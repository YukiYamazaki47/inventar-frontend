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
    if (!formValues.name) nextErrors.name = "Name is required"
    if (!formValues.department_id) nextErrors.department_id = "Department is required"
    if (!formValues.group_id) nextErrors.group_id = "Group is required"
    if (!formValues.status) nextErrors.status = "Status is required"
    if (!formValues.current_responsible_id) {
      nextErrors.current_responsible_id = "Responsible is required"
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

      toast({ title: "Item created" })
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
        <h1 className="text-xl font-semibold">New Item</h1>
        <p className="text-sm text-muted-foreground">Create a new inventory item.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Item details</CardTitle>
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
                <Label>Inventory No</Label>
                <Input
                  value={formValues.inventory_no}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, inventory_no: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formValues.description}
                onChange={(e) =>
                  setFormValues((prev) => ({ ...prev, description: e.target.value }))
                }
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Department *</Label>
                <Select
                  value={formValues.department_id}
                  onValueChange={(value) =>
                    setFormValues((prev) => ({ ...prev, department_id: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
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
                <Label>Group *</Label>
                <Select
                  value={formValues.group_id}
                  onValueChange={(value) => setFormValues((prev) => ({ ...prev, group_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select group" />
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
                <Label>Subject</Label>
                <Select
                  value={formValues.subject_id}
                  onValueChange={(value) =>
                    setFormValues((prev) => ({ ...prev, subject_id: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
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
                    <SelectValue placeholder="Select status" />
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
                <Label>Responsible *</Label>
                <Select
                  value={formValues.current_responsible_id}
                  onValueChange={(value) =>
                    setFormValues((prev) => ({ ...prev, current_responsible_id: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select responsible" />
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
                <Label>Place</Label>
                <Select
                  value={formValues.current_place_id}
                  onValueChange={(value) =>
                    setFormValues((prev) => ({ ...prev, current_place_id: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select place" />
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
                <Label>Borrower</Label>
                <Select
                  value={formValues.current_borrower_id}
                  onValueChange={(value) =>
                    setFormValues((prev) => ({ ...prev, current_borrower_id: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select borrower" />
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
                {isSubmitting ? "Saving..." : "Create Item"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
