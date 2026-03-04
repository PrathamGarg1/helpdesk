
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { AddTechnicianDialog } from '@/components/manager/add-technician-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export default async function TechnicianManagementPage() {
    const session = await auth()
    if (!session?.user?.id) return <div>Unauthorized</div>

    const manager = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { managedDepartment: true }
    })

    if (!manager?.managedDepartment) {
        return <div className="p-8">You are not assigned to manage any department.</div>
    }

    const technicians = await prisma.user.findMany({
        where: {
            departmentId: manager.managedDepartment.id,
            role: 'TECHNICIAN'
        },
        orderBy: { createdAt: 'desc' }
    })

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Manage Technicians</h2>
                <AddTechnicianDialog />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{manager.managedDepartment.name} Team</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Joined</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {technicians.map((tech) => (
                                <TableRow key={tech.id}>
                                    <TableCell className="font-medium">{tech.name}</TableCell>
                                    <TableCell>{tech.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={tech.loginOtp ? 'secondary' : 'outline'}>
                                            {tech.loginOtp ? 'Active' : 'Idle'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{tech.createdAt.toLocaleDateString()}</TableCell>
                                </TableRow>
                            ))}
                            {technicians.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                                        No technicians found. Add one to get started.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
