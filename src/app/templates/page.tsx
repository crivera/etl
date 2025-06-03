import GenericError from '../components/ui/common/error'
import { TemplateManager } from './components/template-manager'
import { getTamplates } from '@/server/routes/template-action'

type TemplatesPageProps = {
  searchParams?: Promise<{
    text?: string
  }>
}

export default async function Templates({ searchParams }: TemplatesPageProps) {
  const params = await searchParams
  const { text } = params ?? {}

  const { serverError, data } = await getTamplates({ text })
  if (serverError || !data) {
    return <GenericError error={serverError} />
  }

  return (
    <main className="container mx-auto py-6 px-4 max-w-full">
      <TemplateManager initialTemplates={data} />
    </main>
  )
}
