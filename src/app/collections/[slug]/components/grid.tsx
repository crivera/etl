'use client'

import { Button } from '@/app/components/ui/button'
import { Card } from '@/app/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu'
import { Input } from '@/app/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import type { DocumentItem } from '@/lib/consts'
import { ExtractionFieldType } from '@/lib/consts'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Edit,
  FileUp,
  MoreVertical,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { useMemo } from 'react'

import { AddColumnDialog } from './add-column-dialog'
import { DragDropArea } from './drag-drop-area'
import { EditColumnDialog } from './edit-column-dialog'
import type { GridProps } from './grid-types'
import { formatCellValue, getFileIcon, getStatusBadge } from './grid-utils'
import { ListDisplay } from './list-display'
import { SearchAndStats } from './search-and-stats'
import { useGrid } from './use-grid'

export const DataGrid = ({ initialCollection, initialDocuments }: GridProps) => {
  const {
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
    rerunExtractionAction,
  } = useGrid(initialCollection, initialDocuments)

  // Transform rows for TanStack Table
  const tableData = useMemo<DocumentItem[]>(() => {
    return rows
  }, [rows])

  // Create column helper
  const columnHelper = createColumnHelper<DocumentItem>()

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
            return formatCellValue(value, column.type)
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
                  (column.type === ExtractionFieldType.LIST || column.type === ExtractionFieldType.TEXT) &&
                  column.allowedValues &&
                  column.allowedValues.length > 0
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
    handleEditColumn,
    handleCellCancel,
    handleCellEdit,
    setEditValue,
    setIsAddColumnDialogOpen,
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

  return (
    <div className="h-full flex flex-col">
      <SearchAndStats
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        filteredRowsCount={table.getFilteredRowModel().rows.length}
        totalRowsCount={rows.length}
        columnsCount={columns.length}
      />

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple={collection.fields.length > 0}
        accept=".pdf,.doc,.docx,.txt,.xlsx,.xls,.csv"
        onChange={handleFileChange}
      />

      <DragDropArea
        dragActive={dragActive}
        onDrag={handleDrag}
        onDrop={handleDrop}
        hasFields={collection.fields.length > 0}
      />

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

      <AddColumnDialog
        open={isAddColumnDialogOpen}
        onOpenChange={setIsAddColumnDialogOpen}
        newColumn={newColumn}
        onNewColumnChange={setNewColumn}
        onAddColumn={handleAddColumn}
      />

      <EditColumnDialog
        open={isEditColumnDialogOpen}
        onOpenChange={setIsEditColumnDialogOpen}
        editingColumn={editingColumn}
        onEditingColumnChange={setEditingColumn}
        onSaveColumnEdit={handleSaveColumnEdit}
        onRemoveColumn={handleRemoveColumn}
      />
    </div>
  )
}