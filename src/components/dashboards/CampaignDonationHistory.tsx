import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  CreditCard,
  Box,
  TrendingUp,
  Gift,
  Filter,
  Eye,
  Search,
  Calendar,
  User,
  MessageSquare
} from "lucide-react";
import { unifiedDonationService } from "@/lib/unifiedDonationService";
import { UnifiedDonation, DonationStats, DonationType } from "@/types/donations";
import { format } from "date-fns";

interface CampaignDonationHistoryProps {
  campaignId: string;
  campaignTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CampaignDonationHistory({
  campaignId,
  campaignTitle,
  open,
  onOpenChange
}: CampaignDonationHistoryProps) {
  const [donations, setDonations] = useState<UnifiedDonation[]>([]);
  const [stats, setStats] = useState<DonationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [donationType, setDonationType] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  useEffect(() => {
    if (open && campaignId) {
      loadData();
    }
  }, [open, campaignId, donationType, status, sortBy]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: any = {
        campaignId,
        page: 1,
        pageSize: 50, // Load more for scrolling
        sorting: { field: 'created_at', direction: 'desc' },
        filters: {}
      };

      // Apply filters
      if (donationType !== 'all') filters.filters.donationType = donationType;
      if (status !== 'all') filters.filters.status = status;
      
      // Apply sorting
      if (sortBy === 'oldest') filters.sorting = { field: 'created_at', direction: 'asc' };
      if (sortBy === 'amount_high') filters.sorting = { field: 'amount', direction: 'desc' };
      if (sortBy === 'amount_low') filters.sorting = { field: 'amount', direction: 'asc' };

      const result = await unifiedDonationService.getDonationHistory(filters);
      
      setDonations(result.donations);
      setStats(result.stats);
    } catch (err) {
      setError("Failed to load donation history");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-[#FDF8F5]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{campaignTitle}</DialogTitle>
          <DialogDescription className="text-muted-foreground text-lg">
            Donation History
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white border-none shadow-sm">
              <CardContent className="p-6">
                <div className="text-muted-foreground text-sm font-medium mb-2">Cash Donations</div>
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="w-5 h-5 text-green-600" />
                  <span className="text-2xl font-bold text-gray-900">{stats?.totalCashDonations || 0}</span>
                </div>
                <div className="text-green-600 font-medium text-sm">
                  {formatCurrency(stats?.totalCashAmount || 0)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-none shadow-sm">
              <CardContent className="p-6">
                <div className="text-muted-foreground text-sm font-medium mb-2">Physical Donations</div>
                <div className="flex items-center gap-2 mb-1">
                  <Box className="w-5 h-5 text-blue-600" />
                  <span className="text-2xl font-bold text-gray-900">{stats?.totalPhysicalDonations || 0}</span>
                </div>
                <div className="text-blue-600 font-medium text-sm">
                  {formatCurrency(stats?.totalEstimatedValue || 0)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-none shadow-sm">
              <CardContent className="p-6">
                <div className="text-muted-foreground text-sm font-medium mb-2">Total Value</div>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  <span className="text-2xl font-bold text-gray-900">
                    {formatCurrency((stats?.totalCashAmount || 0) + (stats?.totalEstimatedValue || 0))}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-none shadow-sm">
              <CardContent className="p-6">
                <div className="text-muted-foreground text-sm font-medium mb-2">Total Donations</div>
                <div className="flex items-center gap-2 mb-1">
                  <Gift className="w-5 h-5 text-orange-600" />
                  <span className="text-2xl font-bold text-gray-900">
                    {(stats?.totalCashDonations || 0) + (stats?.totalPhysicalDonations || 0)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters Section */}
          <Card className="bg-white border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-gray-700" />
                <h3 className="font-semibold text-lg text-gray-900">Filters & Search</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Donation Type</label>
                  <Select value={donationType} onValueChange={setDonationType}>
                    <SelectTrigger className="bg-gray-50 border-gray-200">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="cash">Cash Only</SelectItem>
                      <SelectItem value="physical">Physical Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="bg-gray-50 border-gray-200">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="succeeded">Succeeded</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Target Type</label>
                  <Select disabled defaultValue="campaign">
                    <SelectTrigger className="bg-gray-50 border-gray-200 opacity-70">
                      <SelectValue placeholder="All Targets" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="campaign">Campaign Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Sort By</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="bg-gray-50 border-gray-200">
                      <SelectValue placeholder="Newest First" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="amount_high">Amount: High to Low</SelectItem>
                      <SelectItem value="amount_low">Amount: Low to High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Donation History List */}
          <div className="space-y-4">
            <h3 className="font-semibold text-xl text-gray-800">Donation History</h3>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <p className="text-muted-foreground">Loading donations...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-500 bg-red-50 rounded-lg">
                <p>{error}</p>
                <Button variant="outline" className="mt-4" onClick={loadData}>
                  Try Again
                </Button>
              </div>
            ) : donations.length === 0 ? (
              <div className="text-center py-12 border rounded-lg bg-white shadow-sm">
                <Gift className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                <h3 className="text-lg font-medium text-gray-900">No donations found</h3>
                <p className="text-muted-foreground">Try adjusting your filters or check back later.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {donations.map((donation) => (
                  <Card key={donation.id} className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`p-3 rounded-full ${donation.type === 'cash' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                          {donation.type === 'cash' ? <CreditCard className="w-5 h-5" /> : <Box className="w-5 h-5" />}
                        </div>
                        
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center flex-wrap gap-2">
                            <h4 className="font-semibold text-gray-900">{campaignTitle}</h4>
                            <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                              {donation.targetType}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={`
                                ${donation.status === 'succeeded' || donation.status === 'confirmed' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                                ${donation.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''}
                                ${donation.status === 'failed' || donation.status === 'declined' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                              `}
                            >
                              {donation.status === 'succeeded' && <span className="mr-1">✓</span>}
                              {donation.status}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {donation.donorName || 'Anonymous'}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(donation.createdAt), 'MMM d, yyyy, h:mm a')}
                            </div>
                          </div>

                          {donation.message && (
                            <p className="text-sm text-gray-500 italic mt-1">
                              "{donation.message}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                        <div className="text-right">
                          <div className="font-bold text-gray-900 text-lg">
                            {donation.type === 'cash' 
                              ? formatCurrency(donation.amount || 0, donation.currency)
                              : formatCurrency(donation.estimatedValue || 0)
                            }
                          </div>
                          {donation.type === 'physical' && (
                            <div className="text-xs text-muted-foreground">Estimated Value</div>
                          )}
                        </div>
                        
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-900 hover:bg-black/5 rounded-full">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
