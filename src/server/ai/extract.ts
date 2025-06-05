import { env } from '@/env'
import {
  ExtractedText,
  ExtractionField,
  ExtractionFieldSchema,
} from '@/lib/consts'
import { getFileType } from '@/lib/utils'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'

const google = createGoogleGenerativeAI({
  apiKey: env.GEMINI_API_KEY,
})

const model = google('gemini-2.5-flash-preview-04-17')

/**
 * Extract data from text
 * @param text - The text to extract data from
 * @param fields - The fields to extract data from
 * @returns The extracted data
 */
export async function extractDataFromText(
  text: ExtractedText,
  fields: ExtractionField[],
) {
  const schema = createExtractionSchema(fields)

  const objects = []

  for (const page of text) {
    const prompt = `
        You are an expert data extraction AI.
        Your goal is to accurately identify and extract the following details from the unstructured text provided below:

        ${fields.map((field, index) => `${index + 1}. **${field.label}**: ${field.description}`).join('\n')}

        Present the extracted information as a single JSON object. Use the following keys:
        ${fields.map((field) => `- "${field.id}"`).join('\n')}

        If a specific piece of information cannot be found, its corresponding value in the JSON object should be null.
        Prioritize accuracy and only extract information explicitly present in the text.

        <text>
        ${page.text}
        </text>
      `

    // console.log(prompt)

    const { object } = await generateObject({
      model,
      schema,
      prompt,
    })

    objects.push(object)
  }

  return objects
}

export async function extractDataFromFile(
  file: Buffer,
  fields: ExtractionField[],
) {
  const schema = createExtractionSchema(fields)
  const fileType = getFileType(file)
  const base64 = file.toString('base64')

  const { object } = await generateObject({
    model,
    schema,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `
              You are an expert data extraction AI.
              Your goal is to accurately identify and extract the following details from the document provided:

              ${fields.map((field, index) => `${index + 1}. **${field.label}**: ${field.description}`).join('\n')}

              Present the extracted information as a single JSON object. Use the following keys:
              ${fields.map((field) => `- "${field.id}"`).join('\n')}

              If a specific piece of information cannot be found, its corresponding value in the JSON object should be "null".
              Prioritize accuracy and only extract information explicitly present in the document.
            `,
          },
          {
            type: 'file',
            data: base64,
            mimeType: fileType,
          },
        ],
      },
    ],
  })

  return [object]
}

export async function extractDataFromUnknownFile(text: ExtractedText) {
  const prompt = `
       Your goal is to accurately identify and extract all details from the unstructured text provided below.
       Present the extracted information as a single JSON object. Prioritize accuracy and only extract information explicitly present in the text.
       Keep everything at the root level except when you have a list of items. Inside the list keep everything at the root level too.

        <text>
        ${text.map((page) => page.text).join('\n')}
        </text>
      `

  const { object } = await generateObject({
    model,
    schema: z.object({}),
    prompt,
  })

  return object
}

/**
 * Create a schema for the extraction
 * @param fields - The fields to extract data from
 * @returns The schema
 */
function createExtractionSchema(fields: ExtractionField[]) {
  const schemaObject: Record<string, z.ZodTypeAny> = {}

  for (const field of fields) {
    switch (field.type) {
      case 'text':
      case 'phone':
      case 'email':
      case 'address':
        schemaObject[field.id] = z.string().optional()
        break
      case 'number':
        schemaObject[field.id] = z.number().optional()
        break
      case 'date':
        schemaObject[field.id] = z.string().datetime().optional()
        break
      case 'list':
        schemaObject[field.id] = z.array(z.string()).optional()
        break
    }
  }

  return z.object(schemaObject)
}
