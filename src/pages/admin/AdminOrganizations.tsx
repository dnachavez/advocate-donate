import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { adminService, type OrganizationWithUser } from "@/lib/adminService";
import { useToast } from "@/hooks/use-toast";
import {
  Building2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

import { evidenceService } from "@/services/evidenceService";
import { EvidenceList } from "@/components/evidence/EvidenceList";
import { ImpactEvidence } from "@/types/organizations";

const AdminOrganizations = () => {
  const [organizations, setOrganizations] = useState<OrganizationWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedOrg, setSelectedOrg] = useState<OrganizationWithUser | null>(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  const [orgEvidence, setOrgEvidence] = useState<ImpactEvidence[]>([]);

  const statusFilter = searchParams.get('status') || 'all';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 10;

  const loadOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error, totalCount: count } = await adminService.getAllOrganizations(
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
        setOrganizations(data);
        setTotalCount(count);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load organizations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [limit, page, statusFilter, toast]);

  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  const loadOrgEvidence = async (orgId: string) => {
    try {
      const data = await evidenceService.getOrganizationEvidence(orgId);
      setOrgEvidence(data || []);
    } catch (error) {
      console.error("Failed to load evidence", error);
    }
  };

  useEffect(() => {
    if (selectedOrg) {
      loadOrgEvidence(selectedOrg.id);
    } else {
      setOrgEvidence([]);
    }
  }, [selectedOrg]);

  const handleDeleteEvidence = async (evidenceId: string) => {
    try {
      await evidenceService.deleteEvidence(evidenceId);
      toast({
        title: "Success",
        description: "Evidence deleted successfully",
      });
      if (selectedOrg) {
        loadOrgEvidence(selectedOrg.id);
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

  const handleApprovalAction = async (
    organizationId: string,
    action: 'approved' | 'rejected' | 'suspended'
  ) => {
    try {
      setActionLoading(true);
      const { error } = await adminService.updateOrganizationStatus(
        organizationId,
        action,
        approvalNotes || undefined
      );

      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `Organization ${action} successfully`,
        });
        setSelectedOrg(null);
        setApprovalNotes("");
        loadOrganizations();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update organization status",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800">Verified</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case 'suspended':
        return <Badge className="bg-orange-100 text-orange-800">Suspended</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Organization Management</h1>
        <p className="text-gray-600">Review and manage organization applications</p>
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
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organizations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              Organizations ({totalCount})
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
          ) : organizations.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No organizations found</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizations.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{org.name}</div>
                          <div className="text-sm text-gray-500">
                            {org.user_profiles?.full_name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{org.category}</Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(org.verification_status)}
                      </TableCell>
                      <TableCell>
                        {org.created_at && formatDate(org.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedOrg(org)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Review
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Review Organization</DialogTitle>
                                <DialogDescription>
                                  Review and approve/reject organization application
                                </DialogDescription>
                              </DialogHeader>

                              {selectedOrg && (
                                <div className="space-y-6">
                                  {/* Organization Details */}
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="font-medium">Organization Name</label>
                                      <p className="text-sm text-gray-600">{selectedOrg.name}</p>
                                    </div>
                                    <div>
                                      <label className="font-medium">Category</label>
                                      <p className="text-sm text-gray-600">{selectedOrg.category}</p>
                                    </div>
                                    <div>
                                      <label className="font-medium">Registration Number</label>
                                      <p className="text-sm text-gray-600">{selectedOrg.registration_number || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <label className="font-medium">Phone</label>
                                      <p className="text-sm text-gray-600">{selectedOrg.phone || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <label className="font-medium">Website</label>
                                      <p className="text-sm text-gray-600">
                                        {selectedOrg.website ? (
                                          <a href={selectedOrg.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                            {selectedOrg.website}
                                          </a>
                                        ) : 'N/A'}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="font-medium">Current Status</label>
                                      <div className="mt-1">{getStatusBadge(selectedOrg.verification_status)}</div>
                                    </div>
                                  </div>

                                  <div>
                                    <label className="font-medium">Description</label>
                                    <p className="text-sm text-gray-600 mt-1">{selectedOrg.description}</p>
                                  </div>

                                  {selectedOrg.address && (
                                    <div>
                                      <label className="font-medium">Address</label>
                                      <p className="text-sm text-gray-600 mt-1">{selectedOrg.address}</p>
                                    </div>
                                  )}

                                  {/* Contact Person */}
                                  <div>
                                    <label className="font-medium">Contact Person</label>
                                    <p className="text-sm text-gray-600">
                                      {selectedOrg.user_profiles?.full_name}
                                    </p>
                                  </div>

                                  {/* Previous Notes */}
                                  {selectedOrg.verification_documents && (
                                    <div>
                                      <label className="font-medium">Verification Documents</label>
                                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                                        {JSON.stringify(selectedOrg.verification_documents, null, 2)}
                                      </p>
                                    </div>
                                  )}

                                  {/* Action Notes */}
                                  <div>
                                    <label className="font-medium">Action Notes</label>
                                    <Textarea
                                      placeholder="Add notes about your decision..."
                                      value={approvalNotes}
                                      onChange={(e) => setApprovalNotes(e.target.value)}
                                      rows={3}
                                    />
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="flex space-x-2 pt-4">
                                    {selectedOrg.verification_status !== 'verified' && (
                                      <Button
                                        onClick={() => handleApprovalAction(selectedOrg.id, 'approved')}
                                        disabled={actionLoading}
                                        className="bg-green-600 hover:bg-green-700"
                                      >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Approve
                                      </Button>
                                    )}

                                    {selectedOrg.verification_status !== 'rejected' && (
                                      <Button
                                        variant="destructive"
                                        onClick={() => handleApprovalAction(selectedOrg.id, 'rejected')}
                                        disabled={actionLoading}
                                      >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Reject
                                      </Button>
                                    )}

                                    {selectedOrg.verification_status === 'verified' && (
                                      <Button
                                        variant="outline"
                                        onClick={() => handleApprovalAction(selectedOrg.id, 'suspended')}
                                        disabled={actionLoading}
                                      >
                                        <AlertTriangle className="w-4 h-4 mr-2" />
                                        Suspend
                                      </Button>
                                    )}
                                  </div>

                                  {/* Impact Evidence Section */}
                                  <div className="pt-6 border-t">
                                    <h3 className="text-lg font-medium mb-4">Impact Evidence</h3>
                                    <EvidenceList
                                      evidence={orgEvidence}
                                      onDelete={handleDeleteEvidence}
                                      showTargetInfo={true}
                                    />
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
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

export default AdminOrganizations;
