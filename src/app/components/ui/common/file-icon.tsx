import { FileType } from '@/lib/consts'
import {
  FileText,
  FileSpreadsheet,
  FileIcon as FilePdf,
  Image as ImageIcon,
  Folder,
  File as FileWord,
} from 'lucide-react'

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

export const getFileIconByName = (fileName: string, isFolder: boolean) => {
  if (isFolder) {
    return <Folder className="h-5 w-5 mr-2 text-gray-500" />
  } else if (fileName.endsWith('.pdf')) {
    return <FilePdf className="h-5 w-5 mr-2 text-red-500" />
  } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
    return <FileWord className="h-5 w-5 mr-2 text-blue-500" />
  } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    return <FileSpreadsheet className="h-5 w-5 mr-2 text-green-500" />
  } else if (
    fileName.endsWith('.jpg') ||
    fileName.endsWith('.jpeg') ||
    fileName.endsWith('.png')
  ) {
    return <ImageIcon className="h-5 w-5 mr-2 text-gray-500" />
  } else {
    return <FileText className="h-5 w-5 mr-2 text-gray-500" />
  }
}
