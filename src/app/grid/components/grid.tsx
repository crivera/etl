'use client'

import type React from 'react'

import { useState, useRef, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Card } from '@/app/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
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
  FileUp,
  Plus,
  MoreVertical,
  Trash2,
  FileText,
  FileSpreadsheet,
  FileIcon as FilePdf,
  Upload,
  Settings,
  Edit,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'

export interface DataGridColumn {
  id: string
  label: string
  type: 'text' | 'number' | 'date' | 'currency' | 'select'
  width: number
  description?: string
  options?: string[] // For select type
}

export interface DataGridRow {
  id: string
  file: File
  data: Record<string, string>
}

// Extended row type for TanStack Table
interface TableRow extends DataGridRow {
  fileName: string
  fileSize: string
  fileType: string
}

export const DataGrid = () => {
  const [columns, setColumns] = useState<DataGridColumn[]>([
    {
      id: 'invoice_number',
      label: 'Invoice Number',
      type: 'text',
      width: 160,
      description: 'Unique invoice identifier',
    },
    {
      id: 'customer_name',
      label: 'Customer Name',
      type: 'text',
      width: 220,
      description: 'Name of the customer or client',
    },
    {
      id: 'amount',
      label: 'Amount',
      type: 'currency',
      width: 120,
      description: 'Invoice amount before tax',
    },
    {
      id: 'date',
      label: 'Date',
      type: 'date',
      width: 130,
      description: 'Date the invoice was issued',
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      width: 120,
      options: ['Paid', 'Pending', 'Active', 'Complete'],
      description: 'Current status of the invoice',
    },
    {
      id: 'due_date',
      label: 'Due Date',
      type: 'date',
      width: 130,
      description: 'Date payment is due',
    },
    {
      id: 'payment_method',
      label: 'Payment Method',
      type: 'select',
      width: 160,
      options: ['Credit Card', 'Bank Transfer', 'Cash', 'PayPal'],
      description: 'Method of payment',
    },
    {
      id: 'tax_amount',
      label: 'Tax Amount',
      type: 'currency',
      width: 120,
      description: 'Tax applied to the invoice',
    },
    {
      id: 'discount',
      label: 'Discount',
      type: 'currency',
      width: 120,
      description: 'Discount applied to the invoice',
    },
    {
      id: 'total_amount',
      label: 'Total Amount',
      type: 'currency',
      width: 150,
      description: 'Final amount including tax and discounts',
    },
    {
      id: 'notes',
      label: 'Notes',
      type: 'text',
      width: 200,
      description: 'Additional notes about the invoice',
    },
    {
      id: 'reference',
      label: 'Reference',
      type: 'text',
      width: 150,
      description: 'Reference number or code',
    },
    {
      id: 'department',
      label: 'Department',
      type: 'text',
      width: 140,
      description: 'Department responsible for the invoice',
    },
  ])

  const [rows, setRows] = useState<DataGridRow[]>([
    {
      id: 'row-1',
      file: {
        name: 'invoice-2023-05.pdf',
        size: 1024 * 225,
        type: 'application/pdf',
      } as File,
      data: {
        invoice_number: 'INV-2023-05',
        customer_name: 'Acme Corp',
        amount: '$1,250.00',
        date: '2023-05-15',
        status: 'Paid',
        due_date: '2023-06-15',
        payment_method: 'Credit Card',
        tax_amount: '$100.00',
        discount: '$50.00',
        total_amount: '$1,300.00',
        notes: 'Annual subscription',
        reference: 'REF-2023-001',
        department: 'Sales',
      },
    },
    {
      id: 'row-2',
      file: {
        name: 'contract-agreement.docx',
        size: 1024 * 156,
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      } as File,
      data: {
        invoice_number: 'CON-2023-07',
        customer_name: 'Tech Solutions Inc',
        amount: '$5,000.00',
        date: '2023-07-22',
        status: 'Active',
        due_date: '2023-08-22',
        payment_method: 'Bank Transfer',
        tax_amount: '$400.00',
        discount: '$0.00',
        total_amount: '$5,400.00',
        notes: 'Consulting services',
        reference: 'REF-2023-042',
        department: 'Consulting',
      },
    },
    {
      id: 'row-3',
      file: {
        name: 'financial-report-q2.xlsx',
        size: 1024 * 345,
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      } as File,
      data: {
        invoice_number: 'RPT-2023-Q2',
        customer_name: 'Internal Report',
        amount: '$375,000.00',
        date: '2023-08-05',
        status: 'Complete',
        due_date: '2023-08-05',
        payment_method: 'Internal',
        tax_amount: '$0.00',
        discount: '$0.00',
        total_amount: '$375,000.00',
        notes: 'Q2 Financial Summary',
        reference: 'Q2-2023',
        department: 'Finance',
      },
    },
    {
      id: 'row-4',
      file: {
        name: 'purchase-order-001.pdf',
        size: 1024 * 189,
        type: 'application/pdf',
      } as File,
      data: {
        invoice_number: 'PO-2023-001',
        customer_name: 'Global Manufacturing',
        amount: '$2,750.00',
        date: '2023-09-10',
        status: 'Pending',
        due_date: '2023-10-10',
        payment_method: 'Bank Transfer',
        tax_amount: '$220.00',
        discount: '$100.00',
        total_amount: '$2,870.00',
        notes: 'Equipment purchase',
        reference: 'PO-GM-001',
        department: 'Procurement',
      },
    },
    {
      id: 'row-5',
      file: {
        name: 'service-agreement.docx',
        size: 1024 * 267,
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      } as File,
      data: {
        invoice_number: 'SA-2023-15',
        customer_name: 'Digital Innovations Ltd',
        amount: '$8,500.00',
        date: '2023-09-15',
        status: 'Active',
        due_date: '2023-10-15',
        payment_method: 'Credit Card',
        tax_amount: '$680.00',
        discount: '$500.00',
        total_amount: '$8,680.00',
        notes: '12-month service contract',
        reference: 'DI-SERVICE-2023',
        department: 'Services',
      },
    },
    // Adding more sample data for demonstration
    {
      id: 'row-6',
      file: {
        name: 'expense-report-sept.xlsx',
        size: 1024 * 298,
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      } as File,
      data: {
        invoice_number: 'EXP-2023-09',
        customer_name: 'Employee Expenses',
        amount: '$3,245.67',
        date: '2023-09-30',
        status: 'Complete',
        due_date: '2023-09-30',
        payment_method: 'PayPal',
        tax_amount: '$0.00',
        discount: '$0.00',
        total_amount: '$3,245.67',
        notes: 'Monthly expense reimbursements',
        reference: 'EXP-SEPT-2023',
        department: 'HR',
      },
    },
  ])

  const [dragActive, setDragActive] = useState(false)
  const [editingCell, setEditingCell] = useState<{
    rowId: string
    columnId: string
  } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [isAddColumnDialogOpen, setIsAddColumnDialogOpen] = useState(false)
  const [isEditColumnDialogOpen, setIsEditColumnDialogOpen] = useState(false)
  const [editingColumn, setEditingColumn] = useState<DataGridColumn | null>(
    null,
  )
  const [newColumn, setNewColumn] = useState({
    label: '',
    type: 'text' as DataGridColumn['type'],
    options: '',
    description: '',
  })
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Transform rows for TanStack Table
  const tableData = useMemo<TableRow[]>(() => {
    return rows.map((row) => ({
      ...row,
      fileName: row.file.name,
      fileSize: `${(row.file.size / 1024).toFixed(1)} KB`,
      fileType: row.file.type,
    }))
  }, [rows])

  // Create column helper
  const columnHelper = createColumnHelper<TableRow>()

  // Create TanStack Table columns
  const tableColumns = useMemo<ColumnDef<TableRow, string>[]>(() => {
    const cols: ColumnDef<TableRow, string>[] = [
      // File column (pinned/sticky)
      columnHelper.accessor((row: TableRow) => row.fileName, {
        id: 'file',
        header: ({ table }) => (
          <div className="flex items-center justify-between w-full">
            <span className="font-medium">Files</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsAddColumnDialogOpen(true)}
              className="h-6 w-6 text-muted-foreground hover:text-primary"
              title="Add Column"
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
                {getFileIcon(originalRow.file)}
                <div className="ml-3 min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">
                    {originalRow.file.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {row.original.fileSize}
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
        columnHelper.accessor((row: TableRow) => row.data[column.id] || '', {
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
                  className="h-6 w-6 mr-1"
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Settings className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleRemoveColumn(column.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove Column
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ),
          cell: ({ getValue, row, column: col }) => {
            const value = getValue() as string
            const isEditing =
              editingCell?.rowId === row.original.id &&
              editingCell?.columnId === col.id

            if (isEditing) {
              if (column.type === 'select' && column.options) {
                return (
                  <Select value={editValue} onValueChange={setEditValue}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {column.options.map((option) => (
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
        }),
      )
    })

    return cols
  }, [columns, editingCell, editValue, rows])

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
    const newRows = files.map((file) => ({
      id: `row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      data: columns.reduce(
        (acc, col) => {
          acc[col.id] = ''
          return acc
        },
        {} as Record<string, string>,
      ),
    }))

    setRows([...rows, ...newRows])
  }

  const handleCellEdit = (rowId: string, columnId: string, value: string) => {
    setEditingCell({ rowId, columnId })
    setEditValue(value)
  }

  const handleCellSave = () => {
    if (!editingCell) return

    setRows(
      rows.map((row) =>
        row.id === editingCell.rowId
          ? {
              ...row,
              data: {
                ...row.data,
                [editingCell.columnId]: editValue,
              },
            }
          : row,
      ),
    )

    setEditingCell(null)
    setEditValue('')
  }

  const handleCellCancel = () => {
    setEditingCell(null)
    setEditValue('')
  }

  const handleAddColumn = () => {
    if (!newColumn.label.trim()) return

    const columnId = newColumn.label.toLowerCase().replace(/\s+/g, '_')
    const column: DataGridColumn = {
      id: columnId,
      label: newColumn.label.trim(),
      type: newColumn.type,
      width: 180,
      description: newColumn.description.trim() || undefined,
      options:
        newColumn.type === 'select'
          ? newColumn.options.split(',').map((opt) => opt.trim())
          : undefined,
    }

    setColumns([...columns, column])

    // Add empty data for this column to all existing rows
    setRows(
      rows.map((row) => ({
        ...row,
        data: {
          ...row.data,
          [columnId]: '',
        },
      })),
    )

    setNewColumn({
      label: '',
      type: 'text',
      options: '',
      description: '',
    })
    setIsAddColumnDialogOpen(false)
  }

  const handleEditColumn = (column: DataGridColumn) => {
    setEditingColumn({ ...column })
    setIsEditColumnDialogOpen(true)
  }

  const handleSaveColumnEdit = () => {
    if (!editingColumn) return

    setColumns(
      columns.map((col) => (col.id === editingColumn.id ? editingColumn : col)),
    )

    setIsEditColumnDialogOpen(false)
    setEditingColumn(null)
  }

  const handleRemoveColumn = (columnId: string) => {
    setColumns(columns.filter((col) => col.id !== columnId))
    setRows(
      rows.map((row) => {
        const newData = { ...row.data }
        delete newData[columnId]
        return { ...row, data: newData }
      }),
    )
  }

  const handleRemoveRow = (rowId: string) => {
    setRows(rows.filter((row) => row.id !== rowId))
  }

  const getFileIcon = (file: File) => {
    if (file.type.includes('pdf')) {
      return <FilePdf className="h-5 w-5 text-red-500" />
    } else if (file.type.includes('word') || file.type.includes('document')) {
      return <FileText className="h-5 w-5 text-blue-500" />
    } else if (file.type.includes('sheet') || file.type.includes('excel')) {
      return <FileSpreadsheet className="h-5 w-5 text-green-500" />
    } else {
      return <FileText className="h-5 w-5 text-gray-500" />
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
        multiple
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
          <p className="text-sm font-medium">Drag and drop files here</p>
          <p className="text-xs text-muted-foreground">
            Supports PDF, DOC, DOCX, TXT, and spreadsheet files
          </p>
        </div>
      </div>

      {/* TanStack Table with Sticky First Column */}
      <Card className="flex-1 overflow-hidden">
        <div className="h-full relative">
          <div className="h-full overflow-auto">
            <div className="relative">
              {/* Main Table */}
              <table className="w-full">
                <thead className="sticky top-0 bg-muted/50 border-b z-20">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header, index) => (
                        <th
                          key={header.id}
                          className={`h-12 px-4 text-left align-middle font-medium text-muted-foreground border-r last:border-r-0 ${
                            index === 0
                              ? 'sticky left-0 bg-muted/50 z-30 shadow-[2px_0_4px_rgba(0,0,0,0.1)] dark:shadow-[2px_0_4px_rgba(0,0,0,0.3)]'
                              : ''
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
                          {/* Column resizer */}
                          {header.column.getCanResize() &&
                            header.id !== 'file' && (
                              <div
                                onMouseDown={header.getResizeHandler()}
                                onTouchStart={header.getResizeHandler()}
                                className="absolute right-0 top-0 h-full w-1 bg-border cursor-col-resize hover:bg-primary opacity-0 hover:opacity-100 transition-opacity"
                                style={{
                                  transform: header.column.getIsResizing()
                                    ? 'scaleX(2)'
                                    : 'scaleX(1)',
                                }}
                              />
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
                          <p className="text-sm">No files uploaded</p>
                          <p className="text-xs">Upload files to get started</p>
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
                                ? 'sticky left-0 bg-background z-10 shadow-[2px_0_4px_rgba(0,0,0,0.1)] dark:shadow-[2px_0_4px_rgba(0,0,0,0.3)]'
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
                placeholder="Enter column name"
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
              <Label htmlFor="columnType">Column Type</Label>
              <Select
                value={newColumn.type}
                onValueChange={(value) =>
                  setNewColumn({
                    ...newColumn,
                    type: value as DataGridColumn['type'],
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
                  <SelectItem value="select">Select (Dropdown)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newColumn.type === 'select' && (
              <div className="grid gap-2">
                <Label htmlFor="columnOptions">Options (comma-separated)</Label>
                <Input
                  id="columnOptions"
                  value={newColumn.options}
                  onChange={(e) =>
                    setNewColumn({ ...newColumn, options: e.target.value })
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
                  placeholder="Enter column name"
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
                <Label htmlFor="editColumnType">Column Type</Label>
                <Select
                  value={editingColumn.type}
                  onValueChange={(value) =>
                    setEditingColumn({
                      ...editingColumn,
                      type: value as DataGridColumn['type'],
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
                    <SelectItem value="select">Select (Dropdown)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {editingColumn.type === 'select' && (
                <div className="grid gap-2">
                  <Label htmlFor="editColumnOptions">
                    Options (comma-separated)
                  </Label>
                  <Input
                    id="editColumnOptions"
                    value={
                      editingColumn.options
                        ? editingColumn.options.join(', ')
                        : ''
                    }
                    onChange={(e) =>
                      setEditingColumn({
                        ...editingColumn,
                        options: e.target.value
                          .split(',')
                          .map((opt) => opt.trim()),
                      })
                    }
                    placeholder="Option 1, Option 2, Option 3"
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditColumnDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveColumnEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
