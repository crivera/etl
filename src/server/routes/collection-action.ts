'use server'

import { z } from 'zod/v4'
import { default as collectionStore } from '../db/collection-store'
import documentStore from '../db/document-store'
import {
  mapCollectionToCollectionDTO,
  mapCollectionsToCollectionDTOs,
} from './mapper/collection-mapper'
import { mapDocumentsToDocumentItems } from './mapper/document-mapper'
import { ActionError, authClient } from './safe-action'
import extractedDataStore from '../db/extracted-data-store'
import { ExtractionField } from '@/lib/consts'

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

    const documents = await documentStore.getDocumentsByCollectionId(collectionId)
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
      fields: z.array(z.object({
        id: z.string(),
        label: z.string(),
        type: z.string(),
        description: z.string().optional(),
        prompt: z.string().optional(),
        allowedValues: z.array(z.string()).optional(),
      }))
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
    const updatedCollection = await collectionStore.updateCollection(collectionId, {
      fields: fields as ExtractionField[],
    })

    return mapCollectionToCollectionDTO(updatedCollection)
  })
