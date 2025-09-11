import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Shield, Calendar, Heart, DollarSign, TrendingUp, ArrowRight, CreditCard, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { donationService, DonationHistory } from '@/lib/donationService';
import { userService, UserProfile } from '@/lib/userService';

const IndividualDashboard: React.FC = () => {
  const { user, isEmailVerified } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [recentDonations, setRecentDonations] = useState<DonationHistory[]>([]);
  const [donationStats, setDonationStats] = useState({
    totalDonated: 0,
    donationCount: 0,
    recurringDonations: 0
  });
  const [loading, setLoading] = useState(true);

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getJoinDate = () => {
    if (user?.created_at) {
      return new Date(user.created_at as string).toLocaleDateString();
    }
    return 'Unknown';
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Load user profile
        const { data: profile } = await userService.getCurrentUserProfile();
        if (profile) {
          setUserProfile(profile);
        }

        // Load donation data
        const [donationsResult, statsResult] = await Promise.all([
          donationService.getUserDonations(3, 0), // Get last 3 donations
          donationService.getUserDonationStats()
        ]);

        if (!donationsResult.error) {
          setRecentDonations(donationsResult.donations);
        }

        if (!statsResult.error) {
          setDonationStats({
            totalDonated: statsResult.totalDonated,
            donationCount: statsResult.donationCount,
            recurringDonations: statsResult.recurringDonations
          });
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back!</h1>
        <p className="text-gray-600">
          Hello {userProfile?.full_name || user?.email}, here's your donation activity and impact.
        </p>
      </div>

      {/* Profile Information Card */}
      <Card>
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
                <p className="text-sm font-medium text-gray-900">Account Type</p>
                <Badge variant="outline">Individual Donor</Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Member since</p>
                <p className="text-sm text-gray-600">{getJoinDate()}</p>
              </div>
            </div>
            
            {userProfile?.phone_number && (
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Phone</p>
                  <p className="text-sm text-gray-600">{userProfile.phone_number}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Donation Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Your Giving Impact
          </CardTitle>
          <CardDescription>
            See the difference you're making through your donations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(donationStats.totalDonated)}</p>
                <p className="text-sm text-green-700">Total Donated</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <Heart className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-900">{donationStats.donationCount}</p>
                <p className="text-sm text-blue-700">Donations Made</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-purple-900">{donationStats.recurringDonations}</p>
                <p className="text-sm text-purple-700">Recurring Donations</p>
              </div>
            </div>
          </div>

          {/* Recent Donations */}
          {recentDonations.length > 0 ? (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Recent Donations</h4>
              <div className="space-y-3">
                {recentDonations.map((donation) => (
                  <div key={donation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Heart className="h-4 w-4 text-red-500" />
                      <div>
                        <p className="font-medium text-gray-900">{donation.target_name}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(donation.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(donation.amount, donation.currency)}
                      </p>
                      <Badge variant={donation.payment_status === 'succeeded' ? 'default' : 'destructive'} className="text-xs">
                        {donation.payment_status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-center mt-4">
                <Link to="/donations">
                  <Button variant="outline" className="flex items-center gap-2">
                    View All Donations
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No donations yet</h4>
              <p className="text-gray-500 mb-4">Start making a difference by donating to causes you care about.</p>
              <Link to="/organizations">
                <Button className="bg-green-600 hover:bg-green-700">
                  <Heart className="w-4 h-4 mr-2" />
                  Make Your First Donation
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks and navigation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/organizations">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <Heart className="h-5 w-5" />
                <span className="font-medium">Donate to Organizations</span>
                <span className="text-xs text-gray-500">Support verified nonprofits</span>
              </Button>
            </Link>
            
            <Link to="/campaigns">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <TrendingUp className="h-5 w-5" />
                <span className="font-medium">Support Campaigns</span>
                <span className="text-xs text-gray-500">Help specific causes</span>
              </Button>
            </Link>
            
            <Link to="/donations">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <DollarSign className="h-5 w-5" />
                <span className="font-medium">View Donation History</span>
                <span className="text-xs text-gray-500">Track your contributions</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Account Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Account Management
          </CardTitle>
          <CardDescription>
            Manage your account settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="h-16 flex flex-col gap-1">
              <User className="h-4 w-4" />
              <span className="text-sm font-medium">Edit Profile</span>
              <span className="text-xs text-gray-500">Update your information</span>
            </Button>
            
            <Button variant="outline" className="h-16 flex flex-col gap-1">
              <CreditCard className="h-4 w-4" />
              <span className="text-sm font-medium">Payment Methods</span>
              <span className="text-xs text-gray-500">Manage saved cards</span>
            </Button>
            
            <Button variant="outline" className="h-16 flex flex-col gap-1">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">Privacy Settings</span>
              <span className="text-xs text-gray-500">Control your data</span>
            </Button>
            
            <Button variant="outline" className="h-16 flex flex-col gap-1">
              <Mail className="h-4 w-4" />
              <span className="text-sm font-medium">Notifications</span>
              <span className="text-xs text-gray-500">Email preferences</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IndividualDashboard;
