import { DocumentCollectionDTO } from '@/lib/consts'
import { DocumentCollectionSelect } from '@/server/db/schema'

/**
 * Map a collection to a collection DTO
 * @param collection - The collection to map
 * @returns The collection DTO
 */
export const mapCollectionToCollectionDTO = (
  collection: DocumentCollectionSelect,
): DocumentCollectionDTO => {
  return {
    id: collection.id,
    name: collection.name,
    description: collection.description || '',
    fields: collection.fields || [],
    createdAt: collection.createdAt,
  }
}

/**
 * Map a list of collections to a list of collection DTOs
 * @param collections - The collections to map
 * @returns The collection DTOs
 */
export const mapCollectionsToCollectionDTOs = (
  collections: DocumentCollectionSelect[],
): DocumentCollectionDTO[] => {
  return collections.map(mapCollectionToCollectionDTO)
}
