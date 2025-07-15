'use client'

import type React from 'react'
import { Button } from '@/app/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover'
import { List } from 'lucide-react'
import { formatDateValue } from '@/lib/utils'
import type { ObjectField } from '@/lib/consts'

interface ListDisplayProps {
  items: unknown[]
  fieldLabel: string
  objectSchema?: Record<string, ObjectField>
}

export const ListDisplay = ({ items, fieldLabel, objectSchema }: ListDisplayProps) => {
  if (!items || items.length === 0) {
    return <span className="text-muted-foreground italic">Empty</span>
  }

  const renderItem = (item: unknown, index: number) => {
    if (item === null || item === undefined) {
      return (
        <div key={index} className="text-sm p-2 bg-muted/30 rounded">
          <span className="text-muted-foreground italic">null</span>
        </div>
      )
    }

    if (typeof item === 'object' && !Array.isArray(item)) {
      // Render object as key-value table
      const entries = Object.entries(item as Record<string, unknown>)
      if (entries.length === 0) {
        return (
          <div key={index} className="text-sm p-2 bg-muted/30 rounded">
            <span className="text-muted-foreground italic">Empty object</span>
          </div>
        )
      }

      return (
        <div key={index} className="text-sm p-2 bg-muted/30 rounded space-y-1">
          <div className="font-medium text-xs text-muted-foreground mb-2">
            Item {index + 1}
          </div>
          {entries.map(([key, value]) => {
            const fieldSchema = objectSchema?.[key]
            const displayLabel = fieldSchema?.label || key

            return (
              <div key={key} className="flex gap-2">
                <span className="font-medium text-xs text-muted-foreground min-w-0 flex-shrink-0">
                  {displayLabel}:
                </span>
                <span className="text-xs break-words flex-1">
                  {value === null || value === undefined ? (
                    <span className="text-muted-foreground italic">null</span>
                  ) : typeof value === 'object' ? (
                    JSON.stringify(value)
                  ) : fieldSchema?.type === 'date' && typeof value === 'string' ? (
                    formatDateValue(value)
                  ) : fieldSchema?.type === 'currency' && typeof value === 'string' ? (
                    value.startsWith('$') ? value : `$${value}`
                  ) : fieldSchema?.type === 'checkbox' && typeof value === 'boolean' ? (
                    value ? 'Yes' : 'No'
                  ) : (
                    String(value)
                  )}
                </span>
              </div>
            )
          })}
        </div>
      )
    }

    // Render primitive values
    return (
      <div key={index} className="text-sm p-2 bg-muted/30 rounded break-words">
        {typeof item === 'boolean' ? (item ? 'Yes' : 'No') : String(item)}
      </div>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-1 text-left justify-start hover:bg-muted/50"
        >
          <List className="h-3 w-3 mr-1 text-muted-foreground" />
          <span className="text-sm">
            {items.length} item{items.length !== 1 ? 's' : ''}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="start">
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-muted-foreground">
            {fieldLabel} ({items.length} item{items.length !== 1 ? 's' : ''})
          </h4>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {items.map(renderItem)}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}