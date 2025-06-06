import { getTemplate } from '@/server/routes/template-action'
import { TemplatePreview } from '../../components/template-preview'
import GenericError from '@/app/components/ui/common/error'

export default async function Preview({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { serverError, data } = await getTemplate(slug)

  if (serverError || !data) {
    return <GenericError error={serverError} />
  }
  return (
    <div className="h-full flex flex-col">
      <div className="mt-6 flex-1">
        <TemplatePreview template={data} />
      </div>
    </div>
  )
}
