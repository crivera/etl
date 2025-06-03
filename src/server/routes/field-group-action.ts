'use server'

import { ExtractionFieldSchema } from '@/lib/consts'
import { z } from 'zod'
import fieldGroupStore from '../db/field-group-store'
import {
  mapFieldGroupToFieldGroupDTO,
  mapFieldGroupsToFieldGroupDTOs,
} from './mapper/field-group-mapper'
import { ActionError, authClient } from './safe-action'

/**
 * Create a new field group
 * @param name - The name of the field group
 * @param description - The description of the field group
 * @param fields - The fields to include in the field group
 * @returns The created field group
 */
export const createFieldGroup = authClient
  .inputSchema(
    z.object({
      name: z.string(),
      description: z.string().optional(),
      fields: z.array(ExtractionFieldSchema),
    }),
  )
  .action(async ({ ctx, parsedInput }) => {
    const { name, description, fields } = parsedInput

    const fieldGroup = await fieldGroupStore.createFieldGroup({
      name,
      description,
      fields,
      userId: ctx.dbUser.id,
    })

    return mapFieldGroupToFieldGroupDTO(fieldGroup)
  })

/**
 * Get all field groups
 * @returns The field groups
 */
export const getFieldGroupsForUser = authClient.action(async ({ ctx }) => {
  const fieldGroups = await fieldGroupStore.getFieldGroups(ctx.dbUser.id)
  return mapFieldGroupsToFieldGroupDTOs(fieldGroups)
})

/**
 * Get all public field groups
 * @returns The public field groups
 */
export const getPublicFieldGroups = authClient.action(async () => {
  const fieldGroups = await fieldGroupStore.getPublicFieldGroups()
  return mapFieldGroupsToFieldGroupDTOs(fieldGroups)
})

/**
 * Update a field group
 * @param id - The id of the field group
 * @param name - The name of the field group
 * @param description - The description of the field group
 * @param fields - The fields to include in the field group
 */
export const updateFieldGroup = authClient
  .inputSchema(
    z.object({
      id: z.string(),
      name: z.string().optional(),
      description: z.string().optional(),
      fields: z.array(ExtractionFieldSchema).optional(),
    }),
  )
  .action(async ({ ctx, parsedInput }) => {
    const { id, name, description, fields } = parsedInput

    const oldFieldGroup = await fieldGroupStore.getFieldGroupById(id)

    if (!oldFieldGroup) {
      throw ActionError.NotFound('Field group not found')
    }

    if (oldFieldGroup.userId !== ctx.dbUser.id) {
      throw ActionError.Forbidden(
        'You are not allowed to update this field group',
      )
    }

    if (!oldFieldGroup.userId) {
      throw ActionError.Forbidden(
        'You are not allowed to update this field group',
      )
    }

    await fieldGroupStore.updateFieldGroup(id, {
      name,
      description,
      fields,
    })
  })

/**
 * Delete a field group
 * @param id - The id of the field group
 */
export const deleteFieldGroup = authClient
  .inputSchema(z.string())
  .action(async ({ ctx, parsedInput }) => {
    const id = parsedInput

    const fieldGroup = await fieldGroupStore.getFieldGroupById(id)

    if (!fieldGroup) {
      throw ActionError.NotFound('Field group not found')
    }

    if (fieldGroup.userId !== ctx.dbUser.id) {
      throw ActionError.Forbidden(
        'You are not allowed to delete this field group',
      )
    }

    if (!fieldGroup.userId) {
      throw ActionError.Forbidden(
        'You are not allowed to delete this field group',
      )
    }

    await fieldGroupStore.deleteFieldGroup(id)
  })
