'use client'

import { Button } from '@/app/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Textarea } from '@/app/components/ui/textarea'
import {
  ArrowLeft,
  FileText,
  FileSpreadsheet,
  FileIcon as FilePdf,
  Download,
} from 'lucide-react'
import { format } from 'date-fns'
import { Badge } from '@/app/components/ui/badge'
import type { TemplateDTO, ExtractionField } from '@/lib/consts'

interface TemplatePreviewProps {
  template: TemplateDTO
  onBack: () => void
}

export const TemplatePreview = ({ template, onBack }: TemplatePreviewProps) => {
  const getFileIcon = () => {
    switch (template.fileType) {
      case 'docx':
        return <FileText className="h-16 w-16 text-blue-500" />
      case 'xlsx':
        return <FileSpreadsheet className="h-16 w-16 text-green-500" />
      case 'pdf':
        return <FilePdf className="h-16 w-16 text-red-500" />
      default:
        return <FileText className="h-16 w-16 text-gray-500" />
    }
  }

  const getFileTypeBadge = () => {
    switch (template.fileType) {
      case 'docx':
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
          >
            DOCX
          </Badge>
        )
      case 'xlsx':
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
          >
            CSV
          </Badge>
        )
      case 'pdf':
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
          >
            PDF
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getFieldComponent = (field: ExtractionField) => {
    switch (field.type) {
      case 'text':
        return <Input placeholder={`Enter ${field.label.toLowerCase()}`} />
      case 'number':
        return (
          <Input
            type="number"
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        )
      case 'date':
        return <Input type="date" />
      case 'currency':
        return (
          <div className="relative">
            <span className="absolute left-3 top-2.5">$</span>
            <Input
              type="number"
              step="0.01"
              className="pl-7"
              placeholder="0.00"
            />
          </div>
        )
      case 'email':
        return <Input type="email" placeholder="email@example.com" />
      case 'phone':
        return <Input type="tel" placeholder="(123) 456-7890" />
      case 'address':
        return <Textarea placeholder="Enter address" rows={2} />
      default:
        return <Input placeholder={`Enter ${field.label.toLowerCase()}`} />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Templates
        </Button>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Generate Document
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Template Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center justify-center p-6 border rounded-md">
                {getFileIcon()}
                <h3 className="mt-4 text-lg font-medium">{template.name}</h3>
                <div className="mt-2 flex items-center">
                  {getFileTypeBadge()}
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
