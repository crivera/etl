'use client'

import { FileUp } from 'lucide-react'
import type React from 'react'

interface DragDropAreaProps {
  dragActive: boolean
  onDrag: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  hasFields: boolean
}

export const DragDropArea = ({
  dragActive,
  onDrag,
  onDrop,
  hasFields,
}: DragDropAreaProps) => {
  return (
    <div
      className={`mb-4 border-2 border-dashed rounded-lg p-4 flex items-center justify-center transition-colors ${
        dragActive
          ? 'border-primary bg-primary/5 dark:bg-primary/10'
          : 'border-gray-300 dark:border-gray-600'
      }`}
      onDragEnter={onDrag}
      onDragLeave={onDrag}
      onDragOver={onDrag}
      onDrop={onDrop}
    >
      <FileUp className="h-6 w-6 text-muted-foreground mr-3" />
      <div>
        <p className="text-sm font-medium">
          {hasFields
            ? 'Drag and drop files here'
            : 'Upload your first document to define fields'}
        </p>
        <p className="text-xs text-muted-foreground">
          {hasFields
            ? 'Supports PDF, DOC, DOCX, TXT, and spreadsheet files'
            : 'Upload exactly one document to automatically detect fields'}
        </p>
      </div>
    </div>
  )
}