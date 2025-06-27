import { eq, inArray } from 'drizzle-orm'
import { db } from '.'
import { DocumentExtractionInsert, documentExtractions } from './schema'

const extractedDataStore = {
  /**
   * Upsert extracted data
   * @param extractedData - The extracted data to create
   * @returns The created extracted data
   */
  async upsertExtractedData(data: DocumentExtractionInsert) {
    const existing = await db.query.documentExtractions.findFirst({
      where: eq(documentExtractions.documentId, data.documentId),
    })
    if (existing) {
      // If data already exists, update it instead
      const result = await db
        .update(documentExtractions)
        .set(data)
        .where(eq(documentExtractions.id, existing.id))
        .returning()
      return result[0]
    }
    const result = await db.insert(documentExtractions).values(data).returning()
    return result[0]
  },

  /**
   * Get extracted data for a document
   * @param documentId - The id of the document
   * @returns The extracted data
   */
  async getExtractedDataForDocument(documentId: string) {
    return await db.query.documentExtractions.findFirst({
      where: eq(documentExtractions.documentId, documentId),
    })
  },

  /**
   * Get extracted data for multiple documents
   * @param documentIds - The ids of the documents
   * @returns The extracted data
   */
  async getExtractedDataForDocuments(documentIds: string[]) {
    return await db.query.documentExtractions.findMany({
      where: inArray(documentExtractions.documentId, documentIds),
    })
  },
}

export default extractedDataStore
