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
      toast({ title: "User created" })
      await refresh()
    } catch (error) {
      notifyApiError(error)
    }
  }

  const handleUpdate = async (userId: number | string, payload: Record<string, unknown>) => {
    try {
      await apiFetch(`/users/${userId}`, { method: "PATCH", body: payload })
      toast({ title: "User updated" })
      await refresh()
    } catch (error) {
      notifyApiError(error)
    }
  }

  const handleRoles = async (userId: number | string, roles: string[]) => {
    try {
      await apiFetch(`/users/${userId}/roles`, { method: "PUT", body: { roles } })
      toast({ title: "Roles updated" })
      await refresh()
    } catch (error) {
      notifyApiError(error)
    }
  }

  const handleDeactivate = async (userId: number | string) => {
    try {
      await apiFetch(`/users/${userId}/deactivate`, { method: "PATCH" })
      toast({ title: "User deactivated" })
      await refresh()
    } catch (error) {
      notifyApiError(error)
    }
  }

  const handleDelete = async (userId: number | string) => {
    try {
      await apiFetch(`/users/${userId}`, { method: "DELETE" })
      toast({ title: "User deleted" })
      await refresh()
    } catch (error) {
      notifyApiError(error)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Users</h1>
        <p className="text-sm text-muted-foreground">Manage user access and roles.</p>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
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
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button>Create user</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create user</DialogTitle>
              </DialogHeader>
              <UserForm
                onSubmit={handleCreate}
                submitLabel="Create"
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
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersQuery.isError && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-destructive">
                    Failed to load users.
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
                      {user.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          Actions
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <Dialog>
                          <DialogTrigger asChild>
                            <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                              Edit
                            </DropdownMenuItem>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit user</DialogTitle>
                            </DialogHeader>
                            <UserForm
                              defaultValues={user}
                              onSubmit={(payload) => handleUpdate(user.id, payload)}
                              submitLabel="Save"
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
                              Change roles
                            </DropdownMenuItem>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Update roles</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-2">
                              <Label>Roles (comma separated)</Label>
                              <Input
                                value={rolesValue}
                                onChange={(event) => setRolesValue(event.target.value)}
                              />
                            </div>
                            <DialogFooter>
                              <Button onClick={() => handleRoles(user.id, parseRoles(rolesValue))}>
                                Save
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
                              <AlertDialogTitle>Deactivate user</AlertDialogTitle>
                              <AlertDialogDescription>
                                The user will no longer be able to sign in.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeactivate(user.id)}>
                                Confirm
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
                              Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete user</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(user.id)}>
                                Delete
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
                    No users found.
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
        <Label>Display name</Label>
        <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Password (optional)</Label>
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
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button type="submit">{submitLabel}</Button>
      </DialogFooter>
    </form>
  )
}
