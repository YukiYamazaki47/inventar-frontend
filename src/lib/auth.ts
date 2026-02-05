import type { User } from "@/lib/types"

const ADMIN_ROLE_KEYS = ["admin", "inventory_manager", "inventory-manager", "inventory"]

export function isAdmin(roles: string[] = []) {
  return roles.some((role) => {
    const normalized = role.toLowerCase().replace(/\s+/g, "_")
    return ADMIN_ROLE_KEYS.includes(normalized)
  })
}

export function canEditItem(user: User | null, itemResponsibleId?: number | string | null) {
  if (!user) return false
  if (itemResponsibleId === undefined || itemResponsibleId === null) return false
  return String(user.id) === String(itemResponsibleId)
}
