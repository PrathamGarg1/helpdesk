'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { Role } from '@prisma/client'

const UserSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    role: z.nativeEnum(Role),
    departmentId: z.string().optional(),
})

export async function createUser(prevState: any, formData: FormData) {
    const data = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        role: formData.get('role') as Role,
        departmentId: formData.get('departmentId') as string || undefined,
    }

    const validated = UserSchema.safeParse(data)
    if (!validated.success) {
        return { error: 'Invalid data', details: validated.error.flatten() }
    }

    try {
        const existing = await prisma.user.findUnique({ where: { email: data.email } })
        if (existing) return { error: 'User already exists with this email.' }

        await prisma.user.create({
            data: {
                ...validated.data,
                password: 'otp-only-account', // Placeholder, not used
            }
        })

        revalidatePath('/admin/users')
        return { success: true, message: 'User created successfully.' }
    } catch (e) {
        console.error(e)
        return { error: 'Failed to create user.' }
    }
}

export async function importUsers(users: any[]) {
    // Bulk create users from parsed CSV data
    let successCount = 0
    let errors: string[] = []

    for (const user of users) {
        const validated = UserSchema.safeParse(user)
        if (!validated.success) {
            errors.push(`Invalid data for ${user.email || 'unknown flow'}`)
            continue
        }

        try {
            await prisma.user.upsert({
                where: { email: validated.data.email },
                update: { ...validated.data },
                create: {
                    ...validated.data,
                    password: 'otp-only-account'
                }
            })
            successCount++
        } catch (e) {
            errors.push(`Failed to save ${user.email}`)
        }
    }

    revalidatePath('/admin/users')
    return { successCount, errors }
}

export async function createDepartment(prevState: any, formData: FormData) {
    const name = (formData.get('name') as string)?.trim()

    if (!name || name.length < 2) {
        return { error: 'Department name must be at least 2 characters.' }
    }

    try {
        const existing = await prisma.department.findUnique({ where: { name } })
        if (existing) return { error: `Department "${name}" already exists.` }

        await prisma.department.create({ data: { name } })

        revalidatePath('/admin')
        revalidatePath('/admin/users')
        return { success: true, message: `Department "${name}" created successfully.` }
    } catch (e) {
        console.error(e)
        return { error: 'Failed to create department.' }
    }
}

export async function deleteDepartment(id: string) {
    try {
        // Check if department has any tickets or users assigned
        const dept = await prisma.department.findUnique({
            where: { id },
            include: {
                _count: { select: { tickets: true, users: true } }
            }
        })

        if (!dept) return { error: 'Department not found.' }
        if (dept._count.tickets > 0) return { error: `Cannot delete: department has ${dept._count.tickets} ticket(s).` }
        if (dept._count.users > 0) return { error: `Cannot delete: department has ${dept._count.users} user(s) assigned.` }

        await prisma.department.delete({ where: { id } })

        revalidatePath('/admin')
        revalidatePath('/admin/users')
        return { success: true }
    } catch (e) {
        console.error(e)
        return { error: 'Failed to delete department.' }
    }
}

