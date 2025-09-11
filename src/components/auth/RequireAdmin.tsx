import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { adminService } from "@/lib/adminService";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface RequireAdminProps {
  children: React.ReactNode;
}

export function RequireAdmin({ children }: RequireAdminProps) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { isAdmin: adminStatus, error } = await adminService.isCurrentUserAdmin();
        
        if (error) {
          toast({
            title: "Error",
            description: error,
            variant: "destructive",
          });
          setIsAdmin(false);
        } else {
          setIsAdmin(adminStatus);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
