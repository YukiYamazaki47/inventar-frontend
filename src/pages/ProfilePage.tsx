import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/context/auth-context"

export function ProfilePage() {
  const { me, roles, logout } = useAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Profile</h1>
        <p className="text-sm text-muted-foreground">Your account details.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground">Name</p>
            <p className="text-sm font-medium">{me?.display_name ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="text-sm font-medium">{me?.email ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Roles</p>
            <div className="flex flex-wrap gap-2">
              {(roles ?? []).map((role) => (
                <Badge key={role} variant="secondary">
                  {role}
                </Badge>
              ))}
            </div>
          </div>
          <Button variant="outline" onClick={logout}>
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
