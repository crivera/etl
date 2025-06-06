import { DocumentItem } from '@/lib/consts'
import { DocumentExtractionSelect, DocumentSelect } from '@/server/db/schema'
import { mapExtractedDataToExtractedDataDTO } from './extracted-data-mapper'

/**
 * Map a document to a document item
 * @param document - The document to map
 * @returns The document item
 */
export const mapDocumentToDocumentItem = (
  document: DocumentSelect,
  extractedData?: DocumentExtractionSelect,
): DocumentItem => {
  return {
    ...document,
    selected: false,
    extractedData: extractedData
      ? mapExtractedDataToExtractedDataDTO(extractedData)
      : null,
  }
}

/**
 * Map a list of documents to a list of document items
 * @param documents - The documents to map
 * @returns The document items
 */
export const mapDocumentsToDocumentItems = (
  documents: DocumentSelect[],
  extractedData?: DocumentExtractionSelect[],
): DocumentItem[] => {
  return documents.map((document) => {
    const data = extractedData?.find(
      (extractedData) => extractedData.documentId === document.id,
    )
    return mapDocumentToDocumentItem(document, data)
  })
}
