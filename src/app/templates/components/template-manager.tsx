'use client'

import { useState } from 'react'
import { TemplateList } from './template-list'
import type { TemplateDTO } from '@/lib/consts'
import { useAction } from 'next-safe-action/hooks'
import { createTemplate, deleteTemplate } from '@/server/routes/template-action'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export const TemplateManager = ({
  initialTemplates,
}: {
  initialTemplates: TemplateDTO[]
}) => {
  const router = useRouter()
  const [templates, setTemplates] = useState<TemplateDTO[]>(initialTemplates)

  const { execute: createTemplateAction, isExecuting: isCreatingTemplate } =
    useAction(createTemplate, {
      onSuccess: ({ data }) => {
        if (data) {
          setTemplates([...templates, data])
          router.push(`/templates/edit/${data.id}`)
        }
      },
      onError: ({ error }) => {
        toast.error(error.serverError?.message ?? 'An error occurred')
      },
    })

  const handleCreateTemplate = (
    template: Omit<TemplateDTO, 'id' | 'dateCreated' | 'dateModified'>,
  ) => {
    createTemplateAction({
      name: template.name,
      description: template.description,
      fileType: template.fileType,
    })
  }

  const handleUpdateTemplate = (updatedTemplate: TemplateDTO) => {}

  const { execute: deleteTemplateAction, isExecuting: isDeletingTemplate } =
    useAction(deleteTemplate, {
      onSuccess: () => {
        toast.success('Template deleted successfully')
      },
      onError: ({ error }) => {
        toast.error(error.serverError?.message ?? 'An error occurred')
      },
    })

  const handleDeleteTemplate = (id: string) => {
    deleteTemplateAction(id)
    setTemplates(templates.filter((template) => template.id !== id))
  }

  const handleEditTemplate = (template: TemplateDTO) => {
    router.push(`/templates/edit/${template.id}`)
  }

  const handlePreviewTemplate = (template: TemplateDTO) => {
    router.push(`/templates/preview/${template.id}`)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mt-6 flex-1">
        <TemplateList
          templates={templates}
          onCreateTemplate={handleCreateTemplate}
          onEditTemplate={handleEditTemplate}
          onPreviewTemplate={handlePreviewTemplate}
          onDeleteTemplate={handleDeleteTemplate}
        />
      </div>
    </div>
  )
}
