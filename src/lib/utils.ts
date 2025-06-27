import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { ExtractionFieldType } from './consts'
import { format, isValid, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name: string | null | undefined): string {
  if (!name || !name.trim()) return 'XYZ'

  return name
    .split(' ') // Split the name by spaces
    .filter((word) => word) // Remove empty entries (in case of multiple spaces)
    .map((word) => word[0].toUpperCase()) // Get the first letter of each word and make it uppercase
    .join('') // Join the initials
}

// Function to get file extension
export const getFileExtension = (filename: string) => {
  return filename.split('.').pop()?.toLowerCase() || ''
}

// Function to check if file is an image
export const isImage = (filename: string) => {
  const extension = getFileExtension(filename)
  return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)
}

// Function to check if file is a PDF
export const isPDF = (filename: string) => {
  return getFileExtension(filename) === 'pdf'
}

/**
 * Get the file type of a buffer
 * @param buffer - The buffer to get the file type of
 * @returns The file type of the buffer
 */
export function getFileType(buffer: Buffer) {
  const pdfSignature = Buffer.from([0x25, 0x50, 0x44, 0x46]) // %PDF
  const jpegSignature = Buffer.from([0xff, 0xd8, 0xff])
  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47])

  if (buffer.subarray(0, 4).equals(pdfSignature)) {
    return 'application/pdf'
  } else if (buffer.subarray(0, 3).equals(jpegSignature)) {
    return 'image/jpeg'
  } else if (buffer.subarray(0, 4).equals(pngSignature)) {
    return 'image/png'
  }
  return 'unknown'
}

// Helper to infer ExtractionFieldType from value
export function inferExtractionFieldType(value: unknown): ExtractionFieldType {
  if (typeof value === 'number') {
    return ExtractionFieldType.NUMBER
  }
  if (typeof value === 'boolean') {
    return ExtractionFieldType.CHECKBOX
  }
  if (Array.isArray(value)) {
    return ExtractionFieldType.LIST
  }
  if (typeof value === 'string') {
    // Date (ISO or common formats)
    if (
      /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d{1,6})?)?(Z|([+-]\d{2}:?\d{2}))?)?$/.test(
        value,
      )
    ) {
      return ExtractionFieldType.DATE
    }
    // Email
    if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
      return ExtractionFieldType.EMAIL
    }
    // Phone (simple, international)
    if (/^\+?[0-9 .\-()]{7,}$/.test(value)) {
      return ExtractionFieldType.PHONE
    }
    // Currency (e.g., $1,234.56)
    if (/^[$€£¥₹]\s?\d{1,3}(,\d{3})*(\.\d{2})?$/.test(value)) {
      return ExtractionFieldType.CURRENCY
    }
    // Address (very basic, could be improved)
    if (
      /\d+\s+\w+\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct)\b/i.test(
        value,
      )
    ) {
      return ExtractionFieldType.ADDRESS
    }
    // Fallback
    return ExtractionFieldType.TEXT
  }
  return ExtractionFieldType.TEXT
}

export const formatDateValue = (value: string) => {
  if (!value) return ''

  try {
    // Try parsing as ISO date string first
    let date = parseISO(value)

    // If that fails, try creating a new Date object
    if (!isValid(date)) {
      date = new Date(value)
    }

    // If still not valid, return the original value
    if (!isValid(date)) {
      return value
    }

    // Format as "Jan 15, 2024"
    return format(date, 'MMM dd, yyyy')
  } catch {
    // If any error occurs, return the original value
    return value
  }
}
