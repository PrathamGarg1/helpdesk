'use client'

import { Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface HeatmapProps {
    data: { name: string; tickets: number }[]
}

export function DepartmentHeatmap({ data }: HeatmapProps) {
    if (!data || data.length === 0) {
        return <div className="text-muted-foreground p-4">No data available for visualization.</div>
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Infrastructure Failures by Department</CardTitle>
                <CardDescription>
                    Active tickets across all departments.
                </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Bar dataKey="tickets" fill="#adfa1d" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
