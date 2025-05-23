import GenericError from '@/app/components/ui/common/error'
import { TemplateEditor } from '../../components/template-editor'
import { getTemplate } from '@/server/routes/template-action'

export default async function Edit({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const result = await getTemplate(slug)

  if (result?.serverError || !result?.data) {
    return <GenericError error={result?.serverError} />
  }

  return (
    <main className="container mx-auto py-6 px-4 max-w-full">
      <div className="h-full flex flex-col">
        <div className="mt-6 flex-1">
          <TemplateEditor template={result.data} />
        </div>
      </div>
    </main>
  )
}
