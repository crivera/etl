'use client'

import { Button } from '@/app/components/ui/button'
import { X } from 'lucide-react'
import { DataExtractionForm } from './data-extraction-form'
import { DocumentItem, ExtractionField } from '@/lib/consts'
import { FieldGroupDTO } from '@/lib/consts'

interface ExtractionSidebarProps {
  open: boolean
  onClose: () => void
  selectedDocuments: DocumentItem[]
  fields: ExtractionField[]
  onFieldsChange: (fields: ExtractionField[]) => void
  onExtract: () => void
  isExtracting: boolean
  fieldGroups: FieldGroupDTO[]
  onSaveFieldGroup: (fieldGroup: Partial<FieldGroupDTO>) => void
}

export const ExtractionSidebar = ({
  open,
  onClose,
  selectedDocuments,
  fields,
  onFieldsChange,
  onExtract,
  isExtracting,
  fieldGroups,
  onSaveFieldGroup,
}: ExtractionSidebarProps) => {
  return (
    <div
      className={`fixed top-0 right-0 lg:w-[50%] w-full h-full bg-background border-l shadow-lg transform transition-transform duration-300 ease-in-out z-20 ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="h-full flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Extract Data</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-auto p-4 lg:p-6">
          <DataExtractionForm
            selectedDocuments={selectedDocuments}
            fields={fields}
            onFieldsChange={onFieldsChange}
            onExtract={onExtract}
            isExtracting={isExtracting}
            fieldGroups={fieldGroups}
            onSaveFieldGroup={onSaveFieldGroup}
          />
        </div>
      </div>
    </div>
  )
}
