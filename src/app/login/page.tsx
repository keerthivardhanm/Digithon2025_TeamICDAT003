'use client';

import { useState, useEffect } from 'react';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
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
  
  // NOTE: In a real application, you would not allow public sign-up.
  // User creation would be handled by an admin.
  // This is included for demonstration purposes.
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, signupEmail, signupPassword);
      toast({ title: 'Signup Successful', description: 'Please log in.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Signup Failed', description: error.message });
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
       <div className="flex items-center gap-4 mb-8">
          <Logo className="size-12 text-primary" />
          <h1 className="text-4xl font-bold">CrowdSafe 360°</h1>
        </div>
      <Tabs defaultValue="login" className="w-[400px]">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <form onSubmit={handleLogin}>
            <Card>
              <CardHeader>
                <CardTitle>Login</CardTitle>
                <CardDescription>Enter your credentials to access your dashboard.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" type="email" placeholder="m@example.com" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input id="login-password" type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Logging in...' : 'Login'}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>
        <TabsContent value="signup">
           <form onSubmit={handleSignUp}>
            <Card>
              <CardHeader>
                <CardTitle>Sign Up</CardTitle>
                <CardDescription>Create an account. Roles are assigned by an administrator.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" type="email" placeholder="m@example.com" required value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input id="signup-password" type="password" required value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing up...' : 'Sign Up'}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>
      </Tabs>
        <Card className="w-[400px] mt-4">
            <CardHeader>
                <CardTitle className="text-base">Test Accounts</CardTitle>
                <CardDescription>Click an account to pre-fill credentials. Password for all is: <strong>@12345</strong></CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <ul className="divide-y">
                    {testAccounts.map((account) => (
                        <li key={account.email} className="px-6 py-3 cursor-pointer hover:bg-muted" onClick={() => handleTestAccountClick(account.email)}>
                            <p className="font-medium text-sm">{account.email}</p>
                            <p className="text-xs text-muted-foreground">{account.role}</p>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    </div>
  );
}
