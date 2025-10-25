import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, CustomClaims } from '@/firebase/auth/use-user';

export function useAuthGuard(requiredRole?: CustomClaims['role']) {
  const { user, customClaims, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
        return;
      }

      if (requiredRole && customClaims?.role !== requiredRole) {
        // If role does not match, redirect to their default page or a "not authorized" page.
        // For simplicity, we redirect to the root, which will handle role-based redirection.
        router.replace('/');
      }
    }
  }, [user, customClaims, loading, router, requiredRole]);

  return { loading, user, customClaims };
}
