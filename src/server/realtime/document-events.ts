import { DocumentStatus } from '@/lib/consts'
import { createClient } from '../supabase/server'

export const documentEvents = {
  /**
   * Send a document updated event to the channel
   * @param document - The document to send the event for
   * @returns The channel
   */
  async onDocumentUpdated(document: {
    externalId: string
    id: string
    status: DocumentStatus
  }) {
    const supabase = await createClient()
    const channel = supabase.channel(`user:${document.externalId}`)
    await channel.send({
      type: 'broadcast',
      event: 'document-updated',
      payload: {
        documentId: document.id,
        status: document.status,
      },
    })
    return channel
  },
}
