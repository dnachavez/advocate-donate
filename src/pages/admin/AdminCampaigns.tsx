import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { adminService, type CampaignWithOrganization } from "@/lib/adminService";
import { evidenceService } from "@/services/evidenceService";
import { EvidenceList } from "@/components/evidence/EvidenceList";
import { useToast } from "@/hooks/use-toast";
import { ImpactEvidence } from "@/types/organizations";
import {
  Target,
  Eye,
  Play,
  Pause,
  StopCircle,
  Calendar,
  DollarSign,
  Building2,
  Filter,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

const AdminCampaigns = () => {
  const [campaigns, setCampaigns] = useState<CampaignWithOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignWithOrganization | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  const statusFilter = searchParams.get('status') || 'all';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 10;

  const [campaignEvidence, setCampaignEvidence] = useState<ImpactEvidence[]>([]);

  const loadCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error, totalCount: count } = await adminService.getAllCampaigns(
        limit,
        (page - 1) * limit,
        statusFilter === 'all' ? undefined : statusFilter
      );

      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
      } else if (data) {
        setCampaigns(data);
        setTotalCount(count);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load campaigns",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [limit, page, statusFilter, toast]);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  const loadCampaignEvidence = async (campaignId: string) => {
    try {
      const data = await evidenceService.getEvidenceForTarget('campaign', campaignId);
      setCampaignEvidence(data || []);
    } catch (error) {
      console.error("Failed to load evidence", error);
    }
  };

  useEffect(() => {
    if (selectedCampaign) {
      loadCampaignEvidence(selectedCampaign.slug);
    } else {
      setCampaignEvidence([]);
    }
  }, [selectedCampaign]);

  const handleDeleteEvidence = async (evidenceId: string) => {
    try {
      await evidenceService.deleteEvidence(evidenceId);
      toast({
        title: "Success",
        description: "Evidence deleted successfully",
      });
      if (selectedCampaign) {
        loadCampaignEvidence(selectedCampaign.slug);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete evidence",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = (status: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (status === 'all') {
      newParams.delete('status');
    } else {
      newParams.set('status', status);
    }
    newParams.delete('page');
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    if (newPage === 1) {
      newParams.delete('page');
    } else {
      newParams.set('page', newPage.toString());
    }
    setSearchParams(newParams);
  };

  const handleCampaignStatusUpdate = async (campaignId: string, status: string) => {
    try {
      setActionLoading(true);
      const { error } = await adminService.updateCampaignStatus(campaignId, status);

      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `Campaign status updated to ${status}`,
        });
        setSelectedCampaign(null);
        loadCampaigns();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update campaign status",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-100 text-yellow-800">Paused</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      case 'draft':
      default:
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateProgress = (raised: number, target: number) => {
    return target > 0 ? Math.min((raised / target) * 100, 100) : 0;
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Campaign Management</h1>
        <p className="text-gray-600">Monitor and manage fundraising campaigns</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Campaigns ({totalCount})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No campaigns found</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => {
                    const progress = calculateProgress(campaign.raised_amount, campaign.goal_amount);

                    return (
                      <TableRow key={campaign.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{campaign.title}</div>
                            <div className="text-sm text-gray-500">{campaign.category}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Building2 className="w-4 h-4 mr-2 text-gray-400" />
                            {campaign.organizations?.name || 'Unknown'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(campaign.status)}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>{formatCurrency(campaign.raised_amount)}</span>
                              <span>{formatCurrency(campaign.goal_amount)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <div className="text-xs text-gray-500">{Math.round(progress)}% funded</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {campaign.end_date && (
                            <div className="flex items-center text-sm">
                              <Calendar className="w-4 h-4 mr-1" />
                              {formatDate(campaign.end_date)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedCampaign(campaign)}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  Details
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Campaign Details & Management</DialogTitle>
                                  <DialogDescription>
                                    View campaign details and manage status
                                  </DialogDescription>
                                </DialogHeader>

                                {selectedCampaign && (
                                  <div className="space-y-6">
                                    {/* Campaign Info */}
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <label className="font-medium">Campaign Title</label>
                                        <p className="text-sm text-gray-600">{selectedCampaign.title}</p>
                                      </div>
                                      <div>
                                        <label className="font-medium">Category</label>
                                        <p className="text-sm text-gray-600">{selectedCampaign.category}</p>
                                      </div>
                                      <div>
                                        <label className="font-medium">Organization</label>
                                        <p className="text-sm text-gray-600">{selectedCampaign.organizations?.name}</p>
                                      </div>
                                      <div>
                                        <label className="font-medium">Current Status</label>
                                        <div className="mt-1">{getStatusBadge(selectedCampaign.status)}</div>
                                      </div>
                                    </div>

                                    <div>
                                      <label className="font-medium">Description</label>
                                      <p className="text-sm text-gray-600 mt-1">{selectedCampaign.description}</p>
                                    </div>

                                    {/* Financial Info */}
                                    <div className="grid grid-cols-3 gap-4">
                                      <div>
                                        <label className="font-medium">Target Amount</label>
                                        <p className="text-lg font-bold text-green-600">
                                          {formatCurrency(selectedCampaign.goal_amount)}
                                        </p>
                                      </div>
                                      <div>
                                        <label className="font-medium">Raised Amount</label>
                                        <p className="text-lg font-bold text-blue-600">
                                          {formatCurrency(selectedCampaign.raised_amount)}
                                        </p>
                                      </div>
                                      <div>
                                        <label className="font-medium">Progress</label>
                                        <p className="text-lg font-bold">
                                          {Math.round(calculateProgress(selectedCampaign.raised_amount, selectedCampaign.goal_amount))}%
                                        </p>
                                      </div>
                                    </div>

                                    {/* Dates */}
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <label className="font-medium">Created</label>
                                        <p className="text-sm text-gray-600">
                                          {selectedCampaign.created_at && formatDate(selectedCampaign.created_at)}
                                        </p>
                                      </div>
                                      {selectedCampaign.end_date && (
                                        <div>
                                          <label className="font-medium">Deadline</label>
                                          <p className="text-sm text-gray-600">
                                            {formatDate(selectedCampaign.end_date)}
                                          </p>
                                        </div>
                                      )}
                                    </div>

                                    {/* Status Management */}
                                    <div>
                                      <label className="font-medium mb-3 block">Change Status</label>
                                      <div className="flex flex-wrap gap-2">
                                        {selectedCampaign.status !== 'active' && (
                                          <Button
                                            size="sm"
                                            onClick={() => handleCampaignStatusUpdate(selectedCampaign.id, 'active')}
                                            disabled={actionLoading}
                                            className="bg-green-600 hover:bg-green-700"
                                          >
                                            <Play className="w-4 h-4 mr-2" />
                                            Activate
                                          </Button>
                                        )}

                                        {selectedCampaign.status === 'active' && (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleCampaignStatusUpdate(selectedCampaign.id, 'paused')}
                                            disabled={actionLoading}
                                          >
                                            <Pause className="w-4 h-4 mr-2" />
                                            Pause
                                          </Button>
                                        )}

                                        {selectedCampaign.status !== 'completed' && (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleCampaignStatusUpdate(selectedCampaign.id, 'completed')}
                                            disabled={actionLoading}
                                          >
                                            <StopCircle className="w-4 h-4 mr-2" />
                                            Complete
                                          </Button>
                                        )}

                                        {selectedCampaign.status !== 'cancelled' && (
                                          <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleCampaignStatusUpdate(selectedCampaign.id, 'cancelled')}
                                            disabled={actionLoading}
                                          >
                                            <StopCircle className="w-4 h-4 mr-2" />
                                            Cancel
                                          </Button>
                                        )}
                                      </div>
                                    </div>

                                    {/* Impact Evidence Section */}
                                    <div className="pt-6 border-t">
                                      <h3 className="text-lg font-medium mb-4">Impact Evidence</h3>
                                      <EvidenceList
                                        evidence={campaignEvidence}
                                        onDelete={handleDeleteEvidence}
                                      />
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-2">
                  <p className="text-sm text-gray-700">
                    Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, totalCount)} of {totalCount} results
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    <span className="px-3 py-1 text-sm">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === totalPages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCampaigns;
