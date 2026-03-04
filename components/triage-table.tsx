'use client'

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { assignTicket } from '@/actions/tickets'
import { useState } from 'react'
import { TicketSheet } from '@/components/ticket-sheet'
import { User, Ticket, Department } from '@prisma/client'
import { AlertTriangle, ArrowUp, Eye, UserPlus } from 'lucide-react'

interface TriageTableProps {
    tickets: (Ticket & { requester: User, department: Department, technician: User | null })[]
    technicians: User[]
}

export function TriageTable({ tickets, technicians }: TriageTableProps) {
    const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({})

    const handleAssign = async (ticketId: string, techId: string) => {
        setLoadingMap(prev => ({ ...prev, [ticketId]: true }))
        await assignTicket(ticketId, techId)
        setLoadingMap(prev => ({ ...prev, [ticketId]: false }))
    }

    if (tickets.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
                        <svg className="h-10 w-10 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">All Clear!</h3>
                    <p className="text-sm text-muted-foreground">
                        No tickets in the triage queue. All tickets have been assigned.
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[100px]">ID</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Requester</TableHead>
                        <TableHead className="w-[120px]">Priority</TableHead>
                        <TableHead className="w-[100px]">Details</TableHead>
                        <TableHead className="w-[200px]">Assign To</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tickets.map((ticket) => (
                        <TableRow key={ticket.id} className="hover:bg-muted/50">
                            <TableCell className="font-mono text-xs">
                                #{ticket.uuid?.slice(0, 8) || ticket.id.slice(-8)}
                            </TableCell>
                            <TableCell className="font-medium max-w-[300px] truncate">
                                {ticket.title}
                            </TableCell>
                            <TableCell className="text-sm">
                                {ticket.requester.name}
                            </TableCell>
                            <TableCell>
                                {ticket.priority === 'URGENT' ? (
                                    <Badge variant="destructive" className="gap-1">
                                        <AlertTriangle className="h-3 w-3" />
                                        URGENT
                                    </Badge>
                                ) : ticket.priority === 'HIGH' ? (
                                    <Badge variant="default" className="gap-1">
                                        <ArrowUp className="h-3 w-3" />
                                        HIGH
                                    </Badge>
                                ) : (
                                    <Badge variant="outline">
                                        {ticket.priority}
                                    </Badge>
                                )}
                            </TableCell>
                            <TableCell>
                                <TicketSheet ticket={ticket}>
                                    <Button variant="ghost" size="sm" className="gap-2">
                                        <Eye className="h-4 w-4" />
                                        View
                                    </Button>
                                </TicketSheet>
                            </TableCell>
                            <TableCell>
                                <Select
                                    onValueChange={(val) => handleAssign(ticket.id, val)}
                                    disabled={loadingMap[ticket.id]}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder={
                                            loadingMap[ticket.id] ? "Assigning..." : "Select technician"
                                        } />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {technicians.map(t => (
                                            <SelectItem key={t.id} value={t.id}>
                                                <div className="flex items-center gap-2">
                                                    <UserPlus className="h-4 w-4" />
                                                    {t.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
