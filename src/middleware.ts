import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware file is a placeholder.
// In a production app, you would use this to verify the user's authentication token
// and role before granting access to protected routes.
// For this starter, the authentication guard is handled client-side in `useAuthGuard.ts`.

export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/organizer/:path*', '/audience/:path*', '/volunteer/:path*'],
};
