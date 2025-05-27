import { FileType } from '@/lib/consts'
import { Badge } from '../badge'

export const getFileTypeBadge = (fileType: FileType) => {
  switch (fileType) {
    case 'docx':
      return (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
        >
          DOCX
        </Badge>
      )
    case 'xlsx':
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
        >
          CSV
        </Badge>
      )
    case 'pdf':
      return (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
        >
          PDF
        </Badge>
      )
    default:
      return <Badge variant="outline">Unknown</Badge>
  }
}
