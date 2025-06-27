import { env } from '@/env'
import { ExtractedText, ExtractionField } from '@/lib/consts'
import { getFileType } from '@/lib/utils'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'

const google = createGoogleGenerativeAI({
  apiKey: env.GEMINI_API_KEY,
})

const model = google('gemini-2.5-flash')

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

        ${fields
          .map((field, index) => {
            const description =
              field.customPrompt ||
              field.description ||
              'Extract this field value'
            let fieldDescription = `${index + 1}. **${field.label}**: ${description}`

            if (field.type === 'object_list' && field.objectSchema) {
              fieldDescription +=
                '\n   This should be an array of objects with the following structure:'
              Object.entries(field.objectSchema).forEach(
                ([key, objectField]) => {
                  fieldDescription += `\n   - ${key} (${objectField.type}): ${objectField.description || objectField.label}`
                },
              )
            } else if (field.type === 'list') {
              fieldDescription += ' (Return as an array of values)'
            }

            return fieldDescription
          })
          .join('\n')}

        Present the extracted information as a single JSON object. Use the following keys:
        ${fields.map((field) => `- "${field.id}"`).join('\n')}

        If a specific piece of information cannot be found, its corresponding value in the JSON object should be null.
        Prioritize accuracy and only extract information explicitly present in the text.

        <text>
        ${page.text}
        </text>
      `

    const { object } = await generateObject({
      model,
      schema,
      prompt,
    })

    objects.push(object)
  }

  return objects
}

/**
 * Extract data from a file
 * @param file - The file to extract data from
 * @param fields - The fields to extract data from
 * @returns The extracted data
 */
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

              ${fields
                .map((field, index) => {
                  const description =
                    field.customPrompt ||
                    field.description ||
                    'Extract this field value'
                  let fieldDescription = `${index + 1}. **${field.label}**: ${description}`

                  if (field.type === 'object_list' && field.objectSchema) {
                    fieldDescription +=
                      '\n   This should be an array of objects with the following structure:'
                    Object.entries(field.objectSchema).forEach(
                      ([key, objectField]) => {
                        fieldDescription += `\n   - ${key} (${objectField.type}): ${objectField.description || objectField.label}`
                      },
                    )
                  } else if (field.type === 'list') {
                    fieldDescription += ' (Return as an array of values)'
                  }

                  return fieldDescription
                })
                .join('\n')}

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

/**
 * Extract data from an unknown file
 * @param text - The text to extract data from
 * @returns The extracted data
 */
export async function extractDataFromUnknownFile(text: ExtractedText) {
  const prompt = `
       Your goal is to accurately identify and extract all details from the unstructured text provided below.
       Present the extracted information as a single JSON object. Prioritize accuracy and only extract information explicitly present in the text.
       Keep everything at the root level except when you have a list of items. Inside the list keep everything at the root level too.

        <text>
        ${text.map((page) => page.text).join('\n')}
        </text>
      `
  console.log(prompt)
  const { object } = await generateObject({
    model,
    schema: z.record(z.any()),
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
      case 'currency':
        schemaObject[field.id] = z.string().optional()
        break
      case 'checkbox':
        schemaObject[field.id] = z.boolean().optional()
        break
      case 'list':
        schemaObject[field.id] = z.array(z.string()).optional()
        break
      case 'object_list':
        if (field.objectSchema) {
          const objectSchemaObj: Record<string, z.ZodTypeAny> = {}

          for (const [key, objectField] of Object.entries(field.objectSchema)) {
            switch (objectField.type) {
              case 'text':
              case 'phone':
              case 'email':
              case 'address':
                objectSchemaObj[key] = z.string().optional()
                break
              case 'number':
                objectSchemaObj[key] = z.number().optional()
                break
              case 'date':
                objectSchemaObj[key] = z.string().datetime().optional()
                break
              case 'currency':
                objectSchemaObj[key] = z.string().optional()
                break
              case 'checkbox':
                objectSchemaObj[key] = z.boolean().optional()
                break
              default:
                objectSchemaObj[key] = z.string().optional()
                break
            }
          }

          schemaObject[field.id] = z.array(z.object(objectSchemaObj)).optional()
        } else {
          // Fallback to array of any objects if no schema defined
          schemaObject[field.id] = z.array(z.record(z.any())).optional()
        }
        break
    }
  }

  return z.object(schemaObject)
}
