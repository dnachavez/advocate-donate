import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, LogOut } from 'lucide-react';
import Navigation from '@/components/Navigation';
import IndividualDashboard from '@/components/dashboards/IndividualDashboard';
import OrganizationDashboard from '@/components/dashboards/OrganizationDashboard';
import { userService, UserProfile } from '@/lib/userService';
import { Button } from '@/components/ui/button';

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSignOut = async () => {
    await signOut();
  };

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const { data: profile, error: profileError } = await userService.getCurrentUserProfile();
        
        if (profileError) {
          setError(profileError);
          return;
        }

        setUserProfile(profile);
      } catch (err) {
        console.error('Error loading user profile:', err);
        setError('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Error Loading Dashboard</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-red-600">{error}</p>
                <div className="flex gap-4">
                  <Button onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleSignOut}
                    className="flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Render appropriate dashboard based on user type */}
          {userProfile?.user_type === 'nonprofit' ? (
            <OrganizationDashboard />
          ) : (
            <IndividualDashboard />
          )}

          {/* Global Sign Out Action */}
          <Card className="mt-8">
            <CardContent className="flex justify-end py-4">
              <Button 
                variant="destructive" 
                onClick={handleSignOut}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;