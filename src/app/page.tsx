'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { Logo } from '@/components/icons';

export default function HomePage() {
  const router = useRouter();
  const { user, customClaims, loading } = useUser();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // In a real app, you would have logic to redirect based on roles from customClaims
        // For this starter, we'll just redirect authenticated users to the admin dashboard.
        switch (customClaims?.role) {
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
            router.replace('/login'); // Fallback for users with no role
        }
      } else {
        router.replace('/login');
      }
    }
  }, [user, customClaims, loading, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
       <Logo className="size-16 text-primary animate-pulse" />
      <p className="mt-4 text-lg text-muted-foreground">Loading...</p>
    </div>
  );
}
