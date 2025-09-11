import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Campaign = Tables<'campaigns'>;
export type CampaignInsert = TablesInsert<'campaigns'>;
export type CampaignUpdate = TablesUpdate<'campaigns'>;

export interface CampaignWithOrganization extends Campaign {
  organization?: Tables<'organizations'>;
}

/**
 * Campaign service for managing campaign data
 */
export const campaignService = {
  /**
   * Get all active campaigns
   */
  async getCampaigns(limit = 20, offset = 0, category?: string): Promise<{
    data: CampaignWithOrganization[];
    error: string | null;
    totalCount: number;
  }> {
    try {
      let query = supabase
        .from('campaigns')
        .select(`
          *,
          organization:organizations(*)
        `, { count: 'exact' })
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error, count } = await query.range(offset, offset + limit - 1);

      if (error) {
        console.error('Campaign query error:', error);
        return { data: [], error: error.message, totalCount: 0 };
      }

      return { data: data as CampaignWithOrganization[] || [], error: null, totalCount: count || 0 };
    } catch (error) {
      console.error('Campaign service error:', error);
      return { 
        data: [], 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        totalCount: 0
      };
    }
  },

  /**
   * Get campaign by slug
   */
  async getCampaignBySlug(slug: string): Promise<{
    data: CampaignWithOrganization | null;
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq('slug', slug)
        .eq('status', 'active')
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data as CampaignWithOrganization, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  },

  /**
   * Get campaigns by organization
   */
  async getCampaignsByOrganization(organizationId: string): Promise<{
    data: Campaign[];
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) {
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      return { 
        data: [], 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  },

  /**
   * Create campaign
   */
  async createCampaign(campaignData: CampaignInsert): Promise<{
    data: Campaign | null;
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .insert(campaignData)
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
   * Update campaign
   */
  async updateCampaign(campaignId: string, campaignData: CampaignUpdate): Promise<{
    data: Campaign | null;
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .update(campaignData)
        .eq('id', campaignId)
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
   * Generate unique slug from campaign title
   */
  generateSlug(title: string): string {
    return title
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
        .from('campaigns')
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
   * Get featured campaigns
   */
  async getFeaturedCampaigns(limit = 6): Promise<{
    data: CampaignWithOrganization[];
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq('status', 'active')
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Featured campaigns query error:', error);
        return { data: [], error: error.message };
      }

      return { data: data as CampaignWithOrganization[] || [], error: null };
    } catch (error) {
      console.error('Featured campaigns service error:', error);
      return { 
        data: [], 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  },

  /**
   * Get urgent campaigns
   */
  async getUrgentCampaigns(limit = 6): Promise<{
    data: CampaignWithOrganization[];
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq('status', 'active')
        .eq('is_urgent', true)
        .order('end_date', { ascending: true, nullsLast: true })
        .limit(limit);

      if (error) {
        return { data: [], error: error.message };
      }

      return { data: data as CampaignWithOrganization[] || [], error: null };
    } catch (error) {
      return { 
        data: [], 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  },

  /**
   * Create test campaigns for development
   */
  async createTestCampaigns(): Promise<{
    success: boolean;
    error: string | null;
  }> {
    try {
      console.log('Creating test campaigns...');

      // First, check if we need to create a test organization
      const { data: existingOrg, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .eq('name', 'Test Organization')
        .single();

      let organizationId: string;

      if (orgError || !existingOrg) {
        // Check if we have any existing user profiles to use
        const { data: existingUser, error: userError } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('user_type', 'nonprofit')
          .limit(1)
          .single();

        let userId: string;

        if (userError || !existingUser) {
          // No suitable user found, we need an authenticated user to create organizations
          // For now, let's just skip creating test data and inform the user
          return { 
            success: false, 
            error: 'Cannot create test data without an authenticated nonprofit user. Please sign up as a nonprofit organization first.' 
          };
        } else {
          userId = existingUser.id;
        }

        // Create a test organization
        const { data: newOrg, error: createOrgError } = await supabase
          .from('organizations')
          .insert({
            user_id: userId,
            name: 'Test Organization',
            slug: 'test-organization',
            description: 'A test organization for development',
            category: 'Health',
            registration_number: 'TEST123',
            email: 'test@testorg.com',
            verification_status: 'verified',
            is_active: true
          })
          .select('id')
          .single();

        if (createOrgError || !newOrg) {
          console.error('Error creating test organization:', createOrgError);
          return { success: false, error: 'Failed to create test organization: ' + createOrgError?.message };
        }
        organizationId = newOrg.id;
      } else {
        organizationId = existingOrg.id;
      }

      // Create test campaigns
      const testCampaigns = [
        {
          organization_id: organizationId,
          slug: 'help-children-education',
          title: 'Help Children Get Quality Education',
          description: 'Support underprivileged children by providing them with school supplies, books, and educational resources.',
          goal_amount: 50000,
          raised_amount: 12500,
          category: 'Education',
          status: 'active',
          is_featured: true,
          is_urgent: false,
          supporters_count: 25,
          featured_image_url: '/placeholder.svg'
        },
        {
          organization_id: organizationId,
          slug: 'emergency-medical-fund',
          title: 'Emergency Medical Fund',
          description: 'Urgent medical assistance needed for families who cannot afford healthcare.',
          goal_amount: 100000,
          raised_amount: 75000,
          category: 'Health',
          status: 'active',
          is_featured: true,
          is_urgent: true,
          supporters_count: 150,
          featured_image_url: '/placeholder.svg'
        },
        {
          organization_id: organizationId,
          slug: 'food-for-families',
          title: 'Food for Families in Need',
          description: 'Provide nutritious meals for families struggling with food insecurity.',
          goal_amount: 25000,
          raised_amount: 8000,
          category: 'Hunger',
          status: 'active',
          is_featured: false,
          is_urgent: false,
          supporters_count: 32,
          featured_image_url: '/placeholder.svg'
        }
      ];

      const { data, error } = await supabase
        .from('campaigns')
        .insert(testCampaigns)
        .select();

      if (error) {
        console.error('Error creating test campaigns:', error);
        return { success: false, error: error.message };
      }

      console.log('Test campaigns created successfully:', data);
      return { success: true, error: null };
    } catch (error) {
      console.error('Error in createTestCampaigns:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }
};
