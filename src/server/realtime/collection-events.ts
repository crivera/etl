import { ExtractionField } from '@/lib/consts'
import { createClient } from '../supabase/server'

interface CollectionFieldsUpdatedPayload {
  collectionId: string
  fields: ExtractionField[]
}

export const collectionEvents = {
  /**
   * Send collection fields updated event
   * @param externalId - The external id of the user
   * @param payload - The collection fields updated payload
   */
  async onCollectionFieldsUpdated(
    externalId: string,
    payload: CollectionFieldsUpdatedPayload,
  ) {
    try {
      const supabase = await createClient()
      await supabase
        .channel(`user:${externalId}`)
        .send({
          type: 'broadcast',
          event: 'collection-fields-updated',
          payload,
        })
    } catch (error) {
      console.error('Failed to send collection fields updated event:', error)
    }
  },
}