import { desc, eq } from 'drizzle-orm'
import { db } from '.'
import { DocumentExtractionInsert, documentExtractions } from './schema'

const extractedDataStore = {
  /**
   * Create extracted data
   * @param extractedData - The extracted data to create
   * @returns The created extracted data
   */
  async createExtractedDataVersion(
    data: Omit<DocumentExtractionInsert, 'version'>,
  ) {
    return await db.transaction(async (tx) => {
      const latestVersion = await tx.query.documentExtractions.findFirst({
        where: eq(documentExtractions.documentId, data.documentId),
        orderBy: desc(documentExtractions.version),
      })

      const result = await tx
        .insert(documentExtractions)
        .values({
          ...data,
          version: (latestVersion?.version ?? 0) + 1,
        })
        .returning()
      return result[0]
    })
  },

  /**
   * Get extracted data for a document
   * @param documentId - The id of the document
   * @returns The extracted data
   */
  async getExtractedDataForDocument(documentId: string) {
    return await db.query.documentExtractions.findMany({
      where: eq(documentExtractions.documentId, documentId),
      orderBy: desc(documentExtractions.version),
    })
  },
}

export default extractedDataStore
