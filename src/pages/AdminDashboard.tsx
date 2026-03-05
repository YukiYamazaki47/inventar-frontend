import { Link } from "react-router-dom"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Administration</h1>
        <p className="text-sm text-muted-foreground">Benutzer und Stammdaten verwalten.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Benutzer</CardTitle>
          </CardHeader>
          <CardContent>
            <Link className="text-primary underline underline-offset-4" to="/admin/users">
              Benutzer verwalten
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stammdaten</CardTitle>
          </CardHeader>
          <CardContent>
            <Link className="text-primary underline underline-offset-4" to="/admin/masterdata">
              Stammdaten verwalten
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
