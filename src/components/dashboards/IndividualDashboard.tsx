import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Shield, Calendar, Heart, DollarSign, TrendingUp, ArrowRight, CreditCard, Settings, Package, Trophy, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { donationService, DonationHistory } from '@/lib/donationService';
import { unifiedDonationService } from '@/lib/unifiedDonationService';
import { userService, UserProfile } from '@/lib/userService';
import UnifiedDonationHistory from '@/components/UnifiedDonationHistory';
import { DonationStats } from '@/types/donations';
import { UserBadge } from '@/components/ui/UserBadge';
import { useAchievement, useTierProgress, useAchievementStats } from '@/hooks/useGamification';
import { useNavigate } from 'react-router-dom';

const IndividualDashboard: React.FC = () => {
  const { user, isEmailVerified } = useAuth();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [recentDonations, setRecentDonations] = useState<DonationHistory[]>([]);
  const [donationStats, setDonationStats] = useState<DonationStats>({
    totalCashDonations: 0,
    totalPhysicalDonations: 0,
    totalCashAmount: 0,
    totalEstimatedValue: 0,
    donationsByMonth: [],
    topCategories: []
  });
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Gamification hooks
  const { achievement, isLoading: achievementLoading } = useAchievement();
  const { progress, isLoading: progressLoading } = useTierProgress();
  const { stats: achievementStats, isLoading: statsLoading } = useAchievementStats();

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

        // Load unified donation data
        const [donationsResult, unifiedStats] = await Promise.all([
          donationService.getUserDonations(3, 0), // Get last 3 donations for compatibility
          unifiedDonationService.getDonationStats({ userId: user?.id })
        ]);

        if (!donationsResult.error) {
          setRecentDonations(donationsResult.donations);
        }

        setDonationStats(unifiedStats);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user?.id]);

  // Smooth scroll to full history section when toggled on
  useEffect(() => {
    if (showFullHistory) {
      const handle = window.setTimeout(() => {
        document.getElementById('full-donation-history-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
      return () => window.clearTimeout(handle);
    }
  }, [showFullHistory]);

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

      {/* Achievement Summary Card */}
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Your Achievements
          </CardTitle>
          <CardDescription>
            Track your donation impact and see how you're making a difference
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <UserBadge
                tier={progress?.currentTier}
                isLoading={achievementLoading || progressLoading}
                size="lg"
                clickable={false}
                showLabel={true}
              />
              <div>
                <p className="font-semibold text-lg">
                  {progress?.currentTier?.tier_name ? 
                    progress.currentTier.tier_name.replace('_', ' ').toUpperCase() : 
                    'New Donor'
                  } Tier
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(achievementStats?.totalDonationAmount || 0)} donated across {achievementStats?.organizationsSupportedCount || 0} organizations
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate('/achievements')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Award className="h-4 w-4" />
              View All Achievements
            </Button>
          </div>
          
          {progress?.nextTier && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress to {progress.nextTier.tier_name.replace('_', ' ').toUpperCase()}</span>
                <span>{Math.round(progress.progressPercentage)}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(progress.progressPercentage, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(progress.amountToNextTier || 0)} away from your next tier!
              </p>
            </div>
          )}
          
          {!progress?.nextTier && achievement && (
            <div className="text-center py-2">
              <Trophy className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
              <p className="font-semibold">You've reached the highest tier!</p>
              <p className="text-sm text-muted-foreground">Thank you for your incredible generosity</p>
            </div>
          )}
        </CardContent>
      </Card>

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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(donationStats.totalCashAmount, 'PHP')}</p>
                <p className="text-sm text-green-700">Cash Donated</p>
                <p className="text-xs text-green-600">{donationStats.totalCashDonations} donations</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <Package className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(donationStats.totalEstimatedValue, 'PHP')}</p>
                <p className="text-sm text-blue-700">Physical Value</p>
                <p className="text-xs text-blue-600">{donationStats.totalPhysicalDonations} donations</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
              <Heart className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-purple-900">{donationStats.totalCashDonations + donationStats.totalPhysicalDonations}</p>
                <p className="text-sm text-purple-700">Total Donations</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-orange-900">{donationStats.totalCashDonations + donationStats.totalPhysicalDonations}</p>
                <p className="text-sm text-orange-700">Families Impacted</p>
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
              
              <div className="flex justify-center mt-4 gap-2">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={() => setShowFullHistory(!showFullHistory)}
                >
                  {showFullHistory ? 'Hide' : 'View'} All Donations
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Link to="/donations">
                  <Button variant="default" className="flex items-center gap-2">
                    Donation History Page
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
            
            <Button 
              variant="outline" 
              className="w-full h-20 flex flex-col gap-2"
              onClick={() => setShowFullHistory(!showFullHistory)}
            >
              <DollarSign className="h-5 w-5" />
              <span className="font-medium">{showFullHistory ? 'Hide' : 'Show'} Donation History</span>
              <span className="text-xs text-gray-500">Track all contributions</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Full Donation History */}
      {showFullHistory && (
        <div id="full-donation-history-section">
          <UnifiedDonationHistory
            userId={user?.id}
            donorEmail={user?.email}
            showFilters={true}
            pageSize={10}
            className=""
          />
        </div>
      )}

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
            <Button asChild variant="outline" className="h-16 flex flex-col gap-1">
              <Link to="/edit-profile">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">Edit Profile</span>
                <span className="text-xs text-gray-500">Update your information</span>
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="h-16 flex flex-col gap-1">
              <Link to="/payment-methods">
                <CreditCard className="h-4 w-4" />
                <span className="text-sm font-medium">Payment Methods</span>
                <span className="text-xs text-gray-500">Manage saved cards</span>
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="h-16 flex flex-col gap-1">
              <Link to="/privacy-settings">
                <Shield className="h-4 w-4" />
                <span className="text-sm font-medium">Privacy Settings</span>
                <span className="text-xs text-gray-500">Control your data</span>
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="h-16 flex flex-col gap-1">
              <Link to="/notification-settings">
                <Mail className="h-4 w-4" />
                <span className="text-sm font-medium">Notifications</span>
                <span className="text-xs text-gray-500">Email preferences</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IndividualDashboard;
