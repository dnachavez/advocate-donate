import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adminService, type AdminActivityLog } from "@/lib/adminService";
import { useToast } from "@/hooks/use-toast";
import {
  Activity,
  User,
  Building2,
  Target,
  Shield,
  Clock,
  Filter,
  ChevronDown,
  ChevronUp
} from "lucide-react";

const AdminActivity = () => {
  const [activities, setActivities] = useState<AdminActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [actionFilter, setActionFilter] = useState('all');
  const { toast } = useToast();

  const page = 1;
  const limit = 50;

  useEffect(() => {
    loadActivities();
  }, [page, actionFilter]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const { data, error, totalCount: count } = await adminService.getActivityLogs(limit, 0);

      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
      } else if (data) {
        setActivities(data);
        setTotalCount(count);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load activity logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    if (action.includes('create')) {
      return <Badge className="bg-green-100 text-green-800">Create</Badge>;
    } else if (action.includes('update')) {
      return <Badge className="bg-blue-100 text-blue-800">Update</Badge>;
    } else if (action.includes('delete') || action.includes('reject')) {
      return <Badge className="bg-red-100 text-red-800">Delete</Badge>;
    } else if (action.includes('approve')) {
      return <Badge className="bg-green-100 text-green-800">Approve</Badge>;
    } else {
      return <Badge variant="outline">{action}</Badge>;
    }
  };

  const getTargetIcon = (targetType: string) => {
    switch (targetType) {
      case 'user':
        return <User className="w-4 h-4" />;
      case 'organization':
        return <Building2 className="w-4 h-4" />;
      case 'campaign':
        return <Target className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const formatActionDescription = (activity: AdminActivityLog) => {
    const action = activity.action.replace(/_/g, ' ').toLowerCase();
    const targetType = activity.target_type;
    return `${action} ${targetType}${activity.target_id ? ` (${activity.target_id.slice(0, 8)})` : ''}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleRowExpansion = (activityId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(activityId)) {
      newExpanded.delete(activityId);
    } else {
      newExpanded.add(activityId);
    }
    setExpandedRows(newExpanded);
  };

  const filteredActivities = actionFilter === 'all' 
    ? activities 
    : activities.filter(activity => activity.action.includes(actionFilter));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Activity Logs</h1>
        <p className="text-gray-600">Audit trail of administrative actions and system changes</p>
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
              <label className="text-sm font-medium mb-2 block">Action Type</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Create Actions</SelectItem>
                  <SelectItem value="update">Update Actions</SelectItem>
                  <SelectItem value="approve">Approval Actions</SelectItem>
                  <SelectItem value="reject">Rejection Actions</SelectItem>
                  <SelectItem value="delete">Delete Actions</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Activity Logs ({totalCount})
            </span>
          </CardTitle>
          <CardDescription>
            Recent administrative activities and system changes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No activity logs found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Admin User</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredActivities.map((activity) => (
                      <>
                        <TableRow key={activity.id}>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getActionBadge(activity.action)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getTargetIcon(activity.target_type)}
                              <span className="capitalize">{activity.target_type}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Shield className="w-4 h-4 text-orange-500" />
                              <span className="text-sm">
                                {activity.admin_user_id?.slice(0, 8) || 'System'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">
                                {activity.created_at && formatDate(activity.created_at)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => toggleRowExpansion(activity.id)}
                                className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                              >
                                {expandedRows.has(activity.id) ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                                <span className="text-sm">
                                  {expandedRows.has(activity.id) ? 'Hide' : 'Show'}
                                </span>
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                        
                        {expandedRows.has(activity.id) && (
                          <TableRow>
                            <TableCell colSpan={5} className="bg-gray-50">
                              <div className="p-4 space-y-3">
                                <div>
                                  <h4 className="font-medium text-sm text-gray-900 mb-2">Activity Details</h4>
                                  <div className="text-sm text-gray-600">
                                    {formatActionDescription(activity)}
                                  </div>
                                </div>
                                
                                {activity.new_values && (
                                  <div>
                                    <h4 className="font-medium text-sm text-gray-900 mb-2">Changes Made</h4>
                                    <div className="bg-white p-3 rounded border text-xs font-mono">
                                      <pre className="text-xs">{JSON.stringify(activity.new_values as Record<string, unknown>, null, 2)}</pre>
                                      {activity.old_values && (
                                        <div className="mt-2 pt-2 border-t">
                                          <div className="text-gray-500 mb-1">Previous Values:</div>
                                          <pre className="text-xs">{JSON.stringify(activity.old_values as Record<string, unknown>, null, 2)}</pre>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                                
                                {activity.ip_address && (
                                  <div>
                                    <h4 className="font-medium text-sm text-gray-900 mb-1">Technical Details</h4>
                                    <div className="text-xs text-gray-500 space-y-1">
                                      <div>IP Address: {activity.ip_address}</div>
                                      {activity.user_agent && (
                                        <div>User Agent: {activity.user_agent}</div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {filteredActivities.map((activity) => (
                  <Card key={activity.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        {getActionBadge(activity.action)}
                        <div className="text-xs text-gray-500">
                          {activity.created_at && formatDate(activity.created_at)}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <div className="font-medium text-sm">
                            {formatActionDescription(activity)}
                          </div>
                          {activity.new_values && (
                            <details className="text-xs text-gray-500">
                              <summary className="cursor-pointer hover:text-gray-700">
                                View details
                              </summary>
                              <div className="mt-1 p-2 bg-gray-50 rounded text-xs font-mono">
                                <pre className="text-xs">{JSON.stringify(activity.new_values as Record<string, unknown>, null, 2)}</pre>
                                {activity.old_values && (
                                  <div className="mt-1">
                                    <pre className="text-xs">{JSON.stringify(activity.old_values as Record<string, unknown>, null, 2)}</pre>
                                  </div>
                                )}
                              </div>
                            </details>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm font-medium capitalize">
                          Target: {activity.target_type}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Shield className="w-3 h-3" />
                          <span>Admin: {activity.admin_user_id?.slice(0, 8) || 'System'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminActivity;
