import { useQuery } from "@tanstack/react-query"

import { apiFetch } from "@/lib/api"
import type { ItemStatus, MasterData, User } from "@/lib/types"

export function useMasterData() {
  return useQuery({
    queryKey: ["master-data"],
    queryFn: async () => {
      const [departments, groups, subjects, places, statuses, users] = await Promise.all([
        apiFetch<MasterData[]>("/departments"),
        apiFetch<MasterData[]>("/groups"),
        apiFetch<MasterData[]>("/subjects"),
        apiFetch<MasterData[]>("/places"),
        apiFetch<ItemStatus[]>("/item-status"),
        apiFetch<User[]>("/users"),
      ])
      return { departments, groups, subjects, places, statuses, users }
    },
    staleTime: 1000 * 60 * 10,
  })
}
