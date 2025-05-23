import GenericError from '../components/ui/common/error'
import { TemplateManager } from './components/template-manager'
import { getTamplates } from '@/server/routes/template-action'

type TemplatesPageProps = {
  searchParams?: Promise<{}>
}

export default async function Templates({ searchParams }: TemplatesPageProps) {
  const params = await searchParams

  const result = await getTamplates()
  if (result?.serverError || !result?.data) {
    return <GenericError error={result?.serverError} />
  }

  return (
    <main className="container mx-auto py-6 px-4 max-w-full">
      <TemplateManager initialTemplates={result.data} />
    </main>
  )
}
