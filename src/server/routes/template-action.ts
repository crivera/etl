'use server'

import { env } from '@/env'
import { FileType } from '@/lib/consts'
import { z } from 'zod'
import templateStore from '../db/template-store'
import {
  mapTemplatesToTemplateDTOs,
  mapTemplateToTemplateDTO,
} from './mapper/template-mapper'
import { ActionError, authClient } from './safe-action'

const BUCKET_NAME = `templates-${env.NODE_ENV}`

/**
 * Delete a template by its id
 * @param id - The id of the template
 */
export const deleteTemplate = authClient
  .schema(z.string())
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
export const getTamplates = authClient.action(async ({ ctx }) => {
  const templates = await templateStore.getAllTemplatesForUser(ctx.dbUser.id)
  return mapTemplatesToTemplateDTOs(templates)
})

/**
 * Create a new template
 * @param template - The template to create
 */
export const createTemplate = authClient
  .schema(
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
  .schema(z.string())
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
