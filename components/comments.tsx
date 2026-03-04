'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { addComment, getComments } from '@/actions/comments'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Send } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'

interface Comment {
    id: string
    text: string
    createdAt: Date
    user: {
        name: string
        role: string
    }
}

export function Comments({ ticketId }: { ticketId: string }) {
    const [comments, setComments] = useState<Comment[]>([])
    const [newComment, setNewComment] = useState('')
    const [loading, setLoading] = useState(false)
    const [posting, setPosting] = useState(false)

    useEffect(() => {
        loadComments()
    }, [ticketId])

    async function loadComments() {
        setLoading(true)
        const data = await getComments(ticketId)
        setComments(data as any) // Type assertion if needed due to date serialization across JSON
        setLoading(false)
    }

    async function handlePost() {
        if (!newComment.trim()) return
        setPosting(true)
        await addComment(ticketId, newComment)
        setNewComment('')
        await loadComments()
        setPosting(false)
    }

    return (
        <div className="flex flex-col h-full space-y-4">
            <h3 className="font-semibold text-lg">Discussion</h3>

            <ScrollArea className="flex-1 pr-4 max-h-[400px]">
                {loading ? (
                    <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                ) : (
                    <div className="space-y-4">
                        {comments.length === 0 && <p className="text-muted-foreground text-sm">No comments yet.</p>}
                        {comments.map((c) => (
                            <div key={c.id} className="flex gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback>{c.user.name[0]}</AvatarFallback>
                                </Avatar>
                                <div className="grid gap-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-sm">{c.user.name}</span>
                                        <span className="text-xs text-muted-foreground">{c.user.role}</span>
                                        <span className="text-xs text-muted-foreground">• {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
                                    </div>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">{c.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>

            <div className="flex gap-2">
                <Textarea
                    placeholder="Type your message..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[80px]"
                />
                <Button onClick={handlePost} disabled={posting || !newComment.trim()} size="icon">
                    {posting ? <Loader2 className="animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
            </div>
        </div>
    )
}
