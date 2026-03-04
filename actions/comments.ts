'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

export async function addComment(ticketId: string, text: string) {
    const session = await auth()
    if (!session?.user?.id) return { error: 'Unauthorized' }

    const userId = session.user.id
    if (!userId) return { error: 'User ID not found' }

    if (!text || text.trim().length === 0) return { error: 'Comment cannot be empty' }

    try {
        await prisma.comment.create({
            data: {
                text,
                ticketId,
                userId,
            }
        })

        revalidatePath('/dashboard')
        revalidatePath(`/tickets/${ticketId}`)
        return { success: true }
    } catch (e) {
        return { error: 'Failed to add comment' }
    }
}

export async function getComments(ticketId: string) {
    const comments = await prisma.comment.findMany({
        where: { ticketId },
        include: { user: { select: { name: true, role: true } } },
        orderBy: { createdAt: 'asc' }
    })
    return comments
}
