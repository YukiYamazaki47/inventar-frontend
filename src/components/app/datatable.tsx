import { useQuery } from "@tanstack/react-query"

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * Datatable
 *
 * Note: This component uses `@tanstack/react-query`'s `useQuery` hook.
 * Make sure you have:
 *  - installed the package: `npm i @tanstack/react-query` (or `yarn add @tanstack/react-query`)
 *  - wrapped your app with a `QueryClientProvider` (typically in `src/main.tsx`)
 */

type User = {
  id: number
  first_name: string
  last_name: string
  email: string
  age: number
}

function DataTable({ endpoint = "https://didactic-adventure-7vv54prvjx9r2rrp9-8000.app.github.dev/users" }: { endpoint?: string }) {
  async function fetchItems(url: string) {
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error("Network response was not ok")
    }
    return (await res.json()) as User[]
  }

  const {
    data: items = [],
    isLoading,
    isError,
    error,
  } = useQuery<User[], Error>({
    queryKey: ["datatable", endpoint],
    queryFn: () => fetchItems(endpoint),
    staleTime: 1000 * 60, // 1 minute
  })

  return (
    <div>
      <Table>
        <TableCaption>Users</TableCaption>
        <TableHeader>
          <tr>
            <TableHead>ID</TableHead>
            <TableHead>First name</TableHead>
            <TableHead>Last name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Age</TableHead>
          </tr>
        </TableHeader>

        <TableBody>
          {isLoading && (
            // simple loading skeleton rows
            Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={`loading-${i}`}>
                <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                <TableCell><Skeleton className="h-4 w-12" /></TableCell>
              </TableRow>
            ))
          )}

          {isError && (
            <TableRow>
              <TableCell colSpan={5} className="text-red-600">
                Error: {error?.message}
              </TableCell>
            </TableRow>
          )}

          {!isLoading && !isError && items.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-muted-foreground">
                No users found.
              </TableCell>
            </TableRow>
          )}

          {!isLoading && !isError &&
            items.map((user: User) => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.first_name}</TableCell>
                <TableCell>{user.last_name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.age}</TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  )
}


export default DataTable