'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { auth } from '@/auth'

const TechSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
})

export async function createTechnician(prevState: any, formData: FormData) {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== 'DEPT_ADMIN') {
        return { error: 'Unauthorized' }
    }

    // Find Manager's Department
    const manager = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { managedDepartment: true }
    })

    if (!manager?.managedDepartment) {
        return { error: 'You do not manage any department.' }
    }

    const deptId = manager.managedDepartment.id

    const data = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
    }

    const validated = TechSchema.safeParse(data)
    if (!validated.success) {
        return { error: 'Invalid data' }
    }

    try {
        const existing = await prisma.user.findUnique({ where: { email: data.email } })
        if (existing) return { error: 'User already exists.' }

        await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                role: 'TECHNICIAN',
                departmentId: deptId,
                password: 'otp-only',
            }
        })

        revalidatePath('/manager/technicians')
        revalidatePath('/manager')
        return { success: true, message: 'Technician added.' }
    } catch (e) {
        return { error: 'Failed to create technician.' }
    }
}
