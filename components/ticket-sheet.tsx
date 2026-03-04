'use client'

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Ticket, User, Department } from '@prisma/client'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { Comments } from '@/components/comments'
import { Timeline } from '@/components/timeline'
import { Button } from '@/components/ui/button' // Import Button to prevent lint error

interface TicketWithDetails extends Ticket {
    requester: User
    department: Department
    technician?: User | null
}

export function TicketSheet({ ticket, children }: { ticket: TicketWithDetails, children: React.ReactNode }) {
    return (
        <Sheet>
            <SheetTrigger asChild>
                {children}
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>{ticket.title}</SheetTitle>
                    <SheetDescription>
                        {ticket.uuid} • Created {format(new Date(ticket.createdAt), 'PP')}
                    </SheetDescription>
                </SheetHeader>

                <div className="py-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                            <Badge variant={ticket.status === 'OPEN' ? 'destructive' : 'default'} className="mt-1">
                                {ticket.status}
                            </Badge>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Priority</h4>
                            <span className="font-semibold text-sm mt-1 block">{ticket.priority}</span>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Department</h4>
                            <span className="text-sm mt-1 block">{ticket.department.name}</span>
                        </div>
                        <div>
                            <h4 className="text-sm font-medium text-muted-foreground">Requester</h4>
                            <span className="text-sm mt-1 block">{ticket.requester.name}</span>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
                        <div className="bg-muted/50 p-3 rounded-md text-sm">
                            {ticket.description}
                        </div>
                    </div>

                    <Tabs defaultValue="comments" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="comments">Comments</TabsTrigger>
                            <TabsTrigger value="timeline">Timeline</TabsTrigger>
                        </TabsList>
                        <TabsContent value="comments" className="h-[400px]">
                            <Comments ticketId={ticket.id} />
                        </TabsContent>
                        <TabsContent value="timeline">
                            <Timeline ticketId={ticket.id} />
                        </TabsContent>
                    </Tabs>
                </div>
            </SheetContent>
        </Sheet>
    )
}
