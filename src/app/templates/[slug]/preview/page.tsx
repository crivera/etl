import { getTemplate } from '@/server/routes/template-action'
import { TemplatePreview } from '../../components/template-preview'
import GenericError from '@/app/components/ui/common/error'

export default async function Preview({
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
    <div className="h-full flex flex-col">
      <div className="mt-6 flex-1">
        <TemplatePreview template={result.data} />
      </div>
    </div>
  )
}
