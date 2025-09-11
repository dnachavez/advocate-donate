import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Building2, 
  Mail, 
  Shield, 
  Calendar, 
  Heart, 
  DollarSign, 
  TrendingUp, 
  ArrowRight,
  Plus,
  Users,
  Target,
  AlertCircle,
  CheckCircle,
  Settings,
  BarChart3
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { userService, UserProfileWithOrganization } from '@/lib/userService';
import { organizationService, OrganizationWithCampaigns } from '@/lib/organizationService';

const OrganizationDashboard: React.FC = () => {
  const { user, isEmailVerified } = useAuth();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<UserProfileWithOrganization | null>(null);
  const [organization, setOrganization] = useState<OrganizationWithCampaigns | null>(null);
  const [organizationStats, setOrganizationStats] = useState({
    totalRaised: 0,
    donationCount: 0,
    campaignCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  const formatCurrency = (amount: number, currency: string = 'PHP') => {
    return new Intl.NumberFormat('en-PH', {
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
          
          // Check if organization setup is needed
          if (!profile.organization) {
            setNeedsSetup(true);
          } else {
            setOrganization(profile.organization as OrganizationWithCampaigns);
            
            // Load organization statistics
            const { totalRaised, donationCount, campaignCount } = await organizationService.getOrganizationDonationStats(profile.organization.id);
            setOrganizationStats({
              totalRaised,
              donationCount,
              campaignCount
            });
          }
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

  // If organization setup is needed, show setup prompt
  if (needsSetup) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Organization Setup</h1>
          <p className="text-gray-600">
            Welcome {userProfile?.full_name}! Let's finish setting up your organization profile.
          </p>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your account is registered as a nonprofit organization, but you haven't completed your organization setup yet.
            Please complete the setup to start creating campaigns and receiving donations.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Organization Setup Required
            </CardTitle>
            <CardDescription>
              Complete these steps to activate your organization profile
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <p className="font-medium text-blue-900">Create Organization Profile</p>
                  <p className="text-sm text-blue-700">Set up your organization's public profile with description, mission, and contact details</p>
                </div>
                <Button size="sm" onClick={() => navigate('/organization-setup')}>
                  Start Setup
                </Button>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg opacity-75">
                <Shield className="h-5 w-5 text-gray-500" />
                <div className="flex-1">
                  <p className="font-medium text-gray-700">Verification Process</p>
                  <p className="text-sm text-gray-600">Submit required documents for verification (available after profile setup)</p>
                </div>
                <Badge variant="outline">Pending</Badge>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg opacity-75">
                <Target className="h-5 w-5 text-gray-500" />
                <div className="flex-1">
                  <p className="font-medium text-gray-700">Create Your First Campaign</p>
                  <p className="text-sm text-gray-600">Start fundraising for your cause (available after verification)</p>
                </div>
                <Badge variant="outline">Locked</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Organization Dashboard</h1>
        <p className="text-gray-600">
          Welcome back to {organization?.name || 'your organization'}! Here's your impact overview.
        </p>
      </div>

      {/* Verification Status Alert */}
      {organization?.verification_status === 'pending' && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your organization is pending verification. You can create draft campaigns, but they won't be publicly visible until verification is complete.
          </AlertDescription>
        </Alert>
      )}

      {organization?.verification_status === 'verified' && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Your organization is verified! You can now create public campaigns and receive donations.
          </AlertDescription>
        </Alert>
      )}

      {/* Organization Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organization Overview
          </CardTitle>
          <CardDescription>
            Your organization details and status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">{organization?.name}</p>
                <Badge variant={organization?.verification_status === 'verified' ? 'default' : 'secondary'}>
                  {organization?.verification_status === 'verified' ? 'Verified' : 'Pending Verification'}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">{organization?.email || 'Not provided'}</p>
                <p className="text-sm text-gray-600">Organization Email</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Target className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">{organization?.category || 'Not specified'}</p>
                <p className="text-sm text-gray-600">Category</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">{getJoinDate()}</p>
                <p className="text-sm text-gray-600">Member since</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organization Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Fundraising Impact
          </CardTitle>
          <CardDescription>
            Your organization's fundraising performance and reach
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(organizationStats.totalRaised)}</p>
                <p className="text-sm text-green-700">Total Raised</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <Heart className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-900">{organizationStats.donationCount}</p>
                <p className="text-sm text-blue-700">Total Donations</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
              <Target className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-purple-900">{organizationStats.campaignCount}</p>
                <p className="text-sm text-purple-700">Active Campaigns</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Your Campaigns
              </CardTitle>
              <CardDescription>
                Manage your fundraising campaigns
              </CardDescription>
            </div>
            <Link to="/create-campaign">
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Campaign
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {organization?.campaigns && organization.campaigns.length > 0 ? (
            <div className="space-y-3">
              {organization.campaigns.slice(0, 3).map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Target className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium text-gray-900">{campaign.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                          {campaign.status}
                        </Badge>
                        {campaign.is_urgent && <Badge variant="destructive">Urgent</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(campaign.raised_amount)} / {formatCurrency(campaign.goal_amount)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {Math.round((campaign.raised_amount / campaign.goal_amount) * 100)}% funded
                    </p>
                  </div>
                </div>
              ))}
              
              <div className="flex justify-center pt-4">
                <Link to="/campaigns">
                  <Button variant="outline" className="flex items-center gap-2">
                    View All Campaigns
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h4>
              <p className="text-gray-500 mb-4">Create your first campaign to start fundraising for your cause.</p>
              <Link to="/create-campaign">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Campaign
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
            Common organization management tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/create-campaign">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <Plus className="h-5 w-5" />
                <span className="font-medium">Create Campaign</span>
                <span className="text-xs text-gray-500">Start a new fundraiser</span>
              </Button>
            </Link>
            
            <Button 
              variant="outline" 
              className="w-full h-20 flex flex-col gap-2"
              onClick={() => navigate('/view-donors')}
            >
              <Users className="h-5 w-5" />
              <span className="font-medium">View Donors</span>
              <span className="text-xs text-gray-500">See who supports you</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full h-20 flex flex-col gap-2"
              onClick={() => navigate('/organization-setup')}
            >
              <Settings className="h-5 w-5" />
              <span className="font-medium">Organization Settings</span>
              <span className="text-xs text-gray-500">Manage your profile</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrganizationDashboard;
