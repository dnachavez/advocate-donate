import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Organization = Tables<'organizations'>;
export type OrganizationInsert = TablesInsert<'organizations'>;
export type OrganizationUpdate = TablesUpdate<'organizations'>;

export interface OrganizationWithCampaigns extends Organization {
  campaigns?: Tables<'campaigns'>[];
}

/**
 * Organization service for managing organization data
 */
export const organizationService = {
  /**
   * Get all verified and active organizations
   */
  async getOrganizations(limit = 20, offset = 0): Promise<{
    data: Organization[];
    error: string | null;
    totalCount: number;
  }> {
    try {
      const { data, error, count } = await supabase
        .from('organizations')
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .eq('verification_status', 'verified')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        return { data: [], error: error.message, totalCount: 0 };
      }

      return { data: data || [], error: null, totalCount: count || 0 };
    } catch (error) {
      return { 
        data: [], 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        totalCount: 0
      };
    }
  },

  /**
   * Get organization by slug
   */
  async getOrganizationBySlug(slug: string): Promise<{
    data: OrganizationWithCampaigns | null;
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select(`
          *,
          campaigns(*)
        `)
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data as OrganizationWithCampaigns, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  },

  /**
   * Get current user's organization
   */
  async getCurrentUserOrganization(): Promise<{
    data: OrganizationWithCampaigns | null;
    error: string | null;
  }> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { data: null, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('organizations')
        .select(`
          *,
          campaigns(*)
        `)
        .eq('user_id', user.id)
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data as OrganizationWithCampaigns, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  },

  /**
   * Create organization
   */
  async createOrganization(organizationData: OrganizationInsert): Promise<{
    data: Organization | null;
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .insert(organizationData)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  },

  /**
   * Update organization
   */
  async updateOrganization(organizationData: OrganizationUpdate): Promise<{
    data: Organization | null;
    error: string | null;
  }> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { data: null, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('organizations')
        .update(organizationData)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  },

  /**
   * Generate unique slug from organization name
   */
  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim() // Remove leading/trailing spaces
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  },

  /**
   * Check if slug is available
   */
  async isSlugAvailable(slug: string): Promise<{
    available: boolean;
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', slug)
        .limit(1);

      if (error) {
        return { available: false, error: error.message };
      }

      return { available: !data || data.length === 0, error: null };
    } catch (error) {
      return { 
        available: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  },

  /**
   * Get organization donation statistics
   */
  async getOrganizationDonationStats(organizationId: string): Promise<{
    totalRaised: number;
    donationCount: number;
    campaignCount: number;
    error: string | null;
  }> {
    try {
      // Get donations directly to organization
      const { data: orgDonations, error: orgError } = await supabase
        .from('donations')
        .select('amount')
        .eq('organization_id', organizationId)
        .eq('payment_status', 'succeeded');

      if (orgError) {
        return { totalRaised: 0, donationCount: 0, campaignCount: 0, error: orgError.message };
      }

      // Get donations through campaigns
      const { data: campaignDonations, error: campaignError } = await supabase
        .from('donations')
        .select('amount, campaigns!inner(organization_id)')
        .eq('campaigns.organization_id', organizationId)
        .eq('payment_status', 'succeeded');

      if (campaignError) {
        return { totalRaised: 0, donationCount: 0, campaignCount: 0, error: campaignError.message };
      }

      // Get campaign count
      const { count: campaignCount, error: countError } = await supabase
        .from('campaigns')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);

      if (countError) {
        return { totalRaised: 0, donationCount: 0, campaignCount: 0, error: countError.message };
      }

      const totalOrgDonations = orgDonations?.reduce((sum, d) => sum + d.amount, 0) || 0;
      const totalCampaignDonations = campaignDonations?.reduce((sum, d) => sum + d.amount, 0) || 0;
      const totalDonationCount = (orgDonations?.length || 0) + (campaignDonations?.length || 0);

      return {
        totalRaised: totalOrgDonations + totalCampaignDonations,
        donationCount: totalDonationCount,
        campaignCount: campaignCount || 0,
        error: null
      };
    } catch (error) {
      return { 
        totalRaised: 0, 
        donationCount: 0, 
        campaignCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }
};
