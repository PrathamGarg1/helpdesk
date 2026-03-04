import { prisma } from '@/lib/prisma'
import { TechnicianTasks } from '@/components/technician-tasks'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { Ticket, User } from '@prisma/client'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function TechnicianPage() {
    const session = await auth()

    // Ensure user is authenticated
    if (!session?.user?.id) {
        redirect('/login')
    }

    let tasks: (Ticket & { requester: User })[] = []
    let error = null

    try {
        // Fetch tickets assigned to the logged-in technician
        tasks = await prisma.ticket.findMany({
            where: {
                technicianId: session.user.id,
                status: { not: 'CLOSED' }
            },
            include: {
                requester: true,
                department: true,
                technician: true
            },
            orderBy: { priority: 'desc' }
        })
    } catch (e) {
        console.error("DB Error", e)
        error = "Database connection failed. Ensure database is connected."
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">My Assigned Tasks</h2>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <TechnicianTasks tickets={tasks as any} />
        </div>
    )
}
