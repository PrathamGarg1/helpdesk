import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const ticket = await prisma.ticket.findFirst({
            where: { otp: { not: null } },
            orderBy: { updatedAt: 'desc' },
            select: { otp: true, id: true }
        })

        return NextResponse.json({ otp: ticket?.otp, ticketId: ticket?.id })
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch OTP' }, { status: 500 })
    }
}
