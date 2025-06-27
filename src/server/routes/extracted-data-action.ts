'use server'

import { BASE_URL } from '@/app/robots'
import {
  DocumentStatus,
  ExtractDocumentSchema,
  ExtractUnknownDocumentSchema,
  ExtractionField,
  ExtractionFieldSchema,
  ExtractionFieldType,
  ObjectField,
} from '@/lib/consts'
import { env } from 'process'
import z from 'zod/v4'
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

    // Get user for real-time updates
    const user = await userStore.getUserById(document.userId)
    if (!user) {
      throw ActionError.NotFound('User not found')
    }

    try {
      // Set status to extracting
      await documentStore.updateDocument(documentId, {
        status: DocumentStatus.EXTRACTING,
        extractedText: document.extractedText,
        externalId: user.externalId,
      })

      const extractedData = await extractDataFromText(
        document.extractedText,
        fields,
      )

      await extractedDataStore.upsertExtractedData({
        documentId: document.id,
        data: extractedData,
        fields,
      })

      // Set status to completed
      await documentStore.updateDocument(documentId, {
        status: DocumentStatus.COMPLETED,
        extractedText: document.extractedText,
        externalId: user.externalId,
      })

      return { success: true }
    } catch (error) {
      // Set status to failed if extraction fails
      await documentStore.updateDocument(documentId, {
        status: DocumentStatus.FAILED,
        extractedText: document.extractedText,
        externalId: user.externalId,
        error: error as Error,
      })
      throw error
    }
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

    // Set status to extracting unknown fields
    const user = await userStore.getUserById(collection.userId)
    if (user) {
      await documentStore.updateDocument(documentId, {
        status: DocumentStatus.EXTRACTING_UNKNOWN,
        extractedText: document.extractedText,
        externalId: user.externalId,
      })
    }

    try {
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

          const field: ExtractionField = {
            id: fieldId,
            label: key
              .split('_')
              .map(
                (word) =>
                  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
              )
              .join(' '),
            type: fieldType,
            description: ``,
          }

          // If it's an object array, generate object schema
          if (
            fieldType === ExtractionFieldType.OBJECT_LIST &&
            Array.isArray(value) &&
            value.length > 0
          ) {
            const firstItem = value[0]
            if (
              firstItem &&
              typeof firstItem === 'object' &&
              !Array.isArray(firstItem)
            ) {
              const objectSchema = generateObjectSchema(
                firstItem as Record<string, unknown>,
              )
              if (Object.keys(objectSchema).length > 0) {
                field.objectSchema = objectSchema
              }
            }
          }

          fields.push(field)

          // Add to processed data
          processedData.push({ [fieldId]: value })
        })
      }

      const updatedCollection = await collectionStore.updateCollection(
        collectionId,
        { fields },
      )

      // Store extracted data
      await extractedDataStore.upsertExtractedData({
        documentId: document.id,
        data: processedData,
        fields,
      })

      // Send real-time event for collection fields update and mark document as completed
      if (user) {
        await collectionEvents.onCollectionFieldsUpdated(user.externalId, {
          collectionId,
          fields,
        })

        // Update document status to completed
        await documentStore.updateDocument(documentId, {
          status: DocumentStatus.COMPLETED,
          extractedText: document.extractedText,
          externalId: user.externalId,
        })
      }

      return { success: true, fields }
    } catch (error) {
      // Set status to failed if extraction fails
      if (user) {
        await documentStore.updateDocument(documentId, {
          status: DocumentStatus.FAILED,
          extractedText: document.extractedText,
          externalId: user.externalId,
          error: error as Error,
        })
      }
      console.error('Failed to extract unknown document data:', error)
      throw error
    }
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

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return ExtractionFieldType.LIST
    }

    // Check if array contains objects
    const firstItem = value[0]
    if (
      firstItem &&
      typeof firstItem === 'object' &&
      !Array.isArray(firstItem)
    ) {
      return ExtractionFieldType.OBJECT_LIST
    }

    // If it's an array of primitives, it's a list
    return ExtractionFieldType.LIST
  }

  if (typeof value === 'string') {
    const trimmedValue = value.trim()

    // Skip empty strings
    if (!trimmedValue) {
      return ExtractionFieldType.TEXT
    }

    // Check for currency pattern first (more specific)
    if (
      /^\$?\d{1,3}(,\d{3})*(\.\d{2})?$/.test(trimmedValue.replace(/^\$/, ''))
    ) {
      return ExtractionFieldType.CURRENCY
    }

    // Check for pure numbers (after currency check)
    if (/^\d+(\.\d+)?$/.test(trimmedValue)) {
      return ExtractionFieldType.NUMBER
    }

    // Check for email pattern (more strict)
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue)) {
      return ExtractionFieldType.EMAIL
    }

    // Check for phone pattern (more flexible)
    const phoneDigits = trimmedValue.replace(/\D/g, '')
    if (
      /^[\+]?[\d\s\-\(\)\.\+]+$/.test(trimmedValue) &&
      phoneDigits.length >= 10 &&
      phoneDigits.length <= 15
    ) {
      return ExtractionFieldType.PHONE
    }

    // Check for date patterns (more comprehensive)
    if (
      /^\d{4}[-\/]\d{1,2}[-\/]\d{1,2}/.test(trimmedValue) ||
      /^\d{1,2}[-\/]\d{1,2}[-\/]\d{4}/.test(trimmedValue) ||
      /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(
        trimmedValue,
      ) ||
      /^\d{1,2}(st|nd|rd|th)?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(
        trimmedValue,
      )
    ) {
      return ExtractionFieldType.DATE
    }

    // Check for boolean-like values
    if (
      /^(true|false|yes|no|y|n|on|off|enabled|disabled)$/i.test(trimmedValue)
    ) {
      return ExtractionFieldType.CHECKBOX
    }

    return ExtractionFieldType.TEXT
  }

  return ExtractionFieldType.TEXT
}

/**
 * Generate object schema from a sample object
 * @param sampleObject - Sample object to generate schema from
 * @returns Object schema
 */
function generateObjectSchema(
  sampleObject: Record<string, unknown>,
): Record<string, ObjectField> {
  const schema: Record<string, ObjectField> = {}

  Object.entries(sampleObject).forEach(([key, value]) => {
    const fieldType = inferFieldType(value)

    // Only include primitive field types in object schema (no nested objects or lists)
    if (
      fieldType !== ExtractionFieldType.OBJECT_LIST &&
      fieldType !== ExtractionFieldType.LIST
    ) {
      schema[key] = {
        type: fieldType,
        label: key
          .split('_')
          .map(
            (word) =>
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
          )
          .join(' '),
        description: ``,
      }
    }
  })

  return schema
}
