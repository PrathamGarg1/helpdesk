
import { prisma } from '@/lib/prisma'
import { UserTable } from '@/components/admin/user-table'
import { AddUserDialog } from '@/components/admin/add-user-dialog'
import { CsvImport } from '@/components/admin/csv-import'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function UserManagementPage() {
    const users = await prisma.user.findMany({
        include: { department: true },
        orderBy: { createdAt: 'desc' },
    })

    const departments = await prisma.department.findMany()

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
                <AddUserDialog departments={departments} />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>All Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <UserTable users={users} />
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Bulk Import</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CsvImport />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
