import * as React from "react"
import { Link, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"

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

function ActionButton({
  disabled,
  tooltip,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { tooltip?: string }) {
  if (!disabled) {
    return <Button {...props}>{children}</Button>
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span>
          <Button {...props} disabled>
            {children}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>{tooltip ?? "Not allowed"}</TooltipContent>
    </Tooltip>
  )
}

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
      toast.success("Item updated")
      setEditMode(false)
      await itemQuery.refetch()
    } catch (error) {
      notifyApiError(error)
    }
  }

  const runAction = async (action: () => Promise<void>, success: string) => {
    try {
      await action()
      toast.success(success)
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

  if (!itemId) {
    return <div className="text-sm text-muted-foreground">Invalid item id.</div>
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

  if (!item) {
    return <div className="text-sm text-muted-foreground">Item not found.</div>
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">
          <Link to="/inventory" className="underline underline-offset-4">
            Inventory
          </Link>
          <span> / {item.name}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{item.name}</h1>
          {item.inventory_no && <Badge variant="secondary">{item.inventory_no}</Badge>}
          {item.status?.label && <Badge>{item.status.label}</Badge>}
          <span className="text-xs text-muted-foreground">
            Updated {item.updated_at ? new Date(item.updated_at).toLocaleString() : "-"}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Dialog>
          <DialogTrigger asChild>
            <ActionButton disabled={!canEdit} tooltip="You are not allowed to change status">
              Change Status
            </ActionButton>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change status</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Label>Status</Label>
              <Select value={statusId} onValueChange={setStatusId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {(masterQuery.data?.statuses ?? []).map((status) => (
                    <SelectItem key={String(status.id)} value={String(status.id)}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Label>Note</Label>
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
                    "Status updated"
                  )
                }
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <ActionButton disabled={!canEdit} tooltip="You are not allowed to assign responsible">
              Assign Responsible
            </ActionButton>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign responsible</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Label>Responsible</Label>
              <Select value={responsibleId} onValueChange={setResponsibleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {(masterQuery.data?.users ?? []).map((user) => (
                    <SelectItem key={user.id} value={String(user.id)}>
                      {getUserLabel(user)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Label>Note</Label>
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
                    "Responsible updated"
                  )
                }
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <ActionButton disabled={!canEdit} tooltip="You are not allowed to set place">
              Set Place
            </ActionButton>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set place</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Label>Place</Label>
              <Select value={placeId} onValueChange={setPlaceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select place" />
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
                    "Place updated"
                  )
                }
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <ActionButton disabled={!canEdit} tooltip="You are not allowed to borrow">
              Borrow
            </ActionButton>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Borrow item</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Label>Borrower</Label>
              <Select value={borrowerId} onValueChange={setBorrowerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select borrower" />
                </SelectTrigger>
                <SelectContent>
                  {(masterQuery.data?.users ?? []).map((user) => (
                    <SelectItem key={user.id} value={String(user.id)}>
                      {getUserLabel(user)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Label>Expected return</Label>
              <Input type="date" value={expectedReturn} onChange={(e) => setExpectedReturn(e.target.value)} />
              <Label>Note</Label>
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
                    "Borrowed"
                  )
                }
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <ActionButton disabled={!canEdit} tooltip="You are not allowed to return">
              Return
            </ActionButton>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Return item</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Label>Place</Label>
              <Select value={returnPlaceId} onValueChange={setReturnPlaceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select place" />
                </SelectTrigger>
                <SelectContent>
                  {(masterQuery.data?.places ?? []).map((place) => (
                    <SelectItem key={String(place.id)} value={String(place.id)}>
                      {getLabel(place)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Label>Note</Label>
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
                    "Returned"
                  )
                }
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <ActionButton variant="destructive" disabled={!admin} tooltip="Admin only">
              Retire
            </ActionButton>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Retire item</AlertDialogTitle>
              <AlertDialogDescription>
                This will mark the item as retired.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
              <Label>Note</Label>
              <Textarea value={retireNote} onChange={(e) => setRetireNote(e.target.value)} />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  runAction(
                    () =>
                      apiFetch(`/items/${itemId}/retire`, {
                        method: "POST",
                        body: { note: retireNote || undefined },
                      }),
                    "Item retired"
                  )
                }
              >
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
              {editMode ? "Cancel" : "Edit"}
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
              <Label>Inventory No</Label>
              <Input
                value={formValues.inventory_no}
                onChange={(e) =>
                  setFormValues((prev) => ({ ...prev, inventory_no: e.target.value }))
                }
                disabled={!editMode}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
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
                <Label>Department</Label>
                <Select
                  value={formValues.department_id}
                  onValueChange={(value) =>
                    setFormValues((prev) => ({ ...prev, department_id: value }))
                  }
                  disabled={!editMode}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Department" />
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
                <Label>Group</Label>
                <Select
                  value={formValues.group_id}
                  onValueChange={(value) => setFormValues((prev) => ({ ...prev, group_id: value }))}
                  disabled={!editMode}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Group" />
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
                <Label>Subject</Label>
                <Select
                  value={formValues.subject_id}
                  onValueChange={(value) =>
                    setFormValues((prev) => ({ ...prev, subject_id: value }))
                  }
                  disabled={!editMode}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Subject" />
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
                <Button onClick={handleUpdate}>Save</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current state</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Responsible</p>
              <p>{getUserLabel(item.current_responsible) || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Place</p>
              <p>{getLabel(item.current_place) || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Borrower</p>
              <p>{getUserLabel(item.current_borrower) || "-"}</p>
            </div>
            {item.updated_at && (
              <div>
                <p className="text-xs text-muted-foreground">Last updated</p>
                <p>{new Date(item.updated_at).toLocaleString()}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Events</CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                Add Note
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add note</DialogTitle>
              </DialogHeader>
              <Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} />
              <DialogFooter>
                <Button
                  onClick={() =>
                    runAction(
                      () =>
                        apiFetch(`/items/${itemId}/events`, {
                          method: "POST",
                          body: { event_type: "NOTE", note: noteText },
                        }),
                      "Note added"
                    )
                  }
                >
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="history">
            <TabsList>
              <TabsTrigger value="history">Historie</TabsTrigger>
              <TabsTrigger value="notes">Notiz</TabsTrigger>
            </TabsList>
            <TabsContent value="history">
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Changed At</TableHead>
                      <TableHead>Changed By</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead>Old</TableHead>
                      <TableHead>New</TableHead>
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
                          No events yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value="notes">
              <p className="text-sm text-muted-foreground">
                Use the “Add Note” action to add updates to this item.
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
