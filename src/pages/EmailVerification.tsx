import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2, Mail, ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

const EmailVerification = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error' | 'expired'>('pending');
  const [errorMessage, setErrorMessage] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  
  // Get verification parameters from URL
  const token = searchParams.get('token');
  const type = searchParams.get('type');
  const email = searchParams.get('email');
  
  useEffect(() => {
    // Handle email verification from URL parameters
    if (token && type === 'signup') {
      verifyEmail();
    } else if (type === 'confirmation') {
      // Handle email confirmation link click
      handleEmailConfirmation();
    } else {
      setLoading(false);
      setVerificationStatus('error');
      setErrorMessage('Invalid verification link');
    }
  }, [token, type]);
  
  // Start resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);
  
  const verifyEmail = async () => {
    try {
      setLoading(true);
      
      // Verify the email using Supabase
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token!,
        type: 'signup'
      });
      
      if (error) {
        console.error('Email verification error:', error);
        
        if (error.message.includes('expired')) {
          setVerificationStatus('expired');
          setErrorMessage('This verification link has expired. Please request a new one.');
        } else {
          setVerificationStatus('error');
          setErrorMessage(error.message || 'Failed to verify email address');
        }
        return;
      }
      
      if (data?.user) {
        setVerificationStatus('success');
        toast({
          title: 'Email verified successfully!',
          description: 'Your account has been activated. You can now sign in.',
        });
        
        // Redirect to sign-in page after a delay
        setTimeout(() => {
          navigate('/auth?tab=signin');
        }, 3000);
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationStatus('error');
      setErrorMessage('An unexpected error occurred during verification');
    } finally {
      setLoading(false);
    }
  };
  
  const handleEmailConfirmation = async () => {
    try {
      setLoading(true);
      
      // Handle the email confirmation from Supabase auth state change
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        setVerificationStatus('error');
        setErrorMessage(error.message);
        return;
      }
      
      if (session?.user?.email_confirmed_at) {
        setVerificationStatus('success');
        toast({
          title: 'Email confirmed!',
          description: 'Your email has been successfully confirmed.',
        });
        
        // Redirect to dashboard or home
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setVerificationStatus('error');
        setErrorMessage('Email confirmation failed. Please try again.');
      }
    } catch (error) {
      console.error('Email confirmation error:', error);
      setVerificationStatus('error');
      setErrorMessage('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const resendVerificationEmail = async () => {
    if (!email || resendCooldown > 0) return;
    
    try {
      setResendLoading(true);
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });
      
      if (error) {
        toast({
          title: 'Failed to resend email',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }
      
      toast({
        title: 'Verification email sent',
        description: 'Please check your inbox for a new verification link.',
      });
      
      // Start cooldown
      setResendCooldown(60);
    } catch (error) {
      console.error('Resend error:', error);
      toast({
        title: 'Error',
        description: 'Failed to resend verification email',
        variant: 'destructive',
      });
    } finally {
      setResendLoading(false);
    }
  };
  
  const renderContent = () => {
    if (loading) {
      return (
        <div className="text-center py-8">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Verifying your email...</h3>
          <p className="text-muted-foreground">Please wait while we confirm your email address.</p>
        </div>
      );
    }
    
    switch (verificationStatus) {
      case 'success':
        return (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-green-800 mb-2">Email Verified Successfully!</h3>
            <p className="text-muted-foreground mb-6">
              Your email has been confirmed. You will be redirected to sign in shortly.
            </p>
            <Button onClick={() => navigate('/auth?tab=signin')} className="w-full">
              Continue to Sign In
            </Button>
          </div>
        );
        
      case 'expired':
        return (
          <div className="text-center py-8">
            <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-orange-800 mb-2">Verification Link Expired</h3>
            <p className="text-muted-foreground mb-6">
              This verification link has expired. Please request a new verification email.
            </p>
            {email && (
              <div className="space-y-4">
                <Button 
                  onClick={resendVerificationEmail}
                  disabled={resendLoading || resendCooldown > 0}
                  className="w-full"
                >
                  {resendLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : resendCooldown > 0 ? (
                    `Resend in ${resendCooldown}s`
                  ) : (
                    'Resend Verification Email'
                  )}
                </Button>
                <Button variant="outline" onClick={() => navigate('/auth')} className="w-full">
                  Back to Sign Up
                </Button>
              </div>
            )}
          </div>
        );
        
      case 'error':
      default:
        return (
          <div className="text-center py-8">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-red-800 mb-2">Verification Failed</h3>
            <p className="text-muted-foreground mb-6">
              {errorMessage || 'We couldn\'t verify your email address. Please try again.'}
            </p>
            <div className="space-y-4">
              {email && (
                <Button 
                  onClick={resendVerificationEmail}
                  disabled={resendLoading || resendCooldown > 0}
                  variant="outline"
                  className="w-full"
                >
                  {resendLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : resendCooldown > 0 ? (
                    `Resend in ${resendCooldown}s`
                  ) : (
                    'Resend Verification Email'
                  )}
                </Button>
              )}
              <Button onClick={() => navigate('/auth')} className="w-full">
                Back to Sign Up
              </Button>
            </div>
          </div>
        );
    }
  };
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-primary">Bridge Needs</span>
          </div>
          <CardTitle>Email Verification</CardTitle>
        </CardHeader>
        <CardContent>
          {renderContent()}
          
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

export default EmailVerification;