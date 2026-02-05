import { Link, useLocation } from "react-router-dom"
import { LogOutIcon, UserIcon, LayoutGridIcon, ShieldIcon } from "lucide-react"

import { useAuth } from "@/context/auth-context"
import { isAdmin } from "@/lib/auth"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export function AppShell({ children }: { children: React.ReactNode }) {
  const { me, roles, logout } = useAuth()
  const location = useLocation()
  const admin = isAdmin(roles)

  const pathname = location.pathname
  const isInventory = pathname.startsWith("/inventory")
  const isAdminPath = pathname.startsWith("/admin")
  const isProfile = pathname.startsWith("/profile")

  return (
    <SidebarProvider>
      <div className="flex min-h-svh w-full">
        <Sidebar collapsible="offcanvas">
          <SidebarHeader>
            <div className="px-2 py-2">
              <p className="text-xs text-muted-foreground">School Inventory</p>
              <p className="text-sm font-semibold">Inventory System</p>
            </div>
          </SidebarHeader>
          <SidebarSeparator />
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isInventory} tooltip="Inventory">
                  <Link to="/inventory">
                    <LayoutGridIcon />
                    <span>Inventory</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {admin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isAdminPath} tooltip="Admin">
                    <Link to="/admin">
                      <ShieldIcon />
                      <span>Admin</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isProfile} tooltip="Profile">
                  <Link to="/profile">
                    <UserIcon />
                    <span>Profile</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <div className="px-2 pb-2 text-xs text-muted-foreground">
              {me?.display_name ?? me?.email ?? "Logged in"}
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <header className="flex h-14 items-center gap-3 border-b px-4">
            <SidebarTrigger className="md:hidden" />
            <div className="flex flex-1 items-center gap-2">
              <span className="text-sm font-semibold">Inventory</span>
              <span className="text-xs text-muted-foreground">/ {pathname}</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <UserIcon className="size-4" />
                  {me?.display_name ?? "Account"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{me?.email ?? "User"}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout} className="text-destructive">
                  <LogOutIcon className="size-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          <div className="flex-1 p-6">{children}</div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
