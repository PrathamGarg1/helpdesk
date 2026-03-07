'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { importUsers } from '@/actions/admin'
import { Loader2, Upload, Download } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

// Template CSV content
const TEMPLATE_CSV = `email,name,role,department
john@iitrpr.ac.in,John Doe,REQUESTER,
jane@iitrpr.ac.in,Jane Smith,TECHNICIAN,
admin@iitrpr.ac.in,Admin User,DEPT_ADMIN,`

// Valid roles for validation hint
const VALID_ROLES = ['REQUESTER', 'TECHNICIAN', 'DEPT_ADMIN', 'SUPER_ADMIN']

function downloadTemplate() {
    const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'users_import_template.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

export function CsvImport() {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<{ successCount: number; errors: string[] } | null>(null)
    const [fileName, setFileName] = useState<string | null>(null)

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setFileName(file.name)
        setLoading(true)
        setResult(null)

        const reader = new FileReader()
        reader.onload = async (event) => {
            const text = event.target?.result as string
            const lines = text.split('\n').filter(line => line.trim() !== '')

            // Skip header row
            const users = lines.slice(1).map(line => {
                // Handle quoted CSV fields
                const [email, name, role, department] = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''))
                return {
                    email,
                    name,
                    role: VALID_ROLES.includes(role) ? role : 'REQUESTER',
                    departmentId: department || undefined,
                }
            }).filter(u => u.email && u.name) // filter out empty rows

            if (users.length === 0) {
                setResult({ successCount: 0, errors: ['No valid rows found. Make sure to include a header row and at least one data row.'] })
                setLoading(false)
                return
            }

            const res = await importUsers(users)
            setResult(res as any)
            setLoading(false)
            // Reset file input
            e.target.value = ''
        }
        reader.readAsText(file)
    }

    return (
        <div className="space-y-4">
            {/* Instructions */}
            <div className="rounded-md border p-3 bg-muted/50 text-sm space-y-1">
                <p className="font-medium">Bulk Import Instructions</p>
                <ol className="list-decimal pl-4 text-muted-foreground space-y-0.5">
                    <li>Download the CSV template below</li>
                    <li>Fill in user data (one user per row)</li>
                    <li>Valid roles: <code className="text-xs bg-muted px-1 rounded">REQUESTER</code>, <code className="text-xs bg-muted px-1 rounded">TECHNICIAN</code>, <code className="text-xs bg-muted px-1 rounded">DEPT_ADMIN</code>, <code className="text-xs bg-muted px-1 rounded">SUPER_ADMIN</code></li>
                    <li>The <code className="text-xs bg-muted px-1 rounded">department</code> column is optional — leave it blank if not applicable</li>
                    <li>Upload the edited CSV file</li>
                </ol>
            </div>

            {/* Download Template */}
            <Button variant="outline" onClick={downloadTemplate} className="gap-2">
                <Download className="h-4 w-4" />
                Download CSV Template
            </Button>

            {/* File Upload */}
            <div className="flex items-center gap-4">
                <Input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    disabled={loading}
                    className="w-[300px]"
                />
                {loading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Importing...
                    </div>
                )}
            </div>
            {fileName && !loading && <p className="text-xs text-muted-foreground">Last file: {fileName}</p>}

            {/* Result */}
            {result && (
                <Alert variant={result.errors.length > 0 && result.successCount === 0 ? 'destructive' : 'default'}>
                    <Upload className="h-4 w-4" />
                    <AlertTitle>Import Result</AlertTitle>
                    <AlertDescription>
                        {result.successCount > 0 && (
                            <p className="font-medium text-green-700 dark:text-green-400">
                                ✓ Successfully imported {result.successCount} user{result.successCount !== 1 ? 's' : ''}.
                            </p>
                        )}
                        {result.errors.length > 0 && (
                            <>
                                <p className="mt-1 font-medium">
                                    {result.errors.length} row{result.errors.length !== 1 ? 's' : ''} failed:
                                </p>
                                <ul className="mt-1 list-disc pl-4 text-sm">
                                    {result.errors.slice(0, 8).map((err, i) => (
                                        <li key={i}>{err}</li>
                                    ))}
                                    {result.errors.length > 8 && <li>...and {result.errors.length - 8} more errors</li>}
                                </ul>
                            </>
                        )}
                    </AlertDescription>
                </Alert>
            )}
        </div>
    )
}
