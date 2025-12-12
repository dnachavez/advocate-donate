// Types for payment processing
import type { TablesInsert } from '@/integrations/supabase/types';

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'requires_capture' | 'canceled' | 'succeeded';
  client_secret: string;
  metadata?: Record<string, string>;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account' | 'digital_wallet';
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  billing_details?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: {
      city?: string;
      country?: string;
      line1?: string;
      line2?: string;
      postal_code?: string;
      state?: string;
    };
  };
}

export interface DonationData {
  amount: number;
  currency: string;
  donorEmail: string;
  donorName: string;
  campaignId?: string;
  organizationId?: string;
  isRecurring?: boolean;
  frequency?: 'monthly' | 'quarterly' | 'yearly';
  message?: string;
}

export interface PaymentResult {
  success: boolean;
  paymentIntent?: PaymentIntent;
  error?: string;
  donationId?: string;
}

export interface Subscription {
  id: string;
  status: 'active' | 'canceled' | 'past_due' | 'incomplete';
  amount: number;
  currency: string;
  frequency: 'monthly' | 'quarterly' | 'yearly';
  customer: {
    email: string;
    name: string;
  };
  metadata: {
    campaignId: string;
    organizationId: string;
    message: string;
  };
  current_period_end: string;
  created: string;
}

/**
 * Payment Service
 * 
 * This service handles payment processing. In a full production environment,
 * this would integrate with a payment gateway like Stripe, PayPal, or similar.
 * 
 * Currently configured to simulate a production-ready payment flow with:
 * - Input validation
 * - Secure payment intent creation
 * - Transaction processing simulation
 * - Database persistence
 */
class PaymentService {
  private processingDelay = 1500; // Simulate network latency

  /**
   * Generate a unique identifier for payment intents
   */
  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Simulate payment processing delay
   */
  private async simulateNetworkRequest(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, this.processingDelay));
  }

  /**
   * Create a payment intent for a donation
   * In production, this would call the payment provider's API
   */
  async createPaymentIntent(donationData: DonationData): Promise<PaymentIntent> {
    try {
      // Validate donation amount
      this.validateDonationAmount(donationData.amount);

      await this.simulateNetworkRequest();

      const paymentIntentId = this.generateId('pi');
      const clientSecret = `${paymentIntentId}_secret_${Math.random().toString(36).substr(2, 16)}`;

      const paymentIntent: PaymentIntent = {
        id: paymentIntentId,
        amount: donationData.amount,
        currency: donationData.currency.toLowerCase(),
        status: 'requires_payment_method',
        client_secret: clientSecret,
        metadata: {
          donorEmail: donationData.donorEmail,
          donorName: donationData.donorName,
          campaignId: donationData.campaignId || '',
          organizationId: donationData.organizationId || '',
          message: donationData.message || '',
        },
      };

      return paymentIntent;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw new Error('Failed to create payment intent. Please try again.');
    }
  }

  /**
   * Confirm and process a payment
   * In production, this would confirm the payment with the provider
   */
  async confirmPayment(
    clientSecret: string,
    paymentMethod: PaymentMethod
  ): Promise<PaymentResult> {
    try {
      await this.simulateNetworkRequest();

      if (!clientSecret || !paymentMethod) {
        return {
          success: false,
          error: 'Invalid payment details provided.',
        };
      }

      // Extract payment intent ID from client secret
      const paymentIntentId = clientSecret.split('_secret_')[0];

      // Create successful payment intent object
      const paymentIntent: PaymentIntent = {
        id: paymentIntentId,
        amount: 0, // In a real flow, this would be retrieved from the provider
        currency: 'usd',
        status: 'succeeded',
        client_secret: clientSecret,
      };

      // Generate donation ID for database storage
      const donationId = this.generateId('don');

      return {
        success: true,
        paymentIntent,
        donationId,
      };
    } catch (error) {
      console.error('Error confirming payment:', error);
      return {
        success: false,
        error: 'Failed to process payment. Please try again.',
      };
    }
  }

  /**
   * Create a subscription for recurring donations
   */
  async createSubscription(donationData: DonationData): Promise<Subscription> {
    try {
      if (!donationData.isRecurring || !donationData.frequency) {
        throw new Error('Subscription data is required for recurring donations');
      }

      this.validateDonationAmount(donationData.amount);
      await this.simulateNetworkRequest();

      const subscriptionId = this.generateId('sub');
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const subscription: Subscription = {
        id: subscriptionId,
        status: 'active',
        amount: donationData.amount,
        currency: donationData.currency.toLowerCase(),
        frequency: donationData.frequency,
        customer: {
          email: donationData.donorEmail,
          name: donationData.donorName,
        },
        metadata: {
          campaignId: donationData.campaignId || '',
          organizationId: donationData.organizationId || '',
          message: donationData.message || '',
        },
        current_period_end: nextMonth.toISOString(),
        created: new Date().toISOString(),
      };

      return subscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw new Error('Failed to create subscription. Please try again.');
    }
  }

  /**
   * Save donation record to the database
   */
  async saveDonationToDatabase(donationData: DonationData, paymentResult: PaymentResult, targetName?: string): Promise<string> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');

      // Get current user data for proper linking
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      // In production, we might allow guest donations, but for now we link to user if available
      const userId = session?.user?.id || null;

      // If this is a campaign donation, fetch the organization_id from the campaign
      let organizationId = donationData.organizationId || null;
      if (donationData.campaignId && !organizationId) {
        const { data: campaign } = await supabase
          .from('campaigns')
          .select('organization_id')
          .eq('id', donationData.campaignId)
          .single();

        if (campaign?.organization_id) {
          organizationId = campaign.organization_id;
        }
      }

      // Map the donation data to match the database schema
      const donationRecord: TablesInsert<'donations'> = {
        amount: donationData.amount,
        currency: donationData.currency.toUpperCase(),
        donor_email: donationData.donorEmail,
        donor_name: donationData.donorName,
        donor_phone: null,
        target_type: donationData.campaignId ? 'campaign' : (donationData.organizationId ? 'organization' : 'general'),
        target_name: targetName || (donationData.campaignId ? 'Campaign Donation' : (donationData.organizationId ? 'Organization Donation' : 'General Fund')),
        target_id: donationData.campaignId || donationData.organizationId || null,
        payment_intent_id: paymentResult.paymentIntent?.id || this.generateId('pi_fallback'),
        payment_method_id: null, // In a real app, we'd store the payment method ID
        payment_status: 'succeeded',
        is_recurring: donationData.isRecurring || false,
        frequency: donationData.frequency || null,
        is_anonymous: false,
        message: donationData.message || null,
        processed_at: new Date().toISOString(),
        user_id: userId,
        organization_id: organizationId,
        campaign_id: donationData.campaignId || null
      };

      const { data, error } = await supabase
        .from('donations')
        .insert([donationRecord])
        .select('id')
        .single();

      if (error) {
        console.error('Supabase error saving donation:', error);
        throw new Error(`Failed to save donation: ${error.message}`);
      }

      return data.id;
    } catch (error) {
      console.error('Error saving donation to database:', error);
      throw new Error('Failed to record donation in database.');
    }
  }

  /**
   * Validate donation amount
   */
  private validateDonationAmount(amount: number): void {
    if (amount < 1) {
      throw new Error('Minimum donation amount is $1.00');
    }
    if (amount > 500000) { // Increased limit for production
      throw new Error('For donations over $500,000, please contact us directly.');
    }
  }

  /**
   * Format amount for display
   */
  formatAmount(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  }
}

// Export singleton instance
export const paymentService = new PaymentService();