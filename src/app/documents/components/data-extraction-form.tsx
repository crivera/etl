'use client'

import type React from 'react'

import { useState } from 'react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Badge } from '@/app/components/ui/badge'
import {
  File,
  Loader2,
  Plus,
  Trash2,
  AlertCircle,
  Download,
  Bookmark,
  Check,
  BookmarkPlus,
  Save,
  Edit,
  X,
} from 'lucide-react'
import { Alert, AlertDescription } from '@/app/components/ui/alert'
import {
  DocumentItem,
  ExtractionField,
  ExtractionFieldType,
  FieldGroupDTO,
  getFieldTypeLabel,
  getFieldTypeColor,
  fieldTypes,
} from '@/lib/consts'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import { Textarea } from '@/app/components/ui/textarea'
import { TooltipContent } from '@/app/components/ui/tooltip'
import { Tooltip, TooltipTrigger } from '@/app/components/ui/tooltip'
import { DropdownMenuItem } from '@/app/components/ui/dropdown-menu'
import {
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu'
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
import { DropdownMenu } from '@/app/components/ui/dropdown-menu'
import { Dialog } from '@/app/components/ui/dialog'

interface DataExtractionFormProps {
  selectedDocuments: DocumentItem[]
  fields: ExtractionField[]
  onFieldsChange: (fields: ExtractionField[]) => void
  onExtract: () => void
  isExtracting: boolean
  fieldGroups: FieldGroupDTO[]
  onSaveFieldGroup: (fieldGroup: {
    id?: string
    name: string
    description?: string
    fields: ExtractionField[]
  }) => void
}

export const DataExtractionForm = ({
  selectedDocuments,
  fields,
  onFieldsChange,
  onExtract,
  isExtracting,
  onSaveFieldGroup,
  fieldGroups,
}: DataExtractionFormProps) => {
  const [newFieldName, setNewFieldName] = useState('')
  const [newFieldType, setNewFieldType] = useState<ExtractionFieldType>(
    ExtractionFieldType.TEXT,
  )
  const [newFieldDescription, setNewFieldDescription] = useState('')
  const [isAddingField, setIsAddingField] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [editingFieldId, setEditingFieldId] = useState<string | null>(null)
  const [editFieldName, setEditFieldName] = useState('')
  const [editFieldType, setEditFieldType] = useState<ExtractionFieldType>(
    ExtractionFieldType.TEXT,
  )
  const [editFieldDescription, setEditFieldDescription] = useState('')
  const [isSaveFieldGroupOpen, setIsSaveFieldGroupOpen] = useState(false)
  const [fieldGroupName, setFieldGroupName] = useState('')
  const [fieldGroupDescription, setFieldGroupDescription] = useState('')
  const [fieldGroupError, setFieldGroupError] = useState<string | null>(null)
  const [activeFieldGroup, setActiveFieldGroup] =
    useState<FieldGroupDTO | null>(null)

  const removeField = (id: string) => {
    const updatedFields = fields.filter((field) => field.id !== id)
    onFieldsChange(updatedFields)
  }

  const addNewField = () => {
    // Validate field name
    if (!newFieldName.trim()) {
      setError('Field name cannot be empty')
      return
    }

    // Create a valid ID from the field name (lowercase, no spaces)
    const newFieldId = newFieldName.trim().toLowerCase().replace(/\s+/g, '_')

    // Check if field with this ID already exists
    if (fields.some((field) => field.id === newFieldId)) {
      setError('A field with this name already exists')
      return
    }

    // Add the new field
    const updatedFields = [
      ...fields,
      {
        id: newFieldId,
        label: newFieldName.trim(),
        type: newFieldType,
        description: newFieldDescription.trim() || undefined,
      },
    ]

    onFieldsChange(updatedFields)
    setNewFieldName('')
    setNewFieldType(ExtractionFieldType.TEXT)
    setNewFieldDescription('')
    setError(null)
    setIsAddingField(false)
  }

  const startEditingField = (field: ExtractionField) => {
    setEditingFieldId(field.id)
    setEditFieldName(field.label)
    setEditFieldType(field.type)
    setEditFieldDescription(field.description || '')
  }

  const cancelEditingField = () => {
    setEditingFieldId(null)
    setEditFieldName('')
    setEditFieldType(ExtractionFieldType.TEXT)
    setEditFieldDescription('')
  }

  const saveEditedField = (id: string) => {
    // Validate field name
    if (!editFieldName.trim()) {
      setError('Field name cannot be empty')
      return
    }

    // Update the field
    const updatedFields = fields.map((field) => {
      if (field.id === id) {
        return {
          id: editFieldName.trim().toLowerCase().replace(/\s+/g, '_'),
          label: editFieldName.trim(),
          type: editFieldType,
          description: editFieldDescription.trim() || undefined,
        }
      }
      return field
    })

    onFieldsChange(updatedFields)
    setEditingFieldId(null)
    setError(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addNewField()
    }
  }

  const handleSaveFieldGroup = async () => {
    // Validate configuration name
    if (!fieldGroupName.trim()) {
      setFieldGroupError('Field group name cannot be empty')
      return
    }

    // Check if we have fields to save
    if (fields.length === 0) {
      setFieldGroupError('Cannot save an empty field group')
      return
    }

    // Save the configuration
    onSaveFieldGroup({
      id: activeFieldGroup?.id,
      name: fieldGroupName.trim(),
      description: fieldGroupDescription.trim(),
      fields: [...fields],
    })

    // Close the dialog and reset form
    setIsSaveFieldGroupOpen(false)
    setFieldGroupName('')
    setFieldGroupDescription('')
    setFieldGroupError(null)
  }

  const applyFieldGroup = (fieldGroup: FieldGroupDTO) => {
    onFieldsChange([...fieldGroup.fields])
    setActiveFieldGroup(fieldGroup)
  }

  return (
    <div className="space-y-6">
      {selectedDocuments.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">
            Selected Documents ({selectedDocuments.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {selectedDocuments.map((doc) => (
              <Badge key={doc.id} variant="secondary" className="text-xs py-1">
                <File className="h-3 w-3 mr-1" />
                {doc.name}
              </Badge>
            ))}
          </div>
        </div>
      ) : (
        <Alert
          variant="warning"
          className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800"
        >
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-amber-800 dark:text-amber-300">
            Please select at least one document from the table to extract data
            from.
          </AlertDescription>
        </Alert>
      )}

      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Define data to extract</h3>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <Download className="h-4 w-4 mr-1" />
                  Use Field Group
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[240px]">
                {fieldGroups.length > 0 ? (
                  fieldGroups.map((config) => (
                    <DropdownMenuItem
                      key={config.id}
                      onClick={() => applyFieldGroup(config)}
                      className="flex flex-col items-start py-2"
                    >
                      <div className="flex items-center w-full">
                        <Bookmark className="h-4 w-4 mr-2" />
                        <span className="font-medium">{config.name}</span>
                        {activeFieldGroup?.id === config.id && (
                          <Check className="h-4 w-4 ml-auto text-green-500" />
                        )}
                      </div>
                      {config.description && (
                        <span className="text-xs text-muted-foreground ml-6 mt-1 line-clamp-1">
                          {config.description}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground ml-6 mt-0.5">
                        {config.fields.length} field
                        {config.fields.length !== 1 ? 's' : ''}
                      </span>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                    No field groups saved
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => setIsSaveFieldGroupOpen(true)}
              disabled={fields.length === 0}
            >
              <BookmarkPlus className="h-4 w-4 mr-1" />
              Save Configuration
            </Button>
          </div>
        </div>

        {/* Add new field */}
        {isAddingField ? (
          <div className="mb-6 border rounded-md p-4 bg-muted/30">
            <h4 className="text-sm font-medium mb-3">Add new field</h4>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="fieldName"
                  className="text-sm font-medium block mb-1"
                >
                  Field Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="fieldName"
                  placeholder="Enter field name"
                  value={newFieldName}
                  onChange={(e) => {
                    setNewFieldName(e.target.value)
                    setError(null)
                  }}
                  className={error ? 'border-red-500' : ''}
                  autoFocus
                />
              </div>

              <div>
                <label
                  htmlFor="fieldType"
                  className="text-sm font-medium block mb-1"
                >
                  Field Type <span className="text-red-500">*</span>
                </label>
                <Select
                  value={newFieldType}
                  onValueChange={(value) =>
                    setNewFieldType(value as ExtractionFieldType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select field type" />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center">
                          <span>{type.label}</span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({type.description})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label
                  htmlFor="fieldDescription"
                  className="text-sm font-medium block mb-1"
                >
                  Description (optional)
                </label>
                <Textarea
                  id="fieldDescription"
                  placeholder="Enter a description"
                  value={newFieldDescription}
                  onChange={(e) => setNewFieldDescription(e.target.value)}
                  rows={2}
                  onKeyDown={handleKeyDown}
                />
              </div>

              {error && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddingField(false)
                    setNewFieldName('')
                    setNewFieldType(ExtractionFieldType.TEXT)
                    setNewFieldDescription('')
                    setError(null)
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={addNewField} type="button">
                  <Plus className="h-4 w-4 mr-1" /> Add Field
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6">
            <Button
              onClick={() => setIsAddingField(true)}
              type="button"
              variant="outline"
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-1" /> Add Custom Field
            </Button>
          </div>
        )}

        {/* Field list */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium">
              Fields to extract ({fields.length})
            </h4>
            {activeFieldGroup && (
              <Badge variant="outline" className="text-xs py-1 px-2 gap-1">
                <Bookmark className="h-3 w-3" />
                {activeFieldGroup.name}
              </Badge>
            )}
          </div>

          {fields.length === 0 ? (
            <div className="text-center p-8 border border-dashed rounded-md">
              <p className="text-muted-foreground">
                No fields available. Add a custom field above or load a
                configuration.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {fields.map((field) => (
                <div
                  key={field.id}
                  className="border dark:border-gray-700 rounded-md overflow-hidden"
                >
                  {editingFieldId === field.id ? (
                    <div className="p-3 space-y-3">
                      <div>
                        <label
                          htmlFor={`edit-${field.id}-name`}
                          className="text-xs font-medium block mb-1"
                        >
                          Field Name
                        </label>
                        <Input
                          id={`edit-${field.id}-name`}
                          value={editFieldName}
                          onChange={(e) => setEditFieldName(e.target.value)}
                          className="h-8 text-sm"
                          autoFocus
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`edit-${field.id}-type`}
                          className="text-xs font-medium block mb-1"
                        >
                          Field Type
                        </label>
                        <Select
                          value={editFieldType}
                          onValueChange={(value) =>
                            setEditFieldType(value as ExtractionFieldType)
                          }
                        >
                          <SelectTrigger
                            id={`edit-${field.id}-type`}
                            className="h-8 text-sm"
                          >
                            <SelectValue placeholder="Select field type" />
                          </SelectTrigger>
                          <SelectContent>
                            {fieldTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="flex items-center">
                                  <span>{type.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label
                          htmlFor={`edit-${field.id}-desc`}
                          className="text-xs font-medium block mb-1"
                        >
                          Description
                        </label>
                        <Textarea
                          id={`edit-${field.id}-desc`}
                          value={editFieldDescription}
                          onChange={(e) =>
                            setEditFieldDescription(e.target.value)
                          }
                          className="text-sm min-h-[60px]"
                          rows={2}
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={cancelEditingField}
                          className="h-7 px-2"
                        >
                          <X className="h-4 w-4 mr-1" /> Cancel
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => saveEditedField(field.id)}
                          className="h-7 px-2"
                        >
                          <Check className="h-4 w-4 mr-1" /> Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">
                              {field.label}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${getFieldTypeColor(field.type)}`}
                            >
                              {getFieldTypeLabel(field.type)}
                            </span>
                          </div>
                          {field.description && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {field.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditingField(field)}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                            >
                              <span className="sr-only">
                                Edit {field.label}
                              </span>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit field</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeField(field.id)}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <span className="sr-only">
                                Remove {field.label}
                              </span>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Remove field</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Save Configuration Dialog */}
        <Dialog
          open={isSaveFieldGroupOpen}
          onOpenChange={setIsSaveFieldGroupOpen}
        >
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Save Field Configuration</DialogTitle>
              <DialogDescription>
                Save your current field configuration for future use. This will
                save all defined fields.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="configName" className="text-sm font-medium">
                  Configuration Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="configName"
                  value={fieldGroupName}
                  onChange={(e) => {
                    setFieldGroupName(e.target.value)
                    setFieldGroupError(null)
                  }}
                  placeholder="Enter a name for this configuration"
                  className={fieldGroupError ? 'border-red-500' : ''}
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="configDescription"
                  className="text-sm font-medium"
                >
                  Description
                </label>
                <Textarea
                  id="configDescription"
                  value={fieldGroupDescription}
                  onChange={(e) => setFieldGroupDescription(e.target.value)}
                  placeholder="Enter a description for this configuration"
                  rows={3}
                />
              </div>

              <div className="border rounded-md p-3 bg-muted/30">
                <h4 className="text-sm font-medium mb-2">
                  Fields to be saved ({fields.length})
                </h4>
                <div className="max-h-[150px] overflow-y-auto pr-2">
                  {fields.map((field) => (
                    <div key={field.id} className="flex items-center py-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full mr-2 ${getFieldTypeColor(field.type)}`}
                      >
                        {getFieldTypeLabel(field.type)}
                      </span>
                      <span className="text-sm">{field.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {fieldGroupError && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{fieldGroupError}</AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsSaveFieldGroupOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveFieldGroup}>
                <Save className="h-4 w-4 mr-2" />
                Save Configuration
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={onExtract}
          disabled={
            isExtracting ||
            fields.length === 0 ||
            selectedDocuments.length === 0
          }
        >
          {isExtracting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Extracting...
            </>
          ) : (
            `Extract Data from ${selectedDocuments.length} Document${selectedDocuments.length !== 1 ? 's' : ''}`
          )}
        </Button>
      </div>
    </div>
  )
}
