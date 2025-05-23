import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

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
