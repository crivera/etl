'use client'

import { Button } from '@/app/components/ui/button'
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/app/components/ui/tabs'
import { DocumentItem, ExtractedDataDTO } from '@/lib/consts'
import { getFileExtension, isImage, isPDF } from '@/lib/utils'
import { getDocumentUrl } from '@/server/routes/document-action'
import { getExtractedDataForDocument } from '@/server/routes/extracted-data-action'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Code,
  Download,
  Eye,
  FileSearch,
  FileText,
  X,
} from 'lucide-react'
import { useAction } from 'next-safe-action/hooks'
import { useEffect, useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { toast } from 'sonner'
import Image from 'next/image'

interface DocumentPreviewProps {
  document: DocumentItem
  onClose: () => void
  openExtractionSidebar: (document: DocumentItem[]) => void
}

export const DocumentPreview = ({
  document,
  onClose,
  openExtractionSidebar,
}: DocumentPreviewProps) => {
  const [documentUrl, setDocumentUrl] = useState<string | null>(null)
  const [extractedData, setExtractedData] = useState<ExtractedDataDTO | null>(
    null,
  )

  const { execute: getDocumentUrlAction } = useAction(getDocumentUrl, {
    onSuccess: ({ data }) => {
      if (data?.url) {
        setDocumentUrl(data.url)
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError?.message ?? 'Failed to load document')
    },
  })

  const { execute: getDocumentExtractedDataAction } = useAction(
    getExtractedDataForDocument,
    {
      onSuccess: ({ data }) => {
        if (data) {
          setExtractedData(data)
        }
      },
      onError: ({ error }) => {
        toast.error(error.serverError?.message ?? 'Failed to load document')
      },
    },
  )

  useEffect(() => {
    if (document.itemType === 'FILE') {
      getDocumentUrlAction(document.id)
      getDocumentExtractedDataAction(document.id)
    }
  }, [
    document.id,
    document.itemType,
    getDocumentExtractedDataAction,
    getDocumentUrlAction,
  ])

  // Function to get file icon based on extension
  const getFileIcon = () => {
    const extension = getFileExtension(document.name)

    const config = iconConfig[extension as keyof typeof iconConfig] || {
      bg: 'bg-gray-100 dark:bg-gray-800',
      text: 'text-gray-500',
    }

    return (
      <div
        className={`w-16 h-16 ${config.bg} rounded-lg flex items-center justify-center ${config.text}`}
      >
        <FileText className="w-8 h-8" />
      </div>
    )
  }

  // Function to handle download
  const handleDownload = () => {
    if (documentUrl) {
      window.open(documentUrl, '_blank')
    }
  }
  const hasExtractedData = extractedData !== null

  // Function to render preview content
  const renderPreviewContent = () => {
    if (!documentUrl) {
      return (
        <div className="flex flex-col h-full">
          <div className="p-4 border-b flex items-center gap-4">
            {getFileIcon()}
            <div>
              <h3 className="text-xl font-semibold">{document.name}</h3>
              <p className="text-sm text-muted-foreground">
                {(document.size / 1024).toFixed(1)} KB • Added{' '}
                {document.createdAt.toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="mt-6 animate-pulse">
              <p className="text-sm text-muted-foreground">
                Loading preview...
              </p>
            </div>
          </div>
        </div>
      )
    }

    if (isImage(document.name)) {
      return (
        <div className="flex flex-col h-full">
          <div className="p-4 border-b flex items-center gap-4">
            {getFileIcon()}
            <div>
              <h3 className="text-xl font-semibold">{document.name}</h3>
              <p className="text-sm text-muted-foreground">
                {(document.size / 1024).toFixed(1)} KB • Added{' '}
                {document.createdAt.toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <Image
              src={documentUrl}
              alt={document.name}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )
    }

    if (isPDF(document.name)) {
      return (
        <div className="flex flex-col h-full">
          <div className="p-4 border-b flex items-center gap-4">
            {getFileIcon()}
            <div>
              <h3 className="text-xl font-semibold">{document.name}</h3>
              <p className="text-sm text-muted-foreground">
                {(document.size / 1024).toFixed(1)} KB • Added{' '}
                {document.createdAt.toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex-1">
            <iframe
              src={documentUrl}
              className="w-full h-full border-0"
              title={document.name}
            />
          </div>
        </div>
      )
    }

    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="bg-card p-8 rounded-lg border shadow-sm flex flex-col items-center max-w-md w-full">
          {getFileIcon()}
          <h3 className="text-xl font-semibold mt-4">{document.name}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {(document.size / 1024).toFixed(1)} KB • Added{' '}
            {document.createdAt.toLocaleDateString()}
          </p>

          <Button className="mt-6" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Preview not available. Download the file to view its contents.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold">Document Preview</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openExtractionSidebar([document])}
          >
            Extract Data
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="p-4 border-b">
        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preview">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="extracted">
              <Code className="h-4 w-4 mr-2" />
              Extracted Text
            </TabsTrigger>
            <TabsTrigger value="data" disabled={!hasExtractedData}>
              <FileSearch className="h-4 w-4 mr-2" />
              Extracted Data
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 h-[calc(100vh-180px)] overflow-auto">
            <TabsContent value="preview" className="mt-0 h-full">
              {renderPreviewContent()}
            </TabsContent>

            <TabsContent value="extracted" className="mt-0">
              {document.extractedText ? (
                <div className="border rounded-lg p-4 bg-muted/30 prose max-w-full">
                  <Markdown remarkPlugins={[remarkGfm]}>
                    {document.extractedText
                      .map((text, i) => `## Page ${i + 1}: \n\n ${text.text}`)
                      .join('\n\n')}
                  </Markdown>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-8">
                  <div className="bg-amber-100 dark:bg-amber-900/20 p-3 rounded-full">
                    <Code className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium">
                    No extracted text available
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground max-w-md">
                    This document hasn&apos;t been processed yet. Select it and
                    use the extraction tool to extract data from this document.
                  </p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="data" className="mt-0">
              {extractedData ? (
                <div className="space-y-4">
                  {/* Version navigation */}
                  <div className="flex items-center justify-between border-b pb-3">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />

                      <span className="ml-2 text-xs text-muted-foreground flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {extractedData.createdAt.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Extraction data table */}
                  <div className="border rounded-md overflow-hidden">
                    <div className="bg-muted p-3 flex items-center">
                      <FileText className="h-5 w-5 mr-2 text-primary" />
                      <h4 className="font-medium">{document.name}</h4>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-1/3">Field</TableHead>
                          <TableHead>Extracted Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {extractedData.fields.map((field) => (
                          <TableRow key={field.id}>
                            <TableCell className="font-medium">
                              {field.label}
                            </TableCell>
                            <TableCell>
                              {extractedData.data.map((data) => data[field.id])}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-8">
                  <div className="bg-amber-100 dark:bg-amber-900/20 p-3 rounded-full">
                    <FileSearch className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium">
                    No extracted data available
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground max-w-md">
                    This document hasn&apos;t been processed yet. Select it and
                    use the extraction tool to extract data from this document.
                  </p>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}

const iconConfig = {
  pdf: {
    bg: 'bg-red-100 dark:bg-red-900/20',
    text: 'text-red-500',
  },
  jpg: {
    bg: 'bg-purple-100 dark:bg-purple-900/20',
    text: 'text-purple-500',
  },
  jpeg: {
    bg: 'bg-purple-100 dark:bg-purple-900/20',
    text: 'text-purple-500',
  },
  png: {
    bg: 'bg-purple-100 dark:bg-purple-900/20',
    text: 'text-purple-500',
  },
  gif: {
    bg: 'bg-purple-100 dark:bg-purple-900/20',
    text: 'text-purple-500',
  },
  webp: {
    bg: 'bg-purple-100 dark:bg-purple-900/20',
    text: 'text-purple-500',
  },
  doc: {
    bg: 'bg-blue-100 dark:bg-blue-900/20',
    text: 'text-blue-500',
  },
  docx: {
    bg: 'bg-blue-100 dark:bg-blue-900/20',
    text: 'text-blue-500',
  },
  xls: {
    bg: 'bg-green-100 dark:bg-green-900/20',
    text: 'text-green-500',
  },
  xlsx: {
    bg: 'bg-green-100 dark:bg-green-900/20',
    text: 'text-green-500',
  },
}
