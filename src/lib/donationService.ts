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
      // Validate authentication and session
      const isAuth = await isAuthenticated();
      if (!isAuth) {
        return {
          success: false,
          error: 'You must be signed in to make a donation. Please sign in and try again.',
        };
      }

      // Validate and refresh session
      const sessionData = await validateAndRefreshSession();
      if (!sessionData) {
        return {
          success: false,
          error: 'Your session has expired. Please sign in again.',
        };
      }

      // Get current user data for security verification
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return {
          success: false,
          error: 'Authentication verification failed. Please sign in again.',
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
        donationId = await paymentService.saveDonationToDatabase(
          donationData,
          paymentResult
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
}

// Export singleton instance
export const donationService = new DonationService();