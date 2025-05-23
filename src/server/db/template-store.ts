import { eq } from 'drizzle-orm'
import { db } from '.'
import { templates, type TemplateInsert } from './schema'

const templateStore = {
  /**
   * Create a new document
   * @param document - The document to create
   * @returns The created document
   */
  async createTemplate(template: TemplateInsert) {
    const result = await db
      .insert(templates)
      .values({
        ...template,
      })
      .returning()
    return result[0]
  },

  /**
   * Get a template by its id
   * @param id - The id of the template
   * @returns The template or null if it doesn't exist
   */
  async getTemplateById(id: string) {
    const result = await db.select().from(templates).where(eq(templates.id, id))
    return result[0] ?? null
  },

  /**
   * Delete a template by its id
   * @param id - The id of the template
   */
  async deleteTemplate(id: string) {
    await db.delete(templates).where(eq(templates.id, id))
  },

  /**
   * Update a template
   * @param id - The id of the template
   * @param template - The template to update
   */
  async updateTemplate(id: string, template: Partial<TemplateInsert>) {
    await db.update(templates).set(template).where(eq(templates.id, id))
  },

  /**
   * Get all templates for a userO
   * @param userId - The id of the user
   * @returns All templates for the user
   */
  async getAllTemplatesForUser(userId: string) {
    return await db.select().from(templates).where(eq(templates.userId, userId))
  },
}
export default templateStore
