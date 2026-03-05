import * as React from "react"
import { Link, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { toast } from "@/components/ui/use-toast"

import { apiFetch, normalizeList, notifyApiError } from "@/lib/api"
import { canEditItem, isAdmin } from "@/lib/auth"
import { getLabel, getUserLabel } from "@/lib/display"
import type { Item, ItemEvent } from "@/lib/types"
import { useAuth } from "@/context/auth-context"
import { useMasterData } from "@/hooks/use-master-data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"

export function ItemDetailPage() {
  const { id } = useParams()
  const { me, roles } = useAuth()
  const admin = isAdmin(roles)
  const masterQuery = useMasterData()

  const itemId = id ?? ""

  const itemQuery = useQuery({
    queryKey: ["item", itemId],
    queryFn: () => apiFetch<Item>(`/items/${itemId}`),
    enabled: !!itemId,
  })

  const eventsQuery = useQuery({
    queryKey: ["item-events", itemId],
    queryFn: () => apiFetch<ItemEvent[] | { results: ItemEvent[] }>(`/items/${itemId}/events`),
    enabled: !!itemId,
  })

  const item = itemQuery.data
  const events = normalizeList(eventsQuery.data ?? []).results

  const canEdit = admin || canEditItem(me, item?.current_responsible?.id)

  const [editMode, setEditMode] = React.useState(false)
  const [formValues, setFormValues] = React.useState({
    name: "",
    inventory_no: "",
    description: "",
    department_id: "",
    group_id: "",
    subject_id: "",
  })

  React.useEffect(() => {
    if (item) {
      setFormValues({
        name: item.name ?? "",
        inventory_no: item.inventory_no ?? "",
        description: item.description ?? "",
        department_id: item.department?.id ? String(item.department.id) : "",
        group_id: item.group?.id ? String(item.group.id) : "",
        subject_id: item.subject?.id ? String(item.subject.id) : "",
      })
    }
  }, [item])

  const handleUpdate = async () => {
    if (!itemId) return
    try {
      await apiFetch(`/items/${itemId}`, {
        method: "PATCH",
        body: {
          name: formValues.name,
          inventory_no: formValues.inventory_no || undefined,
          description: formValues.description || undefined,
          department_id: formValues.department_id || undefined,
          group_id: formValues.group_id || undefined,
          subject_id: formValues.subject_id || undefined,
        },
      })
      toast({ title: "Gegenstand wurde aktualisiert" })
      setEditMode(false)
      await itemQuery.refetch()
    } catch (error) {
      notifyApiError(error)
    }
  }

  const runAction = async (action: () => Promise<void>, success: string) => {
    try {
      await action()
      toast({ title: success })
      await Promise.all([itemQuery.refetch(), eventsQuery.refetch()])
    } catch (error) {
      notifyApiError(error)
    }
  }

  const [statusId, setStatusId] = React.useState("")
  const [statusNote, setStatusNote] = React.useState("")
  const [responsibleId, setResponsibleId] = React.useState("")
  const [responsibleNote, setResponsibleNote] = React.useState("")
  const [placeId, setPlaceId] = React.useState("")
  const [borrowerId, setBorrowerId] = React.useState("")
  const [expectedReturn, setExpectedReturn] = React.useState("")
  const [borrowNote, setBorrowNote] = React.useState("")
  const [returnPlaceId, setReturnPlaceId] = React.useState("")
  const [returnNote, setReturnNote] = React.useState("")
  const [retireNote, setRetireNote] = React.useState("")
  const [noteText, setNoteText] = React.useState("")

  React.useEffect(() => {
    if (!item) return
    setStatusId(item.status?.id ? String(item.status.id) : "")
    setResponsibleId(
      item.current_responsible?.id ? String(item.current_responsible.id) : ""
    )
    setPlaceId(item.current_place?.id ? String(item.current_place.id) : "")
    setReturnPlaceId(item.current_place?.id ? String(item.current_place.id) : "")
  }, [item])

  if (!itemId) {
    return <div className="text-sm text-muted-foreground">Ungültige Gegenstands-ID.</div>
  }

  if (itemQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (itemQuery.isError) {
    return <div className="text-sm text-destructive">Gegenstand konnte nicht geladen werden.</div>
  }

  if (!item) {
    return <div className="text-sm text-muted-foreground">Gegenstand nicht gefunden.</div>
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">
          <Link to="/inventory" className="underline underline-offset-4">
            Inventar
          </Link>
          <span> / {item.name}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{item.name}</h1>
          {item.inventory_no && <Badge variant="secondary">{item.inventory_no}</Badge>}
          {item.status?.label && <Badge>{item.status.label}</Badge>}
          <span className="text-xs text-muted-foreground">
            Aktualisiert {item.updated_at ? new Date(item.updated_at).toLocaleString() : "-"}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {canEdit ? (
          <Dialog>
            <DialogTrigger asChild>
              <Button>Status ändern</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Status ändern</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Label>Status</Label>
                <Select value={statusId} onValueChange={setStatusId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {(masterQuery.data?.statuses ?? []).map((status) => (
                      <SelectItem key={String(status.id)} value={String(status.id)}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Label>Notiz</Label>
                <Textarea value={statusNote} onChange={(e) => setStatusNote(e.target.value)} />
              </div>
              <DialogFooter>
                <Button
                  onClick={() =>
                    runAction(
                      () =>
                        apiFetch(`/items/${itemId}/status`, {
                          method: "POST",
                          body: { status: statusId, note: statusNote || undefined },
                        }),
                      "Status wurde aktualisiert"
                    )
                  }
                >
                  Speichern
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button disabled>Status ändern</Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>Sie dürfen den Status nicht ändern.</TooltipContent>
          </Tooltip>
        )}

        {canEdit ? (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Verantwortung zuweisen</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Verantwortung zuweisen</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Label>Verantwortlich</Label>
                <Select value={responsibleId} onValueChange={setResponsibleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Benutzer auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {(masterQuery.data?.users ?? []).map((user) => (
                      <SelectItem key={user.id} value={String(user.id)}>
                        {getUserLabel(user)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Label>Notiz</Label>
                <Textarea value={responsibleNote} onChange={(e) => setResponsibleNote(e.target.value)} />
              </div>
              <DialogFooter>
                <Button
                  onClick={() =>
                    runAction(
                      () =>
                        apiFetch(`/items/${itemId}/assign-responsible`, {
                          method: "POST",
                          body: { responsible_id: responsibleId, note: responsibleNote || undefined },
                        }),
                      "Verantwortung wurde aktualisiert"
                    )
                  }
                >
                  Speichern
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button variant="outline" disabled>
                  Verantwortung zuweisen
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>Sie dürfen keine verantwortliche Person zuweisen.</TooltipContent>
          </Tooltip>
        )}

        {canEdit ? (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Ort festlegen</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ort festlegen</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Label>Ort</Label>
                <Select value={placeId} onValueChange={setPlaceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ort auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {(masterQuery.data?.places ?? []).map((place) => (
                      <SelectItem key={String(place.id)} value={String(place.id)}>
                        {getLabel(place)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button
                  onClick={() =>
                    runAction(
                      () =>
                        apiFetch(`/items/${itemId}/set-place`, {
                          method: "POST",
                          body: { place_id: placeId },
                        }),
                      "Ort wurde aktualisiert"
                    )
                  }
                >
                  Speichern
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button variant="outline" disabled>
                  Ort festlegen
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>Sie dürfen den Ort nicht festlegen.</TooltipContent>
          </Tooltip>
        )}

        {canEdit ? (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Ausleihen</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Gegenstand ausleihen</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Label>Entleiher</Label>
                <Select value={borrowerId} onValueChange={setBorrowerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Entleiher auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {(masterQuery.data?.users ?? []).map((user) => (
                      <SelectItem key={user.id} value={String(user.id)}>
                        {getUserLabel(user)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Label>Voraussichtliche Rückgabe</Label>
                <Input
                  type="date"
                  value={expectedReturn}
                  onChange={(e) => setExpectedReturn(e.target.value)}
                />
                <Label>Notiz</Label>
                <Textarea value={borrowNote} onChange={(e) => setBorrowNote(e.target.value)} />
              </div>
              <DialogFooter>
                <Button
                  onClick={() =>
                    runAction(
                      () =>
                        apiFetch(`/items/${itemId}/borrow`, {
                          method: "POST",
                          body: {
                            borrower_id: borrowerId,
                            expected_return_at: expectedReturn || undefined,
                            note: borrowNote || undefined,
                          },
                        }),
                      "Ausleihe erfasst"
                    )
                  }
                >
                  Speichern
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button variant="outline" disabled>
                  Ausleihen
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>Sie dürfen keine Ausleihe durchführen.</TooltipContent>
          </Tooltip>
        )}

        {canEdit ? (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Rückgabe</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Gegenstand zurückgeben</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Label>Ort</Label>
                <Select value={returnPlaceId} onValueChange={setReturnPlaceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ort auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {(masterQuery.data?.places ?? []).map((place) => (
                      <SelectItem key={String(place.id)} value={String(place.id)}>
                        {getLabel(place)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Label>Notiz</Label>
                <Textarea value={returnNote} onChange={(e) => setReturnNote(e.target.value)} />
              </div>
              <DialogFooter>
                <Button
                  onClick={() =>
                    runAction(
                      () =>
                        apiFetch(`/items/${itemId}/return`, {
                          method: "POST",
                          body: {
                            place_id: returnPlaceId,
                            note: returnNote || undefined,
                          },
                        }),
                      "Rückgabe erfasst"
                    )
                  }
                >
                  Speichern
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button variant="outline" disabled>
                  Rückgabe
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>Sie dürfen keine Rückgabe durchführen.</TooltipContent>
          </Tooltip>
        )}

        {admin ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Ausmustern</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Gegenstand ausmustern</AlertDialogTitle>
                <AlertDialogDescription>
                  Dadurch wird der Gegenstand als ausgemustert markiert.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-2">
                <Label>Notiz</Label>
                <Textarea value={retireNote} onChange={(e) => setRetireNote(e.target.value)} />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    runAction(
                      () =>
                        apiFetch(`/items/${itemId}/retire`, {
                          method: "POST",
                          body: { note: retireNote || undefined },
                        }),
                      "Gegenstand wurde ausgemustert"
                    )
                  }
                >
                  Bestätigen
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button variant="destructive" disabled>
                  Ausmustern
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>Nur für Administratoren.</TooltipContent>
          </Tooltip>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Stammdaten</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditMode((prev) => !prev)}
              disabled={!canEdit}
            >
              {editMode ? "Abbrechen" : "Bearbeiten"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={formValues.name}
                onChange={(e) => setFormValues((prev) => ({ ...prev, name: e.target.value }))}
                disabled={!editMode}
              />
            </div>
            <div className="space-y-2">
              <Label>Inventarnummer</Label>
              <Input
                value={formValues.inventory_no}
                onChange={(e) =>
                  setFormValues((prev) => ({ ...prev, inventory_no: e.target.value }))
                }
                disabled={!editMode}
              />
            </div>
            <div className="space-y-2">
              <Label>Beschreibung</Label>
              <Textarea
                value={formValues.description}
                onChange={(e) =>
                  setFormValues((prev) => ({ ...prev, description: e.target.value }))
                }
                disabled={!editMode}
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Abteilung</Label>
                <Select
                  value={formValues.department_id}
                  onValueChange={(value) =>
                    setFormValues((prev) => ({ ...prev, department_id: value }))
                  }
                  disabled={!editMode}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Abteilung" />
                  </SelectTrigger>
                  <SelectContent>
                    {(masterQuery.data?.departments ?? []).map((dept) => (
                      <SelectItem key={String(dept.id)} value={String(dept.id)}>
                        {getLabel(dept)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Gruppe</Label>
                <Select
                  value={formValues.group_id}
                  onValueChange={(value) => setFormValues((prev) => ({ ...prev, group_id: value }))}
                  disabled={!editMode}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Gruppe" />
                  </SelectTrigger>
                  <SelectContent>
                    {(masterQuery.data?.groups ?? []).map((group) => (
                      <SelectItem key={String(group.id)} value={String(group.id)}>
                        {getLabel(group)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fach</Label>
                <Select
                  value={formValues.subject_id}
                  onValueChange={(value) =>
                    setFormValues((prev) => ({ ...prev, subject_id: value }))
                  }
                  disabled={!editMode}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Fach" />
                  </SelectTrigger>
                  <SelectContent>
                    {(masterQuery.data?.subjects ?? []).map((subject) => (
                      <SelectItem key={String(subject.id)} value={String(subject.id)}>
                        {getLabel(subject)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {editMode && (
              <div className="flex justify-end">
                <Button onClick={handleUpdate}>Speichern</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aktueller Stand</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Verantwortlich</p>
              <p>{getUserLabel(item.current_responsible) || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ort</p>
              <p>{getLabel(item.current_place) || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Entleiher</p>
              <p>{getUserLabel(item.current_borrower) || "-"}</p>
            </div>
            {item.updated_at && (
              <div>
                <p className="text-xs text-muted-foreground">Zuletzt aktualisiert</p>
                <p>{new Date(item.updated_at).toLocaleString()}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Ereignisse</CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                Notiz hinzufügen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Notiz hinzufügen</DialogTitle>
              </DialogHeader>
              <Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} />
              <DialogFooter>
                <Button
                  onClick={async () => {
                    await runAction(
                      () =>
                        apiFetch(`/items/${itemId}/events`, {
                          method: "POST",
                          body: { event_type: "NOTE", note: noteText },
                        }),
                      "Notiz wurde hinzugefügt"
                    )
                    setNoteText("")
                  }}
                >
                  Speichern
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="history">
            <TabsList>
              <TabsTrigger value="history">Historie</TabsTrigger>
              <TabsTrigger value="notes">Notizen</TabsTrigger>
            </TabsList>
            <TabsContent value="history">
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Geändert am</TableHead>
                      <TableHead>Geändert von</TableHead>
                      <TableHead>Typ</TableHead>
                      <TableHead>Notiz</TableHead>
                      <TableHead>Alt</TableHead>
                      <TableHead>Neu</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((event) => (
                      <TableRow key={String(event.id)}>
                        <TableCell>
                          {event.changed_at ? new Date(event.changed_at).toLocaleString() : "-"}
                        </TableCell>
                        <TableCell>{getUserLabel(event.changed_by) || "-"}</TableCell>
                        <TableCell>{event.event_type ?? "-"}</TableCell>
                        <TableCell>{event.note ?? "-"}</TableCell>
                        <TableCell>{event.old_value ?? event.old_id ?? "-"}</TableCell>
                        <TableCell>{event.new_value ?? event.new_id ?? "-"}</TableCell>
                      </TableRow>
                    ))}
                    {events.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                          Noch keine Ereignisse vorhanden.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value="notes">
              <p className="text-sm text-muted-foreground">
                Verwenden Sie die Aktion „Notiz hinzufügen“, um Updates zu diesem Gegenstand zu erfassen.
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
