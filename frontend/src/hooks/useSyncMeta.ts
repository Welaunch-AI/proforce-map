import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { SyncMeta } from '../lib/types'
import { OFFICE_ID } from '../lib/utils'

export function useSyncMeta() {
  const [data, setData] = useState<SyncMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: row, error: queryError } = await supabase
        .from('fr_sync_meta')
        .select('*')
        .eq('office_id', OFFICE_ID)
        .single()

      if (queryError) {
        setError(queryError.message)
        setData(null)
      } else {
        setData((row as SyncMeta) ?? null)
        setError(null)
      }
      setLoading(false)
    }
    void load()
  }, [])

  return { data, loading, error }
}
