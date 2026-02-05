import * as React from "react"
import { Link, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { CheckIcon, FilterIcon, RotateCcwIcon } from "lucide-react"

import { apiFetch, buildQueryString, downloadFile, normalizeList } from "@/lib/api"
import { getLabel, getUserLabel } from "@/lib/display"
import { isAdmin } from "@/lib/auth"
import type { Item, ItemStatus, MasterData, User } from "@/lib/types"
import { useAuth } from "@/context/auth-context"
import { useMasterData } from "@/hooks/use-master-data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

const PAGE_SIZES = [10, 20, 50]

function StatusMultiSelect({
  statuses,
  selected,
  onChange,
}: {
  statuses: ItemStatus[]
  selected: Array<string | number>
  onChange: (values: Array<string | number>) => void
}) {
  const toggleStatus = (value: string | number) => {
    if (selected.some((item) => String(item) === String(value))) {
      onChange(selected.filter((item) => String(item) !== String(value)))
    } else {
      onChange([...selected, value])
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="justify-between">
          Status
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start">
        <Command>
          <CommandInput placeholder="Search status..." />
          <CommandEmpty>No status found.</CommandEmpty>
          <CommandGroup>
            {statuses.map((status) => {
              const isSelected = selected.some(
                (item) => String(item) === String(status.id)
              )
              return (
                <CommandItem
                  key={String(status.id)}
                  onSelect={() => toggleStatus(status.id)}
                >
                  <span className="mr-2 flex size-4 items-center justify-center rounded border">
                    {isSelected && <CheckIcon className="size-3" />}
                  </span>
                  {status.label}
                </CommandItem>
              )
            })}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function UserPicker({
  users,
  value,
  onChange,
  placeholder,
}: {
  users: User[]
  value?: string
  onChange: (value?: string) => void
  placeholder: string
}) {
  const [open, setOpen] = React.useState(false)
  const selectedUser = users.find((user) => String(user.id) === String(value))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="justify-between">
          {selectedUser ? getUserLabel(selectedUser) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start">
        <Command>
          <CommandInput placeholder="Search user..." />
          <CommandEmpty>No users found.</CommandEmpty>
          <CommandGroup>
            <CommandItem
              onSelect={() => {
                onChange(undefined)
                setOpen(false)
              }}
            >
              Clear selection
            </CommandItem>
            {users.map((user) => (
              <CommandItem
                key={user.id}
                onSelect={() => {
                  onChange(String(user.id))
                  setOpen(false)
                }}
              >
                {getUserLabel(user)}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function InventoryListPage() {
  const navigate = useNavigate()
  const { roles } = useAuth()
  const admin = isAdmin(roles)

  const [filtersOpen, setFiltersOpen] = React.useState(true)
  const [query, setQuery] = React.useState("")
  const [statusIds, setStatusIds] = React.useState<Array<string | number>>([])
  const [departmentId, setDepartmentId] = React.useState<string | undefined>()
  const [groupId, setGroupId] = React.useState<string | undefined>()
  const [subjectId, setSubjectId] = React.useState<string | undefined>()
  const [placeId, setPlaceId] = React.useState<string | undefined>()
  const [responsibleId, setResponsibleId] = React.useState<string | undefined>()
  const [borrowerId, setBorrowerId] = React.useState<string | undefined>()
  const [mineOnly, setMineOnly] = React.useState(false)
  const [sort, setSort] = React.useState("-updated_at")
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(20)

  const masterQuery = useMasterData()

  const queryString = buildQueryString({
    q: query || undefined,
    status_id: statusIds,
    department_id: departmentId,
    group_id: groupId,
    subject_id: subjectId,
    place_id: placeId,
    responsible_id: responsibleId,
    borrower_id: borrowerId,
    mine: mineOnly ? true : undefined,
    sort,
    page,
    page_size: pageSize,
  })

  const itemsQuery = useQuery({
    queryKey: ["items", queryString],
    queryFn: () => apiFetch<Item[] | { results: Item[]; count?: number }>(`/items${queryString}`),
    keepPreviousData: true,
  })

  const { results: items, count } = normalizeList(itemsQuery.data ?? [])
  const totalPages = count ? Math.max(1, Math.ceil(count / pageSize)) : undefined

  const resetFilters = () => {
    setQuery("")
    setStatusIds([])
    setDepartmentId(undefined)
    setGroupId(undefined)
    setSubjectId(undefined)
    setPlaceId(undefined)
    setResponsibleId(undefined)
    setBorrowerId(undefined)
    setMineOnly(false)
    setSort("-updated_at")
    setPage(1)
  }

  const exportCsv = async () => {
    try {
      const exportQuery = buildQueryString({
        q: query || undefined,
        status_id: statusIds,
        department_id: departmentId,
        group_id: groupId,
        subject_id: subjectId,
        place_id: placeId,
        responsible_id: responsibleId,
        borrower_id: borrowerId,
        mine: mineOnly ? true : undefined,
        sort,
      })
      await downloadFile(`/items/export.csv${exportQuery}`, "items.csv")
      toast.success("Export started.")
    } catch (error) {
      toast.error("Export failed.")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Inventory</h1>
          <p className="text-sm text-muted-foreground">
            Track school assets and their status.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv}>
            Export CSV
          </Button>
          {admin && (
            <Button asChild>
              <Link to="/inventory/new">New Item</Link>
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FilterIcon className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFiltersOpen((open) => !open)}
            >
              {filtersOpen ? "Hide" : "Show"}
            </Button>
          </div>

          {filtersOpen && (
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Search</label>
                <Input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value)
                    setPage(1)
                  }}
                  placeholder="Search items..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <StatusMultiSelect
                  statuses={masterQuery.data?.statuses ?? []}
                  selected={statusIds}
                  onChange={(values) => {
                    setStatusIds(values)
                    setPage(1)
                  }}
                />
                <div className="flex flex-wrap gap-1">
                  {statusIds.map((id) => {
                    const label = masterQuery.data?.statuses?.find(
                      (status) => String(status.id) === String(id)
                    )?.label
                    return (
                      <Badge
                        key={String(id)}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() =>
                          setStatusIds(statusIds.filter((item) => String(item) !== String(id)))
                        }
                      >
                        {label ?? id}
                      </Badge>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Department</label>
                <Select
                  value={departmentId}
                  onValueChange={(value) => {
                    setDepartmentId(value === "all" ? undefined : value)
                    setPage(1)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {(masterQuery.data?.departments ?? []).map((dept) => (
                      <SelectItem key={String(dept.id)} value={String(dept.id)}>
                        {getLabel(dept)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Group</label>
                <Select
                  value={groupId}
                  onValueChange={(value) => {
                    setGroupId(value === "all" ? undefined : value)
                    setPage(1)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All groups" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {(masterQuery.data?.groups ?? []).map((group) => (
                      <SelectItem key={String(group.id)} value={String(group.id)}>
                        {getLabel(group)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Subject</label>
                <Select
                  value={subjectId}
                  onValueChange={(value) => {
                    setSubjectId(value === "all" ? undefined : value)
                    setPage(1)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {(masterQuery.data?.subjects ?? []).map((subject) => (
                      <SelectItem key={String(subject.id)} value={String(subject.id)}>
                        {getLabel(subject)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Place</label>
                <Select
                  value={placeId}
                  onValueChange={(value) => {
                    setPlaceId(value === "all" ? undefined : value)
                    setPage(1)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All places" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {(masterQuery.data?.places ?? []).map((place) => (
                      <SelectItem key={String(place.id)} value={String(place.id)}>
                        {getLabel(place)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Responsible</label>
                <UserPicker
                  users={masterQuery.data?.users ?? []}
                  value={responsibleId}
                  onChange={(value) => {
                    setResponsibleId(value)
                    setPage(1)
                  }}
                  placeholder="Select responsible"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Borrower</label>
                <UserPicker
                  users={masterQuery.data?.users ?? []}
                  value={borrowerId}
                  onChange={(value) => {
                    setBorrowerId(value)
                    setPage(1)
                  }}
                  placeholder="Select borrower"
                />
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={mineOnly}
                  onCheckedChange={(checked) => {
                    setMineOnly(checked)
                    setPage(1)
                  }}
                />
                <div>
                  <p className="text-sm font-medium">Only my items</p>
                  <p className="text-xs text-muted-foreground">Responsible or borrower</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Sort</label>
                <Select
                  value={sort}
                  onValueChange={(value) => {
                    setSort(value)
                    setPage(1)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-updated_at">Recently updated</SelectItem>
                    <SelectItem value="updated_at">Oldest updated</SelectItem>
                    <SelectItem value="name">Name A-Z</SelectItem>
                    <SelectItem value="-name">Name Z-A</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button variant="outline" onClick={resetFilters} className="gap-2">
                  <RotateCcwIcon className="size-4" />
                  Reset
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Inventory No</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Place</TableHead>
                  <TableHead>Responsible</TableHead>
                  <TableHead>Borrower</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itemsQuery.isLoading &&
                  Array.from({ length: 6 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      {Array.from({ length: 10 }).map((__, cellIndex) => (
                        <TableCell key={`cell-${index}-${cellIndex}`}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}

                {!itemsQuery.isLoading && items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-sm text-muted-foreground">
                      No items found.
                    </TableCell>
                  </TableRow>
                )}

                {!itemsQuery.isLoading &&
                  items.map((item) => (
                    <TableRow
                      key={String(item.id)}
                      className="cursor-pointer"
                      onClick={() => navigate(`/inventory/${item.id}`)}
                    >
                      <TableCell>{item.inventory_no ?? "-"}</TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        {item.status?.label ? (
                          <Badge variant="outline">{item.status.label}</Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{getLabel(item.department) || "-"}</TableCell>
                      <TableCell>{getLabel(item.group) || "-"}</TableCell>
                      <TableCell>{getLabel(item.subject) || "-"}</TableCell>
                      <TableCell>{getLabel(item.current_place) || "-"}</TableCell>
                      <TableCell>{getUserLabel(item.current_responsible) || "-"}</TableCell>
                      <TableCell>{getUserLabel(item.current_borrower) || "-"}</TableCell>
                      <TableCell>{item.updated_at ? new Date(item.updated_at).toLocaleString() : "-"}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">
              Showing {items.length} items{count ? ` of ${count}` : ""}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {page}{totalPages ? ` / ${totalPages}` : ""}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => prev + 1)}
                disabled={totalPages ? page >= totalPages : false}
              >
                Next
              </Button>
              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  setPageSize(Number(value))
                  setPage(1)
                }}
              >
                <SelectTrigger className="h-8 w-[110px]">
                  <SelectValue placeholder="Rows" />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZES.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size} / page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
