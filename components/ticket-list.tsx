'use client'

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Ticket, Department, User } from '@prisma/client'
import { format } from 'date-fns'
import { TicketSheet } from '@/components/ticket-sheet'

interface TicketListProps {
    tickets: (Ticket & { department: Department, requester: User, technician?: User | null })[] | null
}

export function TicketList({ tickets }: TicketListProps) {
    if (!tickets || tickets.length === 0) {
        return (
            <div className="rounded-md border bg-card">
                <div className="flex flex-col items-center justify-center p-12 text-center">
                    <div className="text-6xl mb-4">🎫</div>
                    <h3 className="text-lg font-semibold mb-2">No Tickets Yet</h3>
                    <p className="text-sm text-muted-foreground">
                        Create your first ticket to get started with the system.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[100px]">ID</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead className="text-right">Created At</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tickets.map((ticket) => (
                        <TicketSheet key={ticket.id} ticket={ticket}>
                            <TableRow className="cursor-pointer hover:bg-muted/50">
                                <TableCell className="font-medium">{ticket.uuid || ticket.id.slice(-4)}</TableCell>
                                <TableCell>{ticket.title}</TableCell>
                                <TableCell>{ticket.department.name}</TableCell>
                                <TableCell>
                                    <Badge variant={ticket.status === 'OPEN' ? 'destructive' : 'secondary'}>
                                        {ticket.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>{ticket.priority}</TableCell>
                                <TableCell className="text-right">
                                    {format(new Date(ticket.createdAt), 'MMM d, yyyy')}
                                </TableCell>
                            </TableRow>
                        </TicketSheet>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
