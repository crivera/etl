'use client'

import type React from 'react'

import { Button } from '@/app/components/ui/button'
import { Card } from '@/app/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/app/components/ui/popover'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import { Textarea } from '@/app/components/ui/textarea'
import {
  DocumentCollectionDTO,
  DocumentItem,
  DocumentStatus,
  ExtractionField,
  ExtractionFieldType,
  ObjectField,
} from '@/lib/consts'

import {
  uploadFiles,
  deleteDocument,
  rerunExtraction,
} from '@/server/routes/document-action'
import {
  getDocumentsForCollection,
  updateCollectionFields,
} from '@/server/routes/collection-action'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from '@tanstack/react-table'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Edit,
  FileIcon as FilePdf,
  FileSpreadsheet,
  FileText,
  FileUp,
  List,
  Loader2,
  MoreVertical,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { useAction } from 'next-safe-action/hooks'
import { useMemo, useRef, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { formatDateValue } from '@/lib/utils'

const ListDisplay = ({
  items,
  fieldLabel,
  objectSchema,
}: {
  items: unknown[]
  fieldLabel: string
  objectSchema?: Record<string, ObjectField>
}) => {
  if (!items || items.length === 0)
    return <span className="text-muted-foreground italic">Empty</span>

  const renderItem = (item: unknown, index: number) => {
    if (item === null || item === undefined) {
      return (
        <div key={index} className="text-sm p-2 bg-muted/30 rounded">
          <span className="text-muted-foreground italic">null</span>
        </div>
      )
    }

    if (typeof item === 'object' && !Array.isArray(item)) {
      // Render object as key-value table
      const entries = Object.entries(item as Record<string, unknown>)
      if (entries.length === 0) {
        return (
          <div key={index} className="text-sm p-2 bg-muted/30 rounded">
            <span className="text-muted-foreground italic">Empty object</span>
          </div>
        )
      }

      return (
        <div key={index} className="text-sm p-2 bg-muted/30 rounded space-y-1">
          <div className="font-medium text-xs text-muted-foreground mb-2">
            Item {index + 1}
          </div>
          {entries.map(([key, value]) => {
            const fieldSchema = objectSchema?.[key]
            const displayLabel = fieldSchema?.label || key

            return (
              <div key={key} className="flex gap-2">
                <span className="font-medium text-xs text-muted-foreground min-w-0 flex-shrink-0">
                  {displayLabel}:
                </span>
                <span className="text-xs break-words flex-1">
                  {value === null || value === undefined ? (
                    <span className="text-muted-foreground italic">null</span>
                  ) : typeof value === 'object' ? (
                    JSON.stringify(value)
                  ) : fieldSchema?.type === 'date' &&
                    typeof value === 'string' ? (
                    formatDateValue(value)
                  ) : fieldSchema?.type === 'currency' &&
                    typeof value === 'string' ? (
                    value.startsWith('$') ? (
                      value
                    ) : (
                      `$${value}`
                    )
                  ) : fieldSchema?.type === 'checkbox' &&
                    typeof value === 'boolean' ? (
                    value ? (
                      'Yes'
                    ) : (
                      'No'
                    )
                  ) : (
                    String(value)
                  )}
                </span>
              </div>
            )
          })}
        </div>
      )
    }

    // Render primitive values
    return (
      <div key={index} className="text-sm p-2 bg-muted/30 rounded break-words">
        {typeof item === 'boolean' ? (item ? 'Yes' : 'No') : String(item)}
      </div>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-1 text-left justify-start hover:bg-muted/50"
        >
          <List className="h-3 w-3 mr-1 text-muted-foreground" />
          <span className="text-sm">
            {items.length} item{items.length !== 1 ? 's' : ''}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="start">
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-muted-foreground">
            {fieldLabel} ({items.length} item{items.length !== 1 ? 's' : ''})
          </h4>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {items.map(renderItem)}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export const DataGrid = ({
  initialCollection,
  initialDocuments,
}: {
  initialCollection: DocumentCollectionDTO
  initialDocuments: DocumentItem[]
}) => {
  const { user } = useAuth()
  const [collection, setCollection] = useState(initialCollection)
  const [columns, setColumns] = useState<ExtractionField[]>(
    initialCollection.fields,
  )
  const [rows, setRows] = useState<DocumentItem[]>(initialDocuments)

  const [dragActive, setDragActive] = useState(false)
  const [editingCell, setEditingCell] = useState<{
    rowId: string
    columnId: string
  } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [isAddColumnDialogOpen, setIsAddColumnDialogOpen] = useState(false)
  const [isEditColumnDialogOpen, setIsEditColumnDialogOpen] = useState(false)
  const [editingColumn, setEditingColumn] = useState<ExtractionField | null>(
    null,
  )
  const [newColumn, setNewColumn] = useState({
    label: '',
    type: ExtractionFieldType.TEXT,
    allowedValues: [] as string[],
    description: '',
    customPrompt: '',
    objectSchema: {} as Record<string, ObjectField>,
  })
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Listen for real-time collection field updates
  useRealtime({
    channelName: user ? `user:${user.id}` : null,
    onMessage: (message) => {
      if (
        message.event === 'collection-fields-updated' &&
        message.payload.collectionId === collection.id
      ) {
        setColumns(message.payload.fields)
        setCollection((prev) => ({ ...prev, fields: message.payload.fields }))
        toast.success(
          'Fields detected! New columns have been added to your collection.',
        )

        // Refresh documents to get the extracted data
        refreshDocuments(collection.id)
      } else if (message.event === 'document-updated') {
        // Update document status in the grid
        setRows((prev) =>
          prev.map((row) =>
            row.id === message.payload.documentId
              ? { ...row, status: message.payload.status }
              : row,
          ),
        )

        // If document processing completed, refresh all documents to get extracted data
        if (message.payload.status === DocumentStatus.COMPLETED) {
          refreshDocuments(collection.id)
        }
        if (message.payload.error) {
          toast.error(message.payload.error)
        }
      }
    },
  })

  const { execute: refreshDocuments } = useAction(getDocumentsForCollection, {
    onSuccess: (result) => {
      if (result?.data) {
        setRows(result.data)
      }
    },
    onError: ({ error }) => {
      console.error('Failed to refresh documents:', error)
    },
  })

  const { execute: deleteDocumentAction } = useAction(deleteDocument, {
    onSuccess: (result) => {
      if (result?.data) {
        setRows((prev) => prev.filter((row) => row.id !== result.data.id))
        toast.success('Document deleted successfully')
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError?.message || 'Failed to delete document')
    },
  })

  const { execute: uploadFilesAction } = useAction(uploadFiles, {
    onSuccess: (result) => {
      if (
        result?.data &&
        Array.isArray(result.data) &&
        result.data.length > 0
      ) {
        // Add uploaded documents to the grid
        const newDocuments = result.data as DocumentItem[]
        setRows((prev) => [...prev, ...newDocuments])
        toast.success(
          `Successfully uploaded ${newDocuments.length} document${newDocuments.length > 1 ? 's' : ''}`,
        )
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError?.message || 'Something went wrong')
    },
  })

  const { execute: rerunExtractionAction } = useAction(rerunExtraction, {
    onSuccess: (result) => {
      if (result?.data) {
        // Update document status to show it's processing again
        setRows((prev) =>
          prev.map((row) =>
            row.id === result.data.id
              ? { ...row, status: DocumentStatus.UPLOADED }
              : row,
          ),
        )
        toast.success('Extraction restarted successfully')
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError?.message || 'Failed to rerun extraction')
    },
  })

  const { execute: updateCollectionFieldsAction } = useAction(
    updateCollectionFields,
    {
      onSuccess: (result) => {
        if (result?.data) {
          setCollection(result.data)
          toast.success('Collection fields updated successfully')
        }
      },
      onError: ({ error }) => {
        toast.error(
          error.serverError?.message || 'Failed to update collection fields',
        )
      },
    },
  )

  // Transform rows for TanStack Table
  const tableData = useMemo<DocumentItem[]>(() => {
    return rows
  }, [rows])

  // Create column helper
  const columnHelper = createColumnHelper<DocumentItem>()

  const handleCellSave = useCallback(() => {
    if (!editingCell) return

    setRows(
      rows.map((row) => {
        if (row.id !== editingCell.rowId) return row
        // Ensure extractedData exists
        const extractedData = row.extractedData || {
          id: '',
          documentId: row.id,
          data: [],
          fields: [],
          createdAt: new Date(),
        }
        // Remove any existing entry for this column
        const filteredData = (extractedData.data || []).filter(
          (entry) =>
            !Object.prototype.hasOwnProperty.call(entry, editingCell.columnId),
        )
        // Add the new value
        const newData = [...filteredData, { [editingCell.columnId]: editValue }]
        return {
          ...row,
          extractedData: {
            ...extractedData,
            data: newData,
          },
        }
      }),
    )

    setEditingCell(null)
    setEditValue('')
  }, [editingCell, editValue, rows])

  const handleRemoveRow = useCallback(
    (rowId: string) => {
      deleteDocumentAction(rowId)
    },
    [deleteDocumentAction],
  )

  const handleRemoveColumn = useCallback(
    (columnId: string) => {
      const newColumns = columns.filter((col) => col.id !== columnId)
      setColumns(newColumns)

      // Update collection fields in database
      updateCollectionFieldsAction({
        collectionId: collection.id,
        fields: newColumns.map((col) => ({
          id: col.id,
          label: col.label,
          type: col.type,
          description: col.description,
          customPrompt: col.customPrompt,
          allowedValues: col.allowedValues,
          objectSchema: col.objectSchema,
        })),
      })

      setRows(
        rows.map((row) => {
          const extractedData = row.extractedData || {
            id: '',
            documentId: row.id,
            data: [],
            fields: [],
            createdAt: new Date(),
          }
          const newData = (extractedData.data || []).filter(
            (entry) => !Object.prototype.hasOwnProperty.call(entry, columnId),
          )
          return {
            ...row,
            extractedData: {
              ...extractedData,
              data: newData,
            },
          }
        }),
      )
    },
    [columns, rows, collection.id, updateCollectionFieldsAction],
  )

  // Create TanStack Table columns
  const tableColumns = useMemo<ColumnDef<DocumentItem, string>[]>(() => {
    const cols: ColumnDef<DocumentItem, string>[] = [
      // File column (pinned/sticky)
      columnHelper.accessor((row: DocumentItem) => row.name, {
        id: 'file',
        header: ({}) => (
          <div className="flex items-center justify-between w-full">
            <span className="font-medium">Files</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsAddColumnDialogOpen(true)}
              className="h-6 w-6 text-muted-foreground hover:text-primary"
              title={
                collection.fields.length === 0
                  ? 'Upload a document first to auto-generate fields'
                  : 'Add Column'
              }
              disabled={collection.fields.length === 0}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        ),
        cell: ({ row }) => {
          const originalRow = rows.find((r) => r.id === row.original.id)
          if (!originalRow) return null

          return (
            <div className="flex items-center group w-full">
              <div className="flex items-center flex-1 min-w-0">
                {getFileIcon(originalRow.itemType)}
                <div className="ml-3 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium truncate">
                      {originalRow.name}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-muted-foreground">
                      {(row.original.size / 1024).toFixed(2)} KB
                    </div>
                    {getStatusBadge(originalRow.status)}
                  </div>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => rerunExtractionAction(row.original.id)}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Rerun extraction
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleRemoveRow(row.original.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
        size: 320,
        enableSorting: true,
        enableResizing: false,
      }),
    ]

    // Add dynamic columns
    columns.forEach((column) => {
      cols.push(
        columnHelper.accessor(
          (row: DocumentItem) => {
            const dataEntry = row.extractedData?.data.find((data) =>
              Object.prototype.hasOwnProperty.call(data, column.id),
            )
            if (!dataEntry) return ''

            const value = dataEntry[column.id]

            // Convert value to string for React display
            if (value === null || value === undefined) return ''
            if (typeof value === 'string') {
              // Format dates for display
              if (column.type === ExtractionFieldType.DATE) {
                return formatDateValue(value)
              }
              return value
            }
            if (typeof value === 'number') return value.toString()
            if (typeof value === 'boolean') return value ? 'Yes' : 'No'
            if (typeof value === 'object') {
              // Handle arrays and objects
              if (Array.isArray(value)) {
                return value.join(', ')
              }
              return JSON.stringify(value)
            }
            return String(value)
          },
          {
            id: column.id,
            header: ({ column: col }) => (
              <div className="flex items-center justify-between w-full group">
                <Button
                  variant="ghost"
                  onClick={() => col.toggleSorting(col.getIsSorted() === 'asc')}
                  className="h-auto p-0 font-medium text-sm hover:bg-transparent flex items-center"
                >
                  <span className="truncate flex-1 text-left">
                    {column.label}
                  </span>
                  <div className="ml-2 flex items-center">
                    {col.getIsSorted() === 'asc' ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : col.getIsSorted() === 'desc' ? (
                      <ArrowDown className="h-3 w-3" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-50" />
                    )}
                  </div>
                </Button>
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditColumn(column)}
                    className="h-6 w-6"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ),
            cell: ({ getValue, row, column: col }) => {
              const value = getValue() as string
              const isEditing =
                editingCell?.rowId === row.original.id &&
                editingCell?.columnId === col.id

              // Special handling for LIST and OBJECT field types
              if (
                (column.type === ExtractionFieldType.LIST ||
                  column.type === ExtractionFieldType.OBJECT_LIST) &&
                !isEditing
              ) {
                // Find the original data entry to get the raw array value
                const dataEntry = row.original.extractedData?.data.find(
                  (data) =>
                    Object.prototype.hasOwnProperty.call(data, column.id),
                )
                const rawValue = dataEntry?.[column.id]

                if (Array.isArray(rawValue)) {
                  return (
                    <div className="h-8 px-2 flex items-center w-full">
                      <ListDisplay
                        items={rawValue}
                        fieldLabel={column.label}
                        objectSchema={
                          column.type === ExtractionFieldType.OBJECT_LIST
                            ? column.objectSchema
                            : undefined
                        }
                      />
                    </div>
                  )
                }
              }

              if (isEditing) {
                if (
                  column.type === ExtractionFieldType.TEXT &&
                  column.allowedValues
                ) {
                  return (
                    <Select value={editValue} onValueChange={setEditValue}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {column.allowedValues?.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )
                } else {
                  return (
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="h-8 text-sm"
                      type={
                        column.type === 'date'
                          ? 'date'
                          : column.type === 'number'
                            ? 'number'
                            : 'text'
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCellSave()
                        } else if (e.key === 'Escape') {
                          handleCellCancel()
                        }
                      }}
                      onBlur={handleCellSave}
                      autoFocus
                    />
                  )
                }
              }

              return (
                <div
                  className="h-8 px-2 flex items-center cursor-pointer hover:bg-muted/50 rounded text-sm w-full"
                  onClick={() => handleCellEdit(row.original.id, col.id, value)}
                >
                  {value || (
                    <span className="text-muted-foreground italic">
                      Click to edit
                    </span>
                  )}
                </div>
              )
            },
            // size: column.width,
            enableSorting: true,
            enableResizing: false,
          },
        ),
      )
    })

    return cols
  }, [
    columns,
    editingCell,
    editValue,
    rows,
    columnHelper,
    handleCellSave,
    handleRemoveRow,
    collection.fields.length,
    rerunExtractionAction,
  ])

  // Create table instance
  const table = useReactTable({
    data: tableData,
    columns: tableColumns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection: false,
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
  })

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files)
      handleFilesUpload(newFiles)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      handleFilesUpload(newFiles)
    }
  }

  const handleFilesUpload = (files: File[]) => {
    // If collection has no fields, only allow single file upload
    if (collection.fields.length === 0 && files.length > 1) {
      toast.error(
        'Please upload only one document to define the collection structure first.',
      )
      return
    }

    // If collection has no fields and we already have documents, don't allow more uploads
    if (collection.fields.length === 0 && rows.length > 0) {
      toast.error(
        'Please wait for the first document to be processed before uploading more.',
      )
      return
    }

    uploadFilesAction({ files, collectionId: collection.id })
  }

  const handleCellEdit = (rowId: string, columnId: string, value: string) => {
    setEditingCell({ rowId, columnId })
    setEditValue(value)
  }

  const handleCellCancel = () => {
    setEditingCell(null)
    setEditValue('')
  }

  const handleAddColumn = () => {
    if (!newColumn.label.trim()) return

    const columnId = newColumn.label.toLowerCase().replace(/\s+/g, '_')
    const column: ExtractionField = {
      id: columnId,
      label: newColumn.label.trim(),
      type: newColumn.type,
      description: newColumn.description.trim() || undefined,
      customPrompt: newColumn.customPrompt.trim() || undefined,
      allowedValues:
        newColumn.type === ExtractionFieldType.SELECT
          ? newColumn.allowedValues
          : undefined,
      objectSchema:
        newColumn.type === ExtractionFieldType.OBJECT_LIST &&
        Object.keys(newColumn.objectSchema).length > 0
          ? newColumn.objectSchema
          : undefined,
    }

    const newColumns = [...columns, column]
    setColumns(newColumns)

    // Update collection fields in database
    updateCollectionFieldsAction({
      collectionId: collection.id,
      fields: newColumns.map((col) => ({
        id: col.id,
        label: col.label,
        type: col.type,
        description: col.description,
        customPrompt: col.customPrompt,
        allowedValues: col.allowedValues,
        objectSchema: col.objectSchema,
      })),
    })

    // Add empty data for this column to all existing rows
    setRows(
      rows.map((row) => {
        const extractedData = row.extractedData || {
          id: '',
          documentId: row.id,
          data: [],
          fields: [],
          createdAt: new Date(),
        }
        // Only add if not already present
        const hasColumn = (extractedData.data || []).some((entry) =>
          Object.prototype.hasOwnProperty.call(entry, columnId),
        )
        const newData = hasColumn
          ? extractedData.data
          : [...(extractedData.data || []), { [columnId]: '' }]
        return {
          ...row,
          extractedData: {
            ...extractedData,
            data: newData,
          },
        }
      }),
    )

    setNewColumn({
      label: '',
      type: ExtractionFieldType.TEXT,
      allowedValues: [],
      description: '',
      customPrompt: '',
      objectSchema: {},
    })
    setIsAddColumnDialogOpen(false)
  }

  const handleEditColumn = (column: ExtractionField) => {
    setEditingColumn({ ...column })
    setIsEditColumnDialogOpen(true)
  }

  const handleSaveColumnEdit = () => {
    if (!editingColumn) return

    const oldColumnId = editingColumn.id
    const newColumnId = editingColumn.label.toLowerCase().replace(/\s+/g, '_')
    const updatedColumn = { ...editingColumn, id: newColumnId }

    const newColumns = columns.map((col) =>
      col.id === oldColumnId ? updatedColumn : col,
    )
    setColumns(newColumns)

    // Update extracted data to use new column ID if it changed
    if (oldColumnId !== newColumnId) {
      setRows((prevRows) =>
        prevRows.map((row) => {
          const extractedData = row.extractedData || {
            id: '',
            documentId: row.id,
            data: [],
            fields: [],
            createdAt: new Date(),
          }

          // Update data entries to use new column ID
          const updatedData = (extractedData.data || []).map((entry) => {
            if (Object.prototype.hasOwnProperty.call(entry, oldColumnId)) {
              const value = entry[oldColumnId]
              const newEntry = { ...entry }
              delete newEntry[oldColumnId]
              newEntry[newColumnId] = value
              return newEntry
            }
            return entry
          })

          return {
            ...row,
            extractedData: {
              ...extractedData,
              data: updatedData,
            },
          }
        }),
      )
    }

    // Update collection fields in database
    updateCollectionFieldsAction({
      collectionId: collection.id,
      fields: newColumns.map((col) => ({
        id: col.id,
        label: col.label,
        type: col.type,
        description: col.description,
        customPrompt: col.customPrompt,
        allowedValues: col.allowedValues,
        objectSchema: col.objectSchema,
      })),
    })

    setIsEditColumnDialogOpen(false)
    setEditingColumn(null)
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) {
      return <FilePdf className="h-5 w-5 text-red-500" />
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return <FileText className="h-5 w-5 text-blue-500" />
    } else if (fileType.includes('sheet') || fileType.includes('excel')) {
      return <FileSpreadsheet className="h-5 w-5 text-green-500" />
    } else {
      return <FileText className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status: DocumentStatus | null) => {
    if (status === null || status === DocumentStatus.UPLOADED) return null

    switch (status) {
      case DocumentStatus.EXTRACTING:
        return (
          <div className="flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Processing
          </div>
        )
      case DocumentStatus.EXTRACTING_UNKNOWN:
        return (
          <div className="flex items-center text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Detecting Fields
          </div>
        )
      case DocumentStatus.COMPLETED:
        return (
          <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
            <CheckCircle className="h-3 w-3 mr-1" />
            Ready
          </div>
        )
      case DocumentStatus.FAILED:
        return (
          <div className="flex items-center text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <div className="relative">
            <Input
              placeholder="Search all columns..."
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-64"
            />
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} of {rows.length} file
          {rows.length !== 1 ? 's' : ''} • {columns.length} column
          {columns.length !== 1 ? 's' : ''}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple={collection.fields.length > 0}
        accept=".pdf,.doc,.docx,.txt,.xlsx,.xls,.csv"
        onChange={handleFileChange}
      />

      {/* Drag and Drop Area */}
      <div
        className={`mb-4 border-2 border-dashed rounded-lg p-4 flex items-center justify-center transition-colors ${
          dragActive
            ? 'border-primary bg-primary/5 dark:bg-primary/10'
            : 'border-gray-300 dark:border-gray-600'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <FileUp className="h-6 w-6 text-muted-foreground mr-3" />
        <div>
          <p className="text-sm font-medium">
            {collection.fields.length === 0
              ? 'Upload your first document to define fields'
              : 'Drag and drop files here'}
          </p>
          <p className="text-xs text-muted-foreground">
            {collection.fields.length === 0
              ? 'Upload exactly one document to automatically detect fields'
              : 'Supports PDF, DOC, DOCX, TXT, and spreadsheet files'}
          </p>
        </div>
      </div>

      {/* TanStack Table with Sticky First Column */}
      <Card className="flex-1 overflow-hidden">
        <div className="h-full relative">
          <div className="h-full overflow-auto">
            <div className="relative">
              {/* Main Table */}
              <table className="w-full border-separate">
                <thead className="sticky top-0 bg-muted/50 border-b z-20">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header, index) => (
                        <th
                          key={header.id}
                          className={`h-12 px-4 text-left align-middle font-medium text-muted-foreground border-r last:border-r-0 ${
                            index === 0 ? 'sticky left-0 bg-muted z-30' : ''
                          }`}
                          style={{
                            width: header.getSize(),
                            minWidth: header.id === 'file' ? 320 : 120,
                            maxWidth: header.id === 'file' ? 320 : undefined,
                          }}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={table.getAllColumns().length}
                        className="h-32 text-center text-muted-foreground"
                      >
                        <div className="flex flex-col items-center justify-center">
                          <FileUp className="h-8 w-8 mb-2" />
                          <p className="text-sm">
                            {collection.fields.length === 0
                              ? 'Upload your first document to define the collection structure'
                              : 'No files uploaded'}
                          </p>
                          <p className="text-xs">
                            {collection.fields.length === 0
                              ? 'Fields will be automatically detected from your document'
                              : 'Upload files to get started'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b hover:bg-muted/30 h-12"
                      >
                        {row.getVisibleCells().map((cell, index) => (
                          <td
                            key={cell.id}
                            className={`px-4 align-middle border-r last:border-r-0 ${
                              index === 0
                                ? 'sticky left-0 bg-background z-10'
                                : ''
                            }`}
                            style={{
                              width: cell.column.getSize(),
                              minWidth: cell.column.id === 'file' ? 320 : 120,
                              maxWidth:
                                cell.column.id === 'file' ? 320 : undefined,
                            }}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Card>

      {/* Add Column Dialog */}
      <Dialog
        open={isAddColumnDialogOpen}
        onOpenChange={setIsAddColumnDialogOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Column</DialogTitle>
            <DialogDescription>
              Add a new column to the data grid.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="columnLabel">Column Name</Label>
              <Input
                id="columnLabel"
                value={newColumn.label}
                onChange={(e) =>
                  setNewColumn({ ...newColumn, label: e.target.value })
                }
                placeholder="Enter column name (e.g., Company Name)"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="columnDescription">Description (optional)</Label>
              <Textarea
                id="columnDescription"
                value={newColumn.description}
                onChange={(e) =>
                  setNewColumn({ ...newColumn, description: e.target.value })
                }
                placeholder="Enter column description"
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="columnPrompt">Custom Prompt (optional)</Label>
              <Textarea
                id="columnPrompt"
                value={newColumn.customPrompt}
                onChange={(e) =>
                  setNewColumn({ ...newColumn, customPrompt: e.target.value })
                }
                placeholder="Enter custom extraction prompt for this field"
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="columnType">Column Type</Label>
              <Select
                value={newColumn.type}
                onValueChange={(value) =>
                  setNewColumn({
                    ...newColumn,
                    type: value as ExtractionField['type'],
                  })
                }
              >
                <SelectTrigger id="columnType">
                  <SelectValue placeholder="Select column type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="currency">Currency</SelectItem>
                  <SelectItem value="list">List</SelectItem>
                  <SelectItem value="object">Object List</SelectItem>
                  <SelectItem value="select">Select (Dropdown)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newColumn.type === ExtractionFieldType.SELECT && (
              <div className="grid gap-2">
                <Label htmlFor="columnOptions">Options (comma-separated)</Label>
                <Input
                  id="columnOptions"
                  value={newColumn.allowedValues?.join(', ') || ''}
                  onChange={(e) =>
                    setNewColumn({
                      ...newColumn,
                      allowedValues: e.target.value
                        .split(',')
                        .map((opt) => opt.trim())
                        .filter((opt) => opt.length > 0),
                    })
                  }
                  placeholder="Option 1, Option 2, Option 3"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddColumnDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddColumn}
              disabled={!newColumn.label.trim()}
            >
              Add Column
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Column Dialog */}
      <Dialog
        open={isEditColumnDialogOpen}
        onOpenChange={setIsEditColumnDialogOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Column</DialogTitle>
            <DialogDescription>Modify column properties.</DialogDescription>
          </DialogHeader>

          {editingColumn && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="editColumnLabel">Column Name</Label>
                <Input
                  id="editColumnLabel"
                  value={editingColumn.label}
                  onChange={(e) =>
                    setEditingColumn({
                      ...editingColumn,
                      label: e.target.value,
                    })
                  }
                  placeholder="Enter column name (e.g., Company Name)"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="editColumnDescription">
                  Description (optional)
                </Label>
                <Textarea
                  id="editColumnDescription"
                  value={editingColumn.description || ''}
                  onChange={(e) =>
                    setEditingColumn({
                      ...editingColumn,
                      description: e.target.value,
                    })
                  }
                  placeholder="Enter column description"
                  rows={2}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="editColumnPrompt">
                  Custom Prompt (optional)
                </Label>
                <Textarea
                  id="editColumnPrompt"
                  value={editingColumn.customPrompt || ''}
                  onChange={(e) =>
                    setEditingColumn({
                      ...editingColumn,
                      customPrompt: e.target.value,
                    })
                  }
                  placeholder="Enter custom extraction prompt for this field"
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="editColumnType">Column Type</Label>
                <Select
                  value={editingColumn.type}
                  onValueChange={(value) =>
                    setEditingColumn({
                      ...editingColumn,
                      type: value as ExtractionField['type'],
                    })
                  }
                >
                  <SelectTrigger id="editColumnType">
                    <SelectValue placeholder="Select column type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="currency">Currency</SelectItem>
                    <SelectItem value="list">List</SelectItem>
                    <SelectItem value="object">Object List</SelectItem>
                    <SelectItem value="select">Select (Dropdown)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {editingColumn.type === ExtractionFieldType.SELECT && (
                <div className="grid gap-2">
                  <Label htmlFor="editColumnOptions">
                    Options (comma-separated)
                  </Label>
                  <Input
                    id="editColumnOptions"
                    value={
                      editingColumn.allowedValues
                        ? editingColumn.allowedValues.join(', ')
                        : ''
                    }
                    onChange={(e) =>
                      setEditingColumn({
                        ...editingColumn,
                        allowedValues: e.target.value
                          .split(',')
                          .map((opt) => opt.trim())
                          .filter((opt) => opt.length > 0),
                      })
                    }
                    placeholder="Option 1, Option 2, Option 3"
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <div className="flex justify-between w-full">
              <Button
                variant="destructive"
                onClick={() => {
                  if (editingColumn) {
                    handleRemoveColumn(editingColumn.id)
                    setIsEditColumnDialogOpen(false)
                  }
                }}
              >
                Remove Column
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditColumnDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveColumnEdit}>Save Changes</Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
