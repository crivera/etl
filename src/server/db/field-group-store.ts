import { desc, eq, isNull } from 'drizzle-orm'
import { db } from '.'
import { FieldGroupInsert, fieldGroups } from './schema'

const fieldGroupStore = {
  /**
   * Get a field group by its id
   * @param id - The id of the field group
   * @returns The field group
   */
  async getFieldGroupById(id: string) {
    return await db.query.fieldGroups.findFirst({
      where: eq(fieldGroups.id, id),
    })
  },

  /**
   * Create a new document
   * @param document - The document to create
   * @returns The created document
   */
  async createFieldGroup(fieldGroup: FieldGroupInsert) {
    const result = await db.insert(fieldGroups).values(fieldGroup).returning()
    return result[0]
  },

  /**
   * Get all fields for a user
   * @param userId - The user ID
   * @returns The fields
   */
  async getFieldGroups(userId: string) {
    return await db.query.fieldGroups.findMany({
      where: eq(fieldGroups.userId, userId),
      orderBy: desc(fieldGroups.createdAt),
    })
  },

  /**
   * Get all public fields
   * @returns The fields
   */
  async getPublicFieldGroups() {
    return await db.query.fieldGroups.findMany({
      where: isNull(fieldGroups.userId),
      orderBy: desc(fieldGroups.createdAt),
    })
  },

  /**
   * Update a field
   * @param id - The field ID
   * @param field - The field to update
   */
  async updateFieldGroup(id: string, fieldGroup: Partial<FieldGroupInsert>) {
    return db.update(fieldGroups).set(fieldGroup).where(eq(fieldGroups.id, id))
  },

  /**
   * Delete a field group
   * @param id - The id of the field group
   */
  async deleteFieldGroup(id: string) {
    return db.delete(fieldGroups).where(eq(fieldGroups.id, id))
  },
}

export default fieldGroupStore
