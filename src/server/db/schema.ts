import {
  ExtractedText,
  ExtractionField,
  FileType,
  ItemType,
  Role,
} from '@/lib/consts'
import { createId } from '@paralleldrive/cuid2'
import { sql } from 'drizzle-orm'
import {
  integer,
  jsonb,
  pgEnum,
  pgTableCreator,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core'

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `etl_${name}`)

export const itemTypeEnum = pgEnum('item_type', [
  ItemType.FILE,
  ItemType.FOLDER,
])

export const fileTypeEnum = pgEnum('file_type', [
  FileType.DOCX,
  FileType.XLSX,
  FileType.PDF,
])

const dateColumns = {
  createdAt: timestamp('created_at', { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .$onUpdate(() => new Date())
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
}

const defaultColumns = {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  ...dateColumns,
}

export const users = createTable('user', {
  ...defaultColumns,
  role: integer('role').default(Role.USER).notNull(),
  externalId: text('external_id').notNull().unique(),
})

export const documents = createTable('document', {
  ...defaultColumns,
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  parentId: text('parent_id').references((): any => documents.id),
  itemType: itemTypeEnum('item_type').default(ItemType.FILE).notNull(),
  path: text('path').notNull(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  size: integer('size').notNull(),
  status: integer('status'),
  extractedText: jsonb('extracted_text').$type<ExtractedText>(),
})

export const documentExtractions = createTable(
  'document_extractions',
  {
    ...defaultColumns,
    documentId: text('document_id')
      .references(() => documents.id, { onDelete: 'cascade' })
      .notNull(),
    data: jsonb('data').notNull(),
    fields: jsonb('fields').notNull(),
    version: integer('version').notNull(),
  },
  (table) => [
    {
      documentVersionUnique: unique().on(table.documentId, table.version),
    },
  ],
)

export const fieldGroups = createTable('field_groups', {
  ...defaultColumns,
  name: text('name').notNull(),
  description: text('description'),
  fields: jsonb('fields').notNull().$type<ExtractionField[]>(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
})

export const templates = createTable('templates', {
  ...defaultColumns,
  name: text('name').notNull(),
  description: text('description'),
  fileType: fileTypeEnum('file_type').notNull(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  fields: jsonb('fields').notNull().$type<ExtractionField[]>().default([]),
  path: text('path'),
  fileName: text('file_name'),
  type: text('type'),
  size: integer('size'),
})

export type UserInsert = typeof users.$inferInsert
export type DocumentInsert = typeof documents.$inferInsert
export type DocumentSelect = typeof documents.$inferSelect
export type DocumentExtractionInsert = typeof documentExtractions.$inferInsert
export type DocumentExtractionSelect = typeof documentExtractions.$inferSelect
export type FieldGroupInsert = typeof fieldGroups.$inferInsert
export type FieldGroupSelect = typeof fieldGroups.$inferSelect
export type TemplateInsert = typeof templates.$inferInsert
export type TemplateSelect = typeof templates.$inferSelect
