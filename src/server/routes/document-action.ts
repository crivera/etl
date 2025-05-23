'use server'

import { BASE_URL } from '@/app/robots'
import { env } from '@/env'
import {
  BreadcrumbItem,
  DocumentStatus,
  ItemType,
  OcrDocumentSchema,
  SortDirection,
  SortDirectionSchema,
} from '@/lib/consts'
import { createId } from '@paralleldrive/cuid2'
import { z } from 'zod'
import { zfd } from 'zod-form-data'
import ocr from '../ai/ocr'
import documentStore from '../db/document-store'
import {
  mapDocumentsToDocumentItems,
  mapDocumentToDocumentItem,
} from './mapper/document-mapper'
import { ActionError, authClient, systemClient } from './safe-action'
const sortFieldSchema = z.enum(['createdAt', 'updatedAt', 'name', 'status'])
const BUCKET_NAME = `documents-${env.NODE_ENV}`

const cursorSchema = z.object({
  value: z.union([z.string(), z.number(), z.date()]),
  id: z.string(),
})

/**
 * Delete a document by its id
 * @param id - The id of the document
 */
export const deleteDocument = authClient
  .inputSchema(z.string())
  .action(async ({ ctx, parsedInput }) => {
    const id = parsedInput

    const document = await documentStore.getDocumentById(id)

    if (!document) {
      throw ActionError.NotFound('Document not found')
    }

    if (document.userId !== ctx.dbUser.id) {
      throw ActionError.Forbidden('You are not allowed to delete this document')
    }

    const { supabase } = ctx
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([`${ctx.dbUser.id}/${id}`])

    if (error) {
      throw new ActionError(error.message)
    }

    await documentStore.deleteDocument(id)

    return { success: true }
  })

/**
 * Get documents from the database
 * @param cursor - The cursor to start the query from
 * @param limit - The number of documents to return
 * @param sort - The field to sort the documents by
 * @param filters - The filters to apply to the documents
 */
export const getDocuments = authClient
  .inputSchema(
    z.object({
      cursor: cursorSchema.optional(),
      limit: z.number().min(1).max(100).default(10),
      parentId: z.string().nullable().optional(),
      sort: z
        .object({
          field: sortFieldSchema,
          direction: SortDirectionSchema,
        })
        .default({ field: 'createdAt', direction: SortDirection.DESC }),
      filters: z
        .object({
          name: z.string().optional(),
          status: z.nativeEnum(DocumentStatus).optional(),
        })
        .optional(),
    }),
  )
  .action(async ({ ctx, parsedInput }) => {
    const { cursor, limit, sort, filters, parentId } = parsedInput

    const result = await documentStore.getDocuments(ctx.dbUser.id, {
      cursor,
      limit,
      sort,
      filters,
      parentId,
    })

    return {
      items: mapDocumentsToDocumentItems(result.items),
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    }
  })

/**
 * Upload a file to the database
 * @param image - The image to upload
 * @returns The uploaded image
 */
export const uploadFiles = authClient
  .inputSchema(
    zfd.formData({
      files: zfd.file().array(),
      parentId: zfd.text(z.string().optional()),
    }),
  )
  .action(async ({ ctx, parsedInput }) => {
    const { files, parentId } = parsedInput

    const documents = []
    const { supabase } = ctx

    for (const file of files) {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(`${ctx.dbUser.id}/${createId()}`, file.stream(), {
          contentType: file.type,
        })

      if (error) {
        throw ActionError.InternalServerError(error.message)
      }

      const document = await documentStore.createDocument({
        userId: ctx.dbUser.id,
        path: data.path,
        name: file.name,
        type: file.type,
        size: file.size,
        status: DocumentStatus.UPLOADED,
        parentId: parentId ?? null,
      })

      documents.push(document)
      // Trigger OCR after upload (fire-and-forget)
      fetch(`${BASE_URL}/api/v1/ocr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.SYSTEM_KEY}`,
        },
        body: JSON.stringify(
          OcrDocumentSchema.parse({ documentId: document.id }),
        ),
      }).catch((err) => console.error('Failed to trigger OCR:', err))
    }

    return mapDocumentsToDocumentItems(documents)
  })

/**
 * Create a new folder
 * @param name - The name of the folder
 * @param parentId - The id of the parent folder (optional, for root level)
 */
export const createFolder = authClient
  .inputSchema(
    z.object({
      name: z.string().min(3, 'Folder name cannot be empty'),
      parentId: z.string().nullable().optional(),
    }),
  )
  .action(async ({ ctx, parsedInput }) => {
    const { name, parentId } = parsedInput

    // Optional: Check if a folder/file with the same name already exists in the parentId
    // This would require a new method in documentStore, e.g., findByNameAndParentId

    const folder = await documentStore.createFolder({
      name,
      userId: ctx.dbUser.id,
      parentId: parentId ?? null,
      // path, type, size, status are handled by createFolder in document-store
    })

    return mapDocumentToDocumentItem(folder)
  })

/**
 * OCR a document
 * @param documentId - The id of the document
 */
export const ocrDocument = systemClient
  .inputSchema(OcrDocumentSchema)
  .action(async ({ ctx, parsedInput }) => {
    const { documentId } = parsedInput

    const document = await documentStore.getDocumentById(documentId)

    if (!document || document.itemType === 'FOLDER') {
      throw ActionError.NotFound('File document not found')
    }

    if (document.extractedText) {
      throw ActionError.BadRequest('Document already ocr`d')
    }

    try {
      const { supabase } = ctx
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .download(document.path)

      if (error) {
        throw ActionError.InternalServerError(error.message)
      }

      await documentStore.updateDocument(documentId, {
        status: DocumentStatus.EXTRACTING,
      })

      const ocrResponse = await ocr.ocrImage(
        Buffer.from(await data.arrayBuffer()),
      )

      await documentStore.updateDocument(documentId, {
        status: DocumentStatus.COMPLETED,
        extractedText: ocrResponse,
      })

      return { success: true }
    } catch (error) {
      await documentStore.updateDocument(documentId, {
        status: DocumentStatus.FAILED,
      })
      console.error(error)
      throw error
    }
  })

/**
 * Get the folder path (breadcrumbs) for a given folder ID.
 * @param folderId - The ID of the folder to get the path for. If null or undefined, returns path for root.
 */
export const getFolderPath = authClient
  .inputSchema(
    z.object({
      folderId: z.string().optional(),
    }),
  )
  .action(async ({ ctx, parsedInput }) => {
    const { folderId } = parsedInput
    const path: BreadcrumbItem[] = []

    if (!folderId) {
      return path // Returns empty array for root, or [{id: 'root', name: 'Home'}]
    }

    let currentFolderId: string | null = folderId

    while (currentFolderId) {
      const folder = await documentStore.getDocumentById(currentFolderId)
      if (!folder || folder.userId !== ctx.dbUser.id) {
        // Folder not found or not accessible by the user
        // This could happen if an invalid ID is passed or permissions change
        // Depending on requirements, either throw an error or stop building the path.
        console.warn(`Folder not found or access denied: ${currentFolderId}`)
        break
      }

      // Ensure it's a folder; files shouldn't be part of folder path
      if (folder.itemType !== ItemType.FOLDER) {
        console.warn(`Item is not a folder: ${currentFolderId}`)
        break
      }

      path.unshift({ id: folder.id, name: folder.name }) // Add to the beginning of the array
      currentFolderId = folder.parentId
    }

    return path
  })

/**
 * Get the URL for a document
 * @param id - The id of the document
 */
export const getDocumentUrl = authClient
  .inputSchema(z.string())
  .action(async ({ ctx, parsedInput }) => {
    const id = parsedInput

    const document = await documentStore.getDocumentById(id)

    if (!document) {
      throw ActionError.NotFound('Document not found')
    }

    if (document.userId !== ctx.dbUser.id) {
      throw ActionError.Forbidden('You are not allowed to access this document')
    }

    const { supabase } = ctx
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(document.path, 60) // URL valid for 1 hour

    if (error) {
      throw new ActionError(error.message)
    }

    return { url: data.signedUrl }
  })
