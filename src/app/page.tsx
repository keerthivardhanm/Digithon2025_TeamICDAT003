'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useUser } from '@/firebase/auth/use-user';
import { Logo } from '@/components/icons';

export default function HomePage() {
  const { user, customClaims, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Wait until the loading is complete
    if (loading) {
      return;
    }

    // If there is no user, redirect to login
    if (!user) {
      router.push('/login');
      return;
    }

    // If there is a user, but claims are still being loaded, wait.
    if (customClaims === null) {
      return;
    }
    
    // Once claims are loaded, redirect based on role
    switch (customClaims?.role) {
      case 'admin':
        router.push('/admin');
        break;
      case 'organizer':
        router.push('/organizer');
        break;
      case 'volunteer':
        router.push('/volunteer');
        break;
      case 'audience':
        router.push('/audience');
        break;
      default:
        // This case handles users who are authenticated but have no role claim.
        // This can happen during initial sign-up before claims are set.
        // A re-login after claims are set by an admin would grant them access.
        // We will not redirect here to prevent a loop.
        // In a real app, you might show a "pending approval" message.
        // For now, we will just show the routing message.
        // Only redirect to login if the user is truly not authenticated, which is handled above.
        break;
    }
  }, [user, customClaims, loading, router]);

  return (
     <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="flex items-center gap-4">
        <Logo className="size-12 text-primary" />
        <h1 className="text-4xl font-bold">CrowdSafe 360°</h1>
      </div>
      <p className="mt-4 text-lg text-muted-foreground">Routing to your dashboard...</p>
    </div>
  );
}
