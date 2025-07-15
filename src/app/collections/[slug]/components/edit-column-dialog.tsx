'use client'

import { Button } from '@/app/components/ui/button'
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
import { Textarea } from '@/app/components/ui/textarea'
import { ExtractionFieldType } from '@/lib/consts'
import type { ExtractionField } from '@/lib/consts'
import { AllowedValuesInput } from './allowed-values-input'

interface EditColumnDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingColumn: ExtractionField | null
  onEditingColumnChange: (column: ExtractionField | null) => void
  onSaveColumnEdit: () => void
  onRemoveColumn: (columnId: string) => void
}

export const EditColumnDialog = ({
  open,
  onOpenChange,
  editingColumn,
  onEditingColumnChange,
  onSaveColumnEdit,
  onRemoveColumn,
}: EditColumnDialogProps) => {
  if (!editingColumn) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Column</DialogTitle>
          <DialogDescription>Modify column properties.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="editColumnLabel">Column Name</Label>
            <Input
              id="editColumnLabel"
              value={editingColumn.label}
              onChange={(e) =>
                onEditingColumnChange({
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
                onEditingColumnChange({
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
                onEditingColumnChange({
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
                onEditingColumnChange({
                  ...editingColumn,
                  type: value as ExtractionFieldType,
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
                <SelectItem value="object_list">Object List</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(editingColumn.type === ExtractionFieldType.LIST || editingColumn.type === ExtractionFieldType.TEXT) && (
            <AllowedValuesInput
              label="Allowed Values (optional)"
              values={editingColumn.allowedValues || []}
              onChange={(values) =>
                onEditingColumnChange({
                  ...editingColumn,
                  allowedValues: values,
                })
              }
              placeholder="Type a value and press Enter"
            />
          )}
        </div>

        <DialogFooter>
          <div className="flex justify-between w-full">
            <Button
              variant="destructive"
              onClick={() => {
                onRemoveColumn(editingColumn.id)
                onOpenChange(false)
              }}
            >
              Remove Column
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={onSaveColumnEdit}>Save Changes</Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}