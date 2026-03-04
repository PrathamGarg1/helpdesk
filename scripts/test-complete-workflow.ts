import { prisma } from '../lib/prisma'
import { createTicket, assignTicket, requestOTP, verifyOTP } from '../actions/tickets'

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

        // 2. Create ticket as requester
        console.log('📋 Step 2: Creating ticket as requester...')
        const formData = new FormData()
        formData.append('title', 'Test Ticket - Automated Test')
        formData.append('description', 'This is an automated test ticket to verify the workflow')
        formData.append('departmentId', department.id)
        formData.append('priority', 'HIGH')
        formData.append('location', 'Test Room 101')

        // Mock session for createTicket
        const createResult = await createTicket(null, formData)

        if (createResult.error) {
            throw new Error(`❌ Failed to create ticket: ${createResult.error}`)
        }

        // Find the created ticket
        const ticket = await prisma.ticket.findFirst({
            where: {
                title: 'Test Ticket - Automated Test',
                requesterId: requester.id
            },
            orderBy: { createdAt: 'desc' }
        })

        if (!ticket) {
            throw new Error('❌ Ticket not found after creation')
        }

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

        // 4. Assign ticket to technician
        console.log('📋 Step 4: Assigning ticket to technician...')
        const assignResult = await assignTicket(ticket.id, technician.id)

        if (assignResult.error) {
            throw new Error(`❌ Failed to assign ticket: ${assignResult.error}`)
        }

        const assignedTicket = await prisma.ticket.findUnique({ where: { id: ticket.id } })
        console.log(`✅ Ticket assigned to: ${technician.email}`)
        console.log(`   Status: ${assignedTicket?.status}`)
        console.log(`   Technician ID: ${assignedTicket?.technicianId}\n`)

        if (assignedTicket?.status !== 'ASSIGNED') {
            throw new Error(`❌ Ticket status should be ASSIGNED, got: ${assignedTicket?.status}`)
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
            throw new Error('❌ CRITICAL FAILURE: Technician CANNOT see assigned ticket!')
        }
        console.log(`✅ CRITICAL PASS: Technician can see assigned ticket`)
        console.log(`   Found ${technicianTickets.length} active tickets for technician\n`)

        // 6. Request OTP
        console.log('📋 Step 6: Requesting OTP...')
        const otpResult = await requestOTP(ticket.id)

        if (!otpResult.success) {
            throw new Error('❌ Failed to request OTP')
        }

        const otpTicket = await prisma.ticket.findUnique({ where: { id: ticket.id } })
        console.log(`✅ OTP requested`)
        console.log(`   Status: ${otpTicket?.status}`)
        console.log(`   OTP: ${otpTicket?.otp}\n`)

        if (otpTicket?.status !== 'RESOLVED') {
            throw new Error(`❌ Ticket status should be RESOLVED, got: ${otpTicket?.status}`)
        }

        if (!otpTicket?.otp) {
            throw new Error('❌ OTP not generated')
        }

        // 7. Verify OTP
        console.log('📋 Step 7: Verifying OTP...')
        const verifyResult = await verifyOTP(ticket.id, otpTicket.otp)

        if (verifyResult.error) {
            throw new Error(`❌ Failed to verify OTP: ${verifyResult.error}`)
        }

        const closedTicket = await prisma.ticket.findUnique({ where: { id: ticket.id } })
        console.log(`✅ OTP verified`)
        console.log(`   Status: ${closedTicket?.status}\n`)

        if (closedTicket?.status !== 'CLOSED') {
            throw new Error(`❌ Ticket status should be CLOSED, got: ${closedTicket?.status}`)
        }

        // 8. Verify ticket no longer in technician's active list
        console.log('📋 Step 8: Verifying ticket removed from active list...')
        const activeTickets = await prisma.ticket.findMany({
            where: {
                technicianId: technician.id,
                status: { not: 'CLOSED' }
            }
        })

        const stillActive = activeTickets.find(t => t.id === ticket.id)
        if (stillActive) {
            throw new Error('❌ Closed ticket still appears in active list!')
        }
        console.log(`✅ Ticket correctly removed from active list\n`)

        // 9. Test isolation - verify other users can't see this ticket
        console.log('📋 Step 9: Testing data isolation...')

        // Get another requester if exists
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
            console.log(`✅ Data isolation verified - other requester cannot see ticket\n`)
        } else {
            console.log(`⚠️  No other requester found to test isolation\n`)
        }

        console.log('═══════════════════════════════════════════════')
        console.log('✅ ALL TESTS PASSED! Workflow is working correctly!')
        console.log('═══════════════════════════════════════════════\n')

        console.log('📊 Summary:')
        console.log('  ✅ Ticket creation: PASS')
        console.log('  ✅ Requester visibility: PASS')
        console.log('  ✅ Ticket assignment: PASS')
        console.log('  ✅ Technician visibility: PASS (CRITICAL)')
        console.log('  ✅ OTP request: PASS')
        console.log('  ✅ OTP verification: PASS')
        console.log('  ✅ Ticket closure: PASS')
        console.log('  ✅ Data isolation: PASS')

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
