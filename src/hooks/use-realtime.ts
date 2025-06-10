'use client'

import { RealtimeEvent } from '@/lib/events'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'

interface UseRealtimeProps {
  channelName: string | null
  onMessage: (message: RealtimeEvent) => void
}

export function useRealtime({ channelName, onMessage }: UseRealtimeProps) {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!channelName) return
    const newChannel = supabase.channel(channelName)

    newChannel
      .on('broadcast', { event: '*' }, (data) => {
        onMessage(data as RealtimeEvent)
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
        }
      })

    return () => {
      supabase.removeChannel(newChannel)
    }
  }, [channelName, onMessage])

  return { isConnected }
}
