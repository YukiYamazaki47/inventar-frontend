import * as React from "react"
import { useNavigate } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import {
  apiFetch,
  clearStoredTokens,
  getStoredTokens,
  setStoredTokens,
  setUnauthorizedHandler,
  type Tokens,
} from "@/lib/api"
import type { User } from "@/lib/types"


type LoginResponse = {
  access_token?: string
  accessToken?: string
  access?: string
  token?: string
  refresh_token?: string
  refreshToken?: string
  refresh?: string
}

function toTokens(data: LoginResponse): Tokens {
  const accessToken = data.access_token ?? data.accessToken ?? data.access ?? data.token
  if (!accessToken) {
    throw new Error("Die Antwort zur Anmeldung enthielt kein Zugriffstoken")
  }

  return {
    accessToken,
    refreshToken: data.refresh_token ?? data.refreshToken ?? data.refresh,
  }
}

type AuthContextValue = {
  me: User | null
  roles: string[]
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshMe: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [tokens, setTokens] = React.useState(() => getStoredTokens())

  React.useEffect(() => {
    setUnauthorizedHandler(() => {
      clearStoredTokens()
      setTokens(null)
      queryClient.clear()
      navigate("/login", { replace: true })
    })
  }, [navigate, queryClient])

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<User>("/me"),
    enabled: !!tokens?.accessToken,
    staleTime: 1000 * 60 * 5,
  })

  const login = React.useCallback(
    async (email: string, password: string) => {
      const data = await apiFetch<LoginResponse>(
        "/auth/login/",
        {
          method: "POST",
          skipAuth: true,
          body: { email, password },
        }
      )

      setStoredTokens(toTokens(data))
      setTokens(getStoredTokens())
      await queryClient.invalidateQueries({ queryKey: ["me"] })
      navigate("/inventory", { replace: true })
    },
    [navigate, queryClient]
  )

  const logout = React.useCallback(async () => {
    try {
      await apiFetch("/auth/logout/", { method: "POST" })
    } catch {
      // ignore
    } finally {
      clearStoredTokens()
      setTokens(null)
      queryClient.clear()
      navigate("/login", { replace: true })
    }
  }, [navigate, queryClient])

  const refreshMe = React.useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["me"] })
  }, [queryClient])

  const value = React.useMemo<AuthContextValue>(
    () => ({
      me: meQuery.data ?? null,
      roles: meQuery.data?.roles ?? [],
      isAuthenticated: !!tokens?.accessToken,
      isLoading: meQuery.isLoading,
      login,
      logout,
      refreshMe,
    }),
    [meQuery.data, meQuery.isLoading, tokens?.accessToken, login, logout, refreshMe]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
