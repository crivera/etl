import { TemplatePreview } from '../../components/template-preview'

export default async function Preview() {
  return (
    <div className="h-full flex flex-col">
      <div className="mt-6 flex-1">
        <TemplatePreview template={undefined} onBack={() => {}} />
      </div>
    </div>
  )
}
