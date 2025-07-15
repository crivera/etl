import type React from 'react'
import { DocumentStatus, ExtractionFieldType } from '@/lib/consts'
import { FileIcon as FilePdf, FileSpreadsheet, FileText, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { formatDateValue } from '@/lib/utils'

export const getFileIcon = (fileType: string): React.ReactElement => {
  if (fileType.includes('pdf')) {
    return <FilePdf className="h-5 w-5 text-red-500" />
  } else if (fileType.includes('word') || fileType.includes('document')) {
    return <FileText className="h-5 w-5 text-blue-500" />
  } else if (fileType.includes('sheet') || fileType.includes('excel')) {
    return <FileSpreadsheet className="h-5 w-5 text-green-500" />
  } else {
    return <FileText className="h-5 w-5 text-gray-500" />
  }
}

export const getStatusBadge = (status: DocumentStatus | null): React.ReactElement | null => {
  if (status === null || status === DocumentStatus.UPLOADED) return null

  switch (status) {
    case DocumentStatus.EXTRACTING:
      return (
        <div className="flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Processing
        </div>
      )
    case DocumentStatus.EXTRACTING_UNKNOWN:
      return (
        <div className="flex items-center text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Detecting Fields
        </div>
      )
    case DocumentStatus.COMPLETED:
      return (
        <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
          <CheckCircle className="h-3 w-3 mr-1" />
          Ready
        </div>
      )
    case DocumentStatus.FAILED:
      return (
        <div className="flex items-center text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
          <XCircle className="h-3 w-3 mr-1" />
          Failed
        </div>
      )
    default:
      return null
  }
}

export const formatCellValue = (value: unknown, columnType: ExtractionFieldType): string => {
  if (value === null || value === undefined) return ''

  if (typeof value === 'string') {
    if (columnType === ExtractionFieldType.DATE) {
      return formatDateValue(value)
    }
    return value
  }

  if (typeof value === 'number') return value.toString()
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.join(', ')
    }
    return JSON.stringify(value)
  }

  return String(value)
}

export const getColumnId = (label: string): string => {
  return label.toLowerCase().replace(/\s+/g, '_')
}

export const createEmptyExtractedData = (documentId: string) => ({
  id: '',
  documentId,
  data: [],
  fields: [],
  createdAt: new Date(),
})