'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createDepartment, deleteDepartment } from '@/actions/admin'
import { Loader2, Plus, Trash2, Building2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

type Department = {
    id: string
    name: string
    _count?: { users: number; tickets: number }
}

export function DepartmentManager({ departments }: { departments: Department[] }) {
    const [open, setOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [deleteError, setDeleteError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()
    const [deletingId, setDeletingId] = useState<string | null>(null)

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setError(null)
        setSuccess(null)
        const formData = new FormData(event.currentTarget)

        startTransition(async () => {
            const res = await createDepartment(null, formData)
            if (res?.error) {
                setError(res.error)
            } else {
                setSuccess(res?.message ?? 'Department created.')
                ;(event.target as HTMLFormElement).reset()
            }
        })
    }

    async function onDelete(id: string) {
        setDeleteError(null)
        setDeletingId(id)
        const res = await deleteDepartment(id)
        setDeletingId(null)
        if (res?.error) {
            setDeleteError(res.error)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); setError(null); setSuccess(null); setDeleteError(null) }}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Building2 className="mr-2 h-4 w-4" />
                    Manage Departments
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>Departments</DialogTitle>
                    <DialogDescription>
                        Create or remove departments. Departments with assigned users or tickets cannot be deleted.
                    </DialogDescription>
                </DialogHeader>

                {/* Existing departments list */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                    {departments.length === 0 && (
                        <p className="text-sm text-muted-foreground">No departments yet.</p>
                    )}
                    {departments.map(dept => (
                        <div key={dept.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{dept.name}</span>
                                {dept._count && (
                                    <Badge variant="secondary" className="text-xs">
                                        {dept._count.users} users · {dept._count.tickets} tickets
                                    </Badge>
                                )}
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => onDelete(dept.id)}
                                disabled={deletingId === dept.id}
                            >
                                {deletingId === dept.id
                                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    : <Trash2 className="h-3.5 w-3.5" />
                                }
                            </Button>
                        </div>
                    ))}
                </div>

                {deleteError && (
                    <Alert variant="destructive" className="py-2">
                        <AlertDescription className="text-sm">{deleteError}</AlertDescription>
                    </Alert>
                )}

                {/* Create new department */}
                <form onSubmit={onSubmit} className="space-y-3 border-t pt-4">
                    <Label htmlFor="dept-name" className="text-sm font-medium">Add New Department</Label>
                    <div className="flex gap-2">
                        <Input
                            id="dept-name"
                            name="name"
                            placeholder="e.g. Civil, Mechanical, Library..."
                            className="flex-1"
                            required
                        />
                        <Button type="submit" disabled={isPending} className="shrink-0">
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        </Button>
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}
                    {success && <p className="text-sm text-green-600">{success}</p>}
                </form>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
