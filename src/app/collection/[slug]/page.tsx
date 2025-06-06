import GenericError from '@/app/components/ui/common/error'
import { getDocumentCollectionById } from '@/server/routes/collection-action'
import { DataGrid } from './components/grid'

export default async function View({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { serverError, data } = await getDocumentCollectionById(slug)

  if (serverError || !data) {
    return <GenericError error={serverError} />
  }

  return (
    <main className="container mx-auto py-6 px-4 max-w-full">
      <div className="h-full flex flex-col">
        <div className="mt-6 flex-1">
          <DataGrid
            initialCollection={data.collection}
            initialDocuments={data.documents}
          />
        </div>
      </div>
    </main>
  )
}
