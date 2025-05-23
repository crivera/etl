'use client'

import type React from 'react'

import { useState, useRef } from 'react'
import { Button } from '@/app/components/ui/button'
import { FileUp, File, X, ArrowRight, Loader2 } from 'lucide-react'

interface FileUploaderProps {
  onFilesUpload: (files: File[]) => void
  files: File[]
  onContinue?: () => void
  isExecuting?: boolean
}

export const FileUploader = ({
  onFilesUpload,
  files,
  onContinue,
  isExecuting,
}: FileUploaderProps) => {
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

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
      handleFiles(newFiles)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()

    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      handleFiles(newFiles)
    }
  }

  const handleFiles = (newFiles: File[]) => {
    // Combine with existing files, avoiding duplicates by name
    const existingFileNames = new Set(files.map((f) => f.name))
    const uniqueNewFiles = newFiles.filter(
      (file) => !existingFileNames.has(file.name),
    )

    if (uniqueNewFiles.length > 0) {
      onFilesUpload([...files, ...uniqueNewFiles])
    }

    // Reset the input
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const removeFile = (index: number) => {
    const updatedFiles = [...files]
    updatedFiles.splice(index, 1)
    onFilesUpload(updatedFiles)
  }

  const openFileSelector = () => {
    if (inputRef.current) {
      inputRef.current.click()
    }
  }

  return (
    <div className="w-full space-y-4">
      <div
        className={`
          border-2 border-dashed rounded-lg p-8
          flex flex-col items-center justify-center
          transition-colors
          ${dragActive ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-gray-300 dark:border-gray-600'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={handleChange}
          accept=".pdf,.doc,.docx,.txt"
          multiple
        />

        <FileUp className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium mb-1">Drag and drop your documents</p>
        <p className="text-sm text-gray-500 mb-4">
          {files.length > 0
            ? 'Continue adding documents or proceed to the next step'
            : 'Supports PDF, DOC, DOCX, and TXT files'}
        </p>
        <div className="flex gap-3">
          <Button onClick={openFileSelector}>Select Documents</Button>
          {files.length > 0 && onContinue && (
            <Button
              variant="default"
              onClick={onContinue}
              className="gap-1"
              disabled={isExecuting}
            >
              {isExecuting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  Continue <ArrowRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium">
              Uploaded Documents ({files.length})
            </h3>
            {files.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 px-2 text-muted-foreground"
                onClick={() => onFilesUpload([])}
              >
                Clear All
              </Button>
            )}
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center p-3 bg-card rounded-lg border shadow-sm dark:border-gray-700"
              >
                <File className="h-6 w-6 text-primary mr-3 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(index)}
                  className="ml-2 shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
