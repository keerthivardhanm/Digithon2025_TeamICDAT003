'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { signInWithEmail, signUpWithEmail } from '@/firebase/auth';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      if (isSignUp) {
        // In a real app, you'd want to separate sign-up logic, maybe admin-only
        await signUpWithEmail(email, password);
        toast({
          title: "Sign-up successful!",
          description: "Please log in with your new account.",
        });
        setIsSignUp(false); // Switch to login view
      } else {
        const user = await signInWithEmail(email, password);
        if (user) {
          toast({ title: 'Login Successful' });
          // Redirect based on role, fetched from custom claims (in a real app)
          // For now, we'll just go to admin
          router.push('/admin');
        }
      }
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="absolute top-8 left-8 flex items-center gap-2">
        <Logo className="size-8 text-foreground" />
        <h1 className="text-xl font-semibold">Flow-Track</h1>
      </div>
      <Card className="w-full max-w-md shadow-2xl">
        <form onSubmit={handleSubmit}>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{isSignUp ? 'Create an Account' : 'Welcome Back!'}</CardTitle>
            <CardDescription>{isSignUp ? 'Enter your details to create an account' : 'Log in to access your dashboard'}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input type="email" id="email" name="email" placeholder="name@example.com" required />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input type="password" id="password" name="password" placeholder="••••••••" required />
            </div>
            <Button type="submit" size="lg" disabled={loading}>
              {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Log In')}
            </Button>
          </CardContent>
          <CardFooter className="flex justify-center">
             <Button variant="link" type="button" onClick={() => setIsSignUp(!isSignUp)}>
                {isSignUp ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
            </Button>
          </CardFooter>
        </form>
      </Card>
      <p className="absolute bottom-4 text-xs text-muted-foreground">
        Copyright © Flow-Track 2024 | Privacy Policy
      </p>
    </div>
  );
}
