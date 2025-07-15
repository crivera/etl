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
import type { NewColumn } from './grid-types'

interface AddColumnDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  newColumn: NewColumn
  onNewColumnChange: (column: NewColumn) => void
  onAddColumn: () => void
}

export const AddColumnDialog = ({
  open,
  onOpenChange,
  newColumn,
  onNewColumnChange,
  onAddColumn,
}: AddColumnDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                onNewColumnChange({ ...newColumn, label: e.target.value })
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
                onNewColumnChange({ ...newColumn, description: e.target.value })
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
                onNewColumnChange({ ...newColumn, customPrompt: e.target.value })
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
                onNewColumnChange({
                  ...newColumn,
                  type: value as ExtractionFieldType,
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
                <SelectItem value="object_list">Object List</SelectItem>
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
                  onNewColumnChange({
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onAddColumn} disabled={!newColumn.label.trim()}>
            Add Column
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}