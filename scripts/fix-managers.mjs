import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixManagers() {
    // Find all DEPT_ADMIN users who have a departmentId
    const admins = await prisma.user.findMany({
        where: { role: 'DEPT_ADMIN', departmentId: { not: null } }
    })

    console.log(`Found ${admins.length} DEPT_ADMIN user(s):`)
    for (const admin of admins) {
        console.log(`  - ${admin.email} (departmentId: ${admin.departmentId})`)
    }

    for (const admin of admins) {
        const dept = await prisma.department.findUnique({ where: { id: admin.departmentId } })
        if (!dept) {
            console.log(`  Department ${admin.departmentId} not found, skipping.`)
            continue
        }

        if (!dept.managerId) {
            await prisma.department.update({
                where: { id: dept.id },
                data: { managerId: admin.id }
            })
            console.log(`  ✅ Fixed: set managerId=${admin.id} for department "${dept.name}"`)
        } else if (dept.managerId === admin.id) {
            console.log(`  ✓ Already correct for department "${dept.name}"`)
        } else {
            console.log(`  ⚠️  Department "${dept.name}" already has a different manager (${dept.managerId}), skipping.`)
        }
    }

    await prisma.$disconnect()
    console.log('Done.')
}

fixManagers().catch(e => {
    console.error(e)
    process.exit(1)
})
