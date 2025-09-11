import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { organizationService } from './organizationService';

export type UserProfile = Tables<'user_profiles'>;
export type UserProfileInsert = TablesInsert<'user_profiles'>;
export type UserProfileUpdate = TablesUpdate<'user_profiles'>;

export interface UserProfileWithOrganization extends UserProfile {
  organization?: Tables<'organizations'>;
}

/**
 * User profile service for managing user data
 */
export const userService = {
  /**
   * Get current user's profile
   */
  async getCurrentUserProfile(): Promise<{
    data: UserProfileWithOrganization | null;
    error: string | null;
  }> {
    try {
      console.log('DEBUG USERSERVICE: Getting current user profile');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.log('DEBUG USERSERVICE: Auth error or no user:', authError);
        return { data: null, error: 'User not authenticated' };
      }

      console.log('DEBUG USERSERVICE: User ID:', user.id);

      // First get the user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.log('DEBUG USERSERVICE: Profile error:', profileError);
        return { data: null, error: profileError.message };
      }

      console.log('DEBUG USERSERVICE: Profile loaded:', profile);

      // Then get the organization for this user
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('user_id', user.id)
        .single();

      console.log('DEBUG USERSERVICE: Organization query result:', { organization, orgError });

      // Combine the data
      const profileWithOrg: UserProfileWithOrganization = {
        ...profile,
        organization: organization || undefined
      };

      console.log('DEBUG USERSERVICE: Final profile with org:', profileWithOrg);

      return { data: profileWithOrg, error: null };
    } catch (error) {
      console.error('DEBUG USERSERVICE: Unexpected error:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  },

  /**
   * Create user profile (usually called after signup)
   */
  async createUserProfile(profileData: UserProfileInsert): Promise<{
    data: UserProfile | null;
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert(profileData)
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
   * Update user profile
   */
  async updateUserProfile(profileData: UserProfileUpdate): Promise<{
    data: UserProfile | null;
    error: string | null;
  }> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { data: null, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .update(profileData)
        .eq('id', user.id)
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
   * Check if user has completed profile setup
   */
  async isProfileComplete(): Promise<{
    isComplete: boolean;
    missingFields: string[];
    error: string | null;
  }> {
    try {
      const { data: profile, error } = await this.getCurrentUserProfile();
      
      if (error || !profile) {
        return { isComplete: false, missingFields: [], error: error || 'Profile not found' };
      }

      const missingFields: string[] = [];
      
      // Required fields for all users
      if (!profile.full_name?.trim()) missingFields.push('full_name');
      
      // Additional requirements for nonprofit users
      if (profile.user_type === 'nonprofit') {
        if (!profile.organization_name?.trim()) missingFields.push('organization_name');
        if (!profile.registration_number?.trim()) missingFields.push('registration_number');
        
        // Check if organization record exists
        if (!profile.organization) {
          missingFields.push('organization_setup');
        }
      }

      return { 
        isComplete: missingFields.length === 0, 
        missingFields, 
        error: null 
      };
    } catch (error) {
      return { 
        isComplete: false, 
        missingFields: [], 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  },

  /**
   * Create organization from user metadata (used during email verification)
   */
  async createOrganizationFromMetadata(): Promise<{
    data: Tables<'organizations'> | null;
    error: string | null;
  }> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { data: null, error: 'User not authenticated' };
      }

      // Get user profile
      const { data: profile, error: profileError } = await this.getCurrentUserProfile();
      
      if (profileError || !profile) {
        return { data: null, error: profileError || 'Profile not found' };
      }

      // Check if user is nonprofit and doesn't already have organization
      if (profile.user_type !== 'nonprofit') {
        return { data: null, error: 'User is not a nonprofit organization' };
      }

      if (profile.organization) {
        return { data: profile.organization as Tables<'organizations'>, error: null };
      }

      // Extract organization data from user metadata and profile
      const metadata = user.user_metadata || {};
      const organizationName = profile.organization_name || metadata.organization_name;
      const registrationNumber = profile.registration_number || metadata.registration_number;
      
      if (!organizationName || !registrationNumber) {
        return { data: null, error: 'Missing required organization data' };
      }

      // Generate slug
      const slug = organizationService.generateSlug(organizationName);
      const { available, error: slugError } = await organizationService.isSlugAvailable(slug);
      
      if (slugError) {
        return { data: null, error: 'Failed to validate organization name' };
      }

      const finalSlug = available ? slug : `${slug}-${Date.now()}`;

      // Create organization record
      const organizationData = {
        user_id: user.id,
        slug: finalSlug,
        name: organizationName,
        email: user.email || '',
        registration_number: registrationNumber,
        website: profile.website || metadata.website || null,
        phone: metadata.phone_number || null,
        country: 'Philippines',
        verification_status: 'pending' as const,
        is_active: true,
        // Default values for required fields
        description: `${organizationName} is a nonprofit organization dedicated to making a positive impact.`,
        mission_statement: null,
        address: null,
        city: null,
        state: null,
        postal_code: null,
        category: null,
        subcategories: [],
        tax_id: null,
        founded_year: null
      };

      const { data: organization, error: createError } = await organizationService.createOrganization(organizationData);
      
      if (createError || !organization) {
        return { data: null, error: createError || 'Failed to create organization' };
      }

      return { data: organization, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }
};
