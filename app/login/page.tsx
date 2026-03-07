'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { sendLoginOTP } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

// Schemas
const EmailSchema = z.object({ email: z.string().email() })
const OtpSchema = z.object({ otp: z.string().length(6) })

export default function LoginPage() {
    const [step, setStep] = useState<'EMAIL' | 'OTP'>('EMAIL')
    const [email, setEmail] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    // Forms
    const emailForm = useForm<z.infer<typeof EmailSchema>>({ resolver: zodResolver(EmailSchema) })
    const otpForm = useForm<z.infer<typeof OtpSchema>>({ resolver: zodResolver(OtpSchema) })

    // 1. Send OTP
    async function onRequestOTP(data: z.infer<typeof EmailSchema>) {
        setIsLoading(true)
        setError(null)

        const formData = new FormData()
        formData.append('email', data.email)

        const res = await sendLoginOTP(formData)
        setIsLoading(false)

        if (res?.error) {
            setError(res.error)
        } else {
            setEmail(data.email)
            otpForm.reset()
            setStep('OTP')
        }
    }

    // 2. Verify OTP
    async function onVerifyOTP(data: z.infer<typeof OtpSchema>) {
        setIsLoading(true)
        setError(null)

        try {
            const res = await signIn('credentials', {
                email,
                otp: data.otp,
                redirect: false,
            })

            if (res?.error) {
                setError('Invalid OTP or verify failed.')
                setIsLoading(false)
            } else {
                router.push('/') // Middleware will handle role redirect
                router.refresh()
            }
        } catch (e) {
            setError('An unexpected error occurred.')
            setIsLoading(false)
        }
    }

    return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900">
            <Card className="w-[350px]">
                <CardHeader>
                    <CardTitle>Ticket Management System</CardTitle>
                    <CardDescription>
                        {step === 'EMAIL' ? 'Enter your email to receive an OTP.' : `Enter the OTP sent to ${email}`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {step === 'EMAIL' ? (
                        <form onSubmit={emailForm.handleSubmit(onRequestOTP)} className="space-y-4">
                            <div className="space-y-2">
                                <Input placeholder="name@example.com" {...emailForm.register('email')} />
                                {emailForm.formState.errors.email && (
                                    <p className="text-sm text-red-500">{emailForm.formState.errors.email.message}</p>
                                )}
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Send OTP
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={otpForm.handleSubmit(onVerifyOTP)} className="space-y-4">
                            <div className="space-y-2">
                                <Input placeholder="123456" maxLength={6} {...otpForm.register('otp')} />
                                {otpForm.formState.errors.otp && (
                                    <p className="text-sm text-red-500">{otpForm.formState.errors.otp.message}</p>
                                )}
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Verify & Login
                            </Button>
                            <Button variant="ghost" className="w-full" onClick={() => { emailForm.reset(); setStep('EMAIL') }} disabled={isLoading}>
                                Back to Email
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
