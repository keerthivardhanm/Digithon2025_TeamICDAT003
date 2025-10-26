'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { Logo } from '@/components/icons';

export default function HomePage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, customClaims, loading } = useUser();

  useEffect(() => {
    if (loading) {
      return; // Wait until user status is confirmed
    }

    if (user) {
      // Only redirect if the user is on the root landing page.
      // This prevents re-redirecting them if they are already on a dashboard.
      if (pathname === '/') {
        const role = customClaims?.role;
        switch (role) {
          case 'admin':
            router.replace('/admin');
            break;
          case 'organizer':
            router.replace('/organizer');
            break;
          case 'audience':
            router.replace('/audience');
            break;
          default:
            // If user has no role or we're waiting for claims, go to login.
            // This also handles cases where a user is authenticated but has no role assigned in Firestore yet.
            router.replace('/login');
        }
      }
    } else {
      // If no user is logged in, they should be at the login page.
      if (pathname !== '/login') {
         router.replace('/login');
      }
    }
  }, [user, customClaims, loading, router, pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
       <Logo className="size-16 text-primary animate-pulse" />
      <p className="mt-4 text-lg text-muted-foreground">Loading CrowdSafe 360°...</p>
    </div>
  );
}
