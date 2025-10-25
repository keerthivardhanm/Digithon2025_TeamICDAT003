'use client';

import { useState, useEffect } from 'react';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/icons';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase/auth/use-user';
import { Separator } from '@/components/ui/separator';

const testAccounts = [
  { email: 'admin1@gmail.com', role: 'Admin' },
  { email: 'org1@gmail.com', role: 'Organizer' },
  { email: 'user1@gmail.com', role: 'Audience' },
];

export default function LoginPage() {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const auth = getAuth();
  const router = useRouter();
  const { user, loading: userLoading } = useUser();

  useEffect(() => {
    if (!userLoading && user) {
      router.push('/');
    }
  }, [user, userLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      toast({ title: 'Login Successful' });
      // The useEffect will handle the redirection
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Login Failed', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleTestAccountClick = (email: string) => {
    setLoginEmail(email);
    setLoginPassword('@12345');
  };

  if (userLoading || user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <div className="flex items-center gap-4">
          <Logo className="size-12 text-primary" />
          <h1 className="text-4xl font-bold">CrowdSafe 360°</h1>
        </div>
        <p className="mt-4 text-lg text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="absolute top-8 left-8 flex items-center gap-2">
        <Logo className="size-8 text-foreground" />
        <h1 className="text-xl font-semibold">CrowdSafe 360°</h1>
      </div>
      <div className="w-full max-w-sm space-y-6">
        <Card className="shadow-2xl">
          <form onSubmit={handleLogin}>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Agent Login</CardTitle>
              <CardDescription>Hey, enter your details to get sign in to your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email Address</Label>
                <Input id="login-email" type="email" placeholder="m@example.com" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input id="login-password" type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle className="text-base text-center">Test Accounts</CardTitle>
                <CardDescription className="text-center">Click an account to pre-fill credentials. <br/> Password for all is: <strong>@12345</strong></CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center gap-2">
                {testAccounts.map((account) => (
                    <Button key={account.email} variant="outline" size="sm" onClick={() => handleTestAccountClick(account.email)}>
                        {account.role}
                    </Button>
                ))}
            </CardContent>
        </Card>
      </div>
       <p className="absolute bottom-4 text-xs text-muted-foreground">
        Copyright © CrowdSafe 360° 2024 | Privacy Policy
      </p>
    </div>
  );
}
