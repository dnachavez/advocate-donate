import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Mail, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { resetPassword, validateEmail } from "@/lib/auth";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [cooldownTime, setCooldownTime] = useState(0);

  // Cooldown timer effect
  React.useEffect(() => {
    if (cooldownTime > 0) {
      const timer = setTimeout(() => setCooldownTime(cooldownTime - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownTime]);

  const validateForm = (): boolean => {
    setError("");
    setEmailError("");

    if (!email.trim()) {
      setEmailError("Email is required");
      return false;
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.error || "Invalid email format");
      return false;
    }

    return true;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (cooldownTime > 0) return;

    setLoading(true);
    setError("");

    try {
      const { error } = await resetPassword(email);
      
      if (error) {
        if (error.includes('rate limit')) {
          setError("Too many reset attempts. Please wait before trying again.");
          setCooldownTime(300); // 5 minutes cooldown
        } else {
          setError(error);
        }
        return;
      }

      setEmailSent(true);
      toast({
        title: "Password reset email sent",
        description: "Check your inbox for a secure reset link. The link will expire in 1 hour.",
      });
      
      // Set a cooldown to prevent spam
      setCooldownTime(60); // 1 minute cooldown
      
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred. Please try again later.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldownTime > 0) return;
    await onSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Forgot Password</CardTitle>
          <CardDescription>
            {emailSent 
              ? "We've sent you a secure reset link" 
              : "Enter your email to receive a password reset link"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* General Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success State */}
          {emailSent && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Password reset email sent successfully! Check your inbox and spam folder.
                The reset link will expire in 1 hour for security.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Email address"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError("");
                }}
                className={emailError ? "border-red-500 focus:border-red-500" : ""}
                disabled={loading}
                required
              />
              {emailError && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {emailError}
                </p>
              )}
            </div>
            
            <Button 
              className="w-full" 
              type="submit" 
              disabled={loading || cooldownTime > 0}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : cooldownTime > 0 ? (
                `Wait ${cooldownTime}s`
              ) : emailSent ? (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Resend Reset Link
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Reset Link
                </>
              )}
            </Button>
          </form>

          {/* Additional Help */}
          {emailSent && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Didn't receive the email?</strong>
              </p>
              <ul className="text-xs text-blue-700 mt-1 space-y-1">
                <li>• Check your spam/junk folder</li>
                <li>• Verify the email address is correct</li>
                <li>• Wait a few minutes for delivery</li>
                {cooldownTime === 0 && (
                  <li>
                    • <button 
                        onClick={handleResend}
                        className="underline hover:no-underline"
                        disabled={loading}
                      >
                        Click here to resend
                      </button>
                  </li>
                )}
              </ul>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link to="/auth" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
