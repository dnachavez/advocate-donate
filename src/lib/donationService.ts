import { paymentService, DonationData, PaymentResult, PaymentMethod } from './payment';
import { paymentMethodService, type PaymentMethodDB } from './paymentMethodService';
import { isAuthenticated, validateAndRefreshSession } from './auth';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert } from '@/integrations/supabase/types';
import { gamificationService } from '../services/gamificationService';
import type { TierUpgrade } from '../types/gamification';

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
  selectedPaymentMethod: PaymentMethodDB | null;
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
  tierUpgrade?: {
    upgraded: boolean;
    fromTier?: string;
    toTier?: string;
    newBadgeColor?: string;
    newBadgeIcon?: string;
  };
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
      errors.selectedPaymentMethod = 'Please select a payment method';
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

      // Convert payment method to format for payment service compatibility
      const paymentMethod: PaymentMethod = {
        id: formState.selectedPaymentMethod!.provider_payment_method_id,
        type: 'card',
        card: {
          brand: (formState.selectedPaymentMethod!.card_brand as string) || 'visa',
          last4: formState.selectedPaymentMethod!.card_last4 || '0000',
          exp_month: formState.selectedPaymentMethod!.card_exp_month || 12,
          exp_year: formState.selectedPaymentMethod!.card_exp_year || 2025
        }
      };

      // Process payment
      const paymentResult = await paymentService.confirmPayment(
        paymentIntent.client_secret,
        paymentMethod
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

      // Update user achievements and check for tier upgrades
      let tierUpgrade = undefined;
      if (session.user?.id) {
        try {
          // Get achievement before update to compare tiers
          const beforeAchievement = await gamificationService.getUserAchievement(session.user.id);
          const beforeTier = beforeAchievement?.current_tier;

          // Update achievements (database triggers handle the calculation)
          const afterAchievement = await gamificationService.updateUserAchievement(session.user.id);
          const afterTier = afterAchievement?.current_tier;

          // Check if tier upgraded
          if (beforeTier && afterTier && beforeTier !== afterTier) {
            const newTier = await gamificationService.getTierByName(afterTier);
            tierUpgrade = {
              upgraded: true,
              fromTier: beforeTier,
              toTier: afterTier,
              newBadgeColor: newTier?.badge_color,
              newBadgeIcon: newTier?.badge_icon
            };
          }
        } catch (gamificationError) {
          console.error('Error updating gamification achievements:', gamificationError);
          // Don't fail the donation if gamification update fails
        }
      }

      return {
        success: true,
        donationId,
        paymentResult,
        tierUpgrade,
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
   * Get available payment methods for current user
   */
  async getAvailablePaymentMethods(): Promise<{
    methods: PaymentMethodDB[];
    error?: string;
  }> {
    try {
      const { data, error } = await paymentMethodService.getUserPaymentMethods();

      if (error) {
        return {
          methods: [],
          error
        };
      }

      return {
        methods: data || [],
        error: undefined
      };
    } catch (error) {
      return {
        methods: [],
        error: error instanceof Error ? error.message : 'Failed to load payment methods'
      };
    }
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

      // Fetch donations with pagination using organization_id
      // This will get both direct organization donations and donations made to campaigns
      // owned by this organization (now that we're setting organization_id for campaign donations)
      const { data: donations, error: donationsError, count } = await supabase
        .from('donations')
        .select('*', { count: 'exact' })
        .eq('organization_id', organizationId)
        .eq('payment_status', 'succeeded')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (donationsError) {
        console.error('Error fetching donations:', donationsError);
        return {
          donations: [],
          total: 0,
          error: 'Failed to load donation history. Please try again.'
        };
      }

      return {
        donations: donations || [],
        total: count || 0,
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

      // Fetch all donations using organization_id
      // This will get both direct organization donations and donations made to campaigns
      const { data: allDonations, error: donationsError } = await supabase
        .from('donations')
        .select('amount, target_type, is_recurring')
        .eq('organization_id', organizationId)
        .eq('payment_status', 'succeeded');

      if (donationsError) {
        console.error('Error fetching organization donations for stats:', donationsError);
        return {
          totalReceived: 0,
          donationCount: 0,
          recurringDonations: 0,
          campaignDonations: 0,
          directDonations: 0,
          error: 'Failed to load donation statistics.'
        };
      }

      const totalReceived = allDonations?.reduce((sum, donation) => sum + Number(donation.amount), 0) || 0;
      const donationCount = allDonations?.length || 0;
      const recurringDonations = allDonations?.filter(d => d.is_recurring).length || 0;
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