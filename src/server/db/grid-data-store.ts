import { db } from '.'
import { gridData, type GridDataInsert } from './schema'

const gridDataStore = {
  /**
   * Create a new grid data
   * @param data - The grid data to create
   * @returns The created grid data
   */
  async createGridData(data: GridDataInsert) {
    const result = await db.insert(gridData).values(data).returning()
    return result[0]
  },

  async getGridData() {
    const result = await db.select().from(gridData)

    return result
  },
}

export default gridDataStore
