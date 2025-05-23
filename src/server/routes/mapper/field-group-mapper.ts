import { FieldGroupDTO } from '@/lib/consts'
import { FieldGroupSelect } from '@/server/db/schema'

/**
 * Map a field group to a field group DTO
 * @param fieldGroup - The field group to map
 * @returns The field group DTO
 */
export const mapFieldGroupToFieldGroupDTO = (
  fieldGroup: FieldGroupSelect,
): FieldGroupDTO => {
  return {
    id: fieldGroup.id,
    name: fieldGroup.name,
    description: fieldGroup.description ?? '',
    fields: fieldGroup.fields,
    userId: fieldGroup.userId,
  }
}

/**
 * Map a list of field groups to a list of field group DTOs
 * @param fieldGroups - The field groups to map
 * @returns The field group DTOs
 */
export const mapFieldGroupsToFieldGroupDTOs = (
  fieldGroups: FieldGroupSelect[],
): FieldGroupDTO[] => {
  return fieldGroups.map(mapFieldGroupToFieldGroupDTO)
}
