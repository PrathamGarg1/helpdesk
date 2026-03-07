import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const email = 'gargpratham108@gmail.com'

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
        console.error(`User ${email} not found.`)
        process.exit(1)
    }

    if (!user.departmentId) {
        console.error(`User ${email} has no departmentId set.`)
        process.exit(1)
    }

    const dept = await prisma.department.findUnique({ where: { id: user.departmentId } })
    console.log(`Setting manager of "${dept?.name}" to ${email} (id: ${user.id})`)

    await prisma.department.update({
        where: { id: user.departmentId },
        data: { managerId: user.id }
    })

    console.log('Done ✅')
    await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
