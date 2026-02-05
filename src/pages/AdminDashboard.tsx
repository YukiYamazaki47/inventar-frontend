import { Link } from "react-router-dom"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Admin</h1>
        <p className="text-sm text-muted-foreground">Manage users and master data.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            <Link className="text-primary underline underline-offset-4" to="/admin/users">
              Manage users
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Master data</CardTitle>
          </CardHeader>
          <CardContent>
            <Link className="text-primary underline underline-offset-4" to="/admin/masterdata">
              Manage master data
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
