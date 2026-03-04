import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User } from '@prisma/client'
import { UserCheck, UserX, Activity } from 'lucide-react'

interface TechnicianWithCount extends User {
    _count: {
        assignedTickets: number
    }
}

export function TechnicianGrid({ technicians }: { technicians: TechnicianWithCount[] }) {
    if (!technicians || technicians.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
                        <UserX className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No Technicians</h3>
                    <p className="text-sm text-muted-foreground">
                        Add technicians to start assigning tickets.
                    </p>
                </CardContent>
            </Card>
        )
    }

    const getWorkloadStatus = (count: number) => {
        if (count === 0) return { label: 'Available', variant: 'outline' as const, color: 'bg-green-500' }
        if (count < 3) return { label: 'Light', variant: 'secondary' as const, color: 'bg-green-500' }
        if (count < 5) return { label: 'Moderate', variant: 'default' as const, color: 'bg-yellow-500' }
        return { label: 'Heavy', variant: 'destructive' as const, color: 'bg-red-500' }
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {technicians.map((tech) => {
                const status = getWorkloadStatus(tech._count.assignedTickets)
                const workloadPercentage = Math.min((tech._count.assignedTickets / 10) * 100, 100)

                return (
                    <Card key={tech.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium truncate">
                                {tech.name}
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                <div className={`h-2 w-2 rounded-full ${status.color} animate-pulse`} />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-baseline justify-between">
                                <div className="text-2xl font-bold">{tech._count.assignedTickets}</div>
                                <Badge variant={status.variant} className="text-xs">
                                    {status.label}
                                </Badge>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>Workload</span>
                                    <span>{workloadPercentage.toFixed(0)}%</span>
                                </div>
                                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${status.color} transition-all duration-300`}
                                        style={{ width: `${workloadPercentage}%` }}
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Activity className="h-3 w-3" />
                                Active Tickets
                            </p>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
