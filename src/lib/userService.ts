import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

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
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { data: null, error: 'User not authenticated' };
      }

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq('id', user.id)
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: profile as UserProfileWithOrganization, error: null };
    } catch (error) {
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
  }
};
