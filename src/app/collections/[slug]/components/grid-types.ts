import type { DocumentCollectionDTO, DocumentItem, ExtractionField, ExtractionFieldType, ObjectField } from '@/lib/consts'

export interface GridProps {
  initialCollection: DocumentCollectionDTO
  initialDocuments: DocumentItem[]
}

export interface EditingCell {
  rowId: string
  columnId: string
}

export interface NewColumn {
  label: string
  type: ExtractionFieldType
  allowedValues: string[]
  description: string
  customPrompt: string
  objectSchema: Record<string, ObjectField>
}

export interface ListDisplayProps {
  items: unknown[]
  fieldLabel: string
  objectSchema?: Record<string, ObjectField>
}

export interface FileColumnProps {
  row: DocumentItem
  originalRow: DocumentItem
  onRerunExtraction: (id: string) => void
  onRemoveRow: (id: string) => void
}

export interface DynamicColumnProps {
  column: ExtractionField
  row: DocumentItem
  value: string
  isEditing: boolean
  editValue: string
  onEditValueChange: (value: string) => void
  onCellSave: () => void
  onCellCancel: () => void
  onCellEdit: (rowId: string, columnId: string, value: string) => void
}

export interface AddColumnDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  newColumn: NewColumn
  onNewColumnChange: (column: NewColumn) => void
  onAddColumn: () => void
}

export interface EditColumnDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingColumn: ExtractionField | null
  onEditingColumnChange: (column: ExtractionField | null) => void
  onSaveColumnEdit: () => void
  onRemoveColumn: (columnId: string) => void
}

export interface DragDropAreaProps {
  dragActive: boolean
  onDrag: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  hasFields: boolean
  hasDocuments: boolean
}

export interface SearchAndStatsProps {
  globalFilter: string
  onGlobalFilterChange: (value: string) => void
  filteredRowsCount: number
  totalRowsCount: number
  columnsCount: number
}