'use client'

import { useState } from 'react'
import { Button } from '@/app/components/ui/button'
import { Card } from '@/app/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import { FileText, Loader2 } from 'lucide-react'
import { ExtractedDataDTO } from '@/lib/consts'

interface TemplateMapperProps {
  extractedData: ExtractedDataDTO
  onGenerate: () => void
  isGenerating: boolean
}

type Template = {
  id: string
  name: string
  description: string
  fields: string[]
}

export const TemplateMapper = ({
  extractedData,
  onGenerate,
  isGenerating,
}: TemplateMapperProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('contract')

  // Mock templates
  const templates: Template[] = [
    {
      id: 'contract',
      name: 'Employment Contract',
      description: 'Standard employment contract template',
      fields: ['name', 'email', 'position', 'company'],
    },
    {
      id: 'invoice',
      name: 'Invoice Template',
      description: 'Standard invoice for services',
      fields: ['name', 'email', 'address', 'company'],
    },
    {
      id: 'report',
      name: 'Monthly Report',
      description: 'Monthly activity report template',
      fields: ['name', 'id_number', 'position', 'company'],
    },
  ]

  const currentTemplate = templates.find((t) => t.id === selectedTemplate)

  const getFieldStatus = (field: string) => {
    return 'missing'
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Select a Word template</h3>
        <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
          <SelectTrigger>
            <SelectValue placeholder="Select a template" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {currentTemplate && (
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-start space-x-4">
              <FileText className="h-8 w-8 text-primary mt-1" />
              <div>
                <h4 className="font-medium">{currentTemplate.name}</h4>
                <p className="text-sm text-gray-500 mb-3">
                  {currentTemplate.description}
                </p>

                <h5 className="text-sm font-medium mb-2">Required fields:</h5>
                <ul className="space-y-2">
                  {currentTemplate.fields.map((field) => {
                    const status = getFieldStatus(field)
                    return (
                      <li key={field} className="flex items-center text-sm">
                        <span
                          className={`w-2 h-2 rounded-full mr-2 ${
                            status === 'available'
                              ? 'bg-green-500'
                              : 'bg-amber-500'
                          }`}
                        />
                        <span className="capitalize">
                          {field.replace('_', ' ')}
                        </span>
                        <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-gray-100">
                          {status === 'available' ? 'Available' : 'Missing'}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button onClick={onGenerate} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Word Document'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
