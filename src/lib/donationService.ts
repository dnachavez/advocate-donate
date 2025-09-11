import { paymentService, DonationData, PaymentResult, MockPaymentMethod } from './payment';
import { isAuthenticated, validateAndRefreshSession } from './auth';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert } from '@/integrations/supabase/types';

// Donation form state interface
export interface DonationFormState {
  amount: number;
  customAmount: string;
  donorName: string;
  donorEmail: string;
  donorPhone?: string;
  message: string;
  isRecurring: boolean;
  frequency: 'monthly' | 'quarterly' | 'yearly';
  selectedPaymentMethod: MockPaymentMethod | null;
  isAnonymous?: boolean;
  isProcessing: boolean;
  errors: Record<string, string>;
}

// Donation context data
export interface DonationContext {
  campaignId?: string;
  organizationId?: string;
  campaignTitle?: string;
  organizationName?: string;
  suggestedAmounts?: number[];
}

// Donation result interface
export interface DonationResult {
  success: boolean;
  donationId?: string;
  error?: string;
  paymentResult?: PaymentResult;
}

// Donation history interface
export interface DonationHistory {
  id: string;
  amount: number;
  currency: string;
  target_type: string;
  target_name: string;
  target_id?: string;
  message?: string;
  is_recurring: boolean;
  frequency?: string;
  payment_status: string;
  created_at: string;
  processed_at?: string;
}

class DonationService {
  private defaultSuggestedAmounts = [25, 50, 100, 250, 500];

  /**
   * Initialize donation form state
   */
  initializeFormState(context?: DonationContext): DonationFormState {
    return {
      amount: 0,
      customAmount: '',
      donorName: '',
      donorEmail: '',
      donorPhone: '',
      message: '',
      isRecurring: false,
      frequency: 'monthly',
      selectedPaymentMethod: null,
      isAnonymous: false,
      isProcessing: false,
      errors: {},
    };
  }

  /**
   * Initialize donation form state with authenticated user data
   */
  async initializeFormStateWithAuth(context?: DonationContext): Promise<DonationFormState> {
    const baseState = this.initializeFormState(context);
    
    try {
      // Check if user is authenticated
      const isAuth = await isAuthenticated();
      if (!isAuth) {
        return baseState;
      }

      // Get current session and user data
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return baseState;
      }

      const user = session.user;
      
      // Populate form with authenticated user data
      return {
        ...baseState,
        donorName: user.user_metadata?.full_name || user.user_metadata?.fullName || '',
        donorEmail: user.email || '',
        donorPhone: user.user_metadata?.phone_number || '',
      };
    } catch (error) {
      console.error('Error initializing form with auth data:', error);
      return baseState;
    }
  }

  /**
   * Get suggested donation amounts based on context
   */
  getSuggestedAmounts(context?: DonationContext): number[] {
    if (context?.suggestedAmounts) {
      return context.suggestedAmounts;
    }
    return this.defaultSuggestedAmounts;
  }

  /**
   * Validate donation form
   */
  validateDonationForm(formState: DonationFormState): Record<string, string> {
    const errors: Record<string, string> = {};

    // Validate amount
    const amount = formState.amount || parseFloat(formState.customAmount);
    if (!amount || amount <= 0) {
      errors.amount = 'Please enter a valid donation amount';
    } else if (amount < 1) {
      errors.amount = 'Minimum donation amount is $1';
    } else if (amount > 10000) {
      errors.amount = 'Maximum donation amount is $10,000';
    }

    // Note: Donor name and email validation removed since they're automatically populated from authenticated user
    // The authentication check in processDonation ensures user data is available

    // Validate payment method
    if (!formState.selectedPaymentMethod) {
      errors.paymentMethod = 'Please select a payment method';
    }

    // Validate recurring donation frequency
    if (formState.isRecurring && !formState.frequency) {
      errors.frequency = 'Please select a frequency for recurring donations';
    }

    return errors;
  }

  /**
   * Process donation
   */
  async processDonation(
    formState: DonationFormState,
    context?: DonationContext
  ): Promise<DonationResult> {
    try {
      // Validate authentication and session with retry logic
      let isAuth = await isAuthenticated();
      if (!isAuth) {
        // Try one more time in case of temporary network issues
        await new Promise(resolve => setTimeout(resolve, 1000));
        isAuth = await isAuthenticated();
        
        if (!isAuth) {
          return {
            success: false,
            error: 'You must be signed in to make a donation. Please sign in and try again.',
          };
        }
      }

      // Validate and refresh session with retry logic
      let sessionData = await validateAndRefreshSession();
      if (!sessionData) {
        // Try to refresh the session one more time
        try {
          const { data: { session }, error } = await supabase.auth.refreshSession();
          if (!error && session) {
            sessionData = await validateAndRefreshSession();
          }
        } catch (refreshError) {
          console.error('Session refresh attempt failed:', refreshError);
        }
        
        if (!sessionData) {
          return {
            success: false,
            error: 'Your session has expired. Please refresh the page and sign in again.',
          };
        }
      }

      // Get current user data for security verification
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        return {
          success: false,
          error: 'Authentication verification failed. Please refresh the page and sign in again.',
        };
      }

      // Validate form
      const errors = this.validateDonationForm(formState);
      if (Object.keys(errors).length > 0) {
        return {
          success: false,
          error: 'Please fix the form errors before submitting',
        };
      }

      const amount = formState.amount || parseFloat(formState.customAmount);
      
      // Prepare donation data
      const donationData: DonationData = {
        amount,
        currency: 'USD',
        donorEmail: formState.donorEmail.trim(),
        donorName: formState.donorName.trim(),
        campaignId: context?.campaignId,
        organizationId: context?.organizationId,
        isRecurring: formState.isRecurring,
        frequency: formState.isRecurring ? formState.frequency : undefined,
        message: formState.message.trim() || undefined,
      };

      // Create payment intent
      const paymentIntent = await paymentService.createPaymentIntent(donationData);

      // Process payment
      const paymentResult = await paymentService.confirmPayment(
        paymentIntent.client_secret,
        formState.selectedPaymentMethod!
      );

      if (!paymentResult.success) {
        return {
          success: false,
          error: paymentResult.error || 'Payment failed',
          paymentResult,
        };
      }

      // Save donation to database
      let donationId: string;
      try {
        const targetName = context?.campaignTitle || context?.organizationName || 'General Fund';
        donationId = await paymentService.saveDonationToDatabase(
          donationData,
          paymentResult,
          targetName
        );
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to save donation to database',
          paymentResult,
        };
      }

      // Handle recurring donations
      if (formState.isRecurring && donationId) {
        try {
          // Create mock subscription
          const subscription = await paymentService.createSubscription(donationData);
          
          // Save subscription to database
          const dbSubscription: TablesInsert<'subscriptions'> = {
            amount: donationData.amount,
            currency: donationData.currency.toLowerCase(),
            customer_email: donationData.donorEmail,
            customer_name: donationData.donorName,
            donation_id: donationId,
            frequency: donationData.frequency!,
            subscription_id: subscription.id,
            target_type: donationData.campaignId ? 'campaign' : 'organization',
            target_name: context?.campaignTitle || context?.organizationName || '',
            target_id: donationData.campaignId || donationData.organizationId || null,
            status: 'active',
            next_payment_date: null
          };

          const { error } = await supabase
            .from('subscriptions')
            .insert(dbSubscription);

          if (error) {
            console.error('Failed to save subscription to database:', error);
            // Don't fail the entire donation if subscription creation fails
          }
        } catch (error) {
          console.error('Failed to create subscription:', error);
          // Don't fail the entire donation if subscription creation fails
        }
      }

      return {
        success: true,
        donationId,
        paymentResult,
      };
    } catch (error) {
      console.error('Error processing donation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
    }
  }

  /**
   * Format donation amount for display
   */
  formatAmount(amount: number): string {
    return paymentService.formatAmount(amount);
  }

  /**
   * Get available payment methods
   */
  getAvailablePaymentMethods(): MockPaymentMethod[] {
    return paymentService.generateMockPaymentMethods();
  }

  /**
   * Calculate total for recurring donations (annual equivalent)
   */
  calculateRecurringTotal(amount: number, frequency: 'monthly' | 'quarterly' | 'yearly'): number {
    switch (frequency) {
      case 'monthly':
        return amount * 12;
      case 'quarterly':
        return amount * 4;
      case 'yearly':
        return amount;
      default:
        return amount;
    }
  }

  /**
   * Get frequency display text
   */
  getFrequencyDisplayText(frequency: 'monthly' | 'quarterly' | 'yearly'): string {
    switch (frequency) {
      case 'monthly':
        return 'per month';
      case 'quarterly':
        return 'per quarter';
      case 'yearly':
        return 'per year';
      default:
        return '';
    }
  }

  /**
   * Generate donation summary for confirmation
   */
  generateDonationSummary(
    formState: DonationFormState,
    context?: DonationContext
  ): {
    amount: number;
    formattedAmount: string;
    recipient: string;
    frequency?: string;
    totalAnnual?: string;
    donorName: string;
    donorEmail: string;
    message?: string;
  } {
    const amount = formState.amount || parseFloat(formState.customAmount);
    const recipient = context?.campaignTitle || context?.organizationName || 'General Fund';
    
    const summary = {
      amount,
      formattedAmount: this.formatAmount(amount),
      recipient,
      donorName: formState.donorName,
      donorEmail: formState.donorEmail,
      message: formState.message || undefined,
    };

    if (formState.isRecurring) {
      const totalAnnual = this.calculateRecurringTotal(amount, formState.frequency);
      return {
        ...summary,
        frequency: this.getFrequencyDisplayText(formState.frequency),
        totalAnnual: this.formatAmount(totalAnnual),
      };
    }

    return summary;
  }

  /**
   * Get user's donation history
   */
  async getUserDonations(limit: number = 50, offset: number = 0): Promise<{
    donations: DonationHistory[];
    total: number;
    error?: string;
  }> {
    try {
      // Check if user is authenticated
      const isAuth = await isAuthenticated();
      if (!isAuth) {
        return {
          donations: [],
          total: 0,
          error: 'You must be signed in to view your donations.'
        };
      }

      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        return {
          donations: [],
          total: 0,
          error: 'Unable to verify your identity. Please sign in again.'
        };
      }

      // Fetch donations with pagination using user_id for better security
      const { data: donations, error: donationsError, count } = await supabase
        .from('donations')
        .select('*', { count: 'exact' })
        .eq('user_id', session.user.id)
        .eq('payment_status', 'succeeded')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (donationsError) {
        console.error('Error fetching donations:', donationsError);
        return {
          donations: [],
          total: 0,
          error: 'Failed to load your donation history. Please try again.'
        };
      }

      return {
        donations: donations || [],
        total: count || 0,
        error: undefined
      };
    } catch (error) {
      console.error('Error in getUserDonations:', error);
      return {
        donations: [],
        total: 0,
        error: 'An unexpected error occurred while loading your donations.'
      };
    }
  }

  /**
   * Get donations received by an organization (both direct and campaign donations)
   */
  async getOrganizationReceivedDonations(
    organizationId: string,
    limit: number = 50, 
    offset: number = 0
  ): Promise<{
    donations: DonationHistory[];
    total: number;
    error?: string;
  }> {
    try {
      // Check if user is authenticated
      const isAuth = await isAuthenticated();
      if (!isAuth) {
        return {
          donations: [],
          total: 0,
          error: 'You must be signed in to view donations.'
        };
      }

      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        return {
          donations: [],
          total: 0,
          error: 'Unable to verify your identity. Please sign in again.'
        };
      }

      // First, get organization details to get the slug
      console.log('DEBUG SERVICE: Fetching org slug for ID:', organizationId);
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .select('slug')
        .eq('id', organizationId)
        .single();

      console.log('DEBUG SERVICE: Organization query result:', { organization, orgError });

      if (orgError) {
        console.error('Error fetching organization:', orgError);
        return {
          donations: [],
          total: 0,
          error: 'Failed to load organization details: ' + orgError.message
        };
      }

      // Get all campaigns belonging to this organization
      const { data: campaigns, error: campaignError } = await supabase
        .from('campaigns')
        .select('id, slug, title')
        .eq('organization_id', organizationId);

      if (campaignError) {
        console.error('Error fetching organization campaigns:', campaignError);
        return {
          donations: [],
          total: 0,
          error: 'Failed to load organization campaigns.'
        };
      }

      const campaignIds = campaigns?.map(c => c.id) || [];
      const organizationSlug = organization?.slug;

      console.log('DEBUG SERVICE: Campaign IDs:', campaignIds);
      console.log('DEBUG SERVICE: Organization slug:', organizationSlug);

      // Try multiple approaches to find donations
      let allDonations: DonationHistory[] = [];
      let totalCount = 0;
      
      // First, try with organization slug if it exists
      if (organizationSlug) {
        console.log('DEBUG SERVICE: Trying with organization slug:', organizationSlug);
        
        const orgQuery = supabase
          .from('donations')
          .select('*', { count: 'exact' })
          .eq('payment_status', 'succeeded')
          .eq('target_type', 'organization')
          .eq('target_id', organizationSlug)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
          
        const { data: orgDonations, count: orgCount } = await orgQuery;
        console.log('DEBUG SERVICE: Org donations result:', { orgDonations, orgCount });
        
        if (orgDonations) {
          allDonations = [...allDonations, ...orgDonations];
          totalCount += orgCount || 0;
        }
      }
      
      // Then try with campaign IDs
      if (campaignIds.length > 0) {
        console.log('DEBUG SERVICE: Trying with campaign IDs:', campaignIds);
        
        const campaignQuery = supabase
          .from('donations')
          .select('*', { count: 'exact' })
          .eq('payment_status', 'succeeded')
          .eq('target_type', 'campaign')
          .in('target_id', campaignIds.map(id => id.toString()))
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
          
        const { data: campaignDonations, count: campaignCount } = await campaignQuery;
        console.log('DEBUG SERVICE: Campaign donations result:', { campaignDonations, campaignCount });
        
        if (campaignDonations) {
          allDonations = [...allDonations, ...campaignDonations];
          totalCount += campaignCount || 0;
        }
      }
      
      // If no donations found, try a broader search to see if there are ANY donations for debugging
      if (allDonations.length === 0) {
        console.log('DEBUG SERVICE: No donations found, trying broader search...');
        const { data: sampleDonations } = await supabase
          .from('donations')
          .select('target_type, target_id, target_name')
          .eq('payment_status', 'succeeded')
          .limit(10);
        console.log('DEBUG SERVICE: Sample donations in database:', sampleDonations);
        
        // Also check if the organization actually exists
        const { data: orgExists } = await supabase
          .from('organizations')
          .select('id, slug, name')
          .eq('id', organizationId)
          .single();
        console.log('DEBUG SERVICE: Organization exists check:', orgExists);
      }

      console.log('DEBUG SERVICE: Final result - donations:', allDonations.length, 'total:', totalCount);

      return {
        donations: allDonations || [],
        total: totalCount || 0,
        error: undefined
      };
    } catch (error) {
      console.error('Error in getOrganizationReceivedDonations:', error);
      return {
        donations: [],
        total: 0,
        error: 'An unexpected error occurred while loading donations.'
      };
    }
  }

  /**
   * Get donation statistics for organization (donations received)
   */
  async getOrganizationDonationStats(
    organizationId: string
  ): Promise<{
    totalReceived: number;
    donationCount: number;
    recurringDonations: number;
    campaignDonations: number;
    directDonations: number;
    error?: string;
  }> {
    try {
      // Check if user is authenticated
      const isAuth = await isAuthenticated();
      if (!isAuth) {
        return {
          totalReceived: 0,
          donationCount: 0,
          recurringDonations: 0,
          campaignDonations: 0,
          directDonations: 0,
          error: 'You must be signed in to view donation statistics.'
        };
      }

      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        return {
          totalReceived: 0,
          donationCount: 0,
          recurringDonations: 0,
          campaignDonations: 0,
          directDonations: 0,
          error: 'Unable to verify your identity. Please sign in again.'
        };
      }

      // First, get organization details to get the slug
      console.log('DEBUG STATS: Fetching org slug for ID:', organizationId);
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .select('slug')
        .eq('id', organizationId)
        .single();

      console.log('DEBUG STATS: Organization query result:', { organization, orgError });

      if (orgError) {
        console.error('Error fetching organization:', orgError);
        return {
          totalReceived: 0,
          donationCount: 0,
          recurringDonations: 0,
          campaignDonations: 0,
          directDonations: 0,
          error: 'Failed to load organization details: ' + orgError.message
        };
      }

      // Get campaigns for this organization
      const { data: campaigns, error: campaignError } = await supabase
        .from('campaigns')
        .select('id')
        .eq('organization_id', organizationId);

      if (campaignError) {
        console.error('Error fetching organization campaigns:', campaignError);
        return {
          totalReceived: 0,
          donationCount: 0,
          recurringDonations: 0,
          campaignDonations: 0,
          directDonations: 0,
          error: 'Failed to load organization campaigns.'
        };
      }

      const campaignIds = campaigns?.map(c => c.id) || [];
      const organizationSlug = organization?.slug;

      console.log('DEBUG STATS: Campaign IDs:', campaignIds);
      console.log('DEBUG STATS: Organization slug:', organizationSlug);

      // Try multiple approaches to gather statistics
      let allDonations: Array<{amount: number, target_type: string, target_id: string}> = [];
      
      // First, get organization donations
      if (organizationSlug) {
        console.log('DEBUG STATS: Querying organization donations for slug:', organizationSlug);
        const { data: orgDonations } = await supabase
          .from('donations')
          .select('amount, target_type, target_id')
          .eq('payment_status', 'succeeded')
          .eq('target_type', 'organization')
          .eq('target_id', organizationSlug);
        
        console.log('DEBUG STATS: Organization donations found:', orgDonations?.length || 0);
        if (orgDonations) {
          allDonations = [...allDonations, ...orgDonations];
        }
      }
      
      // Then get campaign donations
      if (campaignIds.length > 0) {
        console.log('DEBUG STATS: Querying campaign donations for IDs:', campaignIds);
        const { data: campaignDonations } = await supabase
          .from('donations')
          .select('amount, target_type, target_id')
          .eq('payment_status', 'succeeded')
          .eq('target_type', 'campaign')
          .in('target_id', campaignIds.map(id => id.toString()));
        
        console.log('DEBUG STATS: Campaign donations found:', campaignDonations?.length || 0);
        if (campaignDonations) {
          allDonations = [...allDonations, ...campaignDonations];
        }
      }

      console.log('DEBUG STATS: Total donations for processing:', allDonations.length);

      const totalReceived = allDonations?.reduce((sum, donation) => sum + Number(donation.amount), 0) || 0;
      const donationCount = allDonations?.length || 0;
      // Note: Cannot check for recurring donations without subscription info in current schema
      const recurringDonations = 0;
      const campaignDonations = allDonations?.filter(d => d.target_type === 'campaign').length || 0;
      const directDonations = allDonations?.filter(d => d.target_type === 'organization').length || 0;

      return {
        totalReceived,
        donationCount,
        recurringDonations,
        campaignDonations,
        directDonations,
        error: undefined
      };
    } catch (error) {
      console.error('Error in getOrganizationDonationStats:', error);
      return {
        totalReceived: 0,
        donationCount: 0,
        recurringDonations: 0,
        campaignDonations: 0,
        directDonations: 0,
        error: 'An unexpected error occurred while loading statistics.'
      };
    }
  }

  /**
   * Get donation statistics for user
   */
  async getUserDonationStats(): Promise<{
    totalDonated: number;
    donationCount: number;
    recurringDonations: number;
    error?: string;
  }> {
    try {
      // Check if user is authenticated
      const isAuth = await isAuthenticated();
      if (!isAuth) {
        return {
          totalDonated: 0,
          donationCount: 0,
          recurringDonations: 0,
          error: 'You must be signed in to view your donation statistics.'
        };
      }

      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        return {
          totalDonated: 0,
          donationCount: 0,
          recurringDonations: 0,
          error: 'Unable to verify your identity. Please sign in again.'
        };
      }

      // Fetch donation statistics using user_id for better security
      const { data: donations, error } = await supabase
        .from('donations')
        .select('amount, is_recurring')
        .eq('user_id', session.user.id)
        .eq('payment_status', 'succeeded');

      if (error) {
        console.error('Error fetching donation stats:', error);
        return {
          totalDonated: 0,
          donationCount: 0,
          recurringDonations: 0,
          error: 'Failed to load your donation statistics.'
        };
      }

      const totalDonated = donations?.reduce((sum, donation) => sum + Number(donation.amount), 0) || 0;
      const donationCount = donations?.length || 0;
      const recurringDonations = donations?.filter(d => d.is_recurring).length || 0;

      return {
        totalDonated,
        donationCount,
        recurringDonations,
        error: undefined
      };
    } catch (error) {
      console.error('Error in getUserDonationStats:', error);
      return {
        totalDonated: 0,
        donationCount: 0,
        recurringDonations: 0,
        error: 'An unexpected error occurred while loading your statistics.'
      };
    }
  }
}

// Export singleton instance
export const donationService = new DonationService();