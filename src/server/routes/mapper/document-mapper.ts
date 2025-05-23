import { DocumentSelect } from '@/server/db/schema'
import { DocumentItem } from '@/lib/consts'

/**
 * Map a document to a document item
 * @param document - The document to map
 * @returns The document item
 */
export const mapDocumentToDocumentItem = (
  document: DocumentSelect,
): DocumentItem => {
  return {
    ...document,
    selected: false,
  }
}

/**
 * Map a list of documents to a list of document items
 * @param documents - The documents to map
 * @returns The document items
 */
export const mapDocumentsToDocumentItems = (
  documents: DocumentSelect[],
): DocumentItem[] => {
  return documents.map(mapDocumentToDocumentItem)
}
