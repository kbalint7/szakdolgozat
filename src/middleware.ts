import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/app/auth';
import NextAuth from 'next-auth';

import type { NextAuthConfig } from 'next-auth';

const authConfig = {
	pages: {
		signIn: '/login',
	},
	callbacks: {
		authorized({ auth, request: { nextUrl } }) {
			const isLoggedIn = !!auth?.user;

			if (nextUrl.pathname === '/') {
				return NextResponse.redirect(new URL('/home', nextUrl));
			}

			if (isLoggedIn && (nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/register'))) {
				return NextResponse.redirect(new URL('/dashboard', nextUrl));
			}

			if (!isLoggedIn && nextUrl.pathname.startsWith('/dashboard')) {
				return false;
			}

			return true;
		},
	},
	providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;

export default NextAuth(authConfig).auth;

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico, sitemap.xml, robots.txt (metadata files)
		 */
		'/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|home).*)',
	],
};
