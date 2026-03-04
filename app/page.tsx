import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function Home() {
  const session = await auth()

  // If not authenticated, redirect to login
  if (!session?.user) {
    redirect('/login')
  }

  // If authenticated, redirect to role-specific dashboard
  const role = session.user.role

  if (role === 'SUPER_ADMIN') {
    redirect('/admin')
  } else if (role === 'DEPT_ADMIN') {
    redirect('/manager')
  } else if (role === 'TECHNICIAN') {
    redirect('/technician')
  } else {
    // Default to requester for REQUESTER role or any other role
    redirect('/requester')
  }
}
