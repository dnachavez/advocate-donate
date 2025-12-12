import { supabase } from '../integrations/supabase/client';
import {
  PhysicalDonation,
  PhysicalDonationInsert,
  PhysicalDonationUpdate,
  DonationItem,
  DonationItemInsert,
  DonationItemUpdate,
  PhysicalDonationWithItems,
  PhysicalDonationFormData,
  DonationItemFormData,
  CreateDonationResponse,
  PhysicalDonationStatus,
  DonationItemStatus,
  DonationValidationResult,
  DonationError
} from '../types/donations';
import { gamificationService } from '../services/gamificationService';

/**
 * Service for managing physical donations and donation items
 */
export class PhysicalDonationService {

  /**
   * Create a new physical donation with items
   */
  async createPhysicalDonation(
    donationData: PhysicalDonationFormData,
    userId?: string
  ): Promise<CreateDonationResponse> {
    try {
      // Validate the donation data
      const validation = this.validatePhysicalDonationData(donationData);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.map(e => e.message).join(', ')
        };
      }

      // Start a transaction
      const { data: donation, error: donationError } = await supabase
        .from('physical_donations')
        .insert({
          donor_name: donationData.donorName,
          donor_email: donationData.donorEmail,
          donor_phone: donationData.donorPhone,
          message: donationData.message,
          is_anonymous: donationData.isAnonymous,
          target_type: donationData.targetType,
          target_id: donationData.targetId,
          target_name: donationData.targetName,
          user_id: userId,
          organization_id: donationData.targetType === 'organization' ? donationData.targetId : null,
          campaign_id: donationData.targetType === 'campaign' ? donationData.targetId : null,
          pickup_preference: donationData.pickupPreference,
          pickup_address: donationData.pickupAddress,
          pickup_instructions: donationData.pickupInstructions,
          preferred_pickup_date: donationData.preferredPickupDate,
          preferred_time_slot: donationData.preferredTimeSlot,
          estimated_value: donationData.items.reduce(
            (total, item) => total + (item.quantity * (item.estimatedValuePerUnit || 0)), 
            0
          ),
          donation_status: 'pending'
        })
        .select()
        .single();

      if (donationError) {
        return {
          success: false,
          error: donationError.message
        };
      }

      // Create donation items
      if (donationData.items.length > 0) {
        const itemsData: DonationItemInsert[] = donationData.items.map(item => ({
          physical_donation_id: donation.id,
          category: item.category,
          subcategory: item.subcategory,
          item_name: item.itemName,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          condition: item.condition,
          estimated_value_per_unit: item.estimatedValuePerUnit,
          special_handling_notes: item.specialHandlingNotes,
          expiry_date: item.expiryDate,
          is_fragile: item.isFragile,
          requires_refrigeration: item.requiresRefrigeration,
          item_status: 'pending'
        }));

        const { error: itemsError } = await supabase
          .from('donation_items')
          .insert(itemsData);

        if (itemsError) {
          // If items creation fails, we should ideally rollback the donation
          // For now, we'll return an error but the donation will exist
          return {
            success: false,
            error: `Donation created but items failed: ${itemsError.message}`
          };
        }
      }

      return {
        success: true,
        donation: donation
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get physical donation by ID with items
   */
  async getPhysicalDonationById(id: string): Promise<PhysicalDonationWithItems | null> {
    try {
      const { data, error } = await supabase
        .from('physical_donations')
        .select(`
          *,
          donation_items (*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching physical donation:', error);
        return null;
      }

      return data as PhysicalDonationWithItems;
    } catch (error) {
      console.error('Error in getPhysicalDonationById:', error);
      return null;
    }
  }

  /**
   * Get physical donations for a donor
   */
  async getDonationsForDonor(
    donorEmail: string,
    userId?: string,
    limit = 50,
    offset = 0
  ): Promise<PhysicalDonationWithItems[]> {
    try {
      let query = supabase
        .from('physical_donations')
        .select(`
          *,
          donation_items (*)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (userId) {
        query = query.or(`donor_email.eq.${donorEmail},user_id.eq.${userId}`);
      } else {
        query = query.eq('donor_email', donorEmail);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching donor donations:', error);
        return [];
      }

      return data as PhysicalDonationWithItems[];
    } catch (error) {
      console.error('Error in getDonationsForDonor:', error);
      return [];
    }
  }

  /**
   * Get physical donations for an organization
   */
  async getDonationsForOrganization(
    organizationId: string,
    status?: PhysicalDonationStatus,
    limit = 50,
    offset = 0
  ): Promise<PhysicalDonationWithItems[]> {
    try {
      let query = supabase
        .from('physical_donations')
        .select(`
          *,
          donation_items (*)
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('donation_status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching organization donations:', error);
        return [];
      }

      return data as PhysicalDonationWithItems[];
    } catch (error) {
      console.error('Error in getDonationsForOrganization:', error);
      return [];
    }
  }

  /**
   * Get physical donations for a campaign
   */
  async getDonationsForCampaign(
    campaignId: string,
    status?: PhysicalDonationStatus,
    limit = 50,
    offset = 0
  ): Promise<PhysicalDonationWithItems[]> {
    try {
      let query = supabase
        .from('physical_donations')
        .select(`
          *,
          donation_items (*)
        `)
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('donation_status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching campaign donations:', error);
        return [];
      }

      return data as PhysicalDonationWithItems[];
    } catch (error) {
      console.error('Error in getDonationsForCampaign:', error);
      return [];
    }
  }

  /**
   * Update physical donation status
   */
  async updateDonationStatus(
    donationId: string,
    status: PhysicalDonationStatus,
    coordinatorNotes?: string
  ): Promise<{ success: boolean; error?: string; tierUpgrade?: any }> {
    try {
      // Get the donation first to check user_id
      const { data: donation, error: fetchError } = await supabase
        .from('physical_donations')
        .select('user_id, estimated_value')
        .eq('id', donationId)
        .single();

      if (fetchError) {
        return {
          success: false,
          error: fetchError.message
        };
      }

      const updateData: PhysicalDonationUpdate = {
        donation_status: status,
        coordinator_notes: coordinatorNotes
      };

      // Set timestamps based on status
      if (status === 'confirmed') {
        updateData.confirmed_at = new Date().toISOString();
      } else if (status === 'received') {
        updateData.received_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('physical_donations')
        .update(updateData)
        .eq('id', donationId);

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      // Update achievements if status changed to confirmed or received and user exists
      let tierUpgrade = undefined;
      if ((status === 'confirmed' || status === 'received') && donation.user_id) {
        try {
          // Get achievement before update to compare tiers
          const beforeAchievement = await gamificationService.getUserAchievement(donation.user_id);
          const beforeTier = beforeAchievement?.current_tier;
          
          // Update achievements (database triggers handle the calculation)
          const afterAchievement = await gamificationService.updateUserAchievement(donation.user_id);
          const afterTier = afterAchievement?.current_tier;
          
          // Check if tier upgraded
          if (beforeTier && afterTier && beforeTier !== afterTier) {
            tierUpgrade = {
              upgraded: true,
              fromTier: beforeTier,
              toTier: afterTier,
              triggeringDonationId: donationId,
              estimatedValue: donation.estimated_value
            };
          }
        } catch (gamificationError) {
          console.error('Error updating gamification achievements:', gamificationError);
          // Don't fail the status update if gamification update fails
        }
      }

      return { success: true, tierUpgrade };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Update donation item status
   */
  async updateDonationItemStatus(
    itemId: string,
    status: DonationItemStatus,
    declineReason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: DonationItemUpdate = {
        item_status: status
      };

      if (status === 'declined' && declineReason) {
        updateData.decline_reason = declineReason;
      }

      const { error } = await supabase
        .from('donation_items')
        .update(updateData)
        .eq('id', itemId);

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Add items to an existing physical donation
   */
  async addDonationItems(
    donationId: string,
    items: DonationItemFormData[]
  ): Promise<{ success: boolean; items?: DonationItem[]; error?: string }> {
    try {
      // Validate items
      const validation = this.validateDonationItems(items);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.map(e => e.message).join(', ')
        };
      }

      const itemsData: DonationItemInsert[] = items.map(item => ({
        physical_donation_id: donationId,
        category: item.category,
        subcategory: item.subcategory,
        item_name: item.itemName,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        condition: item.condition,
        estimated_value_per_unit: item.estimatedValuePerUnit,
        special_handling_notes: item.specialHandlingNotes,
        expiry_date: item.expiryDate,
        is_fragile: item.isFragile,
        requires_refrigeration: item.requiresRefrigeration,
        item_status: 'pending'
      }));

      const { data, error } = await supabase
        .from('donation_items')
        .insert(itemsData)
        .select();

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      // Update the total estimated value of the donation
      await this.updateDonationEstimatedValue(donationId);

      return {
        success: true,
        items: data as DonationItem[]
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Remove donation item
   */
  async removeDonationItem(itemId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get the item to find the donation ID for updating estimated value
      const { data: item, error: getError } = await supabase
        .from('donation_items')
        .select('physical_donation_id')
        .eq('id', itemId)
        .single();

      if (getError) {
        return {
          success: false,
          error: getError.message
        };
      }

      const { error } = await supabase
        .from('donation_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      // Update the total estimated value of the donation
      await this.updateDonationEstimatedValue(item.physical_donation_id);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Update donation item
   */
  async updateDonationItem(
    itemId: string,
    itemData: Partial<DonationItemFormData>
  ): Promise<{ success: boolean; item?: DonationItem; error?: string }> {
    try {
      const updateData: DonationItemUpdate = {};

      if (itemData.category) updateData.category = itemData.category;
      if (itemData.subcategory) updateData.subcategory = itemData.subcategory;
      if (itemData.itemName) updateData.item_name = itemData.itemName;
      if (itemData.description) updateData.description = itemData.description;
      if (itemData.quantity) updateData.quantity = itemData.quantity;
      if (itemData.unit) updateData.unit = itemData.unit;
      if (itemData.condition) updateData.condition = itemData.condition;
      if (itemData.estimatedValuePerUnit !== undefined) {
        updateData.estimated_value_per_unit = itemData.estimatedValuePerUnit;
      }
      if (itemData.specialHandlingNotes) updateData.special_handling_notes = itemData.specialHandlingNotes;
      if (itemData.expiryDate) updateData.expiry_date = itemData.expiryDate;
      if (itemData.isFragile !== undefined) updateData.is_fragile = itemData.isFragile;
      if (itemData.requiresRefrigeration !== undefined) {
        updateData.requires_refrigeration = itemData.requiresRefrigeration;
      }

      const { data, error } = await supabase
        .from('donation_items')
        .update(updateData)
        .eq('id', itemId)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      // Update the total estimated value of the donation
      await this.updateDonationEstimatedValue(data.physical_donation_id);

      return {
        success: true,
        item: data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Cancel physical donation
   */
  async cancelPhysicalDonation(
    donationId: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('physical_donations')
        .update({
          donation_status: 'cancelled',
          coordinator_notes: reason
        })
        .eq('id', donationId);

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get donation statistics for an organization
   */
  async getOrganizationDonationStats(organizationId: string): Promise<{
    total: number;
    pending: number;
    confirmed: number;
    received: number;
    estimatedValue: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('physical_donations')
        .select('donation_status, estimated_value')
        .eq('organization_id', organizationId);

      if (error) {
        console.error('Error fetching donation stats:', error);
        return { total: 0, pending: 0, confirmed: 0, received: 0, estimatedValue: 0 };
      }

      const stats = data.reduce(
        (acc, donation) => {
          acc.total++;
          acc.estimatedValue += donation.estimated_value || 0;
          
          switch (donation.donation_status) {
            case 'pending':
              acc.pending++;
              break;
            case 'confirmed':
              acc.confirmed++;
              break;
            case 'received':
              acc.received++;
              break;
          }
          
          return acc;
        },
        { total: 0, pending: 0, confirmed: 0, received: 0, estimatedValue: 0 }
      );

      return stats;
    } catch (error) {
      console.error('Error in getOrganizationDonationStats:', error);
      return { total: 0, pending: 0, confirmed: 0, received: 0, estimatedValue: 0 };
    }
  }

  /**
   * Validate physical donation data
   */
  private validatePhysicalDonationData(data: PhysicalDonationFormData): DonationValidationResult {
    const errors: DonationError[] = [];

    if (!data.donorName || data.donorName.trim().length === 0) {
      errors.push({ code: 'DONOR_NAME_REQUIRED', message: 'Donor name is required' });
    }

    if (!data.donorEmail || !this.isValidEmail(data.donorEmail)) {
      errors.push({ code: 'INVALID_EMAIL', message: 'Valid donor email is required' });
    }

    if (!data.targetName || data.targetName.trim().length === 0) {
      errors.push({ code: 'TARGET_NAME_REQUIRED', message: 'Target name is required' });
    }

    if (!data.items || data.items.length === 0) {
      errors.push({ code: 'ITEMS_REQUIRED', message: 'At least one donation item is required' });
    } else {
      const itemValidation = this.validateDonationItems(data.items);
      errors.push(...itemValidation.errors);
    }

    if (data.pickupPreference !== 'delivery' && (!data.pickupAddress || data.pickupAddress.trim().length === 0)) {
      errors.push({ code: 'PICKUP_ADDRESS_REQUIRED', message: 'Pickup address is required' });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate donation items
   */
  private validateDonationItems(items: DonationItemFormData[]): DonationValidationResult {
    const errors: DonationError[] = [];

    items.forEach((item, index) => {
      if (!item.itemName || item.itemName.trim().length === 0) {
        errors.push({
          code: 'ITEM_NAME_REQUIRED',
          message: `Item name is required for item ${index + 1}`,
          field: `items[${index}].itemName`
        });
      }

      if (!item.category) {
        errors.push({
          code: 'ITEM_CATEGORY_REQUIRED',
          message: `Category is required for item ${index + 1}`,
          field: `items[${index}].category`
        });
      }

      if (item.quantity <= 0) {
        errors.push({
          code: 'INVALID_QUANTITY',
          message: `Quantity must be greater than 0 for item ${index + 1}`,
          field: `items[${index}].quantity`
        });
      }

      if (item.estimatedValuePerUnit && item.estimatedValuePerUnit < 0) {
        errors.push({
          code: 'INVALID_VALUE',
          message: `Estimated value cannot be negative for item ${index + 1}`,
          field: `items[${index}].estimatedValuePerUnit`
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Update the estimated value of a physical donation based on its items
   */
  private async updateDonationEstimatedValue(donationId: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('donation_items')
        .select('total_estimated_value')
        .eq('physical_donation_id', donationId);

      if (error) {
        console.error('Error calculating estimated value:', error);
        return;
      }

      const totalValue = data.reduce((sum, item) => sum + (item.total_estimated_value || 0), 0);

      await supabase
        .from('physical_donations')
        .update({ estimated_value: totalValue })
        .eq('id', donationId);
    } catch (error) {
      console.error('Error updating estimated value:', error);
    }
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Export a singleton instance
export const physicalDonationService = new PhysicalDonationService();
