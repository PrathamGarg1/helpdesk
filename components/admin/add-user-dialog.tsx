'use client'

import { useState } from 'react'
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { createUser } from '@/actions/admin'
import { Loader2, Plus } from 'lucide-react'
import { Department } from '@prisma/client'

const ROLES_REQUIRING_DEPT = ['TECHNICIAN', 'DEPT_ADMIN']

export function AddUserDialog({ departments }: { departments: Department[] }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [selectedRole, setSelectedRole] = useState('REQUESTER')
    const [selectedDept, setSelectedDept] = useState('')

    const needsDept = ROLES_REQUIRING_DEPT.includes(selectedRole)

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)
        const formData = new FormData(event.currentTarget)

        // Department is required for TECHNICIAN / DEPT_ADMIN
        if (needsDept && !selectedDept) {
            alert('Please select a department for this role.')
            setLoading(false)
            return
        }

        // Inject the controlled dept value into FormData (native select may not pick it up)
        if (needsDept && selectedDept) {
            formData.set('departmentId', selectedDept)
        } else {
            // Make sure REQUESTER never sends a departmentId
            formData.delete('departmentId')
        }

        const res = await createUser(null, formData)
        setLoading(false)

        if (res?.error) {
            alert(res.error)
        } else {
            setOpen(false)
            setSelectedRole('REQUESTER')
            setSelectedDept('')
        }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => {
            setOpen(v)
            if (!v) { setSelectedRole('REQUESTER'); setSelectedDept('') }
        }}>
            <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" /> Add User</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>
                        Create a new user account. They will login via OTP.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit}>
                    <div className="grid gap-4 py-4">
                        {/* Name */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Name</Label>
                            <Input id="name" name="name" className="col-span-3" required />
                        </div>

                        {/* Email */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">Email</Label>
                            <Input id="email" name="email" type="email" className="col-span-3" required />
                        </div>

                        {/* Role */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="role" className="text-right">Role</Label>
                            <Select
                                name="role"
                                required
                                defaultValue="REQUESTER"
                                onValueChange={(val) => {
                                    setSelectedRole(val)
                                    setSelectedDept('')
                                }}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="REQUESTER">Requester</SelectItem>
                                    <SelectItem value="TECHNICIAN">Technician</SelectItem>
                                    <SelectItem value="DEPT_ADMIN">Dept Manager</SelectItem>
                                    <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Department — only shown for TECHNICIAN / DEPT_ADMIN */}
                        {needsDept && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="department" className="text-right">
                                    Dept <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                    value={selectedDept}
                                    onValueChange={setSelectedDept}
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {departments.map(d => (
                                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading || (needsDept && !selectedDept)}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create User
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
