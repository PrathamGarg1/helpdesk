'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { importUsers } from '@/actions/admin'
import { Loader2, Upload } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function CsvImport() {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<{ successCount: number; errors: string[] } | null>(null)

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setLoading(true)
        setResult(null)

        const reader = new FileReader()
        reader.onload = async (event) => {
            const text = event.target?.result as string
            // Simple CSV Parse: email,name,role,department
            const lines = text.split('\n').filter(line => line.trim() !== '')
            const users = lines.slice(1).map(line => {
                const [email, name, role, department] = line.split(',').map(s => s.trim())
                return { email, name, role, department } // Basic mapping, validation handled on server largely or schema
            })

            // We need to map role string to Enum if needed, but server handles validation.
            // Assuming naive CSV for now.

            const res = await importUsers(users)
            setResult(res as any)
            setLoading(false)
        }
        reader.readAsText(file)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <Input type="file" accept=".csv" onChange={handleFileUpload} disabled={loading} className="w-[300px]" />
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
            <p className="text-sm text-muted-foreground">
                Format: email, Name, ROLE, department (Header required)
            </p>

            {result && (
                <Alert variant={result.errors.length > 0 ? 'destructive' : 'default'}>
                    <Upload className="h-4 w-4" />
                    <AlertTitle>Import Result</AlertTitle>
                    <AlertDescription>
                        Successfully imported {result.successCount} users.
                        {result.errors.length > 0 && (
                            <ul className="mt-2 list-disc pl-4">
                                {result.errors.slice(0, 5).map((err, i) => (
                                    <li key={i}>{err}</li>
                                ))}
                                {result.errors.length > 5 && <li>...and {result.errors.length - 5} more errors</li>}
                            </ul>
                        )}
                    </AlertDescription>
                </Alert>
            )}
        </div>
    )
}
