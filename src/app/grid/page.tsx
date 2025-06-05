import { getGridData } from '@/server/routes/grid-action'
import { DataGrid } from './components/grid'
import GenericError from '../components/ui/common/error'

export default async function GridPage() {
  const { serverError, data } = await getGridData()

  if (serverError || !data) {
    return <GenericError error={serverError} />
  }

  return (
    <main className="container mx-auto py-6 px-4 max-w-full">
      <DataGrid initialGridData={data} />
    </main>
  )
}
