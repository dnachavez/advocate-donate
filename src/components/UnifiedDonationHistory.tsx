import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import {
  CreditCard,
  Package,
  Calendar,
  Filter,
  Search,
  Eye,
  TrendingUp,
  DollarSign,
  Gift,
  User,
  Building,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { donationService } from '../lib/donationService';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { physicalDonationService } from '../lib/physicalDonationService';
import {
  UnifiedDonation,
  DonationHistoryFilters,
  DonationHistorySort,
  DonationStats,
  DonationType,
  DonationStatus,
  PhysicalDonationStatus,
  PickupPreference,
  PhysicalDonationWithItems,
  DonationItem
} from '../types/donations';

interface UnifiedDonationHistoryProps {
  userId?: string;
  donorEmail?: string;
  organizationId?: string;
  campaignId?: string;
  showFilters?: boolean;
  pageSize?: number;
  className?: string;
}

const UnifiedDonationHistory: React.FC<UnifiedDonationHistoryProps> = ({
  userId,
  donorEmail,
  organizationId,
  campaignId,
  showFilters = true,
  pageSize = 20,
  className = ''
}) => {
  const [donations, setDonations] = useState<UnifiedDonation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DonationStats | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState<UnifiedDonation | null>(null);

  const [filters, setFilters] = useState<DonationHistoryFilters>({
    donationType: 'all',
    status: 'all',
    targetType: 'all'
  });

  const [sorting, setSorting] = useState<DonationHistorySort>({
    field: 'created_at',
    direction: 'desc'
  });

  // Normalize target type from string to typed union
  const mapTargetType = (value?: string): 'campaign' | 'organization' | 'general' => {
    switch (value) {
      case 'campaign':
      case 'organization':
        return value;
      default:
        return 'general';
    }
  };

  // Load cash donations based on context
  const loadCashDonations = useCallback(async (page: number): Promise<UnifiedDonation[]> => {
    try {
      const offset = (page - 1) * pageSize;

      // Organization context: received donations (cash)
      if (organizationId) {
        const { donations, error } = await donationService.getOrganizationReceivedDonations(
          organizationId,
          pageSize,
          offset
        );
        if (error) {
          console.error('Error loading org cash donations:', error);
          return [];
        }
        return (donations || []).map((d) => ({
          id: d.id,
          type: 'cash',
          donorName: 'Donor',
          donorEmail: '',
          message: d.message,
          targetType: mapTargetType(d.target_type as string),
          targetId: d.target_id,
          targetName: d.target_name,
          createdAt: d.created_at,
          status: d.payment_status as DonationStatus,
          amount: d.amount,
        }));
      }

      // Campaign context: donations to a specific campaign
      if (campaignId) {
        const { data, error } = await supabase
          .from('donations')
          .select('*')
          .eq('payment_status', 'succeeded')
          .eq('target_type', 'campaign')
          .eq('target_id', campaignId)
          .order('created_at', { ascending: false })
          .range(offset, offset + pageSize - 1);

        if (error) {
          console.error('Error loading campaign cash donations:', error);
          return [];
        }

        const rows = (data || []) as Tables<'donations'>[];
        return rows.map((d) => ({
          id: d.id,
          type: 'cash',
          donorName: d.donor_name || d.donor_email || 'Donor',
          donorEmail: d.donor_email || '',
          message: d.message || undefined,
          targetType: mapTargetType(d.target_type || undefined),
          targetId: d.target_id || undefined,
          targetName: d.target_name,
          createdAt: d.created_at,
          status: d.payment_status as DonationStatus,
          amount: d.amount,
        }));
      }

      // User/donor context: current user's donations
      if (userId || donorEmail) {
        const { donations, error } = await donationService.getUserDonations(pageSize, offset);
        if (error) {
          console.error('Error loading user cash donations:', error);
          return [];
        }
        return (donations || []).map((d) => ({
          id: d.id,
          type: 'cash',
          donorName: 'You',
          donorEmail: '',
          message: d.message,
          targetType: mapTargetType(d.target_type),
          targetId: d.target_id,
          targetName: d.target_name,
          createdAt: d.created_at,
          status: d.payment_status as DonationStatus,
          amount: d.amount,
        }));
      }

      return [];
    } catch (err) {
      console.error('Error in loadCashDonations:', err);
      return [];
    }
  }, [organizationId, campaignId, userId, donorEmail, pageSize]);

  // Load physical donations based on context
  const loadPhysicalDonations = useCallback(async (page: number): Promise<UnifiedDonation[]> => {
    try {
      let physicalDonations: PhysicalDonationWithItems[] = [];

      if (organizationId) {
        physicalDonations = await physicalDonationService.getDonationsForOrganization(
          organizationId,
          undefined,
          pageSize,
          (page - 1) * pageSize
        );
      } else if (campaignId) {
        physicalDonations = await physicalDonationService.getDonationsForCampaign(
          campaignId,
          undefined,
          pageSize,
          (page - 1) * pageSize
        );
      } else if (userId || donorEmail) {
        physicalDonations = await physicalDonationService.getDonationsForDonor(
          donorEmail || '',
          userId,
          pageSize,
          (page - 1) * pageSize
        );
      }

      return physicalDonations.map(donation => ({
        id: donation.id,
        type: 'physical' as DonationType,
        donorName: donation.donor_name,
        donorEmail: donation.donor_email,
        message: donation.message,
        targetType: mapTargetType(donation.target_type),
        targetId: donation.target_id,
        targetName: donation.target_name,
        createdAt: donation.created_at || '',
        status: donation.donation_status as PhysicalDonationStatus,
        estimatedValue: donation.estimated_value,
        pickupPreference: (donation.pickup_preference as PickupPreference | undefined),
        donationItems: donation.donation_items,
        coordinatorNotes: donation.coordinator_notes
      }));
    } catch (error) {
      console.error('Error loading physical donations:', error);
      return [];
    }
  }, [organizationId, campaignId, userId, donorEmail, pageSize]);

  const loadDonations = useCallback(async (page = 1, resetList = false) => {
    setLoading(true);
    setError(null);

    try {
      // Load both cash and physical donations
      const [cashDonations, physicalDonations] = await Promise.all([
        loadCashDonations(page),
        loadPhysicalDonations(page)
      ]);

      // Combine and sort donations
      const allDonations = [...cashDonations, ...physicalDonations];
      const sortedDonations = sortDonations(allDonations, sorting);
      const filteredDonations = filterDonations(sortedDonations, filters);

      if (resetList) {
        setDonations(filteredDonations);
      } else {
        setDonations(prev => [...prev, ...filteredDonations]);
      }

      setHasMore(filteredDonations.length === pageSize);
      calculateStats(allDonations);
    } catch (err) {
      setError('Failed to load donation history');
      console.error('Error loading donations:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, sorting, pageSize, loadCashDonations, loadPhysicalDonations]);

  const sortDonations = (donations: UnifiedDonation[], sort: DonationHistorySort): UnifiedDonation[] => {
    return [...donations].sort((a, b) => {
      let aValue, bValue;

      switch (sort.field) {
        case 'created_at':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'amount':
          aValue = a.amount || a.estimatedValue || 0;
          bValue = b.amount || b.estimatedValue || 0;
          break;
        case 'donor_name':
          aValue = a.donorName.toLowerCase();
          bValue = b.donorName.toLowerCase();
          break;
        default:
          return 0;
      }

      if (sort.direction === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  };

  const filterDonations = (donations: UnifiedDonation[], filters: DonationHistoryFilters): UnifiedDonation[] => {
    return donations.filter(donation => {
      if (filters.donationType !== 'all' && donation.type !== filters.donationType) {
        return false;
      }

      if (filters.status !== 'all' && donation.status !== filters.status) {
        return false;
      }

      if (filters.targetType !== 'all' && donation.targetType !== filters.targetType) {
        return false;
      }

      if (filters.dateRange) {
        const donationDate = new Date(donation.createdAt);
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        if (donationDate < startDate || donationDate > endDate) {
          return false;
        }
      }

      if (filters.minAmount && (donation.amount || donation.estimatedValue || 0) < filters.minAmount) {
        return false;
      }

      if (filters.maxAmount && (donation.amount || donation.estimatedValue || 0) > filters.maxAmount) {
        return false;
      }

      return true;
    });
  };

  const calculateStats = (donations: UnifiedDonation[]) => {
    const cashDonations = donations.filter(d => d.type === 'cash');
    const physicalDonations = donations.filter(d => d.type === 'physical');

    const totalCashAmount = cashDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
    const totalEstimatedValue = physicalDonations.reduce((sum, d) => sum + (d.estimatedValue || 0), 0);

    setStats({
      totalCashDonations: cashDonations.length,
      totalPhysicalDonations: physicalDonations.length,
      totalCashAmount,
      totalEstimatedValue,
      donationsByMonth: [], // Would implement monthly breakdown
      topCategories: [] // Would implement category breakdown
    });
  };

  const handleFilterChange = (field: keyof DonationHistoryFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setCurrentPage(1);
  };

  const handleSortChange = (field: DonationHistorySort['field'], direction: DonationHistorySort['direction']) => {
    setSorting({ field, direction });
    setCurrentPage(1);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string, type: DonationType): string => {
    if (type === 'cash') {
      const colors: Record<string, string> = {
        succeeded: 'bg-green-100 text-green-800',
        pending: 'bg-yellow-100 text-yellow-800',
        failed: 'bg-red-100 text-red-800',
        processing: 'bg-blue-100 text-blue-800'
      };
      return colors[status] || 'bg-gray-100 text-gray-800';
    } else {
      const colors: Record<string, string> = {
        pending: 'bg-yellow-100 text-yellow-800',
        confirmed: 'bg-blue-100 text-blue-800',
        in_transit: 'bg-purple-100 text-purple-800',
        received: 'bg-green-100 text-green-800',
        cancelled: 'bg-red-100 text-red-800',
        declined: 'bg-red-100 text-red-800'
      };
      return colors[status] || 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string, type: DonationType) => {
    if (type === 'cash') {
      switch (status) {
        case 'succeeded':
        case 'received':
          return <CheckCircle className="h-4 w-4" />;
        case 'failed':
        case 'cancelled':
        case 'declined':
          return <AlertCircle className="h-4 w-4" />;
        default:
          return <Clock className="h-4 w-4" />;
      }
    } else {
      switch (status) {
        case 'received':
          return <CheckCircle className="h-4 w-4" />;
        case 'cancelled':
        case 'declined':
          return <AlertCircle className="h-4 w-4" />;
        default:
          return <Clock className="h-4 w-4" />;
      }
    }
  };

  useEffect(() => {
    loadDonations(1, true);
  }, [loadDonations]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Statistics Summary */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Cash Donations</p>
                  <p className="text-2xl font-bold">{stats.totalCashDonations}</p>
                  <p className="text-sm text-green-600">{formatCurrency(stats.totalCashAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Physical Donations</p>
                  <p className="text-2xl font-bold">{stats.totalPhysicalDonations}</p>
                  <p className="text-sm text-blue-600">{formatCurrency(stats.totalEstimatedValue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(stats.totalCashAmount + stats.totalEstimatedValue)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Gift className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Donations</p>
                  <p className="text-2xl font-bold">
                    {stats.totalCashDonations + stats.totalPhysicalDonations}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filters & Search</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Donation Type</Label>
                <Select
                  value={filters.donationType || 'all'}
                  onValueChange={(value) => handleFilterChange('donationType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="cash">Cash Only</SelectItem>
                    <SelectItem value="physical">Physical Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(value) => handleFilterChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="succeeded">Succeeded</SelectItem>
                    <SelectItem value="received">Received</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Target Type</Label>
                <Select
                  value={filters.targetType || 'all'}
                  onValueChange={(value) => handleFilterChange('targetType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Targets</SelectItem>
                    <SelectItem value="campaign">Campaigns</SelectItem>
                    <SelectItem value="organization">Organizations</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sort By</Label>
                <Select
                  value={`${sorting.field}-${sorting.direction}`}
                  onValueChange={(value) => {
                    const [field, direction] = value.split('-') as [DonationHistorySort['field'], DonationHistorySort['direction']];
                    handleSortChange(field, direction);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at-desc">Newest First</SelectItem>
                    <SelectItem value="created_at-asc">Oldest First</SelectItem>
                    <SelectItem value="amount-desc">Highest Amount</SelectItem>
                    <SelectItem value="amount-asc">Lowest Amount</SelectItem>
                    <SelectItem value="donor_name-asc">Donor Name A-Z</SelectItem>
                    <SelectItem value="donor_name-desc">Donor Name Z-A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Donations List */}
      <Card>
        <CardHeader>
          <CardTitle>Donation History</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading && donations.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading donations...</span>
            </div>
          ) : donations.length === 0 ? (
            <div className="text-center py-8">
              <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No donations found</h3>
              <p className="text-muted-foreground">
                No donations match your current filters.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {donations.map((donation) => (
                <div key={donation.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className={`p-2 rounded-full ${
                        donation.type === 'cash' ? 'bg-green-100' : 'bg-blue-100'
                      }`}>
                        {donation.type === 'cash' ? (
                          <CreditCard className="h-4 w-4 text-green-600" />
                        ) : (
                          <Package className="h-4 w-4 text-blue-600" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium truncate">{donation.targetName}</h4>
                          <Badge variant="outline" className="text-xs">
                            {donation.targetType}
                          </Badge>
                          <Badge className={`text-xs ${getStatusColor(donation.status, donation.type)}`}>
                            {getStatusIcon(donation.status, donation.type)}
                            <span className="ml-1">{donation.status}</span>
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <User className="h-3 w-3" />
                            <span>{donation.donorName}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(donation.createdAt)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-3 w-3" />
                            <span>
                              {donation.type === 'cash' 
                                ? formatCurrency(donation.amount || 0)
                                : `Est. ${formatCurrency(donation.estimatedValue || 0)}`
                              }
                            </span>
                          </div>
                        </div>

                        {donation.message && (
                          <p className="text-sm text-muted-foreground mt-2 italic">
                            "{donation.message}"
                          </p>
                        )}

                        {donation.type === 'physical' && donation.donationItems && donation.donationItems.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground mb-1">
                              Items: {donation.donationItems.length} item(s)
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {donation.donationItems.slice(0, 3).map((item, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {item.item_name}
                                </Badge>
                              ))}
                              {donation.donationItems.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{donation.donationItems.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedDonation(donation)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Donation Details</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          {selectedDonation && (
                            <>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium">Type</Label>
                                  <p className="text-sm">{selectedDonation.type}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Status</Label>
                                  <Badge className={`text-xs ${getStatusColor(selectedDonation.status, selectedDonation.type)}`}>
                                    {selectedDonation.status}
                                  </Badge>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Donor</Label>
                                  <p className="text-sm">{selectedDonation.donorName}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Date</Label>
                                  <p className="text-sm">{formatDate(selectedDonation.createdAt)}</p>
                                </div>
                              </div>
                              
                              {selectedDonation.message && (
                                <div>
                                  <Label className="text-sm font-medium">Message</Label>
                                  <p className="text-sm">{selectedDonation.message}</p>
                                </div>
                              )}

                              {selectedDonation.type === 'physical' && selectedDonation.donationItems && (
                                <div>
                                  <Label className="text-sm font-medium">Items</Label>
                                  <div className="space-y-2 mt-2">
                                    {selectedDonation.donationItems.map((item, index) => (
                                      <div key={index} className="border rounded p-2">
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <p className="font-medium">{item.item_name}</p>
                                            <p className="text-sm text-muted-foreground">
                                              {item.quantity} {item.unit} • {item.condition}
                                            </p>
                                          </div>
                                          {item.estimated_value_per_unit && (
                                            <Badge variant="outline">
                                              {formatCurrency(item.quantity * item.estimated_value_per_unit)}
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}

              {hasMore && (
                <div className="text-center pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => loadDonations(currentPage + 1)}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load More'
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UnifiedDonationHistory;
