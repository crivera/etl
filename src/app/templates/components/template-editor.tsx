'use client'

import type React from 'react'

import { Alert, AlertDescription } from '@/app/components/ui/alert'
import { Button } from '@/app/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card'
import { getFileIcon } from '@/app/components/ui/common/file-icon'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table'
import { Textarea } from '@/app/components/ui/textarea'
import {
  type ExtractionField,
  ExtractionFieldType,
  FileType,
  getFieldTypeColor,
  getFieldTypeLabel,
  type TemplateDTO,
} from '@/lib/consts'
import { updateTemplate } from '@/server/routes/template-action'
import { Template } from '@pdfme/common'
import { AlertCircle, GripVertical, Loader2, Save, Upload } from 'lucide-react'
import { useAction } from 'next-safe-action/hooks'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import PDFMeDesigner from './pdf-designer'

interface TemplateEditorProps {
  template: TemplateDTO
}

export const TemplateEditor = ({ template }: TemplateEditorProps) => {
  const router = useRouter()
  const [editedTemplate, setEditedTemplate] = useState<TemplateDTO>(template)

  const [base64Pdf, setBase64Pdf] = useState<string | null>(
    template.metadata?.pdfMe?.basePdf ?? null,
  )
  const [file, setFile] = useState<File | null>(null)
  const [pdfMeMetadata, setPdfMeMetadata] = useState<Template | null>(
    template.metadata?.pdfMe ?? null,
  )

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    let isValidType = false
    if (
      editedTemplate.fileType === 'docx' &&
      file.type ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      isValidType = true
    } else if (
      editedTemplate.fileType === 'xlsx' &&
      (file.type === 'text/csv' || file.type === 'application/vnd.ms-excel')
    ) {
      isValidType = true
    } else if (
      editedTemplate.fileType === 'pdf' &&
      file.type === 'application/pdf'
    ) {
      isValidType = true
    }

    if (!isValidType) {
      alert(`Please upload a ${editedTemplate.fileType.toUpperCase()} file.`)
      return
    }

    // Convert file to base64
    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      setBase64Pdf(base64)
    }
    reader.readAsDataURL(file)
    setFile(file)
  }

  const { execute: updateTemplateAction, isExecuting: isUpdatingTemplate } =
    useAction(updateTemplate, {
      onSuccess: ({ data }) => {
        if (data) {
          setEditedTemplate(data)
        }
      },
      onError: ({ error }) => {
        toast.error(error.serverError?.message ?? 'An error occurred')
      },
    })

  const handleSave = () => {
    updateTemplateAction({
      id: editedTemplate.id,
      name: editedTemplate.name,
      description: editedTemplate.description,
      fileType: editedTemplate.fileType,
      file: file,
      fields: editedTemplate.fields,
      metadata: {
        pdfMe: pdfMeMetadata,
      },
    })
    router.push(`/templates`)
  }

  const handleUpdate = (template: Template) => {
    let updatedFields: ExtractionField[] = []
    template.schemas.forEach((schema) => {
      for (const field of schema) {
        let type = ExtractionFieldType.TEXT
        if (field.type === 'checkbox') {
          type = ExtractionFieldType.CHECKBOX
        } else if (field.type === 'date') {
          type = ExtractionFieldType.DATE
        }

        const fieldId = field.name.trim().toLowerCase().replace(/\s+/g, '_')
        updatedFields.push({
          id: fieldId,
          label: field.name,
          type,
        })
      }
    })

    setEditedTemplate({
      ...editedTemplate,
      fields: updatedFields,
    })
    setPdfMeMetadata(template)
  }

  return (
    <div className="space-y-6">
      <div className="mt-6 grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Template Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={editedTemplate.name}
                onChange={(e) =>
                  setEditedTemplate({
                    ...editedTemplate,
                    name: e.target.value,
                  })
                }
                placeholder="Enter template name"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editedTemplate.description}
                onChange={(e) =>
                  setEditedTemplate({
                    ...editedTemplate,
                    description: e.target.value,
                  })
                }
                placeholder="Enter template description"
                rows={4}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="fileType">File Type</Label>
              <Select
                value={editedTemplate.fileType}
                onValueChange={(value) =>
                  setEditedTemplate({
                    ...editedTemplate,
                    fileType: value as FileType,
                  })
                }
                disabled={!!editedTemplate.fileName} // Disable if file is already uploaded
              >
                <SelectTrigger id="fileType">
                  <SelectValue placeholder="Select file type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="docx">Word Document (DOCX)</SelectItem>
                  <SelectItem value="xlsx">CSV File</SelectItem>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                </SelectContent>
              </Select>
              {editedTemplate.fileType === 'xlsx' && (
                <p className="text-xs text-muted-foreground mt-1">
                  Note: CSV files will be generated for Excel templates.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Template Fields</CardTitle>
          </CardHeader>
          <CardContent>
            {editedTemplate.fields.length === 0 ? (
              <div className="text-center py-8 border border-dashed rounded-md">
                <p className="text-muted-foreground">
                  No fields defined yet. Add fields to map data to your
                  template.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead>Field Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="w-[80px] text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="max-h-[400px] overflow-y-auto">
                  {editedTemplate.fields.map((field) => (
                    <TableRow key={field.id}>
                      <TableCell>
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div>
                          <div>{field.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {field.id}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${getFieldTypeColor(field.type)}`}
                        >
                          {getFieldTypeLabel(field.type)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {/* <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveField(field.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Remove</span>
                        </Button> */}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>
              Template File
              <div className="flex items-center justify-end">
                <Button onClick={handleSave} disabled={isUpdatingTemplate}>
                  {isUpdatingTemplate ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Template
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {base64Pdf && pdfMeMetadata ? (
              <div className="flex p-1 border rounded-md">
                <PDFMeDesigner
                  base64Pdf={base64Pdf}
                  initialTemplate={pdfMeMetadata}
                  onUpdate={handleUpdate}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-10 border border-dashed rounded-md">
                {getFileIcon(editedTemplate.fileType)}
                <h3 className="mt-4 text-lg font-medium">
                  Upload Template File
                </h3>
                <p className="mt-2 text-sm text-muted-foreground text-center max-w-md">
                  Upload a {editedTemplate.fileType.toUpperCase()} file that
                  will be used as a template for document generation.
                </p>
                <Button
                  className="mt-4"
                  onClick={() =>
                    document.getElementById('file-upload')?.click()
                  }
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </Button>
              </div>
            )}

            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept={
                editedTemplate.fileType === 'docx'
                  ? '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                  : editedTemplate.fileType === 'xlsx'
                    ? '.csv,text/csv,application/vnd.ms-excel'
                    : '.pdf,application/pdf'
              }
              onChange={handleFileUpload}
            />

            {editedTemplate.fileType === 'docx' && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Word templates should use merge fields with the same names as
                  your defined template fields.
                </AlertDescription>
              </Alert>
            )}

            {editedTemplate.fileType === 'xlsx' && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  CSV templates should have column headers that match your
                  defined template fields.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
