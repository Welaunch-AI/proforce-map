export type Appointment = {
  id: string | number
  office_id: number
  appointment_date: string
  start_time_raw?: string | null
  end_time_raw?: string | null
  status_text?: string | null
  employee_id?: string | number | null
  assigned_tech_id?: string | number | null
  serviced_by_id?: string | number | null
  completed_by_id?: string | number | null
  customer_id?: string | number | null
  synced_at?: string | null
  notes?: string | null
  [key: string]: unknown
}

export type Employee = {
  id: string | number
  office_id: number
  fname?: string | null
  lname?: string | null
  active?: string | null
  date_updated?: string | null
  start_city?: string | null
  start_state?: string | null
  start_address?: string | null
  start_zip?: string | null
  start_lat?: number | null
  start_lng?: number | null
  pic?: string | null
  [key: string]: unknown
}

export type SyncMeta = {
  office_id: number
  last_successful_sync_at?: string | null
  [key: string]: unknown
}
