import { prisma } from '@/lib/prisma'
import { DepartmentHeatmap } from '@/components/department-heatmap'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { DepartmentManager } from '@/components/admin/department-manager'

export default async function AdminPage() {
    let heatmapData: { name: string; tickets: number }[] = []
    let totalOpen = 0
    let totalClosed = 0
    let error = null

    try {
        const departments = await prisma.department.findMany({
            include: {
                _count: {
                    select: { tickets: { where: { status: { not: 'CLOSED' } } } }
                }
            }
        })

        heatmapData = departments.map(d => ({
            name: d.name,
            tickets: d._count.tickets
        }))

        totalOpen = await prisma.ticket.count({ where: { status: { not: 'CLOSED' } } })
        totalClosed = await prisma.ticket.count({ where: { status: 'CLOSED' } })

    } catch (e) {
        console.error("DB Error", e)
        error = "Failed to fetch admin data. Check DB connection."
    }

    // Fetch departments with counts for manager
    const allDepartments = await prisma.department.findMany({
        include: { _count: { select: { users: true, tickets: true } } },
        orderBy: { name: 'asc' },
    }).catch(() => [])

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">System Overview</h2>
                <div className="flex items-center space-x-2">
                    <DepartmentManager departments={allDepartments} />
                    <Link href="/api/export/tickets" target="_blank">
                        <Button variant="outline">Export CSV</Button>
                    </Link>
                    <Link href="/admin/users">
                        <Button>Manage Users</Button>
                    </Link>
                </div>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Active Issues</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalOpen}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Resolved</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalClosed}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4">
                    <DepartmentHeatmap data={heatmapData} />
                </div>
            </div>
        </div>
    )
}
