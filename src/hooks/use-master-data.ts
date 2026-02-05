import { useQuery } from "@tanstack/react-query"

import { apiFetch } from "@/lib/api"
import type { ItemStatus, MasterData, User } from "@/lib/types"

type MasterDataPayload = {
  departments: MasterData[]
  groups: MasterData[]
  subjects: MasterData[]
  places: MasterData[]
  statuses: ItemStatus[]
  users: User[]
}

export function useMasterData() {
  return useQuery<MasterDataPayload>({
    queryKey: ["master-data"],
    queryFn: async () => {
      const results = await Promise.allSettled([
        apiFetch<MasterData[]>("/departments"),
        apiFetch<MasterData[]>("/groups"),
        apiFetch<MasterData[]>("/subjects"),
        apiFetch<MasterData[]>("/places"),
        apiFetch<ItemStatus[]>("/item-status"),
        apiFetch<User[]>("/users"),
      ])

      const pick = <T,>(index: number) => {
        const result = results[index]
        return result.status === "fulfilled" ? (result.value as T) : ([] as T)
      }

      return {
        departments: pick<MasterData[]>(0),
        groups: pick<MasterData[]>(1),
        subjects: pick<MasterData[]>(2),
        places: pick<MasterData[]>(3),
        statuses: pick<ItemStatus[]>(4),
        users: pick<User[]>(5),
      }
    },
    staleTime: 1000 * 60 * 10,
  })
}
