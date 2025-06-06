import { getCollectionsForUser } from '@/server/routes/collection-action'
import GenericError from '../components/ui/common/error'
import CollectionTable from './components/collection-table'

export default async function CollectionPage() {
  const { serverError, data } = await getCollectionsForUser()

  if (serverError || !data) {
    return <GenericError error={serverError} />
  }

  return (
    <main className="container mx-auto py-6 px-4 max-w-full">
      <CollectionTable initialCollections={data} />
    </main>
  )
}
