import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '..'
import documentStore from '../document-store'
import { documents, users } from '../schema'
import { DocumentStatus, Role, SortDirection, ItemType } from '@/lib/consts'
import { createId } from '@paralleldrive/cuid2'

// Consistent IDs for testability
const user1Id = createId()
const user2Id = createId()

const doc1Id = createId()
const doc2Id = createId()
const doc3Id = createId()
const otherUserDocId = createId()
const rootFolderUser1Id = createId()
const nestedFileUser1Id = createId()
const subFolderUser1Id = createId()
const fileInSubFolderUser1Id = createId()
const emptyFolderUser1Id = createId()

// New IDs for items within rootFolderUser1Id for pagination test
const additionalFileInRootFolderId1 = createId()
const additionalFileInRootFolderId2 = createId()
const additionalFolderInRootFolderId1 = createId()

describe('documentStore', () => {
  const testUsers = [
    {
      id: user1Id,
      externalId: 'test-user-1',
      role: Role.USER,
    },
    {
      id: user2Id,
      externalId: 'test-user-2',
      role: Role.USER,
    },
  ]

  // Updated testDocuments to include itemType and parentId
  // And new items for folders and nested structures
  const testItems = [
    // User 1 Files in root
    {
      id: doc1Id,
      userId: user1Id,
      name: 'Document 1 File',
      path: '/files/doc1.pdf',
      type: 'application/pdf',
      size: 1024,
      status: DocumentStatus.COMPLETED,
      createdAt: new Date('2024-01-01T10:00:00Z'),
      updatedAt: new Date('2024-01-01T10:00:00Z'),
      metadata: {},
      itemType: ItemType.FILE,
      parentId: null,
    },
    {
      id: doc2Id,
      userId: user1Id,
      name: 'Another File',
      path: '/files/doc2.txt',
      type: 'text/plain',
      size: 2048,
      status: DocumentStatus.EXTRACTING,
      createdAt: new Date('2024-01-02T10:00:00Z'),
      updatedAt: new Date('2024-01-02T10:00:00Z'),
      metadata: {},
      itemType: ItemType.FILE,
      parentId: null,
    },
    // User 1 Folder in root
    {
      id: rootFolderUser1Id,
      userId: user1Id,
      name: 'Root Folder A',
      path: 'Root Folder A', // Path for folders might be just name or constructed
      type: 'folder',
      size: 0,
      status: null, // Folders have null status
      createdAt: new Date('2024-01-03T10:00:00Z'),
      updatedAt: new Date('2024-01-03T10:00:00Z'),
      metadata: {},
      itemType: ItemType.FOLDER,
      parentId: null,
    },
    // User 1 File inside rootFolderUser1Id
    {
      id: nestedFileUser1Id,
      userId: user1Id,
      name: 'Nested File 1 (Original)',
      path: `${rootFolderUser1Id}/Nested File 1.jpg`,
      type: 'image/jpeg',
      size: 500,
      status: DocumentStatus.UPLOADED,
      createdAt: new Date('2024-01-04T10:00:00Z'),
      updatedAt: new Date('2024-01-04T10:00:00Z'),
      metadata: {},
      itemType: ItemType.FILE,
      parentId: rootFolderUser1Id,
    },
    // User 1 Sub-folder inside rootFolderUser1Id
    {
      id: subFolderUser1Id,
      userId: user1Id,
      name: 'SubFolder X (Original)',
      path: `${rootFolderUser1Id}/SubFolder X`,
      type: 'folder',
      size: 0,
      status: null,
      createdAt: new Date('2024-01-05T10:00:00Z'),
      updatedAt: new Date('2024-01-05T10:00:00Z'),
      metadata: {},
      itemType: ItemType.FOLDER,
      parentId: rootFolderUser1Id,
    },
    // User 1 File inside subFolderUser1Id
    {
      id: fileInSubFolderUser1Id,
      userId: user1Id,
      name: 'Deep File Alpha',
      path: `${subFolderUser1Id}/Deep File Alpha.png`,
      type: 'image/png',
      size: 750,
      status: DocumentStatus.COMPLETED,
      createdAt: new Date('2024-01-06T10:00:00Z'),
      updatedAt: new Date('2024-01-06T10:00:00Z'),
      metadata: {},
      itemType: ItemType.FILE,
      parentId: subFolderUser1Id,
    },
    // User 1 Empty Folder in root
    {
      id: emptyFolderUser1Id,
      userId: user1Id,
      name: 'Empty Folder Z',
      path: 'Empty Folder Z',
      type: 'folder',
      size: 0,
      status: null,
      createdAt: new Date('2024-01-07T10:00:00Z'),
      updatedAt: new Date('2024-01-07T10:00:00Z'),
      metadata: {},
      itemType: ItemType.FOLDER,
      parentId: null,
    },
    // User 2 File in root (to test user separation)
    {
      id: otherUserDocId,
      userId: user2Id,
      name: 'Other User File',
      path: '/files/other.docx',
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: 4096,
      status: DocumentStatus.COMPLETED,
      createdAt: new Date('2024-01-08T10:00:00Z'),
      updatedAt: new Date('2024-01-08T10:00:00Z'),
      metadata: {},
      itemType: ItemType.FILE,
      parentId: null,
    },
    // Legacy documents from original test data, adapted
    {
      id: doc3Id, // Was Document 3
      userId: user1Id,
      name: 'Legacy File C', // Renamed for clarity in sorting
      path: '/files/doc3.pdf',
      type: 'application/pdf',
      size: 3072,
      status: DocumentStatus.FAILED,
      createdAt: new Date('2023-12-31T10:00:00Z'), // Older date
      updatedAt: new Date('2023-12-31T10:00:00Z'),
      metadata: {},
      itemType: ItemType.FILE,
      parentId: null,
    },
    // New items for pagination test inside rootFolderUser1Id
    {
      id: additionalFileInRootFolderId1,
      userId: user1Id,
      name: 'Additional File Beta',
      path: `${rootFolderUser1Id}/Additional File Beta.txt`,
      type: 'text/plain',
      size: 100,
      status: DocumentStatus.COMPLETED,
      createdAt: new Date('2024-01-04T11:00:00Z'), // Newer than Nested File 1
      updatedAt: new Date('2024-01-04T11:00:00Z'),
      metadata: {},
      itemType: ItemType.FILE,
      parentId: rootFolderUser1Id,
    },
    {
      id: additionalFileInRootFolderId2,
      userId: user1Id,
      name: 'Additional File Gamma',
      path: `${rootFolderUser1Id}/Additional File Gamma.doc`,
      type: 'application/msword',
      size: 150,
      status: DocumentStatus.COMPLETED,
      createdAt: new Date('2024-01-03T12:00:00Z'), // Older than others in this folder
      updatedAt: new Date('2024-01-03T12:00:00Z'),
      metadata: {},
      itemType: ItemType.FILE,
      parentId: rootFolderUser1Id,
    },
    {
      id: additionalFolderInRootFolderId1,
      userId: user1Id,
      name: 'Additional Sub Y',
      path: `${rootFolderUser1Id}/Additional Sub Y`,
      type: 'folder',
      size: 0,
      status: null,
      createdAt: new Date('2024-01-05T12:00:00Z'), // Newer than SubFolder X
      updatedAt: new Date('2024-01-05T12:00:00Z'),
      metadata: {},
      itemType: ItemType.FOLDER,
      parentId: rootFolderUser1Id,
    },
  ]

  beforeEach(async () => {
    await db.delete(documents)
    await db.delete(users)
    await db.insert(users).values(testUsers)
    // Insert items ensuring parent folders exist or are inserted first if DB enforces FK on parentId immediately.
    // For simplicity, we assume parentId can be temporarily unresolved or insert in an order that respects hierarchy if needed.
    // Drizzle with Postgres typically allows inserting children with parentId that will exist by end of transaction or if FK is deferred.
    // Given our current schema, direct insert should be fine as parentId is nullable and not strictly enforced to exist on insert.
    await db.insert(documents).values(testItems)
  })

  describe('getDocuments', () => {
    it('should return all root items for a user (files and folders)', async () => {
      const result = await documentStore.getDocuments(user1Id, {
        parentId: null,
      })
      // Expected: 2 files, 2 folders in root for user1 initially.
      // Sort order: ItemType ASC (FILE then FOLDER), then createdAt DESC by default in store
      // Files: Another File (2024-01-02), Document 1 File (2024-01-01), Legacy File C (2023-12-31)
      // Folders: Empty Folder Z (2024-01-07), Root Folder A (2024-01-03)
      const rootItemsForUser1 = testItems.filter(
        (i) => i.userId === user1Id && i.parentId === null,
      )
      expect(result.items).toHaveLength(rootItemsForUser1.length)
      expect(result.items.every((doc) => doc.userId === user1Id)).toBe(true)
      expect(result.hasMore).toBe(false)
      expect(result.nextCursor).toBeNull()

      // Check item types and parent IDs
      result.items.forEach((item) => {
        expect(item.parentId).toBeNull()
        if (item.name.includes('File')) {
          expect(item.itemType).toBe(ItemType.FILE)
        } else if (item.name.includes('Folder')) {
          expect(item.itemType).toBe(ItemType.FOLDER)
          expect(item.status).toBeNull()
        }
      })
      // Check default sort order (ItemType ASC, then createdAt DESC)
      // Files first, sorted by createdAt DESC
      expect(result.items[0].name).toBe('Another File') // File, Jan 2
      expect(result.items[0].itemType).toBe(ItemType.FILE)
      expect(result.items[1].name).toBe('Document 1 File') // File, Jan 1
      expect(result.items[1].itemType).toBe(ItemType.FILE)
      expect(result.items[2].name).toBe('Legacy File C') // File, Dec 31
      expect(result.items[2].itemType).toBe(ItemType.FILE)
      // Then Folders, sorted by createdAt DESC
      expect(result.items[3].name).toBe('Empty Folder Z') // Folder, Jan 7
      expect(result.items[3].itemType).toBe(ItemType.FOLDER)
      expect(result.items[4].name).toBe('Root Folder A') // Folder, Jan 3
      expect(result.items[4].itemType).toBe(ItemType.FOLDER)
    })

    it('should support pagination for root items', async () => {
      const firstPage = await documentStore.getDocuments(user1Id, {
        parentId: null,
        limit: 3, // Get 3 items: 3 files
      })
      expect(firstPage.items).toHaveLength(3)
      expect(firstPage.hasMore).toBe(true)
      expect(firstPage.nextCursor).toBeDefined()
      expect(firstPage.items[0].name).toBe('Another File')
      expect(firstPage.items[1].name).toBe('Document 1 File')
      expect(firstPage.items[2].name).toBe('Legacy File C')

      const secondPage = await documentStore.getDocuments(user1Id, {
        parentId: null,
        cursor: firstPage.nextCursor!,
        limit: 3, // Get next 3 items: 2 folders
      })
      expect(secondPage.items).toHaveLength(2) // Empty Folder Z, Root Folder A
      expect(secondPage.hasMore).toBe(false)
      expect(secondPage.nextCursor).toBeNull()
      expect(secondPage.items[0].name).toBe('Empty Folder Z')
      expect(secondPage.items[1].name).toBe('Root Folder A')
    })

    it('should support sorting by name (asc) with mixed item types', async () => {
      const result = await documentStore.getDocuments(user1Id, {
        parentId: null,
        sort: { field: 'name', direction: SortDirection.ASC }, // Use Enum
      })
      // Expected: Files then Folders, then by name ASC
      // Files: Another File, Document 1 File, Legacy File C
      // Folders: Empty Folder Z, Root Folder A
      expect(result.items[0].name).toBe('Another File') // File
      expect(result.items[1].name).toBe('Document 1 File') // File
      expect(result.items[2].name).toBe('Legacy File C') // File
      expect(result.items[3].name).toBe('Empty Folder Z') // Folder
      expect(result.items[4].name).toBe('Root Folder A') // Folder
    })

    it('should support sorting by createdAt (desc) with mixed item types', async () => {
      const result = await documentStore.getDocuments(user1Id, {
        parentId: null,
        sort: { field: 'createdAt', direction: SortDirection.DESC }, // Use Enum
      })
      // Expected: Files then Folders, then by createdAt DESC
      expect(result.items[0].name).toBe('Another File') // File, Jan 2
      expect(result.items[1].name).toBe('Document 1 File') // File, Jan 1
      expect(result.items[2].name).toBe('Legacy File C') // File, Dec 31
      expect(result.items[3].name).toBe('Empty Folder Z') // Folder, Jan 7
      expect(result.items[4].name).toBe('Root Folder A') // Folder, Jan 3
    })

    it('should filter by status (only files)', async () => {
      const result = await documentStore.getDocuments(user1Id, {
        parentId: null,
        filters: { status: DocumentStatus.COMPLETED },
      })
      // Only 'Document 1 File' and 'Legacy File C' are COMPLETED files in root for user1.
      // Default sort: itemType (FILE), then createdAt DESC.
      // Document 1 File (2024-01-01), Legacy File C (2023-12-31) - oops, test data had doc1 as completed.
      // My new test data for user1 root: doc1Id (Document 1 File) is COMPLETED.
      // Legacy File C is FAILED.
      // Another File is EXTRACTING.
      // So only doc1Id should be returned.
      expect(result.items).toHaveLength(1)
      expect(result.items[0].name).toBe('Document 1 File')
      expect(result.items[0].status).toBe(DocumentStatus.COMPLETED)
      expect(result.items[0].itemType).toBe(ItemType.FILE)
    })

    it('should filter by name (files and folders)', async () => {
      const result = await documentStore.getDocuments(user1Id, {
        parentId: null,
        filters: { name: 'File' }, // Finds 'Document 1 File', 'Another File', 'Legacy File C'
      })
      // Default sort: itemType (FILE), then createdAt DESC
      expect(result.items).toHaveLength(3)
      expect(result.items[0].name).toBe('Another File')
      expect(result.items[1].name).toBe('Document 1 File')
      expect(result.items[2].name).toBe('Legacy File C')
    })

    it('should fetch items inside a specific folder', async () => {
      const result = await documentStore.getDocuments(user1Id, {
        parentId: rootFolderUser1Id,
      })
      // Inside rootFolderUser1Id:
      // Files (sorted by createdAt DESC):
      // 1. Additional File Beta (2024-01-04T11:00:00Z)
      // 2. Nested File 1 (Original) (2024-01-04T10:00:00Z)
      // 3. Additional File Gamma (2024-01-03T12:00:00Z)
      // Folders (sorted by createdAt DESC):
      // 4. Additional Sub Y (2024-01-05T12:00:00Z)
      // 5. SubFolder X (Original) (2024-01-05T10:00:00Z)
      // Total 5 items, default sort: ItemType ASC, then createdAt DESC

      expect(result.items).toHaveLength(5)
      expect(result.hasMore).toBe(false) // All 5 items should be fetched if no limit
      expect(result.nextCursor).toBeNull()

      // Check files first, sorted by createdAt DESC
      expect(result.items[0].name).toBe('Additional File Beta')
      expect(result.items[0].itemType).toBe(ItemType.FILE)
      expect(result.items[0].parentId).toBe(rootFolderUser1Id)

      expect(result.items[1].name).toBe('Nested File 1 (Original)')
      expect(result.items[1].itemType).toBe(ItemType.FILE)
      expect(result.items[1].parentId).toBe(rootFolderUser1Id)

      expect(result.items[2].name).toBe('Additional File Gamma')
      expect(result.items[2].itemType).toBe(ItemType.FILE)
      expect(result.items[2].parentId).toBe(rootFolderUser1Id)

      // Then folders, sorted by createdAt DESC
      expect(result.items[3].name).toBe('Additional Sub Y')
      expect(result.items[3].itemType).toBe(ItemType.FOLDER)
      expect(result.items[3].parentId).toBe(rootFolderUser1Id)

      expect(result.items[4].name).toBe('SubFolder X (Original)')
      expect(result.items[4].itemType).toBe(ItemType.FOLDER)
      expect(result.items[4].parentId).toBe(rootFolderUser1Id)
    })

    it('should fetch items inside a nested sub-folder', async () => {
      const result = await documentStore.getDocuments(user1Id, {
        parentId: subFolderUser1Id,
      })
      // Inside subFolderUser1Id: Deep File Alpha
      expect(result.items).toHaveLength(1)
      expect(result.items[0].name).toBe('Deep File Alpha')
      expect(result.items[0].itemType).toBe(ItemType.FILE)
      expect(result.items[0].parentId).toBe(subFolderUser1Id)
    })

    it('should return empty for an empty folder', async () => {
      const result = await documentStore.getDocuments(user1Id, {
        parentId: emptyFolderUser1Id,
      })
      expect(result.items).toHaveLength(0)
      expect(result.hasMore).toBe(false)
      expect(result.nextCursor).toBeNull()
    })

    it('should support pagination inside a folder', async () => {
      const parentFolderId = rootFolderUser1Id
      // Items in rootFolderUser1Id (sorted by itemType ASC, then createdAt DESC):
      // 1. Additional File Beta (FILE, 2024-01-04T11:00:00Z) - ID: additionalFileInRootFolderId1
      // 2. Nested File 1 (Original) (FILE, 2024-01-04T10:00:00Z) - ID: nestedFileUser1Id
      // 3. Additional File Gamma (FILE, 2024-01-03T12:00:00Z) - ID: additionalFileInRootFolderId2
      // 4. Additional Sub Y (FOLDER, 2024-01-05T12:00:00Z) - ID: additionalFolderInRootFolderId1
      // 5. SubFolder X (Original) (FOLDER, 2024-01-05T10:00:00Z) - ID: subFolderUser1Id

      // First page (limit 3)
      const firstPage = await documentStore.getDocuments(user1Id, {
        parentId: parentFolderId,
        limit: 3,
      })

      expect(firstPage.items).toHaveLength(3)
      expect(firstPage.items[0].name).toBe('Additional File Beta')
      expect(firstPage.items[0].itemType).toBe(ItemType.FILE)
      expect(firstPage.items[1].name).toBe('Nested File 1 (Original)')
      expect(firstPage.items[1].itemType).toBe(ItemType.FILE)
      expect(firstPage.items[2].name).toBe('Additional File Gamma')
      expect(firstPage.items[2].itemType).toBe(ItemType.FILE)
      expect(firstPage.hasMore).toBe(true)
      expect(firstPage.nextCursor).toBeDefined()
      expect(firstPage.nextCursor?.itemTypeValue).toBe(ItemType.FILE) // Last item was a FILE
      expect(firstPage.nextCursor?.value).toEqual(
        new Date('2024-01-03T12:00:00Z'),
      ) // createdAt of 'Additional File Gamma'

      // Second page (limit 3, using cursor from first page)
      const secondPage = await documentStore.getDocuments(user1Id, {
        parentId: parentFolderId,
        cursor: firstPage.nextCursor!,
        limit: 3,
      })

      expect(secondPage.items).toHaveLength(2) // Remaining 2 folders
      expect(secondPage.items[0].name).toBe('Additional Sub Y')
      expect(secondPage.items[0].itemType).toBe(ItemType.FOLDER)
      expect(secondPage.items[1].name).toBe('SubFolder X (Original)')
      expect(secondPage.items[1].itemType).toBe(ItemType.FOLDER)
      expect(secondPage.hasMore).toBe(false)
      expect(secondPage.nextCursor).toBeNull()
    })

    it('should combine filters with pagination and sorting for root items', async () => {
      // Example: Filter by name containing 'Folder', sort by name asc, limit 1
      const result = await documentStore.getDocuments(user1Id, {
        parentId: null,
        filters: { name: 'Folder' }, // 'Root Folder A', 'Empty Folder Z'
        sort: { field: 'name', direction: SortDirection.ASC },
        limit: 1,
      })
      // Expected order: ItemType (Folder), then name ASC => Empty Folder Z, Root Folder A
      expect(result.items).toHaveLength(1)
      expect(result.items[0].name).toBe('Empty Folder Z')
      expect(result.items[0].itemType).toBe(ItemType.FOLDER)
      expect(result.hasMore).toBe(true) // because 'Root Folder A' also matches
    })

    it('should not return documents from other users (root level)', async () => {
      const result = await documentStore.getDocuments(user1Id, {
        parentId: null,
      })
      expect(result.items.every((doc) => doc.userId === user1Id)).toBe(true)
      const user1RootItemsCount = testItems.filter(
        (i) => i.userId === user1Id && i.parentId === null,
      ).length
      expect(result.items.length).toBe(user1RootItemsCount) // Ensure we are only getting user1's root items
    })

    it('should handle empty result set for root items (name filter)', async () => {
      const result = await documentStore.getDocuments(user1Id, {
        parentId: null,
        filters: { name: 'NonExistentDocument' },
      })
      expect(result.items).toHaveLength(0)
      expect(result.hasMore).toBe(false)
      expect(result.nextCursor).toBeNull()
    })
  })

  describe('createDocument', () => {
    it('should create a new file document in the root', async () => {
      const newFileData = {
        userId: user1Id,
        name: 'New Root File',
        path: '/files/newRoot.pdf',
        type: 'application/pdf',
        size: 512,
        status: DocumentStatus.UPLOADED,
        metadata: { data: 'test' },
        parentId: null, // Explicitly in root
      }

      const result = await documentStore.createDocument(newFileData)
      expect(result).toMatchObject({
        ...newFileData,
        itemType: ItemType.FILE, // Should be set by createDocument
      })
      expect(result.id).toBeDefined()
      expect(result.createdAt).toBeDefined()
      expect(result.updatedAt).toBeDefined()

      const createdDoc = await documentStore.getDocumentById(result.id)
      expect(createdDoc).toMatchObject(result)
      expect(createdDoc?.itemType).toBe(ItemType.FILE)
      expect(createdDoc?.parentId).toBeNull()
    })

    it('should create a new file document inside a folder', async () => {
      const newFileInFolderData = {
        userId: user1Id,
        name: 'File in Root Folder A',
        path: `${rootFolderUser1Id}/fileInRootA.txt`,
        type: 'text/plain',
        size: 256,
        status: DocumentStatus.COMPLETED,
        metadata: {},
        parentId: rootFolderUser1Id, // Target the existing folder
      }

      const result = await documentStore.createDocument(newFileInFolderData)
      expect(result).toMatchObject({
        ...newFileInFolderData,
        itemType: ItemType.FILE,
      })
      expect(result.parentId).toBe(rootFolderUser1Id)

      const createdDoc = await documentStore.getDocumentById(result.id)
      expect(createdDoc?.parentId).toBe(rootFolderUser1Id)
      expect(createdDoc?.itemType).toBe(ItemType.FILE)
    })

    // Old test for non-existent user still relevant
    it('should fail to create document for non-existent user', async () => {
      const newDocument = {
        userId: 'non-existent-user-id',
        name: 'New Document',
        path: '/documents/new.pdf',
        type: 'application/pdf',
        size: 512,
        status: DocumentStatus.UPLOADED,
        metadata: {},
        parentId: null,
      }
      // The Omit<DocumentInsert, 'itemType'> part is handled by the function signature
      await expect(
        documentStore.createDocument(newDocument as any),
      ).rejects.toThrow()
    })

    it('should fail to create document for non-existent folder', async () => {
      const newDocument = {
        userId: user1Id,
        name: 'New Document',
        path: '/documents/new.pdf',
        type: 'application/pdf',
        size: 512,
        status: DocumentStatus.UPLOADED,
        metadata: {},
        parentId: 'non-existent-folder-id',
      }
      // The Omit<DocumentInsert, 'itemType'> part is handled by the function signature
      await expect(
        documentStore.createDocument(newDocument as any),
      ).rejects.toThrow()
    })
  })

  describe('createFolder', () => {
    it('should create a new folder in the root', async () => {
      const newFolderData = {
        userId: user1Id,
        name: 'My New Root Folder',
        parentId: null,
      }
      const result = await documentStore.createFolder(newFolderData)
      expect(result).toMatchObject({
        // Fields from newFolderData
        userId: user1Id,
        name: 'My New Root Folder',
        parentId: null,
        // Fields set by createFolder
        itemType: ItemType.FOLDER,
        path: 'My New Root Folder', // Path generation check
        type: 'folder',
        size: 0,
        status: null,
        metadata: {}, // Assuming default metadata is an empty object
        extractedText: null, // Folders should have null extractedText
      })
      // Dynamic fields
      expect(result.id).toBeDefined()
      expect(result.createdAt).toBeDefined()
      expect(result.updatedAt).toBeDefined()

      const createdFolder = await documentStore.getDocumentById(result.id)
      expect(createdFolder).toMatchObject(result) // Verify against the full result
    })

    it('should create a new folder inside an existing folder', async () => {
      const newNestedFolderData = {
        userId: user1Id,
        name: 'Nested Folder B',
        parentId: rootFolderUser1Id,
      }
      const result = await documentStore.createFolder(newNestedFolderData)
      expect(result).toMatchObject({
        // Fields from newNestedFolderData
        userId: user1Id,
        name: 'Nested Folder B',
        parentId: rootFolderUser1Id,
        // Fields set by createFolder
        itemType: ItemType.FOLDER,
        path: `${rootFolderUser1Id}/Nested Folder B`,
        type: 'folder',
        size: 0,
        status: null,
        metadata: {}, // Assuming default metadata is an empty object
        extractedText: null, // Folders should have null extractedText
      })
      // Dynamic fields
      expect(result.id).toBeDefined()
      expect(result.createdAt).toBeDefined()
      expect(result.updatedAt).toBeDefined()

      const createdFolder = await documentStore.getDocumentById(result.id)
      // Verify against the full result, which now includes all expected fields like extractedText: null
      expect(createdFolder).toMatchObject(result)
    })

    it('should fail to create folder for non-existent user', async () => {
      const newFolderData = {
        userId: 'non-existent-user-id',
        name: 'Ghost Folder',
        parentId: null,
      }
      await expect(documentStore.createFolder(newFolderData)).rejects.toThrow()
    })
  })

  describe('getDocumentById', () => {
    it('should return a file document by its id with correct itemType and parentId', async () => {
      const fileToFetch = testItems.find((i) => i.id === doc1Id)! // Document 1 File
      const result = await documentStore.getDocumentById(fileToFetch.id)

      expect(result).toBeDefined()
      expect(result).toMatchObject({
        id: fileToFetch.id,
        name: fileToFetch.name,
        itemType: ItemType.FILE,
        parentId: null,
        status: fileToFetch.status,
      })
    })

    it('should return a folder document by its id with correct itemType, parentId and null status', async () => {
      const folderToFetch = testItems.find((i) => i.id === rootFolderUser1Id)! // Root Folder A
      const result = await documentStore.getDocumentById(folderToFetch.id)

      expect(result).toBeDefined()
      expect(result).toMatchObject({
        id: folderToFetch.id,
        name: folderToFetch.name,
        itemType: ItemType.FOLDER,
        parentId: null,
        status: null,
      })
    })

    it('should return a nested file document with correct parentId', async () => {
      const nestedFile = testItems.find((i) => i.id === nestedFileUser1Id)! // Nested File 1
      const result = await documentStore.getDocumentById(nestedFile.id)
      expect(result).toBeDefined()
      expect(result?.itemType).toBe(ItemType.FILE)
      expect(result?.parentId).toBe(rootFolderUser1Id)
    })

    it('should return null for non-existent document', async () => {
      const result = await documentStore.getDocumentById('non-existent-id')
      expect(result).toBeNull()
    })
  })

  describe('deleteDocument', () => {
    it('should delete a single file document', async () => {
      const fileToDelete = testItems.find(
        (i) => i.itemType === ItemType.FILE && i.parentId === null,
      )! // e.g., doc1Id
      const initialCount = (await db.select().from(documents)).length

      await documentStore.deleteDocument(fileToDelete.id)

      const deletedDoc = await documentStore.getDocumentById(fileToDelete.id)
      expect(deletedDoc).toBeNull()

      const finalCount = (await db.select().from(documents)).length
      expect(finalCount).toBe(initialCount - 1)
    })

    it('should delete an empty folder', async () => {
      const folderToDelete = testItems.find((i) => i.id === emptyFolderUser1Id)!
      const initialCount = (await db.select().from(documents)).length

      await documentStore.deleteDocument(folderToDelete.id)

      const deletedFolder = await documentStore.getDocumentById(
        folderToDelete.id,
      )
      expect(deletedFolder).toBeNull()
      const finalCount = (await db.select().from(documents)).length
      expect(finalCount).toBe(initialCount - 1)
    })

    it('should recursively delete a folder and all its contents (files and sub-folders)', async () => {
      // rootFolderUser1Id contains:
      // - nestedFileUser1Id (FILE)
      // - additionalFileInRootFolderId1 (FILE)
      // - additionalFileInRootFolderId2 (FILE)
      // - subFolderUser1Id (FOLDER) -> which contains fileInSubFolderUser1Id (FILE)
      // - additionalFolderInRootFolderId1 (FOLDER)
      // Total items to be deleted:
      // 1 (rootFolderUser1Id) + 3 (direct files) + 1 (subFolderUser1Id) + 1 (file in sub) + 1 (direct additional folder) = 7 items
      const folderToDeleteId = rootFolderUser1Id
      const initialCount = (
        await db.select({ id: documents.id }).from(documents)
      ).length // Count all documents

      // Sanity check: ensure children exist before deletion
      expect(
        await documentStore.getDocumentById(nestedFileUser1Id),
      ).not.toBeNull()
      expect(
        await documentStore.getDocumentById(additionalFileInRootFolderId1),
      ).not.toBeNull()
      expect(
        await documentStore.getDocumentById(additionalFileInRootFolderId2),
      ).not.toBeNull()
      expect(
        await documentStore.getDocumentById(subFolderUser1Id),
      ).not.toBeNull()
      expect(
        await documentStore.getDocumentById(fileInSubFolderUser1Id),
      ).not.toBeNull()
      expect(
        await documentStore.getDocumentById(additionalFolderInRootFolderId1),
      ).not.toBeNull()

      await documentStore.deleteDocument(folderToDeleteId)

      // Verify the folder itself is deleted
      expect(await documentStore.getDocumentById(folderToDeleteId)).toBeNull()

      // Verify all its direct and indirect children are deleted
      expect(await documentStore.getDocumentById(nestedFileUser1Id)).toBeNull()
      expect(
        await documentStore.getDocumentById(additionalFileInRootFolderId1),
      ).toBeNull()
      expect(
        await documentStore.getDocumentById(additionalFileInRootFolderId2),
      ).toBeNull()
      expect(await documentStore.getDocumentById(subFolderUser1Id)).toBeNull()
      expect(
        await documentStore.getDocumentById(fileInSubFolderUser1Id),
      ).toBeNull()
      expect(
        await documentStore.getDocumentById(additionalFolderInRootFolderId1),
      ).toBeNull()

      const finalCount = (await db.select({ id: documents.id }).from(documents))
        .length
      expect(finalCount).toBe(initialCount - 7) // Updated from -4 to -7

      // Verify other documents are not affected
      const unaffectedFile = testItems.find((i) => i.id === doc1Id)! // A root file not in the deleted folder
      expect(
        await documentStore.getDocumentById(unaffectedFile.id),
      ).not.toBeNull()

      const unaffectedOtherUserFile = testItems.find(
        (i) => i.id === otherUserDocId,
      )!
      expect(
        await documentStore.getDocumentById(unaffectedOtherUserFile.id),
      ).not.toBeNull()
    })

    it('should not throw when deleting non-existent document', async () => {
      const initialCount = (await db.select().from(documents)).length
      await expect(
        documentStore.deleteDocument('non-existent-id'),
      ).resolves.not.toThrow()
      const finalCount = (await db.select().from(documents)).length
      expect(finalCount).toBe(initialCount)
    })

    // The old test for deleting already deleted document is still somewhat relevant
    // though behavior with recursive delete might not change the core expectation here.
    it('should not throw when deleting already deleted document (or folder)', async () => {
      const itemToDelete = testItems[0] // Could be a file or folder
      await documentStore.deleteDocument(itemToDelete.id) // First delete

      const initialCountAfterFirstDelete = (await db.select().from(documents))
        .length

      await expect(
        documentStore.deleteDocument(itemToDelete.id), // Attempt to delete again
      ).resolves.not.toThrow()

      const finalCount = (await db.select().from(documents)).length
      expect(finalCount).toBe(initialCountAfterFirstDelete) // Count should not change further
    })
  })
})
