export type IdName = {
  id: number | string
  name?: string
  label?: string
  title?: string
}

export type User = {
  id: number
  display_name: string
  email: string
  roles?: string[]
  active?: boolean
  created_at?: string
}

export type ItemStatus = {
  id: number | string
  label: string
}

export type Item = {
  id: number | string
  inventory_no?: string
  name: string
  description?: string
  status?: ItemStatus
  department?: IdName
  group?: IdName
  subject?: IdName
  current_place?: IdName
  current_responsible?: User
  current_borrower?: User
  updated_at?: string
}

export type ItemEvent = {
  id: number | string
  changed_at?: string
  changed_by?: User
  event_type?: string
  note?: string
  old_value?: string | number | null
  new_value?: string | number | null
  old_id?: string | number | null
  new_id?: string | number | null
}

export type MasterData = {
  id: number | string
  name?: string
  label?: string
}
