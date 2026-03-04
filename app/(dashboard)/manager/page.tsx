import { prisma } from '@/lib/prisma'
import { TriageTable } from '@/components/triage-table'
import { TechnicianGrid } from '@/components/technician-grid'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, Users, Inbox, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default async function ManagerPage() {
    let openTickets: any[] = []
    let technicians: any[] = []
    let error = null

    try {
        openTickets = await prisma.ticket.findMany({
            where: { status: 'OPEN' },
            include: {
                requester: true,
                department: true,
                technician: true
            },
            orderBy: { createdAt: 'asc' }
        })

        technicians = await prisma.user.findMany({
            where: { role: 'TECHNICIAN' },
            include: {
                _count: {
                    select: { assignedTickets: { where: { status: { not: 'CLOSED' } } } }
                }
            }
        })
    } catch (e) {
        console.error("DB Error", e)
        error = "Failed to load dashboard data. Check database connection."
    }

    // Calculate stats
    const totalTechnicians = technicians.length
    const activeTechnicians = technicians.filter(t => (t._count as any).assignedTickets > 0).length
    const totalOpenTickets = openTickets.length
    const urgentTickets = openTickets.filter(t => t.priority === 'URGENT').length

    return (
        <div className="flex-1 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Department Dashboard</h2>
                    <p className="text-muted-foreground">
                        Manage tickets and technician assignments
                    </p>
                </div>
                <Link href="/manager/technicians">
                    <Button>
                        <Users className="mr-2 h-4 w-4" />
                        Manage Technicians
                    </Button>
                </Link>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Open Tickets
                        </CardTitle>
                        <Inbox className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalOpenTickets}</div>
                        <p className="text-xs text-muted-foreground">
                            Awaiting assignment
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Urgent Tickets
                        </CardTitle>
                        <AlertCircle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{urgentTickets}</div>
                        <p className="text-xs text-muted-foreground">
                            Require immediate attention
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Technicians
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalTechnicians}</div>
                        <p className="text-xs text-muted-foreground">
                            {activeTechnicians} currently active
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Avg. Response Time
                        </CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">~2h</div>
                        <p className="text-xs text-muted-foreground">
                            Last 7 days
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content with Tabs */}
            <Tabs defaultValue="triage" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="triage">
                        <Inbox className="mr-2 h-4 w-4" />
                        Triage Queue
                        {totalOpenTickets > 0 && (
                            <Badge variant="destructive" className="ml-2">
                                {totalOpenTickets}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="technicians">
                        <Users className="mr-2 h-4 w-4" />
                        Technician Status
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="triage" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Unassigned Tickets</CardTitle>
                            <CardDescription>
                                Assign tickets to available technicians
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <TriageTable tickets={openTickets} technicians={technicians} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="technicians" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Technician Workload</CardTitle>
                            <CardDescription>
                                Live tracking of technician assignments
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <TechnicianGrid technicians={technicians} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
