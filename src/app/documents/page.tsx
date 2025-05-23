import { DocumentStatus, SortDirection } from '@/lib/consts'
import { getDocuments, getFolderPath } from '@/server/routes/document-action'
import GenericError from '../components/ui/common/error'
import { DocumentExtractor } from './components/document-extractor'
import { getFieldGroupsForUser } from '@/server/routes/field-group-action'

type DocumentsPageProps = {
  searchParams?: Promise<{
    name?: string
    status?: DocumentStatus
    sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'status'
    sortDirection?: SortDirection
    limit?: string
    parentId?: string
  }>
}

export default async function Documents({ searchParams }: DocumentsPageProps) {
  const params = await searchParams

  const {
    name,
    status,
    sortBy = 'createdAt',
    sortDirection = SortDirection.DESC,
    limit = '20',
    parentId,
  } = params ?? {}

  const filters: { name?: string; status?: DocumentStatus } = {
    name: name,
    status: status,
  }

  const [result, folderPathResult, fieldGroups] = await Promise.all([
    getDocuments({
      limit: Number(limit),
      filters: Object.keys(filters).length > 0 ? filters : undefined,
      sort: {
        field: sortBy,
        direction: sortDirection,
      },
      parentId,
    }),
    getFolderPath({ folderId: parentId }),
    getFieldGroupsForUser(),
  ])

  if (result?.serverError || !result?.data) {
    return <GenericError error={result?.serverError} />
  }

  if (folderPathResult?.serverError || !folderPathResult?.data) {
    // Handle error fetching folder path, maybe show a default breadcrumb or log error
    console.error(
      'Error fetching folder path:',
      folderPathResult?.serverError?.message,
    )
    // For now, we'll proceed with empty breadcrumbs or a default
  }

  if (fieldGroups?.serverError || !fieldGroups?.data) {
    return <GenericError error={fieldGroups?.serverError} />
  }

  const breadcrumbData = folderPathResult?.data || []

  return (
    <main className="container mx-auto py-6 px-4 max-w-full">
      <DocumentExtractor
        initalDocuments={result.data}
        breadcrumbData={breadcrumbData}
        currentFolderId={parentId}
        initalFieldGroups={fieldGroups.data}
      />
    </main>
  )
}
