
import { NextResponse } from 'next/server'
import { createTicket, assignTicket, requestOTP, verifyOTP } from '@/actions/tickets'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    const body = await request.json()
    const { action, payload } = body

    try {
        let result;

        if (action === 'setup') {
            // Helper to get IDs
            const dept = await prisma.department.findUnique({ where: { name: 'Electrical' } })
            const requester = await prisma.user.findUnique({ where: { email: 'user@university.com' } })
            const tech = await prisma.user.findUnique({ where: { email: 'tech@electrical.com' } })
            return NextResponse.json({ deptId: dept?.id, requesterId: requester?.id, techId: tech?.id })
        }

        if (action === 'create') {
            const formData = new FormData()
            Object.entries(payload).forEach(([k, v]) => formData.append(k, v as string))
            result = await createTicket({}, formData)
        }

        else if (action === 'assign') {
            result = await assignTicket(payload.ticketId, payload.technicianId)
        }

        else if (action === 'request-otp') {
            result = await requestOTP(payload.ticketId)
        }

        else if (action === 'verify-otp') {
            result = await verifyOTP(payload.ticketId, payload.otp)
        }

        else if (action === 'get-ticket') {
            result = await prisma.ticket.findUnique({
                where: { id: payload.ticketId }
            })
        }

        else if (action === 'find-ticket-by-title') {
            result = await prisma.ticket.findFirst({
                where: { title: payload.title },
                orderBy: { createdAt: 'desc' }
            })
        }

        else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }

        return NextResponse.json(result)

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
