import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Appointment } from '../lib/types'
import { OFFICE_ID, isoToday } from '../lib/utils'

type Options = {
  onlyToday?: boolean
  dateFrom?: string
  dateTo?: string
}

export function useAppointments(options: Options = {}) {
  const { onlyToday = true, dateFrom, dateTo } = options
  const [data, setData] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      let query = supabase
        .from('fr_appointments')
        .select('*')
        .eq('office_id', OFFICE_ID)
        .order('appointment_date', { ascending: false })
        .order('start_time_raw', { ascending: false })

      if (onlyToday) {
        query = query.eq('appointment_date', isoToday())
      }
      if (dateFrom) {
        query = query.gte('appointment_date', dateFrom)
      }
      if (dateTo) {
        query = query.lte('appointment_date', dateTo)
      }

      const { data: rows, error: queryError } = await query

      if (queryError) {
        setError(queryError.message)
        setData([])
      } else {
        setData((rows as Appointment[]) ?? [])
        setError(null)
      }
      setLoading(false)
    }
    void load()
  }, [onlyToday, dateFrom, dateTo])

  return { data, loading, error }
}
