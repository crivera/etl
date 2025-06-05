'use server'

import { env } from '@/env'
import { ExtractionField } from '@/lib/consts'
import { inferExtractionFieldType } from '@/lib/utils'
import { createId } from '@paralleldrive/cuid2'
import { z } from 'zod/v4'
import { extractDataFromUnknownFile } from '../ai/extract'
import ocr from '../ai/ocr'
import gridDataStore from '../db/grid-data-store'
import { mapGridDataToGridDataDTOs } from './mapper/grid-data-mapper'
import { ActionError, authClient } from './safe-action'

const BUCKET_NAME = `grid-data-${env.NODE_ENV}`

export const getGridData = authClient.action(async ({ ctx, parsedInput }) => {
  const gridData = await gridDataStore.getGridData()

  return mapGridDataToGridDataDTOs(gridData)
})

export const uploadFiles = authClient
  .inputSchema(
    z.object({
      files: z.array(z.instanceof(File)),
    }),
  )
  .action(async ({ ctx, parsedInput }) => {
    const { files } = parsedInput
    const { dbUser } = ctx

    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        const { name, size } = file
        const { supabase } = ctx

        const fileBuffer = Buffer.from(await file.arrayBuffer())

        const { data, error } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(`${dbUser.id}/${createId()}`, fileBuffer, {
            contentType: file.type,
          })

        if (error) {
          throw ActionError.InternalServerError(error.message)
        }

        const ocrResponse = await ocr.ocrFile(fileBuffer)

        const extractedData = await extractDataFromUnknownFile(ocrResponse)

        // Ensure extractedData is an object
        let schema: ExtractionField[] = []
        if (
          extractedData &&
          typeof extractedData === 'object' &&
          !Array.isArray(extractedData)
        ) {
          schema = Object.keys(extractedData).map((key) => {
            const value = (extractedData as Record<string, unknown>)[key]
            return {
              id: key,
              label: key
                .replace(/_/g, ' ')
                .replace(/\b\w/g, (c) => c.toUpperCase()),
              type: inferExtractionFieldType(value),
            }
          })
        }

        const gridData = await gridDataStore.createGridData({
          path: data.path,
          name,
          type: file.type,
          size: file.size,
          data: extractedData,
          schema,
          extractedText: ocrResponse,
        })

        return gridData
      }),
    )

    return mapGridDataToGridDataDTOs(uploadedFiles)
  })
