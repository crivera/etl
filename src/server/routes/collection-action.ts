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
