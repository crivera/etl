import { GridDataDTO } from '@/lib/consts'
import { GridDataSelect } from '@/server/db/schema'

/**
 * Map a grid data to a grid data DTO
 * @param gridData - The grid data to map
 * @returns The grid data DTO
 */
export const mapGridDataToGridDataDTO = (
  gridData: GridDataSelect,
): GridDataDTO => {
  return {
    id: gridData.id,
    name: gridData.name,
    type: gridData.type,
    size: gridData.size,
    data: gridData.data,
    schema: gridData.schema || [],
    extractedText: gridData.extractedText || [],
  }
}

/**
 * Map a list of grid data to a list of grid data DTOs
 * @param gridData - The grid data to map
 * @returns The grid data DTOs
 */
export const mapGridDataToGridDataDTOs = (
  gridData: GridDataSelect[],
): GridDataDTO[] => {
  return gridData.map(mapGridDataToGridDataDTO)
}
