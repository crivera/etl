import { eq } from 'drizzle-orm'
import { db } from '.'
import { documentCollection, type DocumentCollectionInsert } from './schema'

const collectionStore = {
  /**
   * Create a new collection
   * @param data - The collection to create
   * @returns The created collection
   */
  async createCollection(data: DocumentCollectionInsert) {
    const result = await db.insert(documentCollection).values(data).returning()
    return result[0]
  },

  async getCollectionsForUser(userId: string) {
    const result = await db
      .select()
      .from(documentCollection)
      .where(eq(documentCollection.userId, userId))

    return result
  },

  async getCollectionById(id: string) {
    const result = await db
      .select()
      .from(documentCollection)
      .where(eq(documentCollection.id, id))

    return result[0]
  },

  async deleteCollection(id: string) {
    await db.delete(documentCollection).where(eq(documentCollection.id, id))
  },

  async updateCollection(id: string, data: Partial<DocumentCollectionInsert>) {
    const result = await db
      .update(documentCollection)
      .set(data)
      .where(eq(documentCollection.id, id))
      .returning()
    return result[0]
  },
}

export default collectionStore
