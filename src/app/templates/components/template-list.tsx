'use client'

import { Button } from '@/app/components/ui/button'
import { Card, CardContent } from '@/app/components/ui/card'
import { getFileTypeBadge } from '@/app/components/ui/common/file-badge'
import { getFileIcon } from '@/app/components/ui/common/file-icon'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table'
import { Textarea } from '@/app/components/ui/textarea'
import { FileType, TemplateDTO } from '@/lib/consts'
import { format } from 'date-fns'
import {
  Calendar,
  Edit,
  Eye,
  MoreVertical,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'

interface TemplateListProps {
  templates: TemplateDTO[]
  onCreateTemplate: (template: {
    name: string
    description: string
    fileType: FileType
  }) => void
  onEditTemplate: (template: TemplateDTO) => void
  onPreviewTemplate: (template: TemplateDTO) => void
  onDeleteTemplate: (id: string) => void
}

export const TemplateList = ({
  templates,
  onCreateTemplate,
  onEditTemplate,
  onPreviewTemplate,
  onDeleteTemplate,
}: TemplateListProps) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<TemplateDTO | null>(
    null,
  )
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    fileType: FileType.DOCX,
  })

  const filteredTemplates = templates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (template.description
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ??
        false),
  )

  const handleCreateSubmit = () => {
    if (!newTemplate.name.trim()) return

    onCreateTemplate({
      name: newTemplate.name.trim(),
      description: newTemplate.description.trim(),
      fileType: newTemplate.fileType,
    })

    setNewTemplate({
      name: '',
      description: '',
      fileType: FileType.DOCX,
    })
    setIsCreateDialogOpen(false)
  }

  const handleDeleteClick = (template: TemplateDTO) => {
    setTemplateToDelete(template)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (templateToDelete) {
      onDeleteTemplate(templateToDelete.id)
      setTemplateToDelete(null)
      setIsDeleteDialogOpen(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search templates..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Template Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="hidden md:table-cell">Fields</TableHead>
                <TableHead className="hidden md:table-cell">
                  Last Modified
                </TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTemplates.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {searchQuery
                      ? 'No templates match your search'
                      : 'No templates found. Create your first template to get started.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        {getFileIcon(template.fileType)}
                        <div className="ml-3">
                          <div>{template.name}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {template.description}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getFileTypeBadge(template.fileType)}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {template.fields.length} field
                      {template.fields.length !== 1 ? 's' : ''}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center text-muted-foreground text-sm">
                        <Calendar className="h-3.5 w-3.5 mr-1" />
                        {format(template.dateModified, 'MMM d, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => onEditTemplate(template)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onPreviewTemplate(template)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(template)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Template Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
            <DialogDescription>
              Create a new template for document generation. You&apos;ll be able
              to add fields and upload a template file in the next step.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={newTemplate.name}
                onChange={(e) =>
                  setNewTemplate({ ...newTemplate, name: e.target.value })
                }
                placeholder="Enter template name"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newTemplate.description}
                onChange={(e) =>
                  setNewTemplate({
                    ...newTemplate,
                    description: e.target.value,
                  })
                }
                placeholder="Enter template description"
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="fileType">File Type</Label>
              <Select
                value={newTemplate.fileType}
                onValueChange={(value) =>
                  setNewTemplate({
                    ...newTemplate,
                    fileType: value as FileType,
                  })
                }
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
              {newTemplate.fileType === 'xlsx' && (
                <p className="text-xs text-muted-foreground mt-1">
                  Note: CSV files will be generated for Excel templates.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateSubmit}
              disabled={!newTemplate.name.trim()}
            >
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this template? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>

          {templateToDelete && (
            <div className="py-4">
              <div className="flex items-center p-3 border rounded-md">
                {getFileIcon(templateToDelete.fileType)}
                <div className="ml-3">
                  <div className="font-medium">{templateToDelete.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {templateToDelete.description}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
