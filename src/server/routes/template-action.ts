'use server'

import { env } from '@/env'
import {
  ExtractionFieldSchema,
  FileType,
  TemplateMetadataSchema,
} from '@/lib/consts'
import { createId } from '@paralleldrive/cuid2'
import { z } from 'zod/v4'
import templateStore from '../db/template-store'
import {
  mapTemplatesToTemplateDTOs,
  mapTemplateToTemplateDTO,
} from './mapper/template-mapper'
import { ActionError, authClient } from './safe-action'
import { generate } from '@pdfme/generator'
import { checkbox, date, text } from '@pdfme/schemas'

const BUCKET_NAME = `templates-${env.NODE_ENV}`

/**
 * Delete a template by its id
 * @param id - The id of the template
 */
export const deleteTemplate = authClient
  .inputSchema(z.string())
  .action(async ({ ctx, parsedInput }) => {
    const id = parsedInput

    const template = await templateStore.getTemplateById(id)

    if (!template) {
      throw ActionError.NotFound('Template not found')
    }

    if (template.userId !== ctx.dbUser.id) {
      throw ActionError.Forbidden('You are not allowed to delete this template')
    }

    const { supabase } = ctx
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([`${ctx.dbUser.id}/${id}`])

    if (error) {
      throw new ActionError(error.message)
    }

    await templateStore.deleteTemplate(id)

    return { success: true }
  })

/**
 * Get all templates for a user
 */
export const getTamplates = authClient
  .inputSchema(z.object({ text: z.string().optional() }))
  .action(async ({ ctx, parsedInput }) => {
    const { text } = parsedInput

    const templates = await templateStore.getAllTemplatesForUser(ctx.dbUser.id)
    return mapTemplatesToTemplateDTOs(templates)
  })

/**
 * Create a new template
 * @param template - The template to create
 */
export const createTemplate = authClient
  .inputSchema(
    z.object({
      name: z.string(),
      description: z.string().optional(),
      fileType: z.nativeEnum(FileType),
    }),
  )
  .action(async ({ ctx, parsedInput }) => {
    const { name, description, fileType } = parsedInput

    const template = await templateStore.createTemplate({
      name,
      description,
      fileType,
      userId: ctx.dbUser.id,
    })

    return mapTemplateToTemplateDTO(template)
  })

/**
 * Get a template by its id
 * @param id - The id of the template
 */
export const getTemplate = authClient
  .inputSchema(z.string())
  .action(async ({ ctx, parsedInput }) => {
    const id = parsedInput

    const template = await templateStore.getTemplateById(id)

    if (!template) {
      throw ActionError.NotFound('Template not found')
    }

    if (template.userId !== ctx.dbUser.id) {
      throw ActionError.Forbidden('You are not allowed to access this template')
    }

    return mapTemplateToTemplateDTO(template)
  })

/**
 * Update a template
 * @param id - The id of the template
 * @param name - The name of the template
 * @param description - The description of the template
 * @param fileType - The file type of the template
 * @param file - The file to update the template with
 * @param fields - The fields of the template
 * @param metadata - The metadata of the template
 */
export const updateTemplate = authClient
  .inputSchema(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string().optional(),
      fileType: z.nativeEnum(FileType),
      file: z.instanceof(File).nullable(),
      fields: z.array(ExtractionFieldSchema),
      metadata: TemplateMetadataSchema.optional(),
    }),
  )
  .action(async ({ ctx, parsedInput }) => {
    const { id, name, description, fileType, file, fields, metadata } =
      parsedInput

    const template = await templateStore.getTemplateById(id)

    if (!template) {
      throw ActionError.NotFound('Template not found')
    }

    if (template.userId !== ctx.dbUser.id) {
      throw ActionError.Forbidden('You are not allowed to update this template')
    }

    let path = template.path
    let fileName = template.fileName
    let type = template.type
    let size = template.size

    if (file) {
      const { supabase } = ctx
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(`${ctx.dbUser.id}/${createId()}`, file.stream(), {
          contentType: file.type,
        })

      if (error) {
        throw ActionError.InternalServerError(error.message)
      }
      path = data.path
      fileName = file.name
      type = file.type
      size = file.size
    }

    await templateStore.updateTemplate(id, {
      name,
      description,
      fileType,
      path,
      fileName,
      type,
      size,
      fields,
      metadata,
    })

    const updatedTemplate = await templateStore.getTemplateById(id)

    return mapTemplateToTemplateDTO(updatedTemplate)
  })

export const generateDocument = authClient
  .inputSchema(
    z.object({
      templateId: z.string(),
      data: z.record(
        z.string(),
        z.union([z.string(), z.number(), z.boolean()]),
      ),
    }),
  )
  .action(async ({ ctx, parsedInput }) => {
    const { templateId, data } = parsedInput

    const template = await templateStore.getTemplateById(templateId)

    if (!template) {
      throw ActionError.NotFound('Template not found')
    }

    if (template.userId !== ctx.dbUser.id) {
      throw ActionError.Forbidden('You are not allowed to generate a document')
    }

    if (template.fileType === 'docx') {
    }

    if (template.fileType === 'xlsx') {
    }

    if (template.fileType === 'pdf' && template.metadata?.pdfMe) {
      const mappedData = Object.entries(data).reduce(
        (acc, [key, value]) => {
          const field = template.fields.find((field) => field.id === key)
          if (field) {
            acc[field.label] = value
          }
          return acc
        },
        {} as Record<string, unknown>,
      )

      const pdf = await generate({
        template: template.metadata?.pdfMe,
        inputs: [mappedData],
        plugins: {
          Text: text,
          Date: date,
          Checkbox: checkbox,
        },
      })

      return pdf
    }
  })
