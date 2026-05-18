import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Employee } from '../lib/types'
import { OFFICE_ID } from '../lib/utils'

export function useTechnicians() {
  const [data, setData] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data: rows, error: queryError } = await supabase
        .from('fr_employees')
        .select('*')
        .eq('active', '1')
        .eq('office_id', OFFICE_ID)
        .order('lname', { ascending: true })

      if (queryError) {
        setError(queryError.message)
        setData([])
      } else {
        setData((rows as Employee[]) ?? [])
        setError(null)
      }
      setLoading(false)
    }
    void load()
  }, [])

  return { data, loading, error }
}
