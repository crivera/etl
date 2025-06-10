import { DocumentStatus } from '@/lib/consts'
import { RealtimeEvent } from '@/lib/events'
import { createClient } from '../supabase/server'
import { ActionError } from '../routes/safe-action'

// Helper function to send typed document events
async function sendDocumentEvent(externalId: string, event: RealtimeEvent) {
  const supabase = await createClient()
  const channel = supabase.channel(`user:${externalId}`)
  await channel.send(event)
  return channel
}

export const documentEvents = {
  /**
   * Send a document updated event to the channel
   * @param document - The document to send the event for
   * @returns The channel
   */
  async onDocumentUpdated(
    externalId: string,
    document: {
      id: string
      status: DocumentStatus
      error?: Error | ActionError
    },
  ) {
    let error: string | undefined
    if (document.error && 'message' in document.error) {
      error = document.error.message
    }

    const event: RealtimeEvent = {
      type: 'broadcast',
      event: 'document-updated',
      payload: {
        documentId: document.id,
        status: document.status,
        error: error,
      },
    }

    return await sendDocumentEvent(externalId, event)
  },

  /**
   * Send a document deleted event to the channel
   * @param document - The document to send the event for
   * @returns The channel
   */
  async onDocumentDeleted(externalId: string, document: { id: string }) {
    const event: RealtimeEvent = {
      type: 'broadcast',
      event: 'document-deleted',
      payload: {
        documentId: document.id,
      },
    }

    return await sendDocumentEvent(externalId, event)
  },
}
