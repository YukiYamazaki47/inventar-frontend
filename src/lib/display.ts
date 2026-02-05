import type { IdName, MasterData, User } from "@/lib/types"

export function getLabel(item?: IdName | MasterData | null) {
  if (!item) return ""
  return item.name || item.label || item.title || String(item.id)
}

export function getUserLabel(user?: User | null) {
  if (!user) return ""
  return user.display_name || user.email || String(user.id)
}
