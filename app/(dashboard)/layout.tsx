import { SidebarNav } from '@/components/sidebar-nav'
import { UserNav } from '@/components/user-nav'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Ticket } from 'lucide-react'

interface DashboardLayoutProps {
    children: React.ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
    const session = await auth()

    if (!session?.user) {
        redirect('/login')
    }

    // Role-based navigation
    const getSidebarItems = (role?: string) => {
        switch (role) {
            case 'SUPER_ADMIN':
                return [
                    { title: "Dashboard", href: "/admin", icon: "LayoutDashboard" },
                    { title: "User Management", href: "/admin/users", icon: "Users" },
                ]
            case 'DEPT_MANAGER':
                return [
                    { title: "Dashboard", href: "/manager", icon: "LayoutDashboard" },
                    { title: "Triage Queue", href: "/manager", icon: "Inbox" },
                    { title: "Technicians", href: "/manager/technicians", icon: "Users" },
                ]
            case 'TECHNICIAN':
                return [
                    { title: "My Tasks", href: "/technician", icon: "CheckSquare" },
                ]
            case 'REQUESTER':
                return [
                    { title: "My Tickets", href: "/requester", icon: "Ticket" },
                ]
            default:
                return []
        }
    }

    const sidebarNavItems = getSidebarItems(session.user.role)

    return (
        <div className="flex min-h-screen flex-col">
            {/* Header with gradient */}
            <header className="sticky top-0 z-50 w-full border-b bg-gradient-to-r from-background via-background to-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <Ticket className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold">Ticket Management</h1>
                            <p className="text-xs text-muted-foreground">
                                {session.user.role === 'SUPER_ADMIN' && 'Admin Portal'}
                                {session.user.role === 'DEPT_MANAGER' && 'Manager Dashboard'}
                                {session.user.role === 'TECHNICIAN' && 'Technician Portal'}
                                {session.user.role === 'REQUESTER' && 'Requester Portal'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden md:block text-sm text-muted-foreground">
                            Welcome, <span className="font-medium text-foreground">{session.user.name}</span>
                        </div>
                        <UserNav user={session.user} />
                    </div>
                </div>
            </header>

            <div className="flex-1">
                <div className="flex-1 items-start md:flex md:gap-6 lg:gap-8 px-4 md:px-6 lg:px-8 py-6">
                    {/* Sidebar */}
                    {sidebarNavItems.length > 0 && (
                        <aside className="fixed top-20 z-30 hidden h-[calc(100vh-5rem)] w-[200px] shrink-0 md:sticky md:block lg:w-[220px]">
                            <div className="h-full rounded-lg border bg-card p-4">
                                <SidebarNav items={sidebarNavItems} />
                            </div>
                        </aside>
                    )}

                    {/* Main content */}
                    <main className="flex-1 w-full min-w-0">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    )
}
