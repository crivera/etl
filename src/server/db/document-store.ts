import {
  Cursor,
  DocumentSortField,
  DocumentStatus,
  ExtractedText,
  ItemType,
  SortDirection,
} from '@/lib/consts'
import { and, asc, desc, eq, inArray, SQL, sql } from 'drizzle-orm'
import { db } from '.'
import { documents, type DocumentInsert, type DocumentSelect } from './schema'
import { documentEvents } from '../realtime/document-events'
import { ActionError } from '../routes/safe-action'

interface SortConfig {
  field: DocumentSortField
  direction: SortDirection
}

interface FilterConfig {
  name?: string
  status?: DocumentStatus
}

const documentStore = {
  /**
   * Create a new document
   * @param document - The document to create
   * @returns The created document
   */
  async createDocument(document: Omit<DocumentInsert, 'itemType'>) {
    const result = await db
      .insert(documents)
      .values({
        ...document,
        itemType: ItemType.FILE,
      })
      .returning()
    return result[0]
  },

  /**
   * Create a new folder
   * @param folder - The folder data to create (name, userId, parentId)
   * @returns The created folder
   */
  async createFolder(
    folder: Pick<DocumentInsert, 'name' | 'userId' | 'parentId'>,
  ) {
    const result = await db
      .insert(documents)
      .values({
        ...folder,
        itemType: ItemType.FOLDER,
        path: folder.parentId
          ? `${folder.parentId}/${folder.name}`
          : folder.name,
        type: 'folder',
        size: 0, // Folders don't have a size
        status: null, // Folders have a null status
        // metadata could be added if folders need it
      })
      .returning()
    return result[0]
  },

  /**
   * Get documents by collection id
   * @param collectionId - The id of the collection
   * @returns The documents
   */
  async getDocumentsByCollectionId(collectionId: string) {
    const result = await db
      .select()
      .from(documents)
      .where(eq(documents.collectionId, collectionId))
    return result
  },

  /**
   * Get a document by its id
   * @param id - The id of the document
   * @returns The document or null if it doesn't exist
   */
  async getDocumentById(id: string) {
    const result = await db.select().from(documents).where(eq(documents.id, id))
    return result[0] ?? null
  },

  /**
   * Delete a document by its id
   * @param id - The id of the document
   */
  async deleteDocument(id: string) {
    const itemToDelete = await this.getDocumentById(id)

    if (!itemToDelete) {
      return
    }

    if (itemToDelete.itemType === ItemType.FILE) {
      await db.delete(documents).where(eq(documents.id, id))
    } else if (itemToDelete.itemType === ItemType.FOLDER) {
      const idsToDelete = new Set<string>()
      idsToDelete.add(id)

      const folderQueue = [id]

      while (folderQueue.length > 0) {
        const currentParentId = folderQueue.shift()!

        const children = await db
          .select({ id: documents.id, itemType: documents.itemType })
          .from(documents)
          .where(eq(documents.parentId, currentParentId))

        for (const child of children) {
          idsToDelete.add(child.id)
          if (child.itemType === ItemType.FOLDER) {
            folderQueue.push(child.id)
          }
        }
      }

      if (idsToDelete.size > 0) {
        await db
          .delete(documents)
          .where(inArray(documents.id, Array.from(idsToDelete)))
      }
    }
  },

  /**
   * Update a document
   * @param id - The id of the document
   * @param document - The document to update
   */
  async updateDocument(
    id: string,
    {
      status,
      extractedText,
      externalId,
      error,
    }: {
      status: DocumentStatus
      extractedText: ExtractedText | null
      externalId: string
      error?: Error | ActionError
    },
  ) {
    await db.transaction(async (tx) => {
      await tx
        .update(documents)
        .set({
          status,
          ...(extractedText !== null ? { extractedText } : {}),
        })
        .where(eq(documents.id, id))
      await documentEvents.onDocumentUpdated(externalId, {
        id,
        status,
        error,
      })
    })
  },

  /**
   * Get documents from the database
   * @param userId - The user id of the documents
   * @param options - The options for the query
   * @returns The documents
   */
  async getDocuments(
    userId: string,
    options: {
      cursor?: Cursor
      limit?: number
      sort?: SortConfig
      filters?: FilterConfig
      parentId?: string | null
    } = {},
  ) {
    const {
      cursor,
      limit = 10,
      sort = { field: 'createdAt', direction: 'desc' },
      filters = {},
      parentId = null,
    } = options

    const conditions: SQL[] = [eq(documents.userId, userId)]

    if (parentId === null) {
      conditions.push(sql`${documents.parentId} IS NULL`)
    } else {
      conditions.push(eq(documents.parentId, parentId))
    }

    if (filters.name) {
      conditions.push(sql`${documents.name} ILIKE ${`%${filters.name}%`}`)
    }
    if (filters.status) {
      conditions.push(eq(documents.status, filters.status))
    }

    // Define sort keys
    const primarySortColumn = documents.itemType // itemType ASC
    const secondarySortColumn = documents[sort.field] // e.g., documents.createdAt
    const secondarySortDirection = sort.direction // e.g., 'desc'
    const idColumn = documents.id // Tie-breaker

    if (cursor) {
      const cursorItemType = cursor.itemTypeValue
      const cursorSecondaryValue =
        cursor.value instanceof Date ? cursor.value.toISOString() : cursor.value
      const cursorId = cursor.id

      // Ensure all parts of the cursor are present for composite key pagination
      if (
        cursorItemType !== undefined &&
        cursorSecondaryValue !== undefined &&
        cursorId !== undefined
      ) {
        // let secondaryFieldCondition: SQL;
        // if (secondarySortDirection === 'desc') {
        //   secondaryFieldCondition = sql`${secondarySortColumn} < ${cursorSecondaryValue} OR (${secondarySortColumn} = ${cursorSecondaryValue} AND ${idColumn} < ${cursorId})`;
        // } else { // asc
        //   secondaryFieldCondition = sql`${secondarySortColumn} > ${cursorSecondaryValue} OR (${secondarySortColumn} = ${cursorSecondaryValue} AND ${idColumn} > ${cursorId})`;
        // }

        // const compositeKeyCondition = sql`(${primarySortColumn} > ${cursorItemType}) OR (${primarySortColumn} = ${cursorItemType} AND (${secondaryFieldCondition}))`;
        // DEBUG: Simplify to only test the first part of the OR for itemType change
        const compositeKeyCondition = sql`(${primarySortColumn} > ${cursorItemType})`

        conditions.push(compositeKeyCondition)
      } else {
        // Handle incomplete cursor: log warning or ignore for now
        console.warn(
          'Incomplete cursor provided for pagination, fetching from beginning of this effective page might be impacted.',
        )
      }
    }

    const query = db
      .select()
      .from(documents)
      .where(and(...conditions))
      .orderBy(
        asc(primarySortColumn), // itemType ASC
        secondarySortDirection === 'desc'
          ? desc(secondarySortColumn)
          : asc(secondarySortColumn),
        // ID tie-breaker should align with the secondary sort direction for consistency in that sub-group
        secondarySortDirection === 'desc' ? desc(idColumn) : asc(idColumn),
      )
      .limit(limit + 1)

    const results: DocumentSelect[] = await query
    const hasMore = results.length > limit
    const itemsToMap = hasMore ? results.slice(0, -1) : results

    const nextCursor =
      hasMore && itemsToMap.length > 0
        ? {
            itemTypeValue: itemsToMap[itemsToMap.length - 1]
              .itemType as ItemType,
            value: itemsToMap[itemsToMap.length - 1][sort.field],
            id: itemsToMap[itemsToMap.length - 1].id,
          }
        : null

    return {
      items: itemsToMap,
      nextCursor,
      hasMore,
    }
  },
}

export default documentStore
