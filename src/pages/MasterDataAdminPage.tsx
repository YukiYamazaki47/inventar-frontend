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
  { key: "departments", label: "Abteilungen", singularLabel: "Abteilung", endpoint: "/departments" },
  { key: "groups", label: "Gruppen", singularLabel: "Gruppe", endpoint: "/groups" },
  { key: "subjects", label: "Fächer", singularLabel: "Fach", endpoint: "/subjects" },
  { key: "places", label: "Orte", singularLabel: "Ort", endpoint: "/places" },
  {
    key: "statuses",
    label: "Statuswerte",
    singularLabel: "Statuswert",
    endpoint: "/item-status",
    allowCreate: true,
    allowDelete: true,
  },
]

export function MasterDataAdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Stammdaten</h1>
        <p className="text-sm text-muted-foreground">Kataloge für das Inventar verwalten.</p>
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
                  singularLabel={tab.singularLabel}
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
  singularLabel,
  endpoint,
  allowCreate = true,
  allowDelete = true,
}: {
  label: string
  singularLabel: string
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
      toast({ title: `${singularLabel} wurde erstellt` })
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
      toast({ title: `${singularLabel} wurde aktualisiert` })
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
      toast({ title: `${singularLabel} wurde gelöscht` })
      await refresh()
    } catch (error) {
      notifyApiError(error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          placeholder={`${label} suchen...`}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        {allowCreate ? (
          <Dialog>
            <DialogTrigger asChild>
              <Button onClick={() => setNameInput("")}>Anlegen</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{singularLabel} anlegen</DialogTitle>
              </DialogHeader>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={nameInput} onChange={(event) => setNameInput(event.target.value)} />
              </div>
              <DialogFooter>
                <Button onClick={createItem}>Speichern</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : (
          <Badge variant="outline">Anlegen deaktiviert</Badge>
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
                  Einträge konnten nicht geladen werden.
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
                          Bearbeiten
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{singularLabel} bearbeiten</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input
                            value={nameInput}
                            onChange={(event) => setNameInput(event.target.value)}
                          />
                        </div>
                        <DialogFooter>
                          <Button onClick={updateItem}>Speichern</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    {allowDelete ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            Löschen
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{singularLabel} löschen</AlertDialogTitle>
                            <AlertDialogDescription>
                              Dadurch wird der Eintrag entfernt.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteItem(item.id)}>
                              Bestätigen
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <Badge variant="outline">Löschen deaktiviert</Badge>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!query.isLoading && !query.isError && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-sm text-muted-foreground">
                  Keine Einträge gefunden.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
