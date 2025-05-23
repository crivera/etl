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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
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
import {
  AlertCircle,
  FileIcon as FilePdf,
  FileSpreadsheet,
  FileText,
  GripVertical,
  Plus,
  Save,
  Upload,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import PDFMeDesigner from './pdf-designer'
import { Template } from '@pdfme/common'

interface TemplateEditorProps {
  template: TemplateDTO
}

export const TemplateEditor = ({ template }: TemplateEditorProps) => {
  const router = useRouter()
  const [editedTemplate, setEditedTemplate] = useState<TemplateDTO>(template)

  const [isAddFieldDialogOpen, setIsAddFieldDialogOpen] = useState(false)
  const [newField, setNewField] = useState<Omit<ExtractionField, 'id'>>({
    label: '',
    type: ExtractionFieldType.TEXT,
  })
  const [fieldError, setFieldError] = useState('')

  const [base64Pdf, setBase64Pdf] = useState<string | null>(null)
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
  }

  const handleAddField = () => {
    if (!newField.label.trim()) {
      setFieldError('Field name is required')
      return
    }

    // Create field ID from label (lowercase, replace spaces with underscores)
    const fieldId = newField.label.trim().toLowerCase().replace(/\s+/g, '_')

    // Check if field with this ID already exists
    if (editedTemplate.fields.some((field) => field.id === fieldId)) {
      setFieldError('A field with this name already exists')
      return
    }

    const updatedFields = [
      ...editedTemplate.fields,
      {
        id: fieldId,
        label: newField.label.trim(),
        type: newField.type,
      },
    ]

    setEditedTemplate({
      ...editedTemplate,
      fields: updatedFields,
    })

    setNewField({
      label: '',
      type: ExtractionFieldType.TEXT,
    })
    setFieldError('')
    setIsAddFieldDialogOpen(false)
  }

  const handleRemoveField = (id: string) => {
    setEditedTemplate({
      ...editedTemplate,
      fields: editedTemplate.fields.filter((field) => field.id !== id),
    })
  }

  const handleSave = () => {
    console.log('Template saved:', template)
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
  }

  const handleCancel = () => {
    router.push('/templates')
  }

  const getFileIcon = () => {
    switch (editedTemplate.fileType) {
      case 'docx':
        return <FileText className="h-12 w-12 text-blue-500" />
      case 'xlsx':
        return <FileSpreadsheet className="h-12 w-12 text-green-500" />
      case 'pdf':
        return <FilePdf className="h-12 w-12 text-red-500" />
      default:
        return <FileText className="h-12 w-12 text-gray-500" />
    }
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
            <Button onClick={() => setIsAddFieldDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
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
                <TableBody>
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
            <CardTitle>Template File</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {base64Pdf ? (
              <div className="flex p-1 border rounded-md">
                <PDFMeDesigner base64Pdf={base64Pdf} onUpdate={handleUpdate} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-10 border border-dashed rounded-md">
                {getFileIcon()}
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

      <div className="flex items-center justify-end">
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Template
        </Button>
      </div>

      {/* Add Field Dialog */}
      <Dialog
        open={isAddFieldDialogOpen}
        onOpenChange={setIsAddFieldDialogOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Template Field</DialogTitle>
            <DialogDescription>
              Add a field to map extracted data to your template.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="fieldName">Field Name</Label>
              <Input
                id="fieldName"
                value={newField.label}
                onChange={(e) => {
                  setNewField({ ...newField, label: e.target.value })
                  setFieldError('')
                }}
                placeholder="Enter field name"
                className={fieldError ? 'border-red-500' : ''}
              />
              {fieldError && (
                <p className="text-sm text-red-500">{fieldError}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="fieldType">Field Type</Label>
              <Select
                value={newField.type}
                onValueChange={(value) =>
                  setNewField({
                    ...newField,
                    type: value as ExtractionFieldType,
                  })
                }
              >
                <SelectTrigger id="fieldType">
                  <SelectValue placeholder="Select field type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="currency">Currency</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="address">Address</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddFieldDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddField}>Add Field</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
