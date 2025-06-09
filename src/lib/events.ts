import { DocumentStatus } from './consts'

export type RealtimeEvent = DocumentUpdatedEvent

interface DocumentUpdatedEvent {
  event: 'document-updated'
  payload: {
    documentId: string
    status: DocumentStatus
  }
  type: 'broadcast'
}
