import { prisma } from '@/lib/prisma'
import { TicketList } from '@/components/ticket-list'
import { CreateTicketDialog } from '@/components/create-ticket-dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function RequesterPage() {
    const session = await auth()

    // Ensure user is authenticated
    if (!session?.user?.id) {
        redirect('/login')
    }

    let tickets: any[] = []
    let departments: any[] = []
    let error: string | null = null

    try {
        // Fetch tickets created by the logged-in requester
        tickets = await prisma.ticket.findMany({
            where: { requesterId: session.user.id },
            include: {
                department: true,
                technician: true,
                requester: true
            },
            orderBy: { createdAt: 'desc' }
        })

        departments = await prisma.department.findMany()
    } catch (e) {
        console.error("DB Error", e)
        error = "Database connection failed. Please ensure database is connected."
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">My Tickets</h2>
                <div className="flex items-center space-x-2">
                    <CreateTicketDialog departments={departments} />
                </div>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <TicketList tickets={tickets} />
        </div>
    )
}
