import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { adminService, type AdminStats } from "@/lib/adminService";
import { useToast } from "@/hooks/use-toast";
import {
  LayoutDashboard,
  Users,
  Building2,
  Target,
  Activity,
  LogOut,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle
} from "lucide-react";

const AdminDashboard = () => {
  const location = useLocation();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const isExactPath = location.pathname === '/admin' || location.pathname === '/admin/';

  const navigationItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { path: '/admin/organizations', icon: Building2, label: 'Organizations' },
    { path: '/admin/campaigns', icon: Target, label: 'Campaigns' },
    { path: '/admin/users', icon: Users, label: 'Users' },
    { path: '/admin/activity', icon: Activity, label: 'Activity' },
  ];

  useEffect(() => {
    if (isExactPath) {
      loadStats();
    }
  }, [isExactPath]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const { data, error } = await adminService.getAdminStats();
      
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
      } else if (data) {
        setStats(data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const StatCard = ({ title, value, description, icon: Icon, trend }: {
    title: string;
    value: string | number;
    description: string;
    icon: any;
    trend?: 'up' | 'down' | 'neutral';
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground flex items-center">
          {trend === 'up' && <TrendingUp className="w-3 h-3 mr-1 text-green-500" />}
          {description}
        </p>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">BN</span>
                </div>
                <span className="font-semibold text-lg">Bridge Needs Admin</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Admin Dashboard
              </Badge>
              <Button variant="outline" size="sm" asChild>
                <Link to="/">
                  <LogOut className="w-4 h-4 mr-2" />
                  Exit Admin
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Navigation</CardTitle>
                <CardDescription>Admin panel sections</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  {navigationItems.map((item) => {
                    const isActive = item.exact 
                      ? isExactPath
                      : location.pathname.startsWith(item.path) && item.path !== '/admin';
                    
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={cn(
                          "flex items-center px-4 py-3 text-sm font-medium rounded-none transition-colors",
                          isActive
                            ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                            : "text-gray-700 hover:bg-gray-50"
                        )}
                      >
                        <item.icon className="w-5 h-5 mr-3" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {isExactPath ? (
              /* Dashboard Overview */
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                  <p className="text-gray-600">Manage your platform's organizations, campaigns, and users</p>
                </div>

                {/* Statistics Cards */}
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                      <Card key={i}>
                        <CardHeader>
                          <div className="h-4 bg-gray-200 rounded animate-pulse" />
                        </CardHeader>
                        <CardContent>
                          <div className="h-8 bg-gray-200 rounded animate-pulse mb-2" />
                          <div className="h-3 bg-gray-200 rounded animate-pulse" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : stats ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    <StatCard
                      title="Total Users"
                      value={stats.totalUsers}
                      description="Registered users"
                      icon={Users}
                      trend="up"
                    />
                    <StatCard
                      title="Organizations"
                      value={stats.totalOrganizations}
                      description={`${stats.pendingOrganizations} pending approval`}
                      icon={Building2}
                    />
                    <StatCard
                      title="Campaigns"
                      value={stats.totalCampaigns}
                      description="Active campaigns"
                      icon={Target}
                    />
                    <StatCard
                      title="Total Revenue"
                      value={formatCurrency(stats.totalRevenue)}
                      description={`${stats.totalDonations} donations`}
                      icon={DollarSign}
                      trend="up"
                    />
                  </div>
                ) : null}

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common administrative tasks</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Button asChild className="h-auto p-4">
                        <Link to="/admin/organizations?status=pending">
                          <div className="text-center">
                            <Clock className="w-8 h-8 mx-auto mb-2" />
                            <div className="font-medium">Pending Approvals</div>
                            <div className="text-sm opacity-90">Review organizations</div>
                          </div>
                        </Link>
                      </Button>
                      
                      <Button variant="outline" asChild className="h-auto p-4">
                        <Link to="/admin/users">
                          <div className="text-center">
                            <Users className="w-8 h-8 mx-auto mb-2" />
                            <div className="font-medium">Manage Users</div>
                            <div className="text-sm opacity-90">User roles & access</div>
                          </div>
                        </Link>
                      </Button>
                      
                      <Button variant="outline" asChild className="h-auto p-4">
                        <Link to="/admin/campaigns">
                          <div className="text-center">
                            <Target className="w-8 h-8 mx-auto mb-2" />
                            <div className="font-medium">Campaign Status</div>
                            <div className="text-sm opacity-90">Monitor campaigns</div>
                          </div>
                        </Link>
                      </Button>
                      
                      <Button variant="outline" asChild className="h-auto p-4">
                        <Link to="/admin/activity">
                          <div className="text-center">
                            <Activity className="w-8 h-8 mx-auto mb-2" />
                            <div className="font-medium">Activity Logs</div>
                            <div className="text-sm opacity-90">Audit trail</div>
                          </div>
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Pending Organizations Alert */}
                {stats && stats.pendingOrganizations > 0 && (
                  <Card className="border-orange-200 bg-orange-50">
                    <CardHeader>
                      <CardTitle className="text-orange-800 flex items-center">
                        <Clock className="w-5 h-5 mr-2" />
                        Pending Organization Approvals
                      </CardTitle>
                      <CardDescription className="text-orange-700">
                        {stats.pendingOrganizations} organization(s) waiting for approval
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button asChild>
                        <Link to="/admin/organizations?status=pending">
                          Review Pending Organizations
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              /* Nested Routes Content */
              <Outlet />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
