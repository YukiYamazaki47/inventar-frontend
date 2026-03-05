import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "@/components/ui/use-toast"

import { apiFetch, notifyApiError } from "@/lib/api"
import type { MasterData } from "@/lib/types"
import { getLabel } from "@/lib/display"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"

const TABS = [
  { key: "departments", label: "Departments", endpoint: "/departments" },
  { key: "groups", label: "Groups", endpoint: "/groups" },
  { key: "subjects", label: "Subjects", endpoint: "/subjects" },
  { key: "places", label: "Places", endpoint: "/places" },
  {
    key: "statuses",
    label: "Statuses",
    endpoint: "/item-status",
    allowCreate: true,
    allowDelete: true,
  },
]

export function MasterDataAdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Master Data</h1>
        <p className="text-sm text-muted-foreground">Manage catalogs used across inventory.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="departments">
            <TabsList>
              {TABS.map((tab) => (
                <TabsTrigger key={tab.key} value={tab.key}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {TABS.map((tab) => (
              <TabsContent key={tab.key} value={tab.key}>
                <MasterDataTab
                  label={tab.label}
                  endpoint={tab.endpoint}
                  allowCreate={tab.allowCreate}
                  allowDelete={tab.allowDelete}
                />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

function MasterDataTab({
  label,
  endpoint,
  allowCreate = true,
  allowDelete = true,
}: {
  label: string
  endpoint: string
  allowCreate?: boolean
  allowDelete?: boolean
}) {
  const [search, setSearch] = React.useState("")
  const [editItem, setEditItem] = React.useState<MasterData | null>(null)
  const [nameInput, setNameInput] = React.useState("")

  const query = useQuery({
    queryKey: [endpoint],
    queryFn: () => apiFetch<MasterData[]>(endpoint),
  })

  const items = query.data ?? []
  const filtered = items.filter((item) =>
    getLabel(item).toLowerCase().includes(search.toLowerCase())
  )

  const refresh = async () => {
    await query.refetch()
  }

  const createItem = async () => {
    try {
      await apiFetch(endpoint, {
        method: "POST",
        body: { name: nameInput, label: nameInput },
      })
      toast({ title: `${label} created` })
      setNameInput("")
      await refresh()
    } catch (error) {
      notifyApiError(error)
    }
  }

  const updateItem = async () => {
    if (!editItem) return
    try {
      await apiFetch(`${endpoint}/${editItem.id}`, {
        method: "PATCH",
        body: { name: nameInput, label: nameInput },
      })
      toast({ title: `${label} updated` })
      setEditItem(null)
      setNameInput("")
      await refresh()
    } catch (error) {
      notifyApiError(error)
    }
  }

  const deleteItem = async (id: number | string) => {
    try {
      await apiFetch(`${endpoint}/${id}`, { method: "DELETE" })
      toast({ title: `${label} deleted` })
      await refresh()
    } catch (error) {
      notifyApiError(error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          placeholder={`Search ${label.toLowerCase()}...`}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        {allowCreate ? (
          <Dialog>
            <DialogTrigger asChild>
              <Button onClick={() => setNameInput("")}>Create</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create {label}</DialogTitle>
              </DialogHeader>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={nameInput} onChange={(event) => setNameInput(event.target.value)} />
              </div>
              <DialogFooter>
                <Button onClick={createItem}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : (
          <Badge variant="outline">Create disabled</Badge>
        )}
      </div>

      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="w-[160px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isError && (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-sm text-destructive">
                  Failed to load entries.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((item) => (
              <TableRow key={String(item.id)}>
                <TableCell>{getLabel(item)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditItem(item)
                            setNameInput(getLabel(item))
                          }}
                        >
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit {label}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input
                            value={nameInput}
                            onChange={(event) => setNameInput(event.target.value)}
                          />
                        </div>
                        <DialogFooter>
                          <Button onClick={updateItem}>Save</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    {allowDelete ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete {label}</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove the entry.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteItem(item.id)}>
                              Confirm
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <Badge variant="outline">Delete disabled</Badge>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!query.isLoading && !query.isError && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-sm text-muted-foreground">
                  No entries found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
