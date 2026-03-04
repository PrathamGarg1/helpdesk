'use client'

import { useState, useEffect } from 'react'

import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Circle, CheckCircle2, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

interface TimelineEvent {
    id: string
    action: string
    details: string | null
    createdAt: Date
    user: { name: string }
}

import { getAuditLogsForTicket } from '@/actions/timeline'

export function Timeline({ ticketId }: { ticketId: string }) {
    const [events, setEvents] = useState<TimelineEvent[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getAuditLogsForTicket(ticketId).then((data) => {
            setEvents(data as any)
            setLoading(false)
        })
    }, [ticketId])

    if (loading) return <Loader2 className="animate-spin h-5 w-5" />

    return (
        <ScrollArea className="h-[300px] w-full pr-4">
            <div className="space-y-6 border-l-2 border-muted pl-4 ml-2">
                {events.map((event) => (
                    <div key={event.id} className="relative">
                        <span className="absolute -left-[25px] top-1 h-3 w-3 rounded-full bg-primary" />
                        <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium leading-none">{event.action.replace(/_/g, ' ')}</span>
                            <span className="text-xs text-muted-foreground">{format(new Date(event.createdAt), 'PP p')} by {event.user.name}</span>
                            {event.details && <p className="text-xs text-gray-500 mt-1 bg-muted p-2 rounded">{event.details}</p>}
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
    )
}
