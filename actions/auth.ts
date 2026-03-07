'use server'

import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { z } from 'zod'

const LoginSchema = z.object({
    email: z.string().email(),
})

export async function sendLoginOTP(formData: FormData) {
    const email = formData.get('email') as string

    const validatedFields = LoginSchema.safeParse({ email })
    if (!validatedFields.success) {
        return { error: 'Invalid email address.' }
    }

    try {
        // 1. Check Whitelist: allow @iitrpr.ac.in domain OR superadmin-added users
        let user = await prisma.user.findUnique({
            where: { email },
        })

        if (!user) {
            if (email.endsWith('@iitrpr.ac.in')) {
                // Auto-provision IITRPR users as REQUESTER on first login
                user = await prisma.user.create({
                    data: {
                        email,
                        name: email.split('@')[0],
                        role: 'REQUESTER',
                        password: 'otp-only-account',
                    },
                })
            } else {
                return { error: 'Access Denied: Only @iitrpr.ac.in emails or registered users can log in.' }
            }
        }

        // 2. Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString()
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 mins

        // 3. Save to DB
        await prisma.user.update({
            where: { email },
            data: {
                loginOtp: otp,
                loginOtpExpiresAt: expiresAt,
            },
        })

        // 4. Update Audit Log
        await prisma.auditLog.create({
            data: {
                action: 'LOGIN_OTP_REQUESTED',
                userId: user.id,
                details: `OTP requested for login by ${email}`
            }
        })

        // 5. Send Email
        await sendEmail({
            to: email,
            subject: 'Your Login OTP - Ticket Management',
            html: `
        <h1>Login Verification</h1>
        <p>Your OTP is: <strong>${otp}</strong></p>
        <p>This code expires in 15 minutes.</p>
      `,
        })

        return { success: true, message: 'OTP sent to your email.' }

    } catch (error) {
        console.error('Send OTP Error:', error)
        return { error: 'Failed to send OTP. Please try again.' }
    }
}
