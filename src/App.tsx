import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom"

import { AuthProvider, useAuth } from "@/context/auth-context"
import { AppShell } from "@/components/app/app-shell"
import { ProtectedRoute } from "@/components/app/protected-route"
import { RoleGate } from "@/components/app/role-gate"
import { isAdmin } from "@/lib/auth"

import { LoginPage } from "@/pages/LoginPage"
import { InventoryListPage } from "@/pages/InventoryListPage"
import { ItemDetailPage } from "@/pages/ItemDetailPage"
import { NewItemPage } from "@/pages/NewItemPage"
import { AdminDashboard } from "@/pages/AdminDashboard"
import { UsersAdminPage } from "@/pages/UsersAdminPage"
import { MasterDataAdminPage } from "@/pages/MasterDataAdminPage"
import { ProfilePage } from "@/pages/ProfilePage"

function AppLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}

function AdminGate() {
  const { roles } = useAuth()
  return (
    <RoleGate allowed={isAdmin(roles)}>
      <Outlet />
    </RoleGate>
  )
}

function HomeRedirect() {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) {
    return null
  }
  return <Navigate to={isAuthenticated ? "/inventory" : "/login"} replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/inventory" element={<InventoryListPage />} />
        <Route path="/inventory/:id" element={<ItemDetailPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route element={<AdminGate />}>
          <Route path="/inventory/new" element={<NewItemPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UsersAdminPage />} />
          <Route path="/admin/masterdata" element={<MasterDataAdminPage />} />
        </Route>
      </Route>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
