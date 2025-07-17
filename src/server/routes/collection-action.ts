'use server'

import { BASE_URL } from '@/app/robots'
import { env } from '@/env'
import { DocumentStatus, ExtractionFieldSchema, ExtractDocumentSchema } from '@/lib/consts'
import { z } from 'zod'
import { default as collectionStore } from '../db/collection-store'
import documentStore from '../db/document-store'
import extractedDataStore from '../db/extracted-data-store'
import {
  mapCollectionToCollectionDTO,
  mapCollectionsToCollectionDTOs,
} from './mapper/collection-mapper'
import { mapDocumentsToDocumentItems } from './mapper/document-mapper'
import { ActionError, authClient } from './safe-action'

/**
 * Get all collections for a user
 * @param ctx - The context
 * @param parsedInput - The parsed input
 * @returns The collections
 */
export const getCollectionsForUser = authClient.action(async ({ ctx }) => {
  const collections = await collectionStore.getCollectionsForUser(ctx.dbUser.id)

  return mapCollectionsToCollectionDTOs(collections)
})

/**
 * Get a document collection by id
 * @param ctx - The context
 * @param parsedInput - The parsed input
 * @returns The document collection
 */
export const getDocumentCollectionById = authClient
  .inputSchema(z.string())
  .action(async ({ ctx, parsedInput }) => {
    const collection = await collectionStore.getCollectionById(parsedInput)

    if (!collection) {
      throw ActionError.NotFound('Collection not found')
    }

    if (collection.userId !== ctx.dbUser.id) {
      throw ActionError.Forbidden('You are not allowed to view this collection')
    }

    const documents =
      await documentStore.getDocumentsByCollectionId(parsedInput)

    const extractedData = await extractedDataStore.getExtractedDataForDocuments(
      documents.map((document) => document.id),
    )

    return {
      collection: mapCollectionToCollectionDTO(collection),
      documents: mapDocumentsToDocumentItems(documents, extractedData),
    }
  })

/**
 * Get documents for a collection (used for refreshing after field detection)
 * @param collectionId - The collection ID
 * @returns The documents with extracted data
 */
export const getDocumentsForCollection = authClient
  .inputSchema(z.string())
  .action(async ({ ctx, parsedInput }) => {
    const collectionId = parsedInput

    // Verify user has access to this collection
    const collection = await collectionStore.getCollectionById(collectionId)
    if (!collection) {
      throw ActionError.NotFound('Collection not found')
    }
    if (collection.userId !== ctx.dbUser.id) {
      throw ActionError.Forbidden('You are not allowed to view this collection')
    }

    const documents =
      await documentStore.getDocumentsByCollectionId(collectionId)
    const extractedData = await extractedDataStore.getExtractedDataForDocuments(
      documents.map((document) => document.id),
    )

    return mapDocumentsToDocumentItems(documents, extractedData)
  })

/**
 * Create a new collection
 * @param ctx - The context
 * @param parsedInput - The parsed input
 * @returns The created collection
 */
export const createCollection = authClient
  .inputSchema(
    z.object({
      name: z.string(),
      description: z.string().optional(),
    }),
  )
  .action(async ({ ctx, parsedInput }) => {
    const { name, description } = parsedInput
    const { dbUser } = ctx

    const collection = await collectionStore.createCollection({
      name,
      description,
      userId: dbUser.id,
      fields: [],
    })

    return mapCollectionToCollectionDTO(collection)
  })

/**
 * Delete a collection
 * @param ctx - The context
 * @param parsedInput - The parsed input
 * @returns The deleted collection
 */
export const deleteCollection = authClient
  .inputSchema(z.string())
  .action(async ({ ctx, parsedInput }) => {
    const { dbUser } = ctx

    const collection = await collectionStore.getCollectionById(parsedInput)

    if (!collection) {
      throw ActionError.NotFound('Collection not found')
    }

    if (collection.userId !== dbUser.id) {
      throw ActionError.Forbidden(
        'You are not allowed to delete this collection',
      )
    }

    await collectionStore.deleteCollection(parsedInput)

    return {
      success: true,
      id: collection.id,
    }
  })

/**
 * Update collection fields
 * @param ctx - The context
 * @param parsedInput - The parsed input containing collection ID and new fields
 * @returns The updated collection
 */
export const updateCollectionFields = authClient
  .inputSchema(
    z.object({
      collectionId: z.string(),
      fields: z.array(ExtractionFieldSchema),
    }),
  )
  .action(async ({ ctx, parsedInput }) => {
    const { collectionId, fields } = parsedInput
    const { dbUser } = ctx

    const collection = await collectionStore.getCollectionById(collectionId)

    if (!collection) {
      throw ActionError.NotFound('Collection not found')
    }

    if (collection.userId !== dbUser.id) {
      throw ActionError.Forbidden(
        'You are not allowed to update this collection',
      )
    }

    // Update the collection with new fields
    const updatedCollection = await collectionStore.updateCollection(
      collectionId,
      {
        fields: fields,
      },
    )

    // Get all documents in the collection that are ready for re-extraction
    const documents = await documentStore.getDocumentsByCollectionId(collectionId)
    const documentsToReExtract = documents.filter(
      (doc) => 
        doc.extractedText && 
        doc.status === DocumentStatus.COMPLETED &&
        doc.itemType === 'FILE'
    )

    // Trigger re-extraction for all eligible documents
    if (documentsToReExtract.length > 0) {
      // Fire-and-forget: trigger extraction for each document with new fields
      documentsToReExtract.forEach((document) => {
        fetch(`${BASE_URL}/api/v1/extract`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.SYSTEM_KEY}`,
          },
          body: JSON.stringify(
            ExtractDocumentSchema.parse({
              documentId: document.id,
              fields,
            }),
          ),
        }).catch((error) => {
          console.error('Failed to trigger re-extraction for document:', document.id, error)
        })
      })
    }

    return mapCollectionToCollectionDTO(updatedCollection)
  })
