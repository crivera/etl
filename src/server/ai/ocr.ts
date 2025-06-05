import { Mistral } from '@mistralai/mistralai'
import type {
  DocumentURLChunk,
  ImageURLChunk,
} from '@mistralai/mistralai/models/components'

import { env } from '@/env'
import { ExtractedText } from '@/lib/consts'
import { getFileType } from '@/lib/utils'

const client = new Mistral({
  apiKey: env.MISTRAL_API_KEY,
})

const ocr = {
  /**
   * OCR an file
   * @param file - The file to OCR
   * @returns The OCR response
   */
  async ocrFile(file: Buffer) {
    const fileType = getFileType(file)
    const base64 = file.toString('base64')
    return await processOcrRecursively(base64, fileType)
  },
}

export default ocr

/**
 * Process OCR recursively for a document and its embedded images
 * @param base64 - Base64 encoded image/document
 * @param fileType - MIME type of the file
 * @returns Combined text from all OCR results
 */
async function processOcrRecursively(
  base64: string,
  fileType: string,
): Promise<ExtractedText> {
  let data = base64
  if (!data.startsWith('data:')) {
    data = 'data:' + fileType + ';base64,' + base64
  }

  const isPdf = data.includes('application/pdf')
  const document = {
    type: isPdf ? 'document_url' : 'image_url',
    ...(isPdf ? { documentUrl: data } : { imageUrl: data }),
  } as ImageURLChunk | DocumentURLChunk

  const ocrResponse = await client.ocr.process({
    model: 'mistral-ocr-latest',
    document: document,
    includeImageBase64: true,
  })

  const text: ExtractedText = []

  if (ocrResponse.pages.length > 0) {
    for (const page of ocrResponse.pages) {
      let pageText = page.markdown

      // Process any embedded images recursively
      if (page.images.length > 0) {
        for (const image of page.images) {
          if (image.imageBase64) {
            const imageText = await processOcrRecursively(
              image.imageBase64,
              'image/png',
            )

            if (imageText.length > 1) {
              throw new Error('Multiple pages found in image')
            }
            // Replace the image markdown reference with the extracted text
            const imageId = image.id
            const imageMarkdown = `![${imageId}](${imageId})`

            // Join all text entries from the image OCR into a single string
            const combinedImageText = imageText[0].text
            pageText = pageText.replace(imageMarkdown, combinedImageText)
          }
        }
      }

      text.push({ text: pageText })
    }
  }

  return text
}
