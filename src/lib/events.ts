import { DocumentStatus, ExtractionField } from './consts'

export type RealtimeEvent = DocumentUpdatedEvent | DocumentDeletedEvent | CollectionFieldsUpdatedEvent

interface DocumentUpdatedEvent {
  event: 'document-updated'
  payload: {
    documentId: string
    status: DocumentStatus
    error?: string
  }
  type: 'broadcast'
}

interface DocumentDeletedEvent {
  event: 'document-deleted'
  payload: {
    documentId: string
  }
  type: 'broadcast'
}

interface CollectionFieldsUpdatedEvent {
  event: 'collection-fields-updated'
  payload: {
    collectionId: string
    fields: ExtractionField[]
  }
  type: 'broadcast'
}
