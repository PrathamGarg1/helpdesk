'use server'

import { prisma } from '@/lib/prisma'

export async function getAuditLogsForTicket(ticketId: string) {
    const logs = await prisma.auditLog.findMany({
        where: { ticketId },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' }
    })
    return logs
}
