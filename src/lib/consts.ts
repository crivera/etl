import { z } from 'zod/v4'

export enum Role {
  ANNONYMOUS = 0,
  USER = 3,
  ADMIN = 5,
  SYSTEM = 10,
}

export enum DocumentStatus {
  UPLOADED = 0,
  EXTRACTING = 1,
  EXTRACTING_UNKNOWN = 2,
  COMPLETED = 3,
  FAILED = 4,
}

export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

export const SortDirectionSchema = z.nativeEnum(SortDirection)

export enum ExtractionFieldType {
  TEXT = 'text',
  SELECT = 'select',
  NUMBER = 'number',
  DATE = 'date',
  EMAIL = 'email',
  PHONE = 'phone',
  LIST = 'list',
  ADDRESS = 'address',
  CURRENCY = 'currency',
  CHECKBOX = 'checkbox',
  OBJECT_LIST = 'object_list',
}

export const ObjectFieldSchema = z.object({
  type: z.enum(ExtractionFieldType),
  label: z.string(),
  description: z.string().optional(),
})

export const ExtractionFieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(ExtractionFieldType),
  description: z.string().optional(),
  customPrompt: z.string().optional(),
  allowedValues: z.array(z.string()).optional(),
  objectSchema: z.record(z.string(), ObjectFieldSchema).optional(),
})

export const TemplateMetadataSchema = z.object({
  pdfMe: z.any().optional(),
})

export type TemplateMetadata = z.infer<typeof TemplateMetadataSchema>

export type ObjectField = z.infer<typeof ObjectFieldSchema>
export type ExtractionField = z.infer<typeof ExtractionFieldSchema>

export const OcrDocumentSchema = z.object({
  documentId: z.string(),
})

export const ExtractDocumentSchema = z.object({
  documentId: z.string(),
  fields: z.array(ExtractionFieldSchema),
})

export const ExtractUnknownDocumentSchema = z.object({
  documentId: z.string(),
  collectionId: z.string(),
})

export type ExtractedText = Array<{ text: string }>

export const ExtractedDataSchema = z.object({
  id: z.string(),
  documentId: z.string(),
  data: z.array(z.record(z.string(), z.any())),
  fields: z.array(ExtractionFieldSchema),
  createdAt: z.date(),
})

export type ExtractedDataDTO = z.infer<typeof ExtractedDataSchema>

export enum ItemType {
  FILE = 'FILE',
  FOLDER = 'FOLDER',
}

export enum FileType {
  DOCX = 'docx',
  XLSX = 'xlsx',
  PDF = 'pdf',
}

export interface Cursor {
  value: string | number | Date | null
  id: string
  itemTypeValue?: ItemType
}

export interface BreadcrumbItem {
  id: string
  name: string
}

export type DocumentSortField = 'createdAt' | 'updatedAt' | 'name' | 'status'

export interface GetDocumentsDTO {
  items: DocumentItem[]
  nextCursor: Cursor | null
  hasMore: boolean
}

export interface FieldGroupDTO {
  id: string
  name: string
  description?: string
  fields: ExtractionField[]
  userId: string | null
}

export type DocumentItem = {
  id: string
  name: string
  size: number
  createdAt: Date
  updatedAt: Date
  status: DocumentStatus | null
  selected: boolean
  userId: string
  itemType: ItemType
  parentId: string | null
  extractedText: ExtractedText | null
  extractedData: ExtractedDataDTO | null
}

export interface DocumentCollectionDTO {
  id: string
  name: string
  description: string
  fields: ExtractionField[]
  createdAt: Date
}

export const SYSTEM_ROBOT = {
  name: 'System Robot',
  id: 'etl',
  email: 'etl@etl.com',
  role: Role.SYSTEM,
  createdAt: new Date(),
  updatedAt: new Date(),
  externalId: 'etl',
}

export type FieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'currency'
  | 'percentage'
  | 'email'
  | 'phone'
  | 'address'
  | 'checkbox'

export interface TemplateDTO {
  id: string
  name: string
  description?: string
  fileType: FileType
  dateModified: Date
  fields: ExtractionField[]
  fileName: string
  fileSize: number
  metadata: TemplateMetadata | null
}

export const fieldTypes: {
  value: ExtractionFieldType
  label: string
  description: string
}[] = [
  {
    value: ExtractionFieldType.TEXT,
    label: 'Text',
    description: 'General text content',
  },
  {
    value: ExtractionFieldType.NUMBER,
    label: 'Number',
    description: 'Numeric values',
  },
  {
    value: ExtractionFieldType.DATE,
    label: 'Date',
    description: 'Date and time values',
  },
  {
    value: ExtractionFieldType.CURRENCY,
    label: 'Currency',
    description: 'Monetary values',
  },
  {
    value: ExtractionFieldType.EMAIL,
    label: 'Email',
    description: 'Email addresses',
  },
  {
    value: ExtractionFieldType.PHONE,
    label: 'Phone',
    description: 'Phone numbers',
  },
  {
    value: ExtractionFieldType.ADDRESS,
    label: 'Address',
    description: 'Physical addresses',
  },
  {
    value: ExtractionFieldType.CHECKBOX,
    label: 'Checkbox',
    description: 'True/False values',
  },
  {
    value: ExtractionFieldType.LIST,
    label: 'List',
    description: 'Array of simple values',
  },
  {
    value: ExtractionFieldType.OBJECT_LIST,
    label: 'Object List',
    description: 'Array of structured objects',
  },
]

/**
 * Get the label for a field type
 * @param type - The type of the field
 * @returns The label for the field type
 */
export const getFieldTypeLabel = (type: ExtractionFieldType) => {
  return fieldTypes.find((t) => t.value === type)?.label || type
}

/**
 * Get the color for a field type
 * @param type - The type of the field
 * @returns The color for the field type
 */
export const getFieldTypeColor = (type: ExtractionFieldType) => {
  switch (type) {
    case 'text':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    case 'number':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
    case 'date':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case 'currency':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
    case 'email':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400'
    case 'phone':
      return 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400'
    case 'address':
      return 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400'
    case 'list':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    case 'object_list':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
    case 'checkbox':
      return 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
  }
}
