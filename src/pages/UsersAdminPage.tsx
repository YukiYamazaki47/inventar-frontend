import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "@/components/ui/use-toast"

import { apiFetch, buildQueryString, notifyApiError, normalizeList } from "@/lib/api"
import type { User } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

function parseRoles(value: string) {
  return value
    .split(",")
    .map((role) => role.trim())
    .filter(Boolean)
}

export function UsersAdminPage() {
  const [search, setSearch] = React.useState("")
  const [role, setRole] = React.useState("all")
  const [active, setActive] = React.useState("all")
  const [rolesValue, setRolesValue] = React.useState("")

  const queryString = buildQueryString({
    q: search || undefined,
    role: role === "all" ? undefined : role,
    active: active === "all" ? undefined : active === "active",
  })

  const usersQuery = useQuery({
    queryKey: ["users", queryString],
    queryFn: () => apiFetch<User[] | { results: User[] }>(`/users${queryString}`),
  })

  const { results: users } = normalizeList(usersQuery.data ?? [])
  const roleOptions = Array.from(
    new Set(users.flatMap((user) => user.roles ?? []))
  ).sort()

  const refresh = async () => {
    await usersQuery.refetch()
  }

  const handleCreate = async (payload: Record<string, unknown>) => {
    try {
      await apiFetch("/users", { method: "POST", body: payload })
      toast({ title: "Benutzer wurde erstellt" })
      await refresh()
    } catch (error) {
      notifyApiError(error)
    }
  }

  const handleUpdate = async (userId: number | string, payload: Record<string, unknown>) => {
    try {
      await apiFetch(`/users/${userId}`, { method: "PATCH", body: payload })
      toast({ title: "Benutzer wurde aktualisiert" })
      await refresh()
    } catch (error) {
      notifyApiError(error)
    }
  }

  const handleRoles = async (userId: number | string, roles: string[]) => {
    try {
      await apiFetch(`/users/${userId}/roles`, { method: "PUT", body: { roles } })
      toast({ title: "Rollen wurden aktualisiert" })
      await refresh()
    } catch (error) {
      notifyApiError(error)
    }
  }

  const handleDeactivate = async (userId: number | string) => {
    try {
      await apiFetch(`/users/${userId}/deactivate`, { method: "PATCH" })
      toast({ title: "Benutzer wurde deaktiviert" })
      await refresh()
    } catch (error) {
      notifyApiError(error)
    }
  }

  const handleDelete = async (userId: number | string) => {
    try {
      await apiFetch(`/users/${userId}`, { method: "DELETE" })
      toast({ title: "Benutzer wurde gelöscht" })
      await refresh()
    } catch (error) {
      notifyApiError(error)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Benutzer</h1>
        <p className="text-sm text-muted-foreground">Benutzerzugänge und Rollen verwalten.</p>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Input
              placeholder="Benutzer suchen..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Rolle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Rollen</SelectItem>
                {roleOptions.map((roleItem) => (
                  <SelectItem key={roleItem} value={roleItem}>
                    {roleItem}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={active} onValueChange={setActive}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="active">Aktiv</SelectItem>
                <SelectItem value="inactive">Inaktiv</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button>Benutzer anlegen</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Benutzer anlegen</DialogTitle>
              </DialogHeader>
              <UserForm
                onSubmit={handleCreate}
                submitLabel="Anlegen"
              />
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>E-Mail</TableHead>
                <TableHead>Rollen</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Erstellt am</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersQuery.isError && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-destructive">
                    Benutzer konnten nicht geladen werden.
                  </TableCell>
                </TableRow>
              )}
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.display_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(user.roles ?? []).map((roleItem) => (
                        <Badge key={roleItem} variant="secondary">
                          {roleItem}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.active ? "default" : "outline"}>
                      {user.active ? "Aktiv" : "Inaktiv"}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          Aktionen
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <Dialog>
                          <DialogTrigger asChild>
                            <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                              Bearbeiten
                            </DropdownMenuItem>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Benutzer bearbeiten</DialogTitle>
                            </DialogHeader>
                            <UserForm
                              defaultValues={user}
                              onSubmit={(payload) => handleUpdate(user.id, payload)}
                              submitLabel="Speichern"
                            />
                          </DialogContent>
                        </Dialog>
                        <Dialog>
                          <DialogTrigger asChild>
                            <DropdownMenuItem
                              onSelect={(event) => {
                                event.preventDefault()
                                setRolesValue((user.roles ?? []).join(", "))
                              }}
                            >
                              Rollen ändern
                            </DropdownMenuItem>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Rollen aktualisieren</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-2">
                              <Label>Rollen (kommagetrennt)</Label>
                              <Input
                                value={rolesValue}
                                onChange={(event) => setRolesValue(event.target.value)}
                              />
                            </div>
                            <DialogFooter>
                              <Button onClick={() => handleRoles(user.id, parseRoles(rolesValue))}>
                                Speichern
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                              Deactivate
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Benutzer deaktivieren</AlertDialogTitle>
                              <AlertDialogDescription>
                                Der Benutzer kann sich danach nicht mehr anmelden.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeactivate(user.id)}>
                                Bestätigen
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              onSelect={(event) => event.preventDefault()}
                              className="text-destructive"
                            >
                              Löschen
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Benutzer löschen</AlertDialogTitle>
                              <AlertDialogDescription>
                                Diese Aktion kann nicht rückgängig gemacht werden.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(user.id)}>
                                Löschen
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {!usersQuery.isLoading && !usersQuery.isError && users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                    Keine Benutzer gefunden.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function UserForm({
  defaultValues,
  onSubmit,
  submitLabel,
}: {
  defaultValues?: Partial<User>
  onSubmit: (payload: Record<string, unknown>) => void
  submitLabel: string
}) {
  const [displayName, setDisplayName] = React.useState(defaultValues?.display_name ?? "")
  const [email, setEmail] = React.useState(defaultValues?.email ?? "")
  const [password, setPassword] = React.useState("")
  const [active, setActive] = React.useState(defaultValues?.active ?? true)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const payload: Record<string, unknown> = {
      display_name: displayName,
      email,
      active,
    }
    if (password) {
      payload.password = password
    }
    onSubmit(payload)
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label>Anzeigename</Label>
        <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>E-Mail</Label>
        <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Passwort (optional)</Label>
        <Input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={active ? "active" : "inactive"} onValueChange={(value) => setActive(value === "active")}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Aktiv</SelectItem>
            <SelectItem value="inactive">Inaktiv</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button type="submit">{submitLabel}</Button>
      </DialogFooter>
    </form>
  )
}
