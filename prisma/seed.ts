import { PrismaClient, Role } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
    const hashedPassword = await bcrypt.hash('password123', 10)

    // Create Departments
    const electrical = await prisma.department.upsert({
        where: { name: 'Electrical' },
        update: {},
        create: { name: 'Electrical' },
    })

    const it = await prisma.department.upsert({
        where: { name: 'IT' },
        update: {},
        create: { name: 'IT' },
    })

    // Create Users
    // Super Admin
    await prisma.user.upsert({
        where: { email: '2023csb1147@iitrpr.ac.in' },
        update: {},
        create: {
            email: '2023csb1147@iitrpr.ac.in',
            name: 'Super Admin',
            password: hashedPassword,
            role: Role.SUPER_ADMIN,
        },
    })

    // Dept Manager (Electrical)
    await prisma.user.upsert({
        where: { email: 'manager@electrical.com' },
        update: {},
        create: {
            email: 'manager@electrical.com',
            name: 'Electrical Manager',
            password: hashedPassword,
            role: Role.DEPT_ADMIN,
            departmentId: electrical.id,
        },
    })

    // Technician (Electrical)
    await prisma.user.upsert({
        where: { email: 'tech@electrical.com' },
        update: {},
        create: {
            email: 'tech@electrical.com',
            name: 'Tech Rahul',
            password: hashedPassword,
            role: Role.TECHNICIAN,
            departmentId: electrical.id,
        },
    })

    // Requester
    await prisma.user.upsert({
        where: { email: 'user@university.com' },
        update: {},
        create: {
            email: 'user@university.com',
            name: 'Student User',
            password: hashedPassword,
            role: Role.REQUESTER,
        },
    })

    console.log('Seeding completed.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
