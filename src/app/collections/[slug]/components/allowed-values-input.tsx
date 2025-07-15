'use client'

import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { X } from 'lucide-react'
import { useState } from 'react'

interface AllowedValuesInputProps {
  label: string
  values: string[]
  onChange: (values: string[]) => void
  placeholder?: string
}

export const AllowedValuesInput = ({
  label,
  values,
  onChange,
  placeholder = "Type a value and press Enter",
}: AllowedValuesInputProps) => {
  const [inputValue, setInputValue] = useState('')

  const handleAddValue = () => {
    const trimmedValue = inputValue.trim()
    if (trimmedValue && !values.includes(trimmedValue)) {
      onChange([...values, trimmedValue])
      setInputValue('')
    }
  }

  const handleRemoveValue = (valueToRemove: string) => {
    onChange(values.filter(value => value !== valueToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddValue()
    }
  }

  return (
    <div className="grid gap-2">
      <Label>{label}</Label>

      {/* Input for adding new values */}
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button
          type="button"
          onClick={handleAddValue}
          disabled={!inputValue.trim()}
          size="sm"
        >
          Add
        </Button>
      </div>

      {/* Pills for existing values */}
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {values.map((value, index) => (
            <div
              key={index}
              className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm border border-primary/20"
            >
              <span className="truncate max-w-[200px]">{value}</span>
              <button
                type="button"
                onClick={() => handleRemoveValue(value)}
                className="ml-1 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {values.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No allowed values set. Leave empty to allow any values.
        </p>
      )}
    </div>
  )
}