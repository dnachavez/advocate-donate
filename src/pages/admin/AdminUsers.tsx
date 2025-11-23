import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { adminService, type UserProfile } from "@/lib/adminService";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Shield,
  Eye,
  UserCheck,
  UserX,
  Building2,
  User,
  Filter,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

const AdminUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  const typeFilter = searchParams.get('type') || 'all';
  const roleFilter = searchParams.get('role') || 'all';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 15;

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error, totalCount: count } = await adminService.getAllUsers(
        limit,
        (page - 1) * limit,
        typeFilter === 'all' ? undefined : typeFilter
      );

      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
      } else if (data) {
        setUsers(data);
        setTotalCount(count);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [limit, page, typeFilter, toast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleFilterChange = (filterType: 'type' | 'role', value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === 'all') {
      newParams.delete(filterType);
    } else {
      newParams.set(filterType, value);
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

  const handleUpdateRole = async (userId: string, role: 'user' | 'admin' | 'super_admin') => {
    try {
      setActionLoading(true);
      const { error } = await adminService.updateUserRole(userId, role);

      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `User role updated to ${role}`,
        });
        setSelectedUser(null);
        loadUsers();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getUserTypeBadge = (userType: string) => {
    switch (userType) {
      case 'individual':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Individual</Badge>;
      case 'nonprofit':
        return <Badge variant="outline" className="bg-green-50 text-green-700">Nonprofit</Badge>;
      case 'business':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700">Business</Badge>;
      default:
        return <Badge variant="outline">{userType}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-orange-100 text-orange-800">Admin</Badge>;
      case 'super_admin':
        return <Badge className="bg-red-100 text-red-800">Super Admin</Badge>;
      case 'user':
      default:
        return <Badge variant="outline">User</Badge>;
    }
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800">Verified</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unverified</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredUsers = users.filter(user => {
    if (roleFilter !== 'all') {
      const userRole = (user as any).role || 'user';
      return userRole === roleFilter;
    }
    return true;
  });

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600">Manage user accounts and permissions</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">User Type</label>
              <Select value={typeFilter} onValueChange={(value) => handleFilterChange('type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="nonprofit">Nonprofit</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Role</label>
              <Select value={roleFilter} onValueChange={(value) => handleFilterChange('role', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Users ({totalCount})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No users found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-500" />
                            </div>
                            <div>
                              <div className="font-medium">{user.full_name}</div>
                              <div className="text-sm text-gray-500">{user.id.slice(0, 8)}...</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getUserTypeBadge(user.user_type)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getRoleBadge((user as any).role || 'user')}
                            {((user as any).role === 'admin' || (user as any).role === 'super_admin') && (
                              <Shield className="w-4 h-4 text-orange-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.user_type === 'nonprofit' ? (
                            <div className="space-y-1">
                              {getVerificationBadge(user.verification_status)}
                              {user.organization_name && (
                                <div className="text-xs text-gray-500">
                                  {user.organization_name}
                                </div>
                              )}
                            </div>
                          ) : (
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              Active
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.created_at && formatDate(user.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedUser(user)}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  Manage
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Update User Role</DialogTitle>
                                  <DialogDescription>
                                    Change the role for {user.full_name}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">Current Role</label>
                                    <div>{getRoleBadge((user as any).role || 'user')}</div>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">New Role</label>
                                    <div className="flex space-x-2">
                                      <Button
                                        variant={(user as any).role === 'user' ? 'secondary' : 'outline'}
                                        size="sm"
                                        onClick={() => handleUpdateRole(user.id, 'user')}
                                        disabled={actionLoading || (user as any).role === 'user'}
                                      >
                                        User
                                      </Button>
                                      <Button
                                        variant={(user as any).role === 'admin' ? 'secondary' : 'outline'}
                                        size="sm"
                                        onClick={() => handleUpdateRole(user.id, 'admin')}
                                        disabled={actionLoading || (user as any).role === 'admin'}
                                      >
                                        Admin
                                      </Button>
                                      <Button
                                        variant={(user as any).role === 'super_admin' ? 'secondary' : 'outline'}
                                        size="sm"
                                        onClick={() => handleUpdateRole(user.id, 'super_admin')}
                                        disabled={actionLoading || (user as any).role === 'super_admin'}
                                      >
                                        Super Admin
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {filteredUsers.map((user) => (
                  <Card key={user.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-500" />
                          </div>
                          <div>
                            <div className="font-medium">{user.full_name}</div>
                            <div className="text-sm text-gray-500">{user.id.slice(0, 8)}...</div>
                          </div>
                        </div>
                        {getRoleBadge((user as any).role || 'user')}
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Type</div>
                          {getUserTypeBadge(user.user_type)}
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Status</div>
                          {user.user_type === 'nonprofit' ? (
                            getVerificationBadge(user.verification_status)
                          ) : (
                            <Badge variant="outline" className="bg-green-50 text-green-700">Active</Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          Joined {user.created_at && formatDate(user.created_at)}
                        </span>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedUser(user)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Manage
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Update User Role</DialogTitle>
                              <DialogDescription>
                                Change the role for {user.full_name}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Current Role</label>
                                <div>{getRoleBadge((user as any).role || 'user')}</div>
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">New Role</label>
                                <div className="flex space-x-2">
                                  <Button
                                    variant={(user as any).role === 'user' ? 'secondary' : 'outline'}
                                    size="sm"
                                    onClick={() => handleUpdateRole(user.id, 'user')}
                                    disabled={actionLoading || (user as any).role === 'user'}
                                  >
                                    User
                                  </Button>
                                  <Button
                                    variant={(user as any).role === 'admin' ? 'secondary' : 'outline'}
                                    size="sm"
                                    onClick={() => handleUpdateRole(user.id, 'admin')}
                                    disabled={actionLoading || (user as any).role === 'admin'}
                                  >
                                    Admin
                                  </Button>
                                  <Button
                                    variant={(user as any).role === 'super_admin' ? 'secondary' : 'outline'}
                                    size="sm"
                                    onClick={() => handleUpdateRole(user.id, 'super_admin')}
                                    disabled={actionLoading || (user as any).role === 'super_admin'}
                                  >
                                    Super Admin
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

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

export default AdminUsers;
