import { type ExtractedDataDTO, type ExtractionField } from '@/lib/consts'
import { DocumentExtractionSelect } from '@/server/db/schema'

/**
 * Map a DocumentExtractionSelect to an ExtractedDataDTO
 * @param extractedData - The DocumentExtractionSelect to map
 * @returns The ExtractedDataDTO
 */
export const mapExtractedDataToExtractedDataDTO = (
  extractedData: DocumentExtractionSelect,
): ExtractedDataDTO => {
  return {
    id: extractedData.id,
    documentId: extractedData.documentId,
    version: extractedData.version,
    data: extractedData.data as Record<string, unknown>[],
    fields: extractedData.fields as ExtractionField[],
    createdAt: extractedData.createdAt,
  }
}

/**
 * Map an array of DocumentExtractionSelect to an array of ExtractedDataDTO
 * @param extractedData - The array of DocumentExtractionSelect to map
 * @returns The array of ExtractedDataDTO
 */
export const mapExtractedDataToExtractedDataDTOs = (
  extractedData: DocumentExtractionSelect[],
): ExtractedDataDTO[] => {
  return extractedData.map(mapExtractedDataToExtractedDataDTO)
}
