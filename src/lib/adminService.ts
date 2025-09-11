import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesUpdate } from '@/integrations/supabase/types';

export type UserProfile = Tables<'user_profiles'>;
export type Organization = Tables<'organizations'>;
export type Campaign = Tables<'campaigns'>;
export type AdminActivityLog = Tables<'admin_activity_log'>;

export interface OrganizationWithUser extends Organization {
  user_profiles?: UserProfile;
}

export interface CampaignWithOrganization extends Campaign {
  organizations?: Organization;
}

export interface AdminStats {
  totalUsers: number;
  totalOrganizations: number;
  pendingOrganizations: number;
  totalCampaigns: number;
  totalDonations: number;
  totalRevenue: number;
}

/**
 * Admin service for managing admin dashboard functionality
 */
export const adminService = {
  /**
   * Check if current user is admin
   */
  async isCurrentUserAdmin(): Promise<{
    isAdmin: boolean;
    role: string | null;
    error: string | null;
  }> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { isAdmin: false, role: null, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) {
        return { isAdmin: false, role: null, error: error.message };
      }

      const isAdmin = data?.role === 'admin' || data?.role === 'super_admin';
      return { isAdmin, role: data?.role || 'user', error: null };
    } catch (error) {
      return { 
        isAdmin: false, 
        role: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  },

  /**
   * Get admin dashboard statistics
   */
  async getAdminStats(): Promise<{
    data: AdminStats | null;
    error: string | null;
  }> {
    try {
      // Check if user is admin
      const { isAdmin } = await this.isCurrentUserAdmin();
      if (!isAdmin) {
        return { data: null, error: 'Unauthorized access' };
      }

      // Get user count
      const { count: totalUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });

      // Get organization counts
      const { count: totalOrganizations } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true });

      const { count: pendingOrganizations } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .eq('verification_status', 'pending');

      // Get campaign count
      const { count: totalCampaigns } = await supabase
        .from('campaigns')
        .select('*', { count: 'exact', head: true });

      // Get donation statistics
      const { data: donationStats, error: donationError } = await supabase
        .from('donations')
        .select('amount')
        .eq('status', 'completed');

      const totalDonations = donationStats?.length || 0;
      const totalRevenue = donationStats?.reduce((sum, donation) => sum + (donation.amount || 0), 0) || 0;

      return {
        data: {
          totalUsers: totalUsers || 0,
          totalOrganizations: totalOrganizations || 0,
          pendingOrganizations: pendingOrganizations || 0,
          totalCampaigns: totalCampaigns || 0,
          totalDonations,
          totalRevenue
        },
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch admin stats'
      };
    }
  },

  /**
   * Get all organizations for admin management
   */
  async getAllOrganizations(
    limit = 10, 
    offset = 0, 
    statusFilter?: string
  ): Promise<{
    data: OrganizationWithUser[] | null;
    error: string | null;
    totalCount: number;
  }> {
    try {
      const { isAdmin } = await this.isCurrentUserAdmin();
      if (!isAdmin) {
        return { data: null, error: 'Unauthorized access', totalCount: 0 };
      }

      let query = supabase
        .from('organizations')
        .select(`
          *,
          user_profiles:user_id (
            id,
            full_name
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('verification_status', statusFilter);
      }

      const { data, error, count } = await query;

      if (error) {
        return { data: null, error: error.message, totalCount: 0 };
      }

      return { data: data as OrganizationWithUser[], error: null, totalCount: count || 0 };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch organizations',
        totalCount: 0
      };
    }
  },

  /**
   * Update organization approval status
   */
  async updateOrganizationStatus(
    organizationId: string,
    status: 'approved' | 'rejected' | 'suspended',
    notes?: string
  ): Promise<{ error: string | null }> {
    try {
      const { isAdmin } = await this.isCurrentUserAdmin();
      if (!isAdmin) {
        return { error: 'Unauthorized access' };
      }

      const { error } = await supabase
        .from('organizations')
        .update({
          verification_status: status === 'approved' ? 'verified' : status === 'rejected' ? 'rejected' : 'suspended',
          verified_at: status === 'approved' ? new Date().toISOString() : null
        })
        .eq('id', organizationId);

      if (error) {
        return { error: error.message };
      }

      // Log the activity
      await this.logAdminActivity({
        action: `update_organization_${status}`,
        target_type: 'organization',
        target_id: organizationId,
        new_values: { verification_status: status === 'approved' ? 'verified' : status === 'rejected' ? 'rejected' : 'suspended' }
      });

      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to update organization' };
    }
  },

  /**
   * Get all campaigns for admin management
   */
  async getAllCampaigns(
    limit = 10,
    offset = 0,
    statusFilter?: string
  ): Promise<{
    data: CampaignWithOrganization[] | null;
    error: string | null;
    totalCount: number;
  }> {
    try {
      const { isAdmin } = await this.isCurrentUserAdmin();
      if (!isAdmin) {
        return { data: null, error: 'Unauthorized access', totalCount: 0 };
      }

      let query = supabase
        .from('campaigns')
        .select(`
          *,
          organizations (
            name,
            verification_status
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error, count } = await query;

      if (error) {
        return { data: null, error: error.message, totalCount: 0 };
      }

      return { data: data as CampaignWithOrganization[], error: null, totalCount: count || 0 };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch campaigns',
        totalCount: 0
      };
    }
  },

  /**
   * Update campaign status
   */
  async updateCampaignStatus(
    campaignId: string,
    status: string
  ): Promise<{ error: string | null }> {
    try {
      const { isAdmin } = await this.isCurrentUserAdmin();
      if (!isAdmin) {
        return { error: 'Unauthorized access' };
      }

      const { error } = await supabase
        .from('campaigns')
        .update({ status })
        .eq('id', campaignId);

      if (error) {
        return { error: error.message };
      }

      // Log the activity
      await this.logAdminActivity({
        action: 'update_campaign_status',
        target_type: 'campaign',
        target_id: campaignId,
        new_values: { status }
      });

      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to update campaign' };
    }
  },

  /**
   * Get all users for admin management
   */
  async getAllUsers(
    limit = 15,
    offset = 0,
    typeFilter?: string
  ): Promise<{
    data: UserProfile[] | null;
    error: string | null;
    totalCount: number;
  }> {
    try {
      const { isAdmin } = await this.isCurrentUserAdmin();
      if (!isAdmin) {
        return { data: null, error: 'Unauthorized access', totalCount: 0 };
      }

      let query = supabase
        .from('user_profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (typeFilter && typeFilter !== 'all') {
        query = query.eq('user_type', typeFilter);
      }

      const { data, error, count } = await query;

      if (error) {
        return { data: null, error: error.message, totalCount: 0 };
      }

      return { data, error: null, totalCount: count || 0 };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch users',
        totalCount: 0
      };
    }
  },

  /**
   * Update user role
   */
  async updateUserRole(
    userId: string,
    role: 'user' | 'admin' | 'super_admin'
  ): Promise<{ error: string | null }> {
    try {
      const { isAdmin } = await this.isCurrentUserAdmin();
      if (!isAdmin) {
        return { error: 'Unauthorized access' };
      }

      const { error } = await supabase
        .from('user_profiles')
        .update({ role })
        .eq('id', userId);

      if (error) {
        return { error: error.message };
      }

      // Log the activity
      await this.logAdminActivity({
        action: 'update_user_role',
        target_type: 'user',
        target_id: userId,
        new_values: { role }
      });

      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to update user role' };
    }
  },

  /**
   * Get admin activity logs
   */
  async getActivityLogs(
    limit = 50,
    offset = 0
  ): Promise<{
    data: AdminActivityLog[] | null;
    error: string | null;
    totalCount: number;
  }> {
    try {
      const { isAdmin } = await this.isCurrentUserAdmin();
      if (!isAdmin) {
        return { data: null, error: 'Unauthorized access', totalCount: 0 };
      }

      const { data, error, count } = await supabase
        .from('admin_activity_log')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        return { data: null, error: error.message, totalCount: 0 };
      }

      return { data, error: null, totalCount: count || 0 };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch activity logs',
        totalCount: 0
      };
    }
  },

  /**
   * Log admin activity
   */
  async logAdminActivity({
    action,
    target_type,
    target_id,
    old_values,
    new_values
  }: {
    action: string;
    target_type: string;
    target_id?: string;
    old_values?: any;
    new_values?: any;
  }): Promise<{ error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { error: 'User not authenticated' };
      }

      const { error } = await supabase
        .from('admin_activity_log')
        .insert({
          admin_user_id: user.id,
          action,
          target_type,
          target_id,
          old_values,
          new_values
        });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to log activity' };
    }
  }
};
