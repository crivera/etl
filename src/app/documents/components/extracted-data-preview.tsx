'use client'

import { Button } from '@/app/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table'
import type { ExtractedDataDTO } from '@/lib/consts'
import { Check } from 'lucide-react'

interface ExtractedDataPreviewProps {
  data: ExtractedDataDTO[]
  onContinue: () => void
}

export const ExtractedDataPreview = ({
  data,
  onContinue,
}: ExtractedDataPreviewProps) => {
  const formatLabel = (key: string) => {
    return key
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
          <Check className="h-5 w-5 text-green-600" />
        </div>
        <h3 className="text-lg font-medium">Data extracted successfully</h3>
      </div>

      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/3">Field</TableHead>
              <TableHead>Extracted Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(data).map(([key, value]) => (
              <TableRow key={key}>
                <TableCell className="font-medium">
                  {formatLabel(key)}
                </TableCell>
                <TableCell>value</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end">
        <Button onClick={onContinue}>Continue to Template Mapping</Button>
      </div>
    </div>
  )
}
