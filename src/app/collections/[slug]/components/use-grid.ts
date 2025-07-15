import { useCallback, useMemo, useRef, useState } from 'react'
import { useAction } from 'next-safe-action/hooks'
import { toast } from 'sonner'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table'
import type { DocumentCollectionDTO, DocumentItem, ExtractionField } from '@/lib/consts'
import { DocumentStatus, ExtractionFieldType } from '@/lib/consts'
import { uploadFiles, deleteDocument, rerunExtraction } from '@/server/routes/document-action'
import { getDocumentsForCollection, updateCollectionFields } from '@/server/routes/collection-action'
import { updateExtractedData } from '@/server/routes/extracted-data-action'
import { getColumnId, createEmptyExtractedData } from './grid-utils'
import type { EditingCell, NewColumn } from './grid-types'

export const useGrid = (initialCollection: DocumentCollectionDTO, initialDocuments: DocumentItem[]) => {
  const { user } = useAuth()
  const [collection, setCollection] = useState(initialCollection)
  const [columns, setColumns] = useState<ExtractionField[]>(initialCollection.fields)
  const [rows, setRows] = useState<DocumentItem[]>(initialDocuments)

  const [dragActive, setDragActive] = useState(false)
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)
  const [editValue, setEditValue] = useState('')
  const [isAddColumnDialogOpen, setIsAddColumnDialogOpen] = useState(false)
  const [isEditColumnDialogOpen, setIsEditColumnDialogOpen] = useState(false)
  const [editingColumn, setEditingColumn] = useState<ExtractionField | null>(null)
  const [newColumn, setNewColumn] = useState<NewColumn>({
    label: '',
    type: ExtractionFieldType.TEXT,
    allowedValues: [],
    description: '',
    customPrompt: '',
    objectSchema: {},
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

  const { execute: updateExtractedDataAction } = useAction(updateExtractedData, {
    onSuccess: () => {
      toast.success('Cell updated successfully')
    },
    onError: ({ error }) => {
      toast.error(
        error.serverError?.message || 'Failed to update cell',
      )
    },
  })

    const handleCellSave = useCallback(() => {
    if (!editingCell) return

    // Find the current value in the data
    const currentRow = rows.find((row) => row.id === editingCell.rowId)
    if (!currentRow) return

    const extractedData = currentRow.extractedData || createEmptyExtractedData(currentRow.id)
    const existingEntry = (extractedData.data || []).find(
      (entry) => Object.prototype.hasOwnProperty.call(entry, editingCell.columnId),
    )
    const currentValue = existingEntry ? existingEntry[editingCell.columnId] : ''

    // Only update if the value has actually changed
    if (currentValue !== editValue) {
      // Update the database
      updateExtractedDataAction({
        documentId: editingCell.rowId,
        fieldId: editingCell.columnId,
        value: editValue,
      })
    }

    // Update local state
    setRows(
      rows.map((row) => {
        if (row.id !== editingCell.rowId) return row
        // Ensure extractedData exists
        const extractedData = row.extractedData || createEmptyExtractedData(row.id)
        // Find existing entry with this column or create new one
        const existingEntryIndex = (extractedData.data || []).findIndex(
          (entry) => Object.prototype.hasOwnProperty.call(entry, editingCell.columnId),
        )

        let newData = [...(extractedData.data || [])]
        if (existingEntryIndex >= 0) {
          // Update existing entry
          newData[existingEntryIndex] = { ...newData[existingEntryIndex], [editingCell.columnId]: editValue }
        } else {
          // Add to first entry or create new entry
          if (newData.length > 0) {
            newData[0] = { ...newData[0], [editingCell.columnId]: editValue }
          } else {
            newData = [{ [editingCell.columnId]: editValue }]
          }
        }

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
  }, [editingCell, editValue, rows, updateExtractedDataAction])

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
          const extractedData = row.extractedData || createEmptyExtractedData(row.id)
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

  const handleCellEdit = useCallback((rowId: string, columnId: string, value: string) => {
    setEditingCell({ rowId, columnId })
    setEditValue(value)
  }, [])

  const handleCellCancel = useCallback(() => {
    setEditingCell(null)
    setEditValue('')
  }, [])

  const handleAddColumn = useCallback(() => {
    if (!newColumn.label.trim()) return

    const columnId = getColumnId(newColumn.label)
    const column: ExtractionField = {
      id: columnId,
      label: newColumn.label.trim(),
      type: newColumn.type,
      description: newColumn.description.trim() || undefined,
      customPrompt: newColumn.customPrompt.trim() || undefined,
      allowedValues:
        (newColumn.type === ExtractionFieldType.LIST || newColumn.type === ExtractionFieldType.TEXT)
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
        const extractedData = row.extractedData || createEmptyExtractedData(row.id)
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
  }, [newColumn, columns, rows, collection.id, updateCollectionFieldsAction])

  const handleEditColumn = useCallback((column: ExtractionField) => {
    setEditingColumn({ ...column })
    setIsEditColumnDialogOpen(true)
  }, [])

  const handleSaveColumnEdit = useCallback(() => {
    if (!editingColumn) return

    const oldColumnId = editingColumn.id
    const newColumnId = getColumnId(editingColumn.label)
    const updatedColumn = { ...editingColumn, id: newColumnId }

    const newColumns = columns.map((col) =>
      col.id === oldColumnId ? updatedColumn : col,
    )
    setColumns(newColumns)

    // Update extracted data to use new column ID if it changed
    if (oldColumnId !== newColumnId) {
      setRows((prevRows) =>
        prevRows.map((row) => {
          const extractedData = row.extractedData || createEmptyExtractedData(row.id)

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
  }, [editingColumn, columns, collection.id, updateCollectionFieldsAction])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files)
      handleFilesUpload(newFiles)
    }
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      handleFilesUpload(newFiles)
    }
  }, [])

  const handleFilesUpload = useCallback((files: File[]) => {
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
  }, [collection.fields.length, rows.length, collection.id, uploadFilesAction])

  return {
    // State
    collection,
    columns,
    rows,
    dragActive,
    editingCell,
    editValue,
    isAddColumnDialogOpen,
    isEditColumnDialogOpen,
    editingColumn,
    newColumn,
    sorting,
    columnFilters,
    globalFilter,
    fileInputRef,

    // Setters
    setSorting,
    setColumnFilters,
    setGlobalFilter,
    setNewColumn,
    setEditingColumn,
    setIsAddColumnDialogOpen,
    setIsEditColumnDialogOpen,
    setEditValue,

    // Actions
    handleCellSave,
    handleRemoveRow,
    handleRemoveColumn,
    handleCellEdit,
    handleCellCancel,
    handleAddColumn,
    handleEditColumn,
    handleSaveColumnEdit,
    handleDrag,
    handleDrop,
    handleFileChange,
    handleFilesUpload,
    rerunExtractionAction,
    updateExtractedDataAction,
  }
}