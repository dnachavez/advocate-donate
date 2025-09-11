console.log('DEBUG: ViewDonors.tsx file loaded');

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Search, Filter, Download, Calendar, DollarSign, Users, TrendingUp, Loader2, RefreshCw, AlertCircle, Heart } from 'lucide-react';
import { donationService, type DonationHistory } from '@/lib/donationService';
import { userService } from '@/lib/userService';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

interface ExtendedDonationHistory extends DonationHistory {
  donor_name?: string;
  donor_email?: string;
  is_anonymous?: boolean;
}

interface UserProfile {
  id: string;
  user_type: string;
  organization?: {
    id: string;
    name: string;
    slug: string;
  };
}

interface DonationStats {
  totalReceived: number;
  donationCount: number;
  recurringDonations: number;
  campaignDonations: number;
  directDonations: number;
}

export default function ViewDonors() {
  console.log('DEBUG COMPONENT: ViewDonors component mounting...');
  const navigate = useNavigate();
  const [donations, setDonations] = useState<ExtendedDonationHistory[]>([]);
  const [stats, setStats] = useState<DonationStats>({
    totalReceived: 0,
    donationCount: 0,
    recurringDonations: 0,
    campaignDonations: 0,
    directDonations: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'organization' | 'campaign'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  const itemsPerPage = 10;

  const loadUserProfile = useCallback(async () => {
    console.log('DEBUG COMPONENT: loadUserProfile called');
    try {
      console.log('DEBUG COMPONENT: Calling userService.getCurrentUserProfile()');
      const { data: profile, error } = await userService.getCurrentUserProfile();
      console.log('DEBUG COMPONENT: Profile result:', { profile, error });
      if (error) {
        console.error('DEBUG COMPONENT: Profile error:', error);
        setError('Failed to load user profile');
        return;
      }
      if (!profile?.organization) {
        console.log('DEBUG COMPONENT: No organization found in profile');
        toast({
          title: 'Access Denied',
          description: 'You must be part of an organization to view donations.',
          variant: 'destructive'
        });
        navigate('/dashboard');
        return;
      }
      console.log('DEBUG COMPONENT: Setting user profile:', profile);
      setUserProfile(profile);
    } catch (err) {
      console.error('DEBUG COMPONENT: loadUserProfile error:', err);
      setError('Failed to load user profile');
    }
  }, [navigate]);

  const loadDonations = useCallback(async () => {
    console.log('DEBUG COMPONENT: loadDonations called with userProfile:', userProfile);
    if (!userProfile?.organization?.id) {
      console.log('DEBUG COMPONENT: No organization ID, returning early');
      return;
    }
    
    console.log('DEBUG COMPONENT: Starting to load donations for org:', userProfile.organization.id);
    setLoading(true);
    setError(null);
    try {
      console.log('DEBUG COMPONENT: Calling donationService.getOrganizationReceivedDonations with params:', {
        orgId: userProfile.organization.id,
        itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage
      });
      
      const offset = (currentPage - 1) * itemsPerPage;
      const result = await donationService.getOrganizationReceivedDonations(
        userProfile.organization.id,
        itemsPerPage,
        offset
      );

      console.log('DEBUG: Service result:', result);

      if (result.error) {
        console.log('DEBUG: Service error:', result.error);
        setError(result.error);
        return;
      }

      let filteredDonations = result.donations as ExtendedDonationHistory[];
      
      // Apply filter
      if (filterType !== 'all') {
        filteredDonations = result.donations.filter(d => d.target_type === filterType) as ExtendedDonationHistory[];
      }

      console.log('DEBUG: Final donations:', filteredDonations);
      setDonations(filteredDonations.map(d => ({ ...d, is_anonymous: d.is_anonymous || false })));
      setTotalPages(Math.ceil(result.total / itemsPerPage));
    } catch (err) {
      console.error('Error loading donations:', err);
      setError('Failed to load donations: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [userProfile, currentPage, filterType]);

  const loadStats = useCallback(async () => {
    console.log('DEBUG COMPONENT: loadStats called with userProfile:', userProfile);
    if (!userProfile?.organization?.id) {
      console.log('DEBUG COMPONENT: No organization ID for stats, returning early');
      return;
    }
    
    console.log('DEBUG COMPONENT: Calling donationService.getOrganizationDonationStats');
    try {
      const result = await donationService.getOrganizationDonationStats(userProfile.organization.id);
      console.log('DEBUG COMPONENT: Stats result:', result);
      if (result.error) {
        console.error('Failed to load stats:', result.error);
        return;
      }
      setStats(result);
    } catch (err) {
      console.error('Failed to load donation statistics:', err);
    }
  }, [userProfile?.organization?.id]);

  useEffect(() => {
    console.log('DEBUG COMPONENT: useEffect for loadUserProfile triggered');
    loadUserProfile();
  }, [loadUserProfile]);

  useEffect(() => {
    console.log('DEBUG COMPONENT: useEffect for loading data triggered, userProfile:', userProfile);
    if (userProfile?.organization?.id) {
      console.log('DEBUG COMPONENT: Organization ID found, loading donations and stats');
      loadDonations();
      loadStats();
    } else {
      console.log('DEBUG COMPONENT: No organization ID found, skipping data load');
    }
  }, [userProfile, loadDonations, loadStats]);

  const filteredDonations = donations.filter(donation => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      donation.donor_name?.toLowerCase().includes(searchLower) ||
      donation.donor_email?.toLowerCase().includes(searchLower) ||
      donation.message?.toLowerCase().includes(searchLower) ||
      donation.amount.toString().includes(searchLower)
    );
  });

  const exportDonations = () => {
    const csvData = filteredDonations.map(donation => ({
      Date: formatDate(donation.created_at),
      'Donor Name': donation.is_anonymous ? 'Anonymous' : (donation.donor_name || 'N/A'),
      'Donor Email': donation.is_anonymous ? 'Anonymous' : (donation.donor_email || 'N/A'),
      Amount: donation.amount,
      Currency: donation.currency,
      Type: donation.target_type === 'organization' ? 'Direct Donation' : 'Campaign Donation',
      Recurring: donation.is_recurring ? 'Yes' : 'No',
      Message: donation.message || 'N/A',
      Status: donation.payment_status
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `donations-${userProfile?.organization?.name}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading && donations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-2 text-lg">Loading donations...</span>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="flex gap-4">
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard')} 
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </Button>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Donors & Donations</h1>
                <p className="text-gray-600">Donations received by {userProfile?.organization?.name}</p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={loadDonations}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button onClick={exportDonations} className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Received</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalReceived)}</div>
                <p className="text-xs text-muted-foreground">From {stats.donationCount} donations</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recurring Donors</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.recurringDonations}</div>
                <p className="text-xs text-muted-foreground">Active subscriptions</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Campaign Donations</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.campaignDonations}</div>
                <p className="text-xs text-muted-foreground">vs {stats.directDonations} direct</p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by donor name, email, or message..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterType} onValueChange={(value: 'all' | 'organization' | 'campaign') => setFilterType(value)}>
                  <SelectTrigger className="w-48">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Donations</SelectItem>
                    <SelectItem value="organization">Direct Donations</SelectItem>
                    <SelectItem value="campaign">Campaign Donations</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Donations List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Donation History
              </CardTitle>
              <CardDescription>
                Complete history of donations received by your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredDonations.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No donations found</h3>
                  <p className="text-gray-500 mb-6">
                    {searchTerm || filterType !== 'all' 
                      ? 'Try adjusting your search or filters'
                      : 'Donations will appear here once received'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredDonations.map((donation) => (
                    <div 
                      key={donation.id} 
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900">
                              {donation.is_anonymous ? 'Anonymous Donor' : (donation.donor_name || 'Anonymous Donor')}
                            </h3>
                            <Badge variant={donation.target_type === 'campaign' ? 'default' : 'secondary'}>
                              {donation.target_type === 'campaign' ? 'Campaign' : 'Direct'}
                            </Badge>
                            {donation.is_recurring && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                Recurring
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(donation.created_at)}
                            </div>
                            {!donation.is_anonymous && donation.donor_email && (
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {donation.donor_email}
                              </div>
                            )}
                          </div>
                          
                          {donation.message && (
                            <p className="text-sm text-gray-600 italic">"{donation.message}"</p>
                          )}
                        </div>
                        
                        <div className="text-right ml-4">
                          <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(donation.amount, donation.currency)}
                          </div>
                          <Badge 
                            variant={donation.payment_status === 'succeeded' ? 'default' : 'destructive'}
                            className="mt-1"
                          >
                            {donation.payment_status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-6 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4 text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
