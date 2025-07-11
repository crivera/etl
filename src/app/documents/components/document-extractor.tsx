'use client'

import {
  BreadcrumbItem,
  DocumentItem,
  ExtractionField,
  ExtractionFieldType,
  FieldGroupDTO,
  GetDocumentsDTO,
} from '@/lib/consts'
import {
  createFolder,
  deleteDocument,
  uploadFiles,
} from '@/server/routes/document-action'
import { useAction } from 'next-safe-action/hooks'
import { useRouter } from 'nextjs-toploader/app'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { DocumentTable } from './document-table'
import { ExtractionSidebar } from './extraction-sidebar'
import { DocumentPreview } from './document-preview'
import {
  createFieldGroup,
  updateFieldGroup,
} from '@/server/routes/field-group-action'
import { triggerExtraction } from '@/server/routes/extracted-data-action'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'

interface DocumentExtractorProps {
  initalDocuments: GetDocumentsDTO
  breadcrumbData: BreadcrumbItem[]
  currentFolderId: string | undefined
  initalFieldGroups: FieldGroupDTO[]
}

export const DocumentExtractor = ({
  initalDocuments,
  breadcrumbData,
  currentFolderId,
  initalFieldGroups,
}: DocumentExtractorProps) => {
  const router = useRouter()
  const { user } = useAuth()

  const [documents, setDocuments] = useState<DocumentItem[]>(
    initalDocuments.items,
  )

  // Update documents when initalDocuments prop changes (e.g., when navigating folders)
  useEffect(() => {
    setDocuments(initalDocuments.items)
  }, [initalDocuments.items])

  const [fieldGroups, setFieldGroups] =
    useState<FieldGroupDTO[]>(initalFieldGroups)

  const [extractionFields, setExtractionFields] = useState<ExtractionField[]>([
    {
      id: 'name',
      label: 'Name',
      type: ExtractionFieldType.TEXT,
      description: 'The name of the main person in the document',
    },
    {
      id: 'email',
      label: 'Email',
      type: ExtractionFieldType.EMAIL,
      description: 'The email of the main person in the document',
    },
  ])

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [previewDocument, setPreviewDocument] = useState<DocumentItem | null>(
    null,
  )
  const [sidebarMode, setSidebarMode] = useState<'extract' | 'preview'>(
    'extract',
  )

  const { execute: uploadFilesAction, isExecuting: isUploading } = useAction(
    uploadFiles,
    {
      onSuccess: ({ data }) => {
        toast.success('Documents uploaded successfully')
        if (data) {
          setDocuments((prev) => [...data, ...prev])
        }
        router.refresh()
      },
      onError: ({ error }) => {
        toast.error(error.serverError?.message ?? 'An error occurred')
      },
    },
  )

  const { execute: deleteDocumentAction } = useAction(deleteDocument, {
    onSuccess: ({ data }) => {
      toast.success('Document deleted successfully')
      router.refresh()
      if (data) {
        setDocuments((prev) => prev.filter((doc) => doc.id !== data.id))
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError?.message ?? 'An error occurred')
    },
  })

  const { execute: createFolderAction, isExecuting: isCreatingFolder } =
    useAction(createFolder, {
      onSuccess: ({ data }) => {
        toast.success('Folder created successfully')
        router.push(`/documents?parentId=${data?.id}`)
      },
    })

  const { execute: createFieldGroupAction } = useAction(createFieldGroup, {
    onSuccess: ({ data }) => {
      toast.success('Field group created successfully')
      if (data) {
        setFieldGroups([...fieldGroups, data])
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError?.message ?? 'An error occurred')
    },
  })

  const { execute: updateFieldGroupAction } = useAction(updateFieldGroup, {
    onSuccess: ({}) => {
      toast.success('Field group updated successfully')
    },
    onError: ({ error }) => {
      toast.error(error.serverError?.message ?? 'An error occurred')
    },
  })

  const handleCreateFolder = (name: string) => {
    createFolderAction({
      name,
      parentId: currentFolderId,
    })
  }

  const handleFilesUpload = (uploadedFiles: File[]) => {
    uploadFilesAction({
      files: uploadedFiles,
      parentId: currentFolderId,
    })
  }

  const handleNavigateToFolder = (folderId: string | undefined | null) => {
    const currentSearchParams = new URLSearchParams(window.location.search)
    if (folderId) {
      currentSearchParams.set('parentId', folderId)
    } else {
      currentSearchParams.delete('parentId')
    }
    router.push(`/documents?${currentSearchParams.toString()}`)
  }

  const handleDocumentSelection = (id: string, selected: boolean) => {
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === id ? { ...doc, selected } : doc)),
    )
  }

  const handleSelectAll = (selected: boolean) => {
    setDocuments((prev) => prev.map((doc) => ({ ...doc, selected })))
  }

  const handleRemoveDocument = (id: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id))
    deleteDocumentAction(id)
    if (previewDocument?.id === id) {
      setPreviewDocument(null)
      setSidebarOpen(false)
    }
  }

  const handleDocumentClick = (document: DocumentItem) => {
    setPreviewDocument(document)
    setSidebarMode('preview')
    setSidebarOpen(true)
  }

  const handleCloseSidebar = () => {
    setSidebarOpen(false)
    if (sidebarMode === 'preview') {
      setPreviewDocument(null)
    }
  }

  const openExtractionSidebar = (documents: DocumentItem[]) => {
    handleSelectAll(false)
    documents.forEach((doc) => {
      handleDocumentSelection(doc.id, true)
    })
    setSidebarMode('extract')
    setSidebarOpen(true)
  }

  const handleSaveFieldGroup = (fieldGroup: {
    id?: string
    name: string
    description?: string
    fields: ExtractionField[]
  }) => {
    if (fieldGroup.id) {
      updateFieldGroupAction({
        id: fieldGroup.id,
        name: fieldGroup.name,
        description: fieldGroup.description,
        fields: fieldGroup.fields,
      })
    } else {
      createFieldGroupAction({
        name: fieldGroup.name,
        description: fieldGroup.description,
        fields: fieldGroup.fields,
      })
    }
  }

  const {
    execute: triggerExtractionAction,
    isExecuting: isTriggeringExtraction,
  } = useAction(triggerExtraction, {
    onSuccess: () => {
      toast.success('Extraction started successfully')
    },
    onError: ({ error }) => {
      toast.error(error.serverError?.message ?? 'An error occurred')
    },
  })

  const handleExtract = () => {
    // Get selected documents
    const selectedDocs = documents.filter((doc) => doc.selected)

    triggerExtractionAction({
      documentIds: selectedDocs.map((doc) => doc.id),
      fields: extractionFields,
    })
  }

  const { isConnected } = useRealtime({
    channelName: user ? `user:${user.id}` : null,
    onMessage: (message) => {
      if (message.event === 'document-updated') {
        if (message.payload.error) {
          toast.error(message.payload.error ?? 'An error occurred')
        }
        setDocuments((prev) =>
          prev.map((doc) =>
            doc.id === message.payload.documentId
              ? { ...doc, status: message.payload.status }
              : doc,
          ),
        )
      }
    },
  })

  const selectedDocuments = documents.filter((doc) => doc.selected)

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex overflow-hidden">
        <div
          className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:mr-[50%] mr-0' : ''}`}
        >
          <DocumentTable
            items={documents}
            currentFolderId={currentFolderId}
            breadcrumbData={breadcrumbData}
            onCreateFolder={handleCreateFolder}
            onUpload={handleFilesUpload}
            onSelect={handleDocumentSelection}
            onSelectAll={handleSelectAll}
            onRemove={handleRemoveDocument}
            isUploading={isUploading}
            isCreatingFolder={isCreatingFolder}
            onOpenSideBar={() => openExtractionSidebar(selectedDocuments)}
            onNavigateToFolder={handleNavigateToFolder}
            onDocumentClick={handleDocumentClick}
            isConnected={isConnected}
          />
        </div>

        {sidebarMode === 'extract' ? (
          <ExtractionSidebar
            open={sidebarOpen}
            onClose={handleCloseSidebar}
            selectedDocuments={selectedDocuments}
            fields={extractionFields}
            onFieldsChange={setExtractionFields}
            onExtract={handleExtract}
            isExtracting={isTriggeringExtraction}
            fieldGroups={fieldGroups}
            onSaveFieldGroup={handleSaveFieldGroup}
          />
        ) : (
          previewDocument && (
            <div
              className={`fixed top-0 right-0 lg:w-[50%] w-full h-full bg-background border-l shadow-lg transform transition-transform duration-300 ease-in-out z-20 ${
                sidebarOpen ? 'translate-x-0' : 'translate-x-full'
              }`}
            >
              <DocumentPreview
                document={previewDocument}
                onClose={handleCloseSidebar}
                openExtractionSidebar={openExtractionSidebar}
              />
            </div>
          )
        )}
      </div>
    </div>
  )
}
