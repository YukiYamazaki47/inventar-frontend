import * as React from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "@/components/ui/use-toast"

import { apiFetch, notifyApiError } from "@/lib/api"
import { getLabel, getUserLabel } from "@/lib/display"
import { useMasterData } from "@/hooks/use-master-data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export function NewItemPage() {
  const navigate = useNavigate()
  const masterQuery = useMasterData()

  const [formValues, setFormValues] = React.useState({
    name: "",
    inventory_no: "",
    description: "",
    department_id: "",
    group_id: "",
    subject_id: "",
    status: "",
    current_responsible_id: "",
    current_place_id: "",
    current_borrower_id: "",
  })

  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const validate = () => {
    const nextErrors: Record<string, string> = {}
    if (!formValues.name) nextErrors.name = "Name ist erforderlich"
    if (!formValues.department_id) nextErrors.department_id = "Abteilung ist erforderlich"
    if (!formValues.group_id) nextErrors.group_id = "Gruppe ist erforderlich"
    if (!formValues.status) nextErrors.status = "Status ist erforderlich"
    if (!formValues.current_responsible_id) {
      nextErrors.current_responsible_id = "Verantwortliche Person ist erforderlich"
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const item = await apiFetch<{ id: number | string }>("/items", {
        method: "POST",
        body: {
          ...formValues,
          inventory_no: formValues.inventory_no || undefined,
          description: formValues.description || undefined,
          subject_id: formValues.subject_id || undefined,
          current_place_id: formValues.current_place_id || undefined,
          current_borrower_id: formValues.current_borrower_id || undefined,
        },
      })

      toast({ title: "Inventargegenstand wurde erstellt" })
      navigate(`/inventory/${item.id}`)
    } catch (error) {
      notifyApiError(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Neuer Gegenstand</h1>
        <p className="text-sm text-muted-foreground">Einen neuen Inventargegenstand anlegen.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gegenstandsdaten</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={formValues.name}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, name: e.target.value }))}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label>Inventarnummer</Label>
                <Input
                  value={formValues.inventory_no}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, inventory_no: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Beschreibung</Label>
              <Textarea
                value={formValues.description}
                onChange={(e) =>
                  setFormValues((prev) => ({ ...prev, description: e.target.value }))
                }
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Abteilung *</Label>
                <Select
                  value={formValues.department_id}
                  onValueChange={(value) =>
                    setFormValues((prev) => ({ ...prev, department_id: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Abteilung auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {(masterQuery.data?.departments ?? []).map((dept) => (
                      <SelectItem key={String(dept.id)} value={String(dept.id)}>
                        {getLabel(dept)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.department_id && (
                  <p className="text-xs text-destructive">{errors.department_id}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Gruppe *</Label>
                <Select
                  value={formValues.group_id}
                  onValueChange={(value) => setFormValues((prev) => ({ ...prev, group_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Gruppe auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {(masterQuery.data?.groups ?? []).map((group) => (
                      <SelectItem key={String(group.id)} value={String(group.id)}>
                        {getLabel(group)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.group_id && <p className="text-xs text-destructive">{errors.group_id}</p>}
              </div>

              <div className="space-y-2">
                <Label>Fach</Label>
                <Select
                  value={formValues.subject_id}
                  onValueChange={(value) =>
                    setFormValues((prev) => ({ ...prev, subject_id: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Fach auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {(masterQuery.data?.subjects ?? []).map((subject) => (
                      <SelectItem key={String(subject.id)} value={String(subject.id)}>
                        {getLabel(subject)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status *</Label>
                <Select
                  value={formValues.status}
                  onValueChange={(value) => setFormValues((prev) => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {(masterQuery.data?.statuses ?? []).map((status) => (
                      <SelectItem key={String(status.id)} value={String(status.id)}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.status && <p className="text-xs text-destructive">{errors.status}</p>}
              </div>

              <div className="space-y-2">
                <Label>Verantwortlich *</Label>
                <Select
                  value={formValues.current_responsible_id}
                  onValueChange={(value) =>
                    setFormValues((prev) => ({ ...prev, current_responsible_id: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Verantwortliche Person auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {(masterQuery.data?.users ?? []).map((user) => (
                      <SelectItem key={user.id} value={String(user.id)}>
                        {getUserLabel(user)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.current_responsible_id && (
                  <p className="text-xs text-destructive">{errors.current_responsible_id}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Ort</Label>
                <Select
                  value={formValues.current_place_id}
                  onValueChange={(value) =>
                    setFormValues((prev) => ({ ...prev, current_place_id: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ort auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {(masterQuery.data?.places ?? []).map((place) => (
                      <SelectItem key={String(place.id)} value={String(place.id)}>
                        {getLabel(place)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Entleiher</Label>
                <Select
                  value={formValues.current_borrower_id}
                  onValueChange={(value) =>
                    setFormValues((prev) => ({ ...prev, current_borrower_id: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Entleiher auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {(masterQuery.data?.users ?? []).map((user) => (
                      <SelectItem key={user.id} value={String(user.id)}>
                        {getUserLabel(user)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Speichert..." : "Gegenstand anlegen"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
