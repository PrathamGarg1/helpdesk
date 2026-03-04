
import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
    const isLoggedIn = !!req.auth
    const { nextUrl } = req
    const role = req.auth?.user?.role as string | undefined

    const isApiAuthRoute = nextUrl.pathname.startsWith('/api/auth')
    const isAssets = nextUrl.pathname.startsWith('/_next') || nextUrl.pathname.includes('.')
    if (isApiAuthRoute || isAssets) {
        return NextResponse.next()
    }

    // Handle root path (/)
    if (nextUrl.pathname === '/') {
        if (!isLoggedIn) {
            return NextResponse.redirect(new URL('/login', nextUrl))
        }
        // If logged in, redirect to role-specific dashboard
        let target = '/requester'
        if (role === 'SUPER_ADMIN') target = '/admin'
        else if (role === 'DEPT_ADMIN') target = '/manager'
        else if (role === 'TECHNICIAN') target = '/technician'
        return NextResponse.redirect(new URL(target, nextUrl))
    }

    // Redirect to login if accessing protected routes without session
    const protectedPaths = ['/admin', '/manager', '/technician', '/requester']
    const isProtected = protectedPaths.some(path => nextUrl.pathname.startsWith(path))

    if (isProtected && !isLoggedIn) {
        return NextResponse.redirect(new URL('/login', nextUrl))
    }

    // Redirect logged-in users away from /login
    if (isLoggedIn && nextUrl.pathname === '/login') {
        let target = '/requester'
        if (role === 'SUPER_ADMIN') target = '/admin'
        else if (role === 'DEPT_ADMIN') target = '/manager'
        else if (role === 'TECHNICIAN') target = '/technician'
        return NextResponse.redirect(new URL(target, nextUrl))
    }

    // Strict Role Checking
    if (isLoggedIn) {
        if (nextUrl.pathname.startsWith('/admin') && role !== 'SUPER_ADMIN') {
            return NextResponse.rewrite(new URL('/unauthorized', nextUrl)) // Or 404
        }
        if (nextUrl.pathname.startsWith('/manager') && role !== 'DEPT_ADMIN' && role !== 'SUPER_ADMIN') {
            return NextResponse.rewrite(new URL('/unauthorized', nextUrl))
        }
    }

    return NextResponse.next()
})

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
