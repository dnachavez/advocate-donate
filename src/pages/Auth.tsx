import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Heart, ArrowLeft, Eye, EyeOff, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  signUp, 
  signIn, 
  validateEmail, 
  validatePassword, 
  validatePasswordConfirmation,
  sanitizeInput,
  generateCSRFToken,
  checkRateLimit
} from "@/lib/auth";
import { PasswordStrength } from "@/components/ui/password-strength";
import { cn } from "@/lib/utils";

// Form interfaces
interface SignInForm {
  email: string;
  password: string;
}

interface SignUpForm {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phoneNumber: string;
  userType: string;
  organizationName?: string;
  registrationNumber?: string;
  website?: string;
  companyName?: string;
  businessRegistration?: string;
}

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  const { isAuthenticated, loading: authLoading } = useAuth();
  
  // State management
  const [activeTab, setActiveTab] = useState(mode === 'reset' ? 'signin' : 'signin');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [csrfToken, setCsrfToken] = useState('');
  
  // Form states
  const [signInForm, setSignInForm] = useState<SignInForm>({
    email: '',
    password: ''
  });
  
  const [signUpForm, setSignUpForm] = useState<SignUpForm>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phoneNumber: '',
    userType: ''
  });
  
  // Validation states
  const [signInErrors, setSignInErrors] = useState<Partial<SignInForm>>({});
  const [signUpErrors, setSignUpErrors] = useState<Partial<SignUpForm>>({});
  const [generalError, setGeneralError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Initialize CSRF token
  useEffect(() => {
    setCsrfToken(generateCSRFToken());
  }, []);
  
  // Redirect authenticated users
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const redirectTo = searchParams.get('redirect') || '/';
      navigate(redirectTo, { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate, searchParams]);
  
  // Handle authentication state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        toast({
          title: 'Welcome back!',
          description: 'You have been successfully signed in.',
        });
        navigate('/');
      }
    });
    
    return () => subscription.unsubscribe();
  }, [navigate]);
  
  // Validate sign-in form
  const validateSignInForm = (): boolean => {
    const errors: Partial<SignInForm> = {};
    
    const emailValidation = validateEmail(signInForm.email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.error;
    }
    
    if (!signInForm.password) {
      errors.password = 'Password is required';
    }
    
    setSignInErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Validate sign-up form
  const validateSignUpForm = (): boolean => {
    const errors: Partial<SignUpForm> = {};
    
    // Email validation
    const emailValidation = validateEmail(signUpForm.email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.error;
    }
    
    // Password validation
    const passwordValidation = validatePassword(signUpForm.password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.errors[0];
    }
    
    // Confirm password validation
    const confirmPasswordValidation = validatePasswordConfirmation(
      signUpForm.password, 
      signUpForm.confirmPassword
    );
    if (!confirmPasswordValidation.isValid) {
      errors.confirmPassword = confirmPasswordValidation.error;
    }
    
    // Required fields
    if (!signUpForm.fullName.trim()) {
      errors.fullName = 'Full name is required';
    }
    
    if (!signUpForm.userType) {
      errors.userType = 'Please select a user type';
    }
    
    // Conditional validations
    if (signUpForm.userType === 'nonprofit') {
      if (!signUpForm.organizationName?.trim()) {
        errors.organizationName = 'Organization name is required';
      }
      if (!signUpForm.registrationNumber?.trim()) {
        errors.registrationNumber = 'Registration number is required';
      }
    }
    
    setSignUpErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle sign-in
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    
    if (!validateSignInForm()) {
      return;
    }
    
    // Check rate limiting
    const rateLimitCheck = checkRateLimit(signInForm.email);
    if (!rateLimitCheck.allowed) {
      const blockedUntil = rateLimitCheck.blockedUntil;
      setGeneralError(
        `Too many failed attempts. Please try again ${blockedUntil ? `after ${blockedUntil.toLocaleTimeString()}` : 'later'}`
      );
      return;
    }
    
    setLoading(true);
    
    try {
      const { data, error } = await signIn(
        sanitizeInput(signInForm.email),
        signInForm.password
      );
      
      if (error) {
        throw error;
      }
      
      if (data?.user) {
        toast({
          title: 'Success!',
          description: 'You have been successfully signed in.',
        });
        navigate('/');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      setGeneralError(
        error instanceof Error ? error.message : 'An unexpected error occurred'
      );
    } finally {
      setLoading(false);
    }
  };
  
  // Handle sign-up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    setSuccessMessage('');
    
    if (!validateSignUpForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const additionalData: Record<string, string | number | boolean> = {
        phone_number: sanitizeInput(signUpForm.phoneNumber),
      };
      
      if (signUpForm.userType === 'nonprofit') {
        additionalData.organization_name = sanitizeInput(signUpForm.organizationName || '');
        additionalData.registration_number = sanitizeInput(signUpForm.registrationNumber || '');
        if (signUpForm.website) {
          additionalData.website = sanitizeInput(signUpForm.website);
        }
      }
      
      const { data, error } = await signUp({
        email: sanitizeInput(signUpForm.email),
        password: signUpForm.password,
        fullName: sanitizeInput(signUpForm.fullName),
        userType: signUpForm.userType,
        additionalData
      });
      
      if (error) {
        throw error;
      }
      
      if (data?.user) {
        setSuccessMessage(
          'Account created successfully! We\'ve sent a verification email to your inbox. Please check your email and click the verification link to activate your account.'
        );
        
        // Reset form
        setSignUpForm({
          email: '',
          password: '',
          confirmPassword: '',
          fullName: '',
          phoneNumber: '',
          userType: ''
        });
        
        // Don't auto-switch tabs, let user verify email first
        toast({
          title: 'Check your email',
          description: 'We\'ve sent you a verification link. Please verify your email before signing in.',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Sign up error:', error);
      setGeneralError(
        error instanceof Error ? error.message : 'An unexpected error occurred'
      );
    } finally {
      setLoading(false);
    }
  };
  
  // Handle Google OAuth
  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      toast({
        title: 'Google sign-in failed',
        description: error instanceof Error ? error.message : 'Please try again later.',
        variant: 'destructive',
      });
    }
  };
  
  // Show loading spinner while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">Checking authentication...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-primary">Advocate&Donate</span>
          </div>
          <CardTitle>Join Our Community</CardTitle>
          <CardDescription>
            Connect with causes that matter and make a real difference
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* General Messages */}
          {generalError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{generalError}</AlertDescription>
            </Alert>
          )}
          
          {successMessage && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
            </Alert>
          )}
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            {/* Sign In Tab */}
            <TabsContent value="signin" className="space-y-4">
              <form onSubmit={handleSignIn} className="space-y-4">
                <input type="hidden" name="csrf_token" value={csrfToken} />
                
                <div className="space-y-2">
                  <Input
                    placeholder="Email address"
                    type="email"
                    value={signInForm.email}
                    onChange={(e) => {
                      setSignInForm(prev => ({ ...prev, email: e.target.value }));
                      if (signInErrors.email) {
                        setSignInErrors(prev => ({ ...prev, email: undefined }));
                      }
                    }}
                    className={cn(signInErrors.email && 'border-red-500')}
                    disabled={loading}
                  />
                  {signInErrors.email && (
                    <p className="text-sm text-red-600">{signInErrors.email}</p>
                  )}
                  
                  <div className="relative">
                    <Input
                      placeholder="Password"
                      type={showPassword ? 'text' : 'password'}
                      value={signInForm.password}
                      onChange={(e) => {
                        setSignInForm(prev => ({ ...prev, password: e.target.value }));
                        if (signInErrors.password) {
                          setSignInErrors(prev => ({ ...prev, password: undefined }));
                        }
                      }}
                      className={cn(signInErrors.password && 'border-red-500', 'pr-10')}
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  {signInErrors.password && (
                    <p className="text-sm text-red-600">{signInErrors.password}</p>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>
              
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                  <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.599 32.438 29.195 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.158 7.961 3.039l5.657-5.657C34.869 6.053 29.73 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20c10.493 0 19-8.507 19-19 0-1.262-.131-2.496-.389-3.917z"/>
                  <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.267 16.108 18.799 12 24 12c3.059 0 5.842 1.158 7.961 3.039l5.657-5.657C34.869 6.053 29.73 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                  <path fill="#4CAF50" d="M24 44c5.138 0 9.801-1.977 13.285-5.193l-6.142-5.2C29.11 35.091 26.671 36 24 36c-5.176 0-9.568-3.539-11.192-8.333l-6.5 5.02C9.62 39.556 16.227 44 24 44z"/>
                  <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.087 3.129-3.368 5.583-6.16 7.027l.001-.001 6.142 5.2C33.036 41.205 38 37 38 25c0-1.262-.131-2.496-.389-3.917z"/>
                </svg>
                Continue with Google
              </Button>
              
              <div className="text-center text-sm">
                <Link to="/forgot-password" className="text-primary hover:underline">
                  Forgot your password?
                </Link>
              </div>
            </TabsContent>
            
            {/* Sign Up Tab */}
            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <input type="hidden" name="csrf_token" value={csrfToken} />
                
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <Select 
                        value={signUpForm.userType} 
                        onValueChange={(value) => {
                          setSignUpForm(prev => ({ ...prev, userType: value }));
                          if (signUpErrors.userType) {
                            setSignUpErrors(prev => ({ ...prev, userType: undefined }));
                          }
                        }}
                        disabled={loading}
                      >
                        <SelectTrigger className={cn(signUpErrors.userType && 'border-red-500')}>
                          <SelectValue placeholder="I want to join as..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="individual">Individual Donor</SelectItem>
                        </SelectContent>
                      </Select>
                      {signUpErrors.userType && (
                        <p className="text-sm text-red-600 mt-1">{signUpErrors.userType}</p>
                      )}
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">or</p>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setSignUpForm(prev => ({ ...prev, userType: 'nonprofit' }));
                          if (signUpErrors.userType) {
                            setSignUpErrors(prev => ({ ...prev, userType: undefined }));
                          }
                        }}
                        disabled={loading}
                      >
                        Sign up as Organization
                      </Button>
                    </div>
                  </div>
                  
                  {signUpForm.userType && (
                    <div className="space-y-3">
                      <div>
                        <Input 
                          placeholder="Full name" 
                          value={signUpForm.fullName}
                          onChange={(e) => {
                            setSignUpForm(prev => ({ ...prev, fullName: e.target.value }));
                            if (signUpErrors.fullName) {
                              setSignUpErrors(prev => ({ ...prev, fullName: undefined }));
                            }
                          }}
                          className={cn(signUpErrors.fullName && 'border-red-500')}
                          disabled={loading}
                        />
                        {signUpErrors.fullName && (
                          <p className="text-sm text-red-600 mt-1">{signUpErrors.fullName}</p>
                        )}
                      </div>
                      
                      <div>
                        <Input 
                          placeholder="Email address" 
                          type="email" 
                          value={signUpForm.email}
                          onChange={(e) => {
                            setSignUpForm(prev => ({ ...prev, email: e.target.value }));
                            if (signUpErrors.email) {
                              setSignUpErrors(prev => ({ ...prev, email: undefined }));
                            }
                          }}
                          className={cn(signUpErrors.email && 'border-red-500')}
                          disabled={loading}
                        />
                        {signUpErrors.email && (
                          <p className="text-sm text-red-600 mt-1">{signUpErrors.email}</p>
                        )}
                      </div>
                      
                      <div>
                        <Input 
                          placeholder="Phone number" 
                          type="tel" 
                          value={signUpForm.phoneNumber}
                          onChange={(e) => {
                            setSignUpForm(prev => ({ ...prev, phoneNumber: e.target.value }));
                          }}
                          disabled={loading}
                        />
                      </div>
                      
                      <div>
                        <div className="relative">
                          <Input 
                            placeholder="Password" 
                            type={showPassword ? 'text' : 'password'}
                            value={signUpForm.password}
                            onChange={(e) => {
                              setSignUpForm(prev => ({ ...prev, password: e.target.value }));
                              if (signUpErrors.password) {
                                setSignUpErrors(prev => ({ ...prev, password: undefined }));
                              }
                            }}
                            className={cn(signUpErrors.password && 'border-red-500', 'pr-10')}
                            disabled={loading}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={loading}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                        {signUpErrors.password && (
                          <p className="text-sm text-red-600 mt-1">{signUpErrors.password}</p>
                        )}
                        
                        {/* Password Strength Indicator */}
                        {signUpForm.password && (
                          <div className="mt-2">
                            <PasswordStrength 
                              password={signUpForm.password} 
                              showRequirements={true}
                              className="text-xs"
                            />
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <div className="relative">
                          <Input 
                            placeholder="Confirm password" 
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={signUpForm.confirmPassword}
                            onChange={(e) => {
                              setSignUpForm(prev => ({ ...prev, confirmPassword: e.target.value }));
                              if (signUpErrors.confirmPassword) {
                                setSignUpErrors(prev => ({ ...prev, confirmPassword: undefined }));
                              }
                            }}
                            className={cn(signUpErrors.confirmPassword && 'border-red-500', 'pr-10')}
                            disabled={loading}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            disabled={loading}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                        {signUpErrors.confirmPassword && (
                          <p className="text-sm text-red-600 mt-1">{signUpErrors.confirmPassword}</p>
                        )}
                      </div>
                      
                      {/* Conditional Fields */}
                      {signUpForm.userType === 'nonprofit' && (
                        <>
                          <div>
                            <Input 
                              placeholder="Organization name" 
                              value={signUpForm.organizationName || ''}
                              onChange={(e) => {
                                setSignUpForm(prev => ({ ...prev, organizationName: e.target.value }));
                                if (signUpErrors.organizationName) {
                                  setSignUpErrors(prev => ({ ...prev, organizationName: undefined }));
                                }
                              }}
                              className={cn(signUpErrors.organizationName && 'border-red-500')}
                              disabled={loading}
                            />
                            {signUpErrors.organizationName && (
                              <p className="text-sm text-red-600 mt-1">{signUpErrors.organizationName}</p>
                            )}
                          </div>
                          <div>
                            <Input 
                              placeholder="Registration number" 
                              value={signUpForm.registrationNumber || ''}
                              onChange={(e) => {
                                setSignUpForm(prev => ({ ...prev, registrationNumber: e.target.value }));
                                if (signUpErrors.registrationNumber) {
                                  setSignUpErrors(prev => ({ ...prev, registrationNumber: undefined }));
                                }
                              }}
                              className={cn(signUpErrors.registrationNumber && 'border-red-500')}
                              disabled={loading}
                            />
                            {signUpErrors.registrationNumber && (
                              <p className="text-sm text-red-600 mt-1">{signUpErrors.registrationNumber}</p>
                            )}
                          </div>
                          <Input 
                            placeholder="Website (optional)" 
                            value={signUpForm.website || ''}
                            onChange={(e) => {
                              setSignUpForm(prev => ({ ...prev, website: e.target.value }));
                            }}
                            disabled={loading}
                          />
                        </>
                      )}
                      
                    </div>
                  )}
                </div>
                
                {signUpForm.userType && (
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                )}
              </form>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 text-center">
            <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;