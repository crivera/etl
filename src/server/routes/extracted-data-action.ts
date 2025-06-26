'use server'

import { BASE_URL } from '@/app/robots'
import {
  ExtractDocumentSchema,
  ExtractUnknownDocumentSchema,
  ExtractionField,
  ExtractionFieldSchema,
  ExtractionFieldType,
} from '@/lib/consts'
import { env } from 'process'
import z from 'zod'
import { extractDataFromText, extractDataFromUnknownFile } from '../ai/extract'
import documentStore from '../db/document-store'
import extractedDataStore from '../db/extracted-data-store'
import collectionStore from '../db/collection-store'
import userStore from '../db/user-store'
import { mapExtractedDataToExtractedDataDTO } from './mapper/extracted-data-mapper'
import { ActionError, authClient, systemClient } from './safe-action'
import { collectionEvents } from '../realtime/collection-events'

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

/**
 * Extract unknown document data (for first document in collection)
 * @param documentId - The id of the document
 * @param collectionId - The id of the collection
 */
export const extractUnknownDocumentData = systemClient
  .inputSchema(ExtractUnknownDocumentSchema)
  .action(async ({ parsedInput }) => {
    const { documentId, collectionId } = parsedInput

    const document = await documentStore.getDocumentById(documentId)
    if (!document) {
      throw ActionError.NotFound('Document not found')
    }

    if (!document.extractedText) {
      throw ActionError.BadRequest('Document has not been OCR`d')
    }

    const collection = await collectionStore.getCollectionById(collectionId)
    if (!collection) {
      throw ActionError.NotFound('Collection not found')
    }

    // Extract data from unknown file structure
    const extractedData = await extractDataFromUnknownFile(
      document.extractedText,
    )

    // Convert extracted data to ExtractionField format
    const fields: ExtractionField[] = []
    const processedData: Record<string, unknown>[] = []

    if (extractedData && typeof extractedData === 'object') {
      Object.entries(extractedData).forEach(([key, value]) => {
        // Create field definition
        const fieldId = key.toLowerCase().replace(/\s+/g, '_')
        const fieldType = inferFieldType(value)

        fields.push({
          id: fieldId,
          label: key,
          type: fieldType,
          description: `Auto-generated field for ${key}`,
        })

        // Add to processed data
        processedData.push({ [fieldId]: value })
      })
    }

    // Update collection with new fields
    await collectionStore.updateCollection(collectionId, { fields })

    // Store extracted data
    await extractedDataStore.createExtractedDataVersion({
      documentId: document.id,
      data: processedData,
      fields,
    })

    // Send real-time event for collection fields update
    const user = await userStore.getUserById(collection.userId)
    if (user) {
      await collectionEvents.onCollectionFieldsUpdated(user.externalId, {
        collectionId,
        fields,
      })
    }

    return { success: true, fields }
  })

/**
 * Infer field type from value
 * @param value - The value to infer type from
 * @returns The inferred field type
 */
function inferFieldType(value: unknown): ExtractionFieldType {
  if (value === null || value === undefined) {
    return ExtractionFieldType.TEXT
  }

  if (typeof value === 'number') {
    return ExtractionFieldType.NUMBER
  }

  if (typeof value === 'boolean') {
    return ExtractionFieldType.CHECKBOX
  }

  if (typeof value === 'string') {
    // Check for email pattern
    if (value.includes('@') && value.includes('.')) {
      return ExtractionFieldType.EMAIL
    }

    // Check for phone pattern
    if (
      /^\+?[\d\s\-\(\)]+$/.test(value) &&
      value.replace(/\D/g, '').length >= 10
    ) {
      return ExtractionFieldType.PHONE
    }

    // Check for date pattern
    if (
      /^\d{4}-\d{2}-\d{2}/.test(value) ||
      /^\d{1,2}\/\d{1,2}\/\d{4}/.test(value)
    ) {
      return ExtractionFieldType.DATE
    }

    // Check for currency pattern
    if (/^\$?\d+(\.\d{2})?$/.test(value.replace(/,/g, ''))) {
      return ExtractionFieldType.CURRENCY
    }

    return ExtractionFieldType.TEXT
  }

  return ExtractionFieldType.TEXT
}
