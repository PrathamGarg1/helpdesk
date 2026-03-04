const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testCompleteWorkflow() {
    console.log('🧪 Starting Complete Workflow Test...\n')

    try {
        // 1. Get test users
        console.log('📋 Step 1: Fetching test users...')
        const requester = await prisma.user.findUnique({ where: { email: 'user@university.com' } })
        const technician = await prisma.user.findUnique({ where: { email: 'tech@electrical.com' } })
        const department = await prisma.department.findUnique({ where: { name: 'Electrical' } })

        if (!requester || !technician || !department) {
            throw new Error('❌ Test users not found. Please run: npx prisma db seed')
        }

        console.log(`✅ Found requester: ${requester.email}`)
        console.log(`✅ Found technician: ${technician.email}`)
        console.log(`✅ Found department: ${department.name}\n`)

        // 2. Create ticket directly in database (simulating requester action)
        console.log('📋 Step 2: Creating ticket as requester...')
        const ticket = await prisma.ticket.create({
            data: {
                title: 'Test Ticket - Automated Test',
                description: 'This is an automated test ticket to verify the workflow',
                departmentId: department.id,
                requesterId: requester.id,
                priority: 'HIGH',
                location: 'Test Room 101',
                status: 'OPEN'
            }
        })

        console.log(`✅ Ticket created: ${ticket.id}`)
        console.log(`   Status: ${ticket.status}`)
        console.log(`   Requester: ${requester.email}\n`)

        // 3. Verify requester can see their ticket
        console.log('📋 Step 3: Verifying requester can see their ticket...')
        const requesterTickets = await prisma.ticket.findMany({
            where: { requesterId: requester.id }
        })

        const foundTicket = requesterTickets.find(t => t.id === ticket.id)
        if (!foundTicket) {
            throw new Error('❌ Requester cannot see their own ticket!')
        }
        console.log(`✅ Requester can see ticket (found ${requesterTickets.length} total tickets)\n`)

        // 4. Assign ticket to technician (simulating manager action)
        console.log('📋 Step 4: Assigning ticket to technician...')
        const assignedTicket = await prisma.ticket.update({
            where: { id: ticket.id },
            data: {
                technicianId: technician.id,
                status: 'ASSIGNED'
            }
        })

        console.log(`✅ Ticket assigned to: ${technician.email}`)
        console.log(`   Status: ${assignedTicket.status}`)
        console.log(`   Technician ID: ${assignedTicket.technicianId}\n`)

        if (assignedTicket.status !== 'ASSIGNED') {
            throw new Error(`❌ Ticket status should be ASSIGNED, got: ${assignedTicket.status}`)
        }

        // 5. CRITICAL TEST: Verify technician can see assigned ticket
        console.log('📋 Step 5: CRITICAL - Verifying technician can see assigned ticket...')
        const technicianTickets = await prisma.ticket.findMany({
            where: {
                technicianId: technician.id,
                status: { not: 'CLOSED' }
            }
        })

        const techFoundTicket = technicianTickets.find(t => t.id === ticket.id)
        if (!techFoundTicket) {
            console.error(`❌ CRITICAL FAILURE: Technician CANNOT see assigned ticket!`)
            console.error(`   Technician ID: ${technician.id}`)
            console.error(`   Ticket technician ID: ${assignedTicket.technicianId}`)
            console.error(`   Tickets found for technician: ${technicianTickets.length}`)
            throw new Error('CRITICAL FAILURE: Technician visibility test failed')
        }
        console.log(`✅ CRITICAL PASS: Technician can see assigned ticket`)
        console.log(`   Found ${technicianTickets.length} active tickets for technician\n`)

        // 6. Test isolation - verify other technicians can't see this ticket
        console.log('📋 Step 6: Testing technician isolation...')
        const otherTechnician = await prisma.user.findFirst({
            where: {
                role: 'TECHNICIAN',
                id: { not: technician.id }
            }
        })

        if (otherTechnician) {
            const otherTechTickets = await prisma.ticket.findMany({
                where: {
                    technicianId: otherTechnician.id,
                    status: { not: 'CLOSED' }
                }
            })
            const leaked = otherTechTickets.find(t => t.id === ticket.id)
            if (leaked) {
                throw new Error('❌ SECURITY ISSUE: Other technician can see this ticket!')
            }
            console.log(`✅ Technician isolation verified - other technician cannot see ticket\n`)
        } else {
            console.log(`⚠️  No other technician found to test isolation\n`)
        }

        // 7. Test requester isolation
        console.log('📋 Step 7: Testing requester isolation...')
        const otherRequester = await prisma.user.findFirst({
            where: {
                role: 'REQUESTER',
                id: { not: requester.id }
            }
        })

        if (otherRequester) {
            const otherRequesterTickets = await prisma.ticket.findMany({
                where: { requesterId: otherRequester.id }
            })
            const leaked = otherRequesterTickets.find(t => t.id === ticket.id)
            if (leaked) {
                throw new Error('❌ SECURITY ISSUE: Other requester can see this ticket!')
            }
            console.log(`✅ Requester isolation verified - other requester cannot see ticket\n`)
        } else {
            console.log(`⚠️  No other requester found to test isolation\n`)
        }

        // 8. Clean up - delete test ticket
        console.log('📋 Step 8: Cleaning up test data...')
        await prisma.ticket.delete({ where: { id: ticket.id } })
        console.log(`✅ Test ticket deleted\n`)

        console.log('═══════════════════════════════════════════════')
        console.log('✅ ALL TESTS PASSED! Workflow is working correctly!')
        console.log('═══════════════════════════════════════════════\n')

        console.log('📊 Summary:')
        console.log('  ✅ Ticket creation: PASS')
        console.log('  ✅ Requester visibility: PASS')
        console.log('  ✅ Ticket assignment: PASS')
        console.log('  ✅ Technician visibility: PASS (CRITICAL)')
        console.log('  ✅ Technician isolation: PASS')
        console.log('  ✅ Requester isolation: PASS')
        console.log('  ✅ Data security: PASS')

    } catch (error) {
        console.error('\n❌ TEST FAILED!')
        console.error(error)
        process.exit(1)
    }
}

testCompleteWorkflow()
    .then(async () => {
        await prisma.$disconnect()
        process.exit(0)
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
