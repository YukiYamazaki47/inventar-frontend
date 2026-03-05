import * as React from "react"
import { Link } from "react-router-dom"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function RoleGate({ allowed, children }: { allowed: boolean; children: React.ReactNode }) {
  if (!allowed) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Zugriff eingeschränkt</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Sie haben keinen Zugriff auf diesen Bereich.</p>
            <Link className="text-primary underline underline-offset-4" to="/inventory">
              Zurück zum Inventar
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
