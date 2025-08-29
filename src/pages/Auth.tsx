import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const Auth = () => {
  const [userType, setUserType] = useState("");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-primary">Bridge Needs</span>
          </div>
          <CardTitle>Join Our Community</CardTitle>
          <CardDescription>
            Connect with causes that matter and make a real difference
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="space-y-4">
              <div className="space-y-2">
                <Input placeholder="Email address" type="email" />
                <Input placeholder="Password" type="password" />
              </div>
              <Button className="w-full" variant="default">
                Sign In
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
                onClick={async () => {
                  const { error } = await supabase.auth.signInWithOAuth({
                    provider: "google",
                    options: {
                      redirectTo: window.location.origin,
                    },
                  });
                  if (error) {
                    toast({
                      title: "Google sign-in failed",
                      description: error.message,
                      variant: "destructive",
                    });
                  }
                }}
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
            
            <TabsContent value="signup" className="space-y-4">
              <div className="space-y-4">
                <Select value={userType} onValueChange={setUserType}>
                  <SelectTrigger>
                    <SelectValue placeholder="I want to join as..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual Donor</SelectItem>
                    <SelectItem value="nonprofit">Non-Profit Organization</SelectItem>
                    <SelectItem value="business">Business/Corporate</SelectItem>
                    <SelectItem value="volunteer">Volunteer</SelectItem>
                    <SelectItem value="recipient">Someone in Need</SelectItem>
                  </SelectContent>
                </Select>
                
                {userType && (
                  <div className="space-y-2">
                    <Input placeholder="Full name" />
                    <Input placeholder="Email address" type="email" />
                    <Input placeholder="Phone number" type="tel" />
                    <Input placeholder="Password" type="password" />
                    <Input placeholder="Confirm password" type="password" />
                    
                    {userType === "nonprofit" && (
                      <>
                        <Input placeholder="Organization name" />
                        <Input placeholder="Registration number" />
                        <Input placeholder="Website" />
                      </>
                    )}
                    
                    {userType === "business" && (
                      <>
                        <Input placeholder="Company name" />
                        <Input placeholder="Business registration" />
                        <Input placeholder="Website" />
                      </>
                    )}
                  </div>
                )}
              </div>
              
              {userType && (
                <Button className="w-full" variant="default">
                  Create Account
                </Button>
              )}
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