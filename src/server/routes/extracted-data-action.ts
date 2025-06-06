'use server'

import { BASE_URL } from '@/app/robots'
import { ExtractDocumentSchema, ExtractionFieldSchema } from '@/lib/consts'
import { env } from 'process'
import z from 'zod'
import { extractDataFromText } from '../ai/extract'
import documentStore from '../db/document-store'
import extractedDataStore from '../db/extracted-data-store'
import { mapExtractedDataToExtractedDataDTO } from './mapper/extracted-data-mapper'
import { ActionError, authClient, systemClient } from './safe-action'

/**
 * Trigger extraction of document data
 * @param documentIds - The ids of the documents to extract data from
 * @param fields - The fields to extract data from
 */
export const triggerExtraction = authClient
  .inputSchema(
    z.object({
      documentIds: z.array(z.string()),
      fields: z.array(ExtractionFieldSchema),
    }),
  )
  .action(async ({ ctx, parsedInput }) => {
    const { documentIds, fields } = parsedInput

    for (const documentId of documentIds) {
      const document = await documentStore.getDocumentById(documentId)

      if (!document) {
        throw ActionError.NotFound('Document not found')
      }

      if (document.userId !== ctx.dbUser.id) {
        throw ActionError.Forbidden(
          'You are not allowed to access this document',
        )
      }

      if (!document.extractedText) {
        throw ActionError.BadRequest('Document has not been OCR`d')
      }

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
      }).catch((err) => console.error('Failed to trigger OCR:', err))
    }
  })

/**
 * Extract document data
 * @param documentId - The id of the document
 * @param fields - The fields to extract data from
 */
export const extractDocumentData = systemClient
  .inputSchema(ExtractDocumentSchema)
  .action(async ({ parsedInput }) => {
    const { documentId, fields } = parsedInput

    const document = await documentStore.getDocumentById(documentId)

    if (!document) {
      throw ActionError.NotFound('Document not found')
    }

    if (!document.extractedText) {
      throw ActionError.BadRequest('Document has not been OCR`d')
    }

    const extractedData = await extractDataFromText(
      document.extractedText,
      fields,
    )

    await extractedDataStore.createExtractedDataVersion({
      documentId: document.id,
      data: extractedData,
      fields,
    })

    return { success: true }
  })

/**
 * Get the extracted data for a document
 * @param documentId - The id of the document
 */
export const getExtractedDataForDocument = authClient
  .inputSchema(z.string())
  .action(async ({ ctx, parsedInput }) => {
    const documentId = parsedInput

    const document = await documentStore.getDocumentById(documentId)

    if (!document) {
      throw ActionError.NotFound('Document not found')
    }

    if (document.userId !== ctx.dbUser.id) {
      throw ActionError.Forbidden('You are not allowed to access this document')
    }

    const extractedData =
      await extractedDataStore.getExtractedDataForDocument(documentId)

    if (!extractedData) {
      return null
    }

    return mapExtractedDataToExtractedDataDTO(extractedData)
  })
