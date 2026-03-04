'use client'

import { LogOut, User, Mail, Shield } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

interface UserNavProps {
    user: {
        name?: string | null
        email?: string | null
        role?: string | null
    }
}

export function UserNav({ user }: UserNavProps) {
    const router = useRouter()

    const handleLogout = async () => {
        await signOut({ redirect: false })
        router.push('/login')
    }

    const getInitials = (name?: string | null) => {
        if (!name) return 'U'
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    const getRoleBadgeVariant = (role?: string | null) => {
        switch (role) {
            case 'SUPER_ADMIN':
                return 'destructive'
            case 'DEPT_MANAGER':
                return 'default'
            case 'TECHNICIAN':
                return 'secondary'
            case 'REQUESTER':
                return 'outline'
            default:
                return 'outline'
        }
    }

    const getRoleLabel = (role?: string | null) => {
        switch (role) {
            case 'SUPER_ADMIN':
                return 'Admin'
            case 'DEPT_MANAGER':
                return 'Manager'
            case 'TECHNICIAN':
                return 'Technician'
            case 'REQUESTER':
                return 'Requester'
            default:
                return 'User'
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                            {getInitials(user.name)}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-2">
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm font-medium leading-none">
                                {user.name || 'User'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <p className="text-xs leading-none text-muted-foreground">
                                {user.email}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-muted-foreground" />
                            <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                                {getRoleLabel(user.role)}
                            </Badge>
                        </div>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive"
                    onClick={handleLogout}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
