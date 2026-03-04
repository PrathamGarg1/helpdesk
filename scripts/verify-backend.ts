
import { createTicket, assignTicket, requestOTP, verifyOTP } from '../actions/index'
import { prisma } from '../lib/prisma'

async function main() {
    console.log('--- Starting Backend Verification ---')

    // 1. Create a Ticket
    console.log('1. Creating Ticket...')
    const dept = await prisma.department.findUnique({ where: { name: 'Electrical' } })
    if (!dept) throw new Error('Electrical department not found. Did you seed?')

    const requester = await prisma.user.findUnique({ where: { email: 'user@university.com' } })
    if (!requester) throw new Error('Requester not found')

    const formData = new FormData()
    formData.append('title', 'Test Ticket via Script')
    formData.append('description', 'Testing backend actions logic')
    formData.append('departmentId', dept.id)
    formData.append('priority', 'HIGH')
    formData.append('requesterId', requester.id)

    const createRes = await createTicket(null, formData)
    if (createRes.error) {
        console.error('Create failed:', createRes.error)
        process.exit(1)
    }
    console.log('   Ticket Created Successfully')

    // Get the created ticket
    const ticket = await prisma.ticket.findFirst({
        where: { title: 'Test Ticket via Script' },
        orderBy: { createdAt: 'desc' }
    })
    if (!ticket) throw new Error('Ticket not found in DB')
    console.log(`   Ticket ID: ${ticket.id}, Status: ${ticket.status}`)

    // 2. Assign Ticket
    console.log('2. Assigning Ticket...')
    const tech = await prisma.user.findUnique({ where: { email: 'tech@electrical.com' } })
    if (!tech) throw new Error('Technician not found')

    const assignRes = await assignTicket(ticket.id, tech.id)
    if (assignRes.error) {
        console.error('Assign failed:', assignRes.error)
        process.exit(1)
    }

    const assignedTicket = await prisma.ticket.findUnique({ where: { id: ticket.id } })
    console.log(`   Status: ${assignedTicket?.status}, Technician: ${assignedTicket?.technicianId}`)
    if (assignedTicket?.status !== 'ASSIGNED') throw new Error('Status should be ASSIGNED')


    // 3. Request OTP
    console.log('3. Requesting OTP...')
    const otpRes = await requestOTP(ticket.id)
    if (!otpRes.success) {
        console.error('OTP Request failed')
        process.exit(1)
    }

    const otpTicket = await prisma.ticket.findUnique({ where: { id: ticket.id } })
    console.log(`   Status: ${otpTicket?.status}, OTP: ${otpTicket?.otp}`)
    if (otpTicket?.status !== 'RESOLVED') throw new Error('Status should be RESOLVED')
    if (!otpTicket?.otp) throw new Error('OTP not generated')


    // 4. Verify OTP (Closure)
    console.log('4. Verifying OTP...')
    const verifyRes = await verifyOTP(ticket.id, otpTicket.otp)
    if (verifyRes.error) {
        console.error('Verification failed:', verifyRes.error)
        process.exit(1)
    }

    const closedTicket = await prisma.ticket.findUnique({ where: { id: ticket.id } })
    console.log(`   Status: ${closedTicket?.status}`)
    if (closedTicket?.status !== 'CLOSED') throw new Error('Status should be CLOSED')

    console.log('--- Verification Complete: SUCCESS ---')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
