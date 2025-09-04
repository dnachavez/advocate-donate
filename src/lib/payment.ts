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
  type: 'card' | 'bank_account';
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
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

export interface MockPaymentMethod {
  id: string;
  type: 'card';
  card: {
    brand: 'visa' | 'mastercard' | 'amex';
    last4: string;
    exp_month: number;
    exp_year: number;
  };
}

export interface Subscription {
  id: string;
  status: 'active' | 'canceled' | 'past_due';
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
  created: string;
}

class MockPaymentService {
  private mockDelay = 2000; // Simulate network delay

  /**
   * Generate a mock payment intent ID
   */
  private generatePaymentIntentId(): string {
    return `pi_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate a mock client secret
   */
  private generateClientSecret(paymentIntentId: string): string {
    return `${paymentIntentId}_secret_${Math.random().toString(36).substr(2, 16)}`;
  }

  /**
   * Simulate payment processing delay
   */
  private async simulateDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, this.mockDelay));
  }

  /**
   * Create a mock payment intent for one-time donation
   */
  async createPaymentIntent(donationData: DonationData): Promise<PaymentIntent> {
    try {
      // Validate donation amount
      this.validateDonationAmount(donationData.amount);

      await this.simulateDelay();

      const paymentIntentId = this.generatePaymentIntentId();
      const clientSecret = this.generateClientSecret(paymentIntentId);

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
      console.error('Error creating mock payment intent:', error);
      throw new Error('Failed to create payment intent');
    }
  }

  /**
   * Mock payment confirmation - simulates successful payment and saves to database
   */
  async confirmPayment(
    clientSecret: string,
    paymentMethod: MockPaymentMethod
  ): Promise<PaymentResult> {
    try {
      await this.simulateDelay();

      // Extract payment intent ID from client secret
      const paymentIntentId = clientSecret.split('_secret_')[0];

      // Simulate random payment failures (5% chance)
      if (Math.random() < 0.05) {
        return {
          success: false,
          error: 'Your card was declined. Please try a different payment method.',
        };
      }

      // Create successful payment intent
      const paymentIntent: PaymentIntent = {
        id: paymentIntentId,
        amount: 0, // Will be populated from stored data
        currency: 'usd',
        status: 'succeeded',
        client_secret: clientSecret,
      };

      // Generate donation ID for database storage
      const donationId = `donation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Here you would typically save to your database
      // For now, we'll just log the donation data
      console.log('Mock donation saved:', {
        donationId,
        paymentIntentId,
        paymentMethod,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        paymentIntent,
        donationId,
      };
    } catch (error) {
      console.error('Error confirming mock payment:', error);
      return {
        success: false,
        error: 'Failed to process payment',
      };
    }
  }

  /**
   * Create a mock subscription for recurring donations
   */
  async createSubscription(donationData: DonationData): Promise<Subscription> {
    try {
      if (!donationData.isRecurring || !donationData.frequency) {
        throw new Error('Subscription data is required for recurring donations');
      }

      this.validateDonationAmount(donationData.amount);
      await this.simulateDelay();

      const subscriptionId = `sub_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const subscription: Subscription = {
        id: subscriptionId,
        status: 'active' as const,
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
        created: new Date().toISOString(),
      };

      // Note: Database saving for subscriptions is handled in the donation service
      // after the donation is successfully saved

      console.log('Mock subscription created:', subscription);
      return subscription;
    } catch (error) {
      console.error('Error creating mock subscription:', error);
      throw new Error('Failed to create subscription');
    }
  }

  /**
   * Generate mock payment methods for testing
   */
  generateMockPaymentMethods(): MockPaymentMethod[] {
    return [
      {
        id: 'pm_mock_visa_4242',
        type: 'card',
        card: {
          brand: 'visa',
          last4: '4242',
          exp_month: 12,
          exp_year: 2025,
        },
      },
      {
        id: 'pm_mock_mastercard_5555',
        type: 'card',
        card: {
          brand: 'mastercard',
          last4: '5555',
          exp_month: 10,
          exp_year: 2026,
        },
      },
      {
        id: 'pm_mock_amex_3782',
        type: 'card',
        card: {
          brand: 'amex',
          last4: '3782',
          exp_month: 8,
          exp_year: 2027,
        },
      },
    ];
  }

  /**
   * Save donation to Supabase database
   */
  async saveDonationToDatabase(donationData: DonationData, paymentResult: PaymentResult): Promise<string> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Map the donation data to match the database schema
      const donationRecord: TablesInsert<'donations'> = {
        amount: donationData.amount,
        currency: donationData.currency.toLowerCase(),
        donor_email: donationData.donorEmail,
        donor_name: donationData.donorName,
        donor_phone: null,
        target_type: donationData.campaignId ? 'campaign' : 'organization',
        target_name: '', // This would need to be fetched from the campaign/organization
        target_id: donationData.campaignId || donationData.organizationId || null,
        payment_intent_id: paymentResult.paymentIntent?.id || null,
        payment_method_id: null,
        payment_status: 'completed',
        is_recurring: donationData.isRecurring || false,
        frequency: donationData.frequency || null,
        is_anonymous: false,
        message: donationData.message || null,
        processed_at: new Date().toISOString()
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

      console.log('Donation saved to Supabase:', data);
      return data.id;
    } catch (error) {
      console.error('Error saving donation to database:', error);
      throw new Error('Failed to save donation');
    }
  }

  /**
   * Validate donation amount
   */
  private validateDonationAmount(amount: number): void {
    if (amount < 1) {
      throw new Error('Minimum donation amount is $1');
    }
    if (amount > 10000) {
      throw new Error('Maximum donation amount is $10,000');
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
export const paymentService = new MockPaymentService();