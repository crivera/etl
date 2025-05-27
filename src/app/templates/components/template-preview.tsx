'use client'

import { Button } from '@/app/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card'
import { getFileTypeBadge } from '@/app/components/ui/common/file-badge'
import { getFileIcon } from '@/app/components/ui/common/file-icon'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Textarea } from '@/app/components/ui/textarea'
import type { ExtractionField, TemplateDTO } from '@/lib/consts'
import { generateDocument } from '@/server/routes/template-action'
import { format } from 'date-fns'
import { Download, Loader2 } from 'lucide-react'
import { useAction } from 'next-safe-action/hooks'
import { useState } from 'react'
import { toast } from 'sonner'
import * as FileSaver from 'file-saver'

interface TemplatePreviewProps {
  template: TemplateDTO
}

export const TemplatePreview = ({ template }: TemplatePreviewProps) => {
  const initialData = template.fields.reduce(
    (acc, field) => {
      switch (field.type) {
        case 'currency':
        case 'number':
          acc[field.id] = 0
          break
        case 'checkbox':
          acc[field.id] = false
          break
        default:
          acc[field.id] = ''
          break
      }
      return acc
    },
    {} as Record<string, string | number | boolean>,
  )
  const [data, setData] =
    useState<Record<string, string | number | boolean>>(initialData)

  const getFieldComponent = (field: ExtractionField) => {
    switch (field.type) {
      case 'text':
        return (
          <Input
            placeholder={`Enter ${field.label.toLowerCase()}`}
            value={data[field.id] as string}
            onChange={(e) => setData({ ...data, [field.id]: e.target.value })}
          />
        )
      case 'number':
        return (
          <Input
            type="number"
            placeholder={`Enter ${field.label.toLowerCase()}`}
            value={data[field.id] as number}
            onChange={(e) => setData({ ...data, [field.id]: e.target.value })}
          />
        )
      case 'date':
        return (
          <Input
            type="date"
            value={data[field.id] as string}
            onChange={(e) => setData({ ...data, [field.id]: e.target.value })}
          />
        )
      case 'currency':
        return (
          <div className="relative">
            <span className="absolute left-3 top-2.5">$</span>
            <Input
              type="number"
              step="0.01"
              className="pl-7"
              placeholder="0.00"
              value={data[field.id] as number}
              onChange={(e) => setData({ ...data, [field.id]: e.target.value })}
            />
          </div>
        )
      case 'email':
        return (
          <Input
            type="email"
            placeholder="email@example.com"
            value={data[field.id] as string}
            onChange={(e) => setData({ ...data, [field.id]: e.target.value })}
          />
        )
      case 'phone':
        return (
          <Input
            type="tel"
            placeholder="(123) 456-7890"
            value={data[field.id] as string}
            onChange={(e) => setData({ ...data, [field.id]: e.target.value })}
          />
        )
      case 'address':
        return (
          <Textarea
            placeholder="Enter address"
            rows={2}
            value={data[field.id] as string}
            onChange={(e) => setData({ ...data, [field.id]: e.target.value })}
          />
        )
      default:
        return (
          <Input
            placeholder={`Enter ${field.label.toLowerCase()}`}
            value={data[field.id] as string}
            onChange={(e) => setData({ ...data, [field.id]: e.target.value })}
          />
        )
    }
  }

  const { execute: generateDocumentAction, isExecuting: isGeneratingDocument } =
    useAction(generateDocument, {
      onSuccess: ({ data }) => {
        if (data) {
          toast.success('Document generated successfully')
          FileSaver.saveAs(
            new Blob([data], { type: 'application/octet-stream' }),
            `${template.name}.${template.fileType.toLowerCase()}`,
          )
        }
      },
      onError: ({ error }) => {
        toast.error(error.serverError?.message ?? 'An error occurred')
      },
    })

  const handleGenerateDocument = () => {
    console.log(data)
    generateDocumentAction({
      templateId: template.id,
      data: data,
    })
  }
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Template Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center justify-center p-6 border rounded-md">
                {getFileIcon(template.fileType)}
                <h3 className="mt-4 text-lg font-medium">{template.name}</h3>
                <div className="mt-2 flex items-center">
                  {getFileTypeBadge(template.fileType)}
                  <span className="mx-2 text-muted-foreground">•</span>
                  <span className="text-sm text-muted-foreground">
                    {(template.fileSize / 1024).toFixed(1)} KB
                  </span>
                </div>
                <p className="mt-3 text-sm text-center text-muted-foreground">
                  {template.description}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">File Name:</span>
                  <span className="font-medium">{template.fileName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Modified:</span>
                  <span className="font-medium">
                    {format(template.dateModified, 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Fields:</span>
                  <span className="font-medium">{template.fields.length}</span>
                </div>
              </div>
              <div className="flex items-center justify-center mt-4">
                <Button
                  variant="default"
                  onClick={handleGenerateDocument}
                  disabled={isGeneratingDocument}
                >
                  {isGeneratingDocument ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Generate Document
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Template Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-sm font-medium">Fill Template Fields</h3>
                <p className="text-xs text-muted-foreground">
                  Enter values for the template fields to generate a document.
                </p>
              </div>

              <div className="space-y-4">
                {template.fields.map((field) => (
                  <div key={field.id} className="grid gap-2">
                    <Label htmlFor={field.id}>{field.label}</Label>
                    {getFieldComponent(field)}
                  </div>
                ))}
              </div>

              {template.fields.length === 0 && (
                <div className="text-center py-8 border border-dashed rounded-md">
                  <p className="text-muted-foreground">
                    No fields defined for this template. Add fields in the
                    template editor.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
