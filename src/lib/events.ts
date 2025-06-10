import { DocumentStatus } from './consts'

export type RealtimeEvent = DocumentUpdatedEvent | DocumentDeletedEvent

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
