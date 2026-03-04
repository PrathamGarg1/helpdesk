'use client'

import { useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { requestOTP, verifyOTP } from '@/actions/tickets'
import { Ticket, User, Department } from '@prisma/client'
import { MapPin, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { TicketSheet } from '@/components/ticket-sheet'
import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet'

interface TechnicianTasksProps {
    tickets: (Ticket & { requester: User, department: Department, technician: User | null })[]
}

export function TechnicianTasks({ tickets }: TechnicianTasksProps) {
    const [otpInputs, setOtpInputs] = useState<Record<string, string>>({})
    const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({})

    const handleRequestOTP = async (ticketId: string) => {
        setLoadingMap(prev => ({ ...prev, [ticketId]: true }))
        try {
            await requestOTP(ticketId)
            alert("OTP sent to requester's email!")
        } catch (e) {
            alert("Failed to send OTP")
        }
        setLoadingMap(prev => ({ ...prev, [ticketId]: false }))
    }

    const handleVerify = async (ticketId: string) => {
        const code = otpInputs[ticketId]
        if (!code) return

        setLoadingMap(prev => ({ ...prev, [ticketId]: true }))
        const res = await verifyOTP(ticketId, code)
        setLoadingMap(prev => ({ ...prev, [ticketId]: false }))

        if (res?.error) {
            alert(res.error)
        } else {
            // Success
        }
    }

    if (tickets.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                    <div className="text-6xl mb-4">📋</div>
                    <h3 className="text-lg font-semibold mb-2">No Active Tasks</h3>
                    <p className="text-sm text-muted-foreground">
                        You don't have any assigned tickets at the moment. Check back later!
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            {tickets.map((ticket) => (
                <Card key={ticket.id} className="hover:border-primary transition-colors">
                    {/* Wrap Header and Content in Sheet Trigger for Details View */}
                    <TicketSheet ticket={ticket}>
                        <div className="cursor-pointer">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-lg">{ticket.title}</CardTitle>
                                        <div className="text-sm text-muted-foreground mt-1">
                                            #{ticket.uuid ? ticket.uuid.slice(0, 8) : ticket.id.slice(0, 8)} • {ticket.requester.name}
                                        </div>
                                    </div>
                                    <Badge variant={ticket.priority === 'URGENT' ? 'destructive' : 'outline'}>
                                        {ticket.priority}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pb-2">
                                <div className="space-y-2 text-sm">
                                    {ticket.location && (
                                        <div className="flex items-center text-muted-foreground">
                                            <MapPin className="mr-2 h-4 w-4" /> {ticket.location}
                                        </div>
                                    )}
                                    <div className="flex items-center text-muted-foreground">
                                        <Clock className="mr-2 h-4 w-4" />
                                        {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                                    </div>
                                </div>
                            </CardContent>
                        </div>
                    </TicketSheet>

                    <CardFooter className="pt-2 gap-2 border-t bg-muted/20">
                        {ticket.status === 'ASSIGNED' || ticket.status === 'OPEN' ? (
                            <Button
                                className="w-full"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleRequestOTP(ticket.id)
                                }}
                                disabled={loadingMap[ticket.id]}
                            >
                                {loadingMap[ticket.id] ? 'Sending...' : 'Request OTP & Resolve'}
                            </Button>
                        ) : ticket.status === 'RESOLVED' ? (
                            <div className="flex w-full gap-2 items-center">
                                <Input
                                    placeholder="Enter OTP"
                                    className="h-9 bg-background"
                                    maxLength={6}
                                    value={otpInputs[ticket.id] || ''}
                                    onChange={(e) => setOtpInputs(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <Button
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleVerify(ticket.id)
                                    }}
                                    disabled={loadingMap[ticket.id]}
                                >
                                    Verify
                                </Button>
                            </div>
                        ) : (
                            <div className="w-full text-center text-sm font-medium text-green-600 py-1">
                                Ticket Closed
                            </div>
                        )}
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}
