'use client'

import { Template } from '@pdfme/common'
import { checkbox, date, text } from '@pdfme/schemas'
import { Designer } from '@pdfme/ui'
import { useEffect, useRef, useState } from 'react'

interface PDFMeDesignerProps {
  base64Pdf: string
  initialTemplate: Template | null
  onUpdate: (template: Template) => void
}

export default function PDFMeDesigner({
  base64Pdf,
  initialTemplate,
  onUpdate,
}: PDFMeDesignerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const designerRef = useRef<Designer | null>(null)
  const [template] = useState<Template>(
    initialTemplate ?? {
      basePdf: base64Pdf,
      schemas: [],
    },
  )

  useEffect(() => {
    // Only initialize if the container exists and designer hasn't been created yet
    if (containerRef.current && !designerRef.current) {
      // Initialize the Designer
      designerRef.current = new Designer({
        domContainer: containerRef.current,
        template: template,
        options: {},
        plugins: {
          Text: text,
          Date: date,
          Checkbox: checkbox,
        },
      })

      // Set up event handlers
      designerRef.current.onChangeTemplate((updatedTemplate: Template) => {
        onUpdate(updatedTemplate)
      })

      // designerRef.current.onSaveTemplate((savedTemplate: Template) => {
      //   onSave(savedTemplate)
      // })

      // Clean up on unmount
      return () => {
        if (designerRef.current) {
          designerRef.current.destroy()
          designerRef.current = null
        }
      }
    }
  }, [])

  return (
    <div className="w-full h-full">
      <div ref={containerRef} style={{ width: '100%', height: '90vh' }} />
    </div>
  )
}
