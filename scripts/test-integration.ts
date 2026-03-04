
const BASE_URL = 'http://localhost:3000/api/test/execute'

async function callApi(action: string, payload?: any) {
    const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload })
    })
    if (!res.ok) {
        const text = await res.text()
        throw new Error(`API Error (${res.status}): ${text}`)
    }
    return res.json()
}

async function main() {
    console.log('--- Starting API Integration Test ---')

    // 1. Setup - Get IDs
    console.log('1. Fetching IDs...')
    const setup = await callApi('setup')
    console.log('   IDs:', setup)

    if (!setup.deptId || !setup.requesterId || !setup.techId) {
        throw new Error('Missing seed data. Please seed DB.')
    }

    // 2. Create Ticket
    console.log('2. Creating Ticket...')
    const createTitle = `Integration Test Ticket ${Date.now()}`
    await callApi('create', {
        title: createTitle,
        description: 'Testing via API Gateway',
        departmentId: setup.deptId,
        priority: 'URGENT',
        requesterId: setup.requesterId
    })
    console.log('   Ticket Created')

    // 3. Find Ticket
    console.log('3. Finding Ticket...')
    const ticket = await callApi('find-ticket-by-title', { title: createTitle })
    if (!ticket) throw new Error('Ticket not found')
    console.log(`   Ticket Found: ID=${ticket.id}, Status=${ticket.status}`)

    // 4. Assign Ticket
    console.log('4. Assigning Ticket...')
    await callApi('assign', {
        ticketId: ticket.id,
        technicianId: setup.techId,
        priority: 'URGENT'
    })

    // Verify assignment
    const assignedTicket = await callApi('get-ticket', { ticketId: ticket.id })
    console.log(`   Status: ${assignedTicket.status}`)
    if (assignedTicket.status !== 'ASSIGNED') throw new Error('Assignment failed')


    // 5. Request OTP
    console.log('5. Requesting OTP...')
    await callApi('request-otp', { ticketId: ticket.id })

    // Get OTP
    const otpTicket = await callApi('get-ticket', { ticketId: ticket.id })
    console.log(`   Status: ${otpTicket.status}, OTP: ${otpTicket.otp}`)
    if (otpTicket.status !== 'RESOLVED' || !otpTicket.otp) throw new Error('OTP generation failed')


    // 6. Verify OTP
    console.log('6. Verifying OTP...')
    const verifyRes = await callApi('verify-otp', {
        ticketId: ticket.id,
        otp: otpTicket.otp
    })

    if (verifyRes.error) throw new Error(`Verification failed: ${verifyRes.error}`)

    // Final Check
    const closedTicket = await callApi('get-ticket', { ticketId: ticket.id })
    console.log(`   Final Status: ${closedTicket.status}`)

    if (closedTicket.status === 'CLOSED') {
        console.log('--- TEST PASSED SUCCESSFULLY ---')
    } else {
        throw new Error('Ticket not CLOSED')
    }
}

main().catch(console.error)
