
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
    const session = await auth()
    if (!session?.user || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'DEPT_ADMIN')) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const tickets = await prisma.ticket.findMany({
        include: {
            requester: true,
            technician: true,
            department: true
        },
        orderBy: { createdAt: 'desc' }
    })

    const csvHeader = 'ID,UUID,Title,Status,Priority,Department,Requester,Technician,Created At\n'
    const csvRows = tickets.map(t => {
        const clean = (str: string | null) => str ? `"${str.replace(/"/g, '""')}"` : ''
        return [
            t.id,
            t.uuid,
            clean(t.title),
            t.status,
            t.priority,
            clean(t.department.name),
            clean(t.requester.name),
            clean(t.technician?.name || 'Unassigned'),
            t.createdAt.toISOString()
        ].join(',')
    })

    const csvContent = csvHeader + csvRows.join('\n')

    return new NextResponse(csvContent, {
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="tickets-export-${new Date().toISOString().split('T')[0]}.csv"`
        }
    })
}
