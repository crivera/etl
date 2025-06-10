'use client'

import React from 'react'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/app/components/ui/breadcrumb'
import { Button } from '@/app/components/ui/button'
import { Checkbox } from '@/app/components/ui/checkbox'
import { getFileIconByName } from '@/app/components/ui/common/file-icon'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table'
import {
  BreadcrumbItem as BreadcrumbItemType,
  DocumentItem,
  DocumentSortField,
  DocumentStatus,
  ItemType,
  SortDirection,
} from '@/lib/consts'
import { formatDistanceToNow } from 'date-fns'
import {
  ArrowUpDown,
  Calendar,
  Check,
  ChevronRight,
  FileUp,
  FolderPlus,
  Home,
  Loader2,
  PanelRight,
  Upload,
  X,
} from 'lucide-react'
import { useRef, useState } from 'react'

interface DocumentTableProps {
  items: DocumentItem[]
  currentFolderId: string | undefined
  breadcrumbData: BreadcrumbItemType[]
  onUpload: (files: File[]) => void
  onSelect: (id: string, selected: boolean) => void
  onSelectAll: (selected: boolean) => void
  onRemove: (id: string) => void
  onOpenSideBar: () => void
  onCreateFolder: (name: string) => void
  onNavigateToFolder: (id: string | undefined) => void
  onDocumentClick: (document: DocumentItem) => void
  isUploading: boolean
  isCreatingFolder: boolean
  isConnected: boolean
}

export const DocumentTable = ({
  items,
  currentFolderId,
  breadcrumbData,
  onUpload,
  onSelect,
  onSelectAll,
  onRemove,
  onOpenSideBar,
  onCreateFolder,
  onNavigateToFolder,
  onDocumentClick,
  isUploading,
  isCreatingFolder,
  isConnected,
}: DocumentTableProps) => {
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const [sortField, setSortField] = useState<DocumentSortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    SortDirection.DESC,
  )
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [folderNameError, setFolderNameError] = useState('')
  const [itemToRemove, setItemToRemove] = useState<string | null>(null)

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
      onUpload(newFiles)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()

    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      onUpload(newFiles)
    }
  }

  const openFileSelector = () => {
    if (inputRef.current) {
      inputRef.current.click()
    }
  }

  const handleSort = (field: DocumentSortField) => {
    if (sortField === field) {
      setSortDirection(
        sortDirection === SortDirection.ASC
          ? SortDirection.DESC
          : SortDirection.ASC,
      )
    } else {
      setSortField(field)
      setSortDirection(SortDirection.ASC)
    }
  }

  const handleOpenNewFolderDialog = () => {
    setNewFolderName('')
    setFolderNameError('')
    setIsNewFolderDialogOpen(true)
  }

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      setFolderNameError('Folder name cannot be empty')
      return
    }

    if (newFolderName.length > 20) {
      setFolderNameError('Folder name cannot be longer than 20 characters')
      return
    }

    const folderExists = items.some(
      (doc) =>
        doc.parentId === currentFolderId &&
        doc.itemType === ItemType.FOLDER &&
        doc.name.toLowerCase() === newFolderName.trim().toLowerCase(),
    )

    if (folderExists) {
      setFolderNameError('Folder with this name already exists')
      return
    }

    onCreateFolder(newFolderName.trim())
    setIsNewFolderDialogOpen(false)
  }

  const handleRemove = (id: string) => {
    setItemToRemove(id)
  }

  const confirmRemove = () => {
    if (itemToRemove) {
      onRemove(itemToRemove)
      setItemToRemove(null)
    }
  }

  const cancelRemove = () => {
    setItemToRemove(null)
  }

  const allSelected = items.every((doc) => doc.selected)
  const someSelected = items.some((doc) => doc.selected)
  const selectedCount = items.filter((doc) => doc.selected).length

  const documents = items.filter((doc) => {
    if (currentFolderId) {
      return doc.parentId === currentFolderId
    } else {
      return doc.parentId === null
    }
  })

  return (
    <div className="h-full flex flex-col border rounded-md">
      <div className="p-4 flex justify-between items-center border-b h-16">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
            title={
              isConnected
                ? 'Connected to realtime updates'
                : 'Disconnected from realtime updates'
            }
          />
          <h2 className="text-xl font-semibold">Documents</h2>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleOpenNewFolderDialog}>
            <FolderPlus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
          {someSelected && (
            <Button onClick={() => onOpenSideBar()} className="gap-2">
              <PanelRight className="h-4 w-4" />
              Extract Data ({selectedCount})
            </Button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleChange}
        accept=".pdf,.doc,.docx,.txt,.xlsx,.xls,.jpg,.jpeg,.png"
        multiple
      />
      {/* Drag & Drop Area at the top */}
      <div
        className={`mx-4 my-4 border-2 border-dashed rounded-lg p-3 flex items-center justify-center transition-colors ${
          dragActive
            ? 'border-primary bg-primary/5 dark:bg-primary/10'
            : 'border-gray-300 dark:border-gray-600'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <FileUp className="h-8 w-8 text-muted-foreground mr-4 hidden sm:block" />
        <div className="flex-1">
          <p className="text-sm font-medium">Drag and drop documents here</p>
          <p className="text-xs text-muted-foreground">
            Supports PDF, DOC, DOCX, IMAGE, TXT, and spreadsheet files
          </p>
        </div>
        {isUploading && (
          <div className="flex items-center justify-center">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            <span>Uploading...</span>
          </div>
        )}
        <Button
          size="sm"
          onClick={openFileSelector}
          className="ml-4"
          disabled={isUploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          Browse
        </Button>
      </div>

      {/* Breadcrumbs */}
      <div className="px-4 py-2 border-b flex items-center">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                onClick={() => onNavigateToFolder(undefined)}
                className="flex items-center gap-1 cursor-pointer hover:underline"
                aria-disabled={!currentFolderId}
                tabIndex={!currentFolderId ? -1 : 0}
              >
                <Home className="h-4 w-4" /> /
              </BreadcrumbLink>
            </BreadcrumbItem>
            {breadcrumbData.map((item, index) => (
              <React.Fragment key={item.id}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {index === breadcrumbData.length - 1 ? (
                    <BreadcrumbPage className="font-medium">
                      {item.name}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      onClick={() => onNavigateToFolder(item.id)}
                      className="cursor-pointer hover:underline"
                    >
                      {item.name}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {documents.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <FileUp className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No documents uploaded</h3>
          <p className="text-muted-foreground mb-4 max-w-md">
            Drag and drop your documents here, or click the upload button to
            browse for files.
          </p>
          <Button onClick={openFileSelector}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Documents
          </Button>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    id="select-all"
                    checked={allSelected}
                    onCheckedChange={(checked) => onSelectAll(!!checked)}
                  />
                </TableHead>
                <TableHead className="min-w-[300px]">
                  <Button
                    variant="ghost"
                    className="p-0 h-8 font-medium"
                    onClick={() => handleSort('name')}
                  >
                    Name
                    <ArrowUpDown
                      className={`ml-2 h-4 w-4 ${sortField === 'name' ? 'opacity-100' : 'opacity-40'}`}
                    />
                  </Button>
                </TableHead>
                <TableHead className="w-[120px]">
                  <Button
                    variant="ghost"
                    className="p-0 h-8 font-medium"
                    disabled
                  >
                    Size
                  </Button>
                </TableHead>
                <TableHead className="w-[180px]">
                  <Button
                    variant="ghost"
                    className="p-0 h-8 font-medium"
                    onClick={() => handleSort('createdAt')}
                  >
                    Added
                    <ArrowUpDown
                      className={`ml-2 h-4 w-4 ${sortField === 'createdAt' ? 'opacity-100' : 'opacity-40'}`}
                    />
                  </Button>
                </TableHead>
                <TableHead className="w-[180px]">
                  <Button
                    variant="ghost"
                    className="p-0 h-8 font-medium"
                    onClick={() => handleSort('updatedAt')}
                  >
                    Updated
                    <ArrowUpDown
                      className={`ml-2 h-4 w-4 ${sortField === 'updatedAt' ? 'opacity-100' : 'opacity-40'}`}
                    />
                  </Button>
                </TableHead>

                <TableHead className="w-[120px]">
                  <Button
                    variant="ghost"
                    className="p-0 h-8 font-medium"
                    onClick={() => handleSort('status')}
                  >
                    Status
                    <ArrowUpDown
                      className={`ml-2 h-4 w-4 ${sortField === 'status' ? 'opacity-100' : 'opacity-40'}`}
                    />
                  </Button>
                </TableHead>
                <TableHead className="w-[80px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((item) => (
                <TableRow
                  key={item.id}
                  className={`${item.selected ? 'bg-muted/50' : ''} ${
                    item.selected ? 'hover:bg-muted/70' : 'hover:bg-muted/30'
                  }`}
                >
                  <TableCell>
                    {item.itemType !== ItemType.FOLDER && (
                      <Checkbox
                        id={`select-${item.id}`}
                        checked={item.selected}
                        onCheckedChange={(checked) =>
                          onSelect(item.id, !!checked)
                        }
                      />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div
                      className={`flex items-center cursor-pointer hover:text-primary`}
                      onClick={() =>
                        item.itemType === ItemType.FOLDER
                          ? onNavigateToFolder(item.id)
                          : onDocumentClick(item)
                      }
                    >
                      {getFileIconByName(
                        item.name,
                        item.itemType === ItemType.FOLDER,
                      )}
                      <span className="truncate max-w-[250px]">
                        {item.name}
                      </span>
                      {item.itemType === ItemType.FOLDER && (
                        <ChevronRight className="h-4 w-4 ml-1" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.itemType === ItemType.FILE &&
                      (item.size / 1024).toFixed(1) + ' KB'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {item.itemType === ItemType.FILE && (
                        <>
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />

                          <span>
                            {formatDistanceToNow(item.createdAt, {
                              addSuffix: true,
                            })}
                          </span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {item.itemType === ItemType.FILE && (
                        <>
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>
                            {formatDistanceToNow(item.updatedAt, {
                              addSuffix: true,
                            })}
                          </span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.itemType === ItemType.FOLDER ? (
                      <></>
                    ) : item.status === DocumentStatus.COMPLETED ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        <Check className="h-3 w-3 mr-1" /> Processed
                      </span>
                    ) : item.status === DocumentStatus.FAILED ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                        <X className="h-3 w-3 mr-1" /> Failed
                      </span>
                    ) : item.status === DocumentStatus.EXTRACTING ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />{' '}
                        Extracting
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                        <Upload className="h-3 w-3 mr-1" /> Uploaded
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(item.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive cursor-pointer"
                    >
                      <span className="sr-only">Remove</span>
                      <X className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog
        open={isNewFolderDialogOpen}
        onOpenChange={setIsNewFolderDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="folderName">Folder Name</Label>
              <Input
                id="folderName"
                placeholder="Enter folder name"
                value={newFolderName}
                onChange={(e) => {
                  setNewFolderName(e.target.value)
                  setFolderNameError('')
                }}
                className={folderNameError ? 'border-red-500' : ''}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleCreateFolder()
                  }
                }}
                autoFocus
              />
              {folderNameError && (
                <p className="text-sm text-red-500">{folderNameError}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNewFolderDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateFolder} disabled={isCreatingFolder}>
              {isCreatingFolder ? 'Creating...' : 'Create Folder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!itemToRemove} onOpenChange={() => setItemToRemove(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Removal</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Are you sure you want to remove this item? This action cannot be
              undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelRemove}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmRemove}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
