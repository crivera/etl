import { TemplateSelect } from '@/server/db/schema'
import { TemplateDTO, FileType } from '@/lib/consts'

/**
 * Map a template to a template DTO
 * @param template - The template to map
 * @returns The mapped template DTO
 */
export const mapTemplateToTemplateDTO = (
  template: TemplateSelect,
): TemplateDTO => {
  return {
    id: template.id,
    name: template.name,
    fileType: template.fileType as FileType,
    dateModified: template.updatedAt,
    fields: template.fields,
    fileName: template.fileName || '',
    fileSize: template.size || 0,
  }
}

/**
 * Map a list of templates to a list of template DTOs
 * @param templates - The templates to map
 * @returns The mapped template DTOs
 */
export const mapTemplatesToTemplateDTOs = (
  templates: TemplateSelect[],
): TemplateDTO[] => {
  return templates.map(mapTemplateToTemplateDTO)
}
