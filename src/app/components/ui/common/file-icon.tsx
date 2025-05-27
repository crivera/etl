import { FileType } from '@/lib/consts'
import { FileText, FileSpreadsheet, FileIcon as FilePdf } from 'lucide-react'

export const getFileIcon = (fileType: FileType) => {
  switch (fileType) {
    case 'docx':
      return <FileText className="h-12 w-12 text-blue-500" />
    case 'xlsx':
      return <FileSpreadsheet className="h-12 w-12 text-green-500" />
    case 'pdf':
      return <FilePdf className="h-12 w-12 text-red-500" />
    default:
      return <FileText className="h-12 w-12 text-gray-500" />
  }
}
