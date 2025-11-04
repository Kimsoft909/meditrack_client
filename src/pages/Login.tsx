// Login page with clinical design aesthetics

import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { LoginFormData } from '@/types/auth';

export const Login = React.memo(() => {
  const { login, isLoading } = useAuth();
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = useCallback((field: keyof LoginFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
  }, []);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await login(formData);
      // AuthContext handles redirect to /dashboard
    } catch (error: any) {
      toast.error(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, login]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-2xl shadow-primary/10 border-primary/20">
        <CardHeader className="space-y-3 text-center pb-6">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shadow-lg shadow-primary/30">
              <span className="text-primary-foreground font-bold text-lg">M</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">MEDITRACK</CardTitle>
          <CardDescription className="text-xs">
            Welcome back. Please sign in to continue.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs font-medium">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Dr. "
                value={formData.username}
                onChange={handleInputChange('username')}
                className="h-9 text-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  className="h-9 text-sm pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full h-9 text-sm font-medium bg-gradient-to-r from-primary to-primary-hover shadow-lg shadow-primary/30 hover:shadow-primary/40 transition-all"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </Button>

            <div className="text-center pt-4 border-t border-border/40">
              <p className="text-xs text-muted-foreground">
                Don't have an account?{' '}
                <Link
                  to="/signup"
                  className="text-primary hover:text-primary-hover font-medium transition-colors underline-offset-2 hover:underline"
                >
                  Create Account
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
});

Login.displayName = 'Login';

export default Login;
