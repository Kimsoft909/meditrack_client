// Signup page with comprehensive registration form

import React, { useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { MedicalSpecialty, type SignupFormData } from '@/types/auth';

export const Signup = React.memo(() => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<SignupFormData>({
    username: '',
    email: '',
    full_name: '',
    specialty: MedicalSpecialty.OTHER,
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const specialtyOptions = useMemo(() => Object.values(MedicalSpecialty), []);

  const passwordsMatch = useMemo(() => {
    if (!formData.confirmPassword) return null;
    return formData.password === formData.confirmPassword;
  }, [formData.password, formData.confirmPassword]);

  const passwordStrength = useMemo(() => {
    const password = formData.password;
    if (!password) return { strength: 0, label: '' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    return { strength, label: labels[strength] };
  }, [formData.password]);

  const handleInputChange = useCallback((field: keyof SignupFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
  }, []);

  const handleSpecialtyChange = useCallback((value: string) => {
    setFormData(prev => ({
      ...prev,
      specialty: value as MedicalSpecialty,
    }));
  }, []);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const toggleConfirmPasswordVisibility = useCallback(() => {
    setShowConfirmPassword(prev => !prev);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordsMatch) {
      toast.error('Passwords do not match');
      return;
    }
    
    setIsSubmitting(true);

    try {
      await signup(formData);
      setShowSuccessModal(true);
    } catch (error: any) {
      toast.error(error.message || 'Signup failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, passwordsMatch, signup]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-2xl shadow-primary/10 border-primary/20">
        <CardHeader className="space-y-3 text-center pb-6">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shadow-lg shadow-primary/30">
              <span className="text-primary-foreground font-bold text-lg">M</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Create Account</CardTitle>
          <CardDescription className="text-xs">
            Join MEDITRACK to manage your patients efficiently.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-xs font-medium">
                Full Name
              </Label>
              <Input
                id="full_name"
                type="text"
                placeholder="Dr. John Smith"
                value={formData.full_name}
                onChange={handleInputChange('full_name')}
                className="h-9 text-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs font-medium">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter username"
                value={formData.username}
                onChange={handleInputChange('username')}
                className="h-9 text-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="doctor@hospital.com"
                value={formData.email}
                onChange={handleInputChange('email')}
                className="h-9 text-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialty" className="text-xs font-medium">
                Medical Specialty
              </Label>
              <Select value={formData.specialty} onValueChange={handleSpecialtyChange}>
                <SelectTrigger id="specialty" className="h-9 text-sm">
                  <SelectValue placeholder="Select your specialty" />
                </SelectTrigger>
                <SelectContent>
                  {specialtyOptions.map((specialty) => (
                    <SelectItem key={specialty} value={specialty} className="text-sm">
                      {specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
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
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {formData.password && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        passwordStrength.strength === 1
                          ? 'w-1/4 bg-destructive'
                          : passwordStrength.strength === 2
                          ? 'w-2/4 bg-warning'
                          : passwordStrength.strength === 3
                          ? 'w-3/4 bg-primary'
                          : passwordStrength.strength === 4
                          ? 'w-full bg-success'
                          : 'w-0'
                      }`}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground min-w-[40px]">
                    {passwordStrength.label}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-xs font-medium">
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange('confirmPassword')}
                  className="h-9 text-sm pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={toggleConfirmPasswordVisibility}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordsMatch !== null && (
                <div className="flex items-center gap-1.5 mt-1">
                  {passwordsMatch ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 text-success" />
                      <span className="text-[10px] text-success">Passwords match</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 text-destructive" />
                      <span className="text-[10px] text-destructive">Passwords do not match</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-9 text-sm font-medium bg-gradient-to-r from-primary to-primary-hover shadow-lg shadow-primary/30 hover:shadow-primary/40 transition-all"
              disabled={!passwordsMatch || isSubmitting}
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </Button>

            <div className="text-center pt-4 border-t border-border/40">
              <p className="text-xs text-muted-foreground">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-primary hover:text-primary-hover font-medium transition-colors underline-offset-2 hover:underline"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Success Modal */}
      <AlertDialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Account Created Successfully!</AlertDialogTitle>
            <AlertDialogDescription>
              Your account has been created. Please sign in to access the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button onClick={() => navigate('/login')}>Go to Login</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});

Signup.displayName = 'Signup';

export default Signup;
