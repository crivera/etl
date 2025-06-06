import { desc, eq } from 'drizzle-orm'
import { db } from '.'
import { DocumentExtractionInsert, documentExtractions } from './schema'

const extractedDataStore = {
  /**
   * Create extracted data
   * @param extractedData - The extracted data to create
   * @returns The created extracted data
   */
  async createExtractedDataVersion(data: DocumentExtractionInsert) {
    const result = await db.insert(documentExtractions).values(data).returning()
    return result[0]
  },

  /**
   * Update extracted data
   * @param id - The id of the extracted data
   * @param data - The extracted data to update
   * @returns The updated extracted data
   */
  async updateExtractedData(id: string, data: DocumentExtractionInsert) {
    const result = await db
      .update(documentExtractions)
      .set(data)
      .where(eq(documentExtractions.id, id))
      .returning()
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
}

export default extractedDataStore
