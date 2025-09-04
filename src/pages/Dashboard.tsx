import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Shield, Calendar, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navigation from '@/components/Navigation';

const Dashboard: React.FC = () => {
  const { user, signOut, isEmailVerified } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  const getUserRole = () => {
    return user?.user_metadata?.userType || user?.app_metadata?.userType || 'User';
  };

  const getJoinDate = () => {
    if (user?.created_at) {
      return new Date(user.created_at as string).toLocaleDateString();
    }
    return 'Unknown';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user?.user_metadata?.fullName || user?.email}</p>
          </div>

          {/* User Info Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Your account details and verification status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={isEmailVerified() ? 'default' : 'destructive'}>
                        {isEmailVerified() ? 'Verified' : 'Unverified'}
                      </Badge>
                      {!isEmailVerified() && (
                        <Link to="/email-verification" className="text-sm text-blue-600 hover:underline">
                          Verify now
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Role</p>
                    <Badge variant="outline">{getUserRole()}</Badge>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Member since</p>
                    <p className="text-sm text-gray-600">{getJoinDate()}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">User ID</p>
                    <p className="text-sm text-gray-600 font-mono">{user?.id}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and navigation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link to="/create-campaign">
                  <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                    <span className="font-medium">Create Campaign</span>
                    <span className="text-xs text-gray-500">Start a new fundraising campaign</span>
                  </Button>
                </Link>
                
                <Link to="/organizations">
                  <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                    <span className="font-medium">Browse Organizations</span>
                    <span className="text-xs text-gray-500">Discover verified nonprofits</span>
                  </Button>
                </Link>
                
                <Link to="/campaigns">
                  <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                    <span className="font-medium">View Campaigns</span>
                    <span className="text-xs text-gray-500">Explore active campaigns</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Account Management</CardTitle>
              <CardDescription>
                Manage your account settings and security
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                {!isEmailVerified() && (
                  <Link to="/email-verification">
                    <Button variant="default">
                      Verify Email
                    </Button>
                  </Link>
                )}
                
                <Link to="/reset-password">
                  <Button variant="outline">
                    Change Password
                  </Button>
                </Link>
                
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
};

export default Dashboard;