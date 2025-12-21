'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Bell } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { OAuthLoginButton } from '@/components/oauth-login-button';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [redirectUrl, setRedirectUrl] = useState<string>('');

  useEffect(() => {
    // Check if there's a redirect parameter or MCP parameters
    const redirect = searchParams.get('redirect');
    const mcp = searchParams.get('mcp');

    if (redirect) {
      setRedirectUrl(redirect);
    } else if (mcp === 'true') {
      // Preserve all MCP query parameters
      const mcpParams = new URLSearchParams();
      searchParams.forEach((value, key) => {
        mcpParams.append(key, value);
      });
      setRedirectUrl(`/auth/mcp/authorize?${mcpParams.toString()}`);
    }
  }, [searchParams]);

  async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      await signIn(email, password);
      toast.success('Signed in successfully');

      // Redirect to MCP authorize page or dashboard based on query params
      if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      await signUp(email, password, name);
      toast.success('Account created successfully');

      // After signup, redirect to MCP or dashboard
      if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-12 w-12 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Bell className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl text-gray-900">Notifiable</h1>
        </div>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <Card>
              <CardHeader>
                <CardTitle>Welcome back</CardTitle>
                <CardDescription>Sign in to your Notifiable account</CardDescription>
              </CardHeader>
              <form onSubmit={handleSignIn}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input id="signin-password" name="password" type="password" required />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </CardFooter>
              </form>

              {/* OAuth Divider */}
              <div className="px-6 py-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground">
                      Or continue with OAuth
                    </span>
                  </div>
                </div>
              </div>

              {/* OAuth Login Button */}
              <div className="px-6 pb-6">
                <OAuthLoginButton className="w-full">Login with OAuth</OAuthLoginButton>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Create account</CardTitle>
                <CardDescription>Get started with Notifiable</CardDescription>
              </CardHeader>
              <form onSubmit={handleSignUp}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      name="name"
                      type="text"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input id="signup-password" name="password" type="password" required />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>

        <p className="text-center text-sm text-gray-600 mt-6">
          Multi-tenant Notifications API Dashboard
        </p>
      </div>
    </div>
  );
}
