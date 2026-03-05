import { toast } from "@/components/ui/use-toast"

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(/\/+$/, "")

const ACCESS_TOKEN_KEY = "access_token"
const REFRESH_TOKEN_KEY = "refresh_token"

export type Tokens = {
  accessToken: string
  refreshToken?: string
}

export type ApiErrorPayload = {
  detail?: string
  message?: string
  error?: string
}

type TokenResponse = {
  access_token?: string
  access?: string
  token?: string
  refresh_token?: string
  refresh?: string
}

export class ApiError extends Error {
  status: number
  payload?: ApiErrorPayload

  constructor(message: string, status: number, payload?: ApiErrorPayload) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.payload = payload
  }
}

export function getStoredTokens(): Tokens | null {
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY)
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
  if (!accessToken) return null
  return { accessToken, refreshToken: refreshToken ?? undefined }
}

export function setStoredTokens(tokens: Tokens) {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken)
  if (tokens.refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
    return
  }
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export function clearStoredTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

let unauthorizedHandler: (() => void) | null = null

export function setUnauthorizedHandler(handler: () => void) {
  unauthorizedHandler = handler
}

type ApiBody = BodyInit | Record<string, unknown> | Array<unknown> | null

type ApiFetchOptions = Omit<RequestInit, "body"> & {
  body?: ApiBody
  responseType?: "json" | "blob"
  skipAuth?: boolean
  retry?: boolean
}

async function refreshTokens(refreshToken: string): Promise<Tokens> {
  const res = await fetch(buildApiUrl("/auth/refresh/"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })

  if (!res.ok) {
    throw new ApiError("Failed to refresh session", res.status)
  }

  const data = (await res.json()) as TokenResponse
  const accessToken = data.access_token ?? data.access ?? data.token
  const nextRefreshToken = data.refresh_token ?? data.refresh

  if (!accessToken) {
    throw new ApiError("Refresh response did not include an access token", res.status)
  }

  return {
    accessToken,
    refreshToken: nextRefreshToken,
  }
}

export function buildQueryString(params: Record<string, unknown>) {
  const search = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item === undefined || item === null || item === "") return
        search.append(key, String(item))
      })
      return
    }

    search.set(key, String(value))
  })

  const query = search.toString()
  return query ? `?${query}` : ""
}

function parseErrorMessage(payload?: ApiErrorPayload) {
  return (
    payload?.detail ||
    payload?.message ||
    payload?.error ||
    "Something went wrong"
  )
}

export function notifyApiError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      toast({
        title: "Not allowed",
        description: "You do not have permission to perform this action.",
        variant: "destructive",
      })
      return
    }
    toast({ title: "Request failed", description: error.message, variant: "destructive" })
    return
  }

  if (error instanceof Error) {
    toast({ title: "Request failed", description: error.message, variant: "destructive" })
    return
  }

  toast({ title: "Something went wrong", variant: "destructive" })
}

function buildApiUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const tokens = getStoredTokens()
  const { responseType = "json", skipAuth, retry = true, ...init } = options

  const headers = new Headers(init.headers || {})

  if (!skipAuth && tokens?.accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${tokens.accessToken}`)
  }

  const rawBody = init.body
  let body: BodyInit | null | undefined = rawBody as BodyInit | null | undefined

  const isJsonBody =
    rawBody &&
    typeof rawBody === "object" &&
    !(rawBody instanceof FormData) &&
    !(rawBody instanceof Blob) &&
    !(rawBody instanceof ArrayBuffer) &&
    !ArrayBuffer.isView(rawBody) &&
    !(rawBody instanceof URLSearchParams) &&
    !(typeof ReadableStream !== "undefined" && rawBody instanceof ReadableStream)

  if (isJsonBody) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json")
    }
    body = JSON.stringify(rawBody)
  }

  const res = await fetch(buildApiUrl(path), {
    ...init,
    headers,
    body,
  })

  if (res.status === 401 && retry && tokens?.refreshToken && !skipAuth) {
    try {
      const newTokens = await refreshTokens(tokens.refreshToken)
      setStoredTokens(newTokens)
      return apiFetch<T>(path, { ...options, retry: false })
    } catch (refreshError) {
      clearStoredTokens()
      unauthorizedHandler?.()
      throw refreshError
    }
  }

  if (!res.ok) {
    let payload: ApiErrorPayload | undefined
    try {
      payload = (await res.json()) as ApiErrorPayload
    } catch {
      payload = undefined
    }
    const message = parseErrorMessage(payload)
    throw new ApiError(message, res.status, payload)
  }

  if (responseType === "blob") {
    return (await res.blob()) as T
  }

  if (res.status === 204) {
    return null as T
  }

  return (await res.json()) as T
}

export async function downloadFile(path: string, filename: string) {
  const blob = await apiFetch<Blob>(path, { responseType: "blob" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function normalizeList<T>(data: T[] | { results: T[]; count?: number }) {
  if (Array.isArray(data)) {
    return { results: data, count: data.length }
  }
  return { results: data.results ?? [], count: data.count ?? data.results?.length ?? 0 }
}
