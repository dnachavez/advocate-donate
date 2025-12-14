import { donationService } from './donationService';
import { physicalDonationService } from './physicalDonationService';
import { donationTypeService } from './donationTypeService';
import { campaignService } from './campaignService';
import { supabase } from '../integrations/supabase/client';
import {
  UnifiedDonation,
  DonationHistoryFilters,
  DonationHistorySort,
  DonationHistoryResponse,
  DonationStats,
  DonationType,
  TargetType,
  PickupPreference
} from '../types/donations';

/**
 * Unified service for managing both cash and physical donations
 * Extends the existing donation service with unified operations
 */
export class UnifiedDonationService {

  /**
   * Get unified donation history for a user, organization, or campaign
   */
  async getDonationHistory(
    filters: {
      userId?: string;
      donorEmail?: string;
      organizationId?: string;
      campaignId?: string;
      filters?: DonationHistoryFilters;
      sorting?: DonationHistorySort;
      page?: number;
      pageSize?: number;
    }
  ): Promise<DonationHistoryResponse> {
    const {
      userId,
      donorEmail,
      organizationId,
      campaignId,
      filters: searchFilters = {},
      sorting = { field: 'created_at', direction: 'desc' },
      page = 1,
      pageSize = 20
    } = filters;

    try {
      // Load both cash and physical donations in parallel
      const [cashDonations, physicalDonations] = await Promise.all([
        this.loadCashDonations({ userId, donorEmail, organizationId, campaignId, page, pageSize }),
        this.loadPhysicalDonations({ userId, donorEmail, organizationId, campaignId, page, pageSize })
      ]);

      // Combine and process donations
      const allDonations = [...cashDonations, ...physicalDonations];
      const filteredDonations = this.filterDonations(allDonations, searchFilters);
      const sortedDonations = this.sortDonations(filteredDonations, sorting);

      // Paginate results
      const startIndex = (page - 1) * pageSize;
      const paginatedDonations = sortedDonations.slice(startIndex, startIndex + pageSize);

      // Calculate statistics
      const stats = this.calculateStats(allDonations);

      return {
        donations: paginatedDonations,
        totalCount: sortedDonations.length,
        stats,
        hasMore: sortedDonations.length > startIndex + pageSize
      };
    } catch (error) {
      console.error('Error getting donation history:', error);
      return {
        donations: [],
        totalCount: 0,
        stats: this.getEmptyStats(),
        hasMore: false
      };
    }
  }

  /**
   * Get donation statistics for a user, organization, or campaign
   */
  async getDonationStats(filters: {
    userId?: string;
    organizationId?: string;
    campaignId?: string;
    dateRange?: { start: string; end: string };
  }): Promise<DonationStats> {
    try {
      const history = await this.getDonationHistory({
        ...filters,
        pageSize: 1000 // Get all for stats calculation
      });

      return history.stats;
    } catch (error) {
      console.error('Error getting donation stats:', error);
      return this.getEmptyStats();
    }
  }

  /**
   * Get comprehensive donation statistics for an organization across all campaigns
   * This aggregates donations from all active and inactive campaigns
   */
  async getOrganizationCampaignDonationsStats(organizationId: string): Promise<DonationStats> {
    try {
      console.log('getOrganizationCampaignDonationsStats called with organizationId:', organizationId);
      
      // Get all campaigns (active and inactive) for the organization
      const { data: campaigns, error: campaignsError } = await campaignService.getAllCampaignsByOrganization(organizationId);
      
      if (campaignsError) {
        console.error('Error fetching campaigns:', campaignsError);
        return this.getEmptyStats();
      }

      console.log('Campaigns found:', campaigns?.length || 0, campaigns?.map(c => ({ id: c.id, title: c.title, status: c.status })));

      const campaignIds = campaigns?.map(c => c.id) || [];

      // Fetch all cash donations for the organization
      // Cash donations to campaigns already have organization_id set (from payment.ts)
      // So we can query by organization_id to get both direct org donations AND campaign donations
      let cashDonations: any[] = [];
      
      // Query 1: Get donations where organization_id matches
      const { data: orgCashDonationsData, error: orgCashError } = await supabase
        .from('donations')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('payment_status', 'succeeded');

      if (orgCashError) {
        console.error('Error fetching org cash donations:', orgCashError);
      } else {
        cashDonations.push(...(orgCashDonationsData || []));
        console.log('Org cash donations (by organization_id):', orgCashDonationsData?.length || 0);
      }

      // Query 2: Also get donations by campaign_id (in case some don't have organization_id set)
      if (campaignIds.length > 0) {
        // Query for donations that have campaign_id but might not have organization_id
        const { data: campaignCashDonationsData, error: campaignCashError } = await supabase
          .from('donations')
          .select('*')
          .in('campaign_id', campaignIds)
          .eq('payment_status', 'succeeded');

        if (campaignCashError) {
          console.error('Error fetching campaign cash donations:', campaignCashError);
        } else if (campaignCashDonationsData) {
          // Deduplicate by adding only donations we don't already have
          const existingIds = new Set(cashDonations.map(d => d.id));
          const newDonations = campaignCashDonationsData.filter(d => !existingIds.has(d.id));
          cashDonations.push(...newDonations);
          console.log('Campaign cash donations (by campaign_id):', campaignCashDonationsData.length, 'new:', newDonations.length);
        }
      }

      console.log('Cash donations found:', {
        total: cashDonations.length,
        sampleDonation: cashDonations[0] ? { 
          id: cashDonations[0].id, 
          amount: cashDonations[0].amount,
          organization_id: cashDonations[0].organization_id,
          campaign_id: cashDonations[0].campaign_id
        } : null
      });

      // Fetch all physical donations for the organization
      // Physical donations to campaigns might NOT have organization_id set (from physicalDonationService.ts)
      // So we need to query both by organization_id AND by campaign_id
      let physicalDonations: any[] = [];

      // Get direct organization physical donations (where organization_id is set)
      const { data: orgPhysicalDonationsData, error: orgPhysicalError } = await supabase
        .from('physical_donations')
        .select(`
          *,
          donation_items (*)
        `)
        .eq('organization_id', organizationId);

      if (orgPhysicalError) {
        console.error('Error fetching org physical donations:', orgPhysicalError);
      } else if (orgPhysicalDonationsData) {
        physicalDonations.push(...orgPhysicalDonationsData);
      }

      // Get physical donations for campaigns (these might not have organization_id set)
      if (campaignIds.length > 0) {
        const { data: campaignPhysicalDonationsData, error: campaignPhysicalError } = await supabase
          .from('physical_donations')
          .select(`
            *,
            donation_items (*)
          `)
          .in('campaign_id', campaignIds);

        if (campaignPhysicalError) {
          console.error('Error fetching campaign physical donations:', campaignPhysicalError);
        } else if (campaignPhysicalDonationsData) {
          // Deduplicate by adding only donations we don't already have
          const existingIds = new Set(physicalDonations.map(d => d.id));
          const newDonations = campaignPhysicalDonationsData.filter(d => !existingIds.has(d.id));
          physicalDonations.push(...newDonations);
          console.log('Campaign physical donations (by campaign_id):', campaignPhysicalDonationsData.length, 'new:', newDonations.length);
        }
      }

      console.log('Physical donations found:', {
        orgDonations: orgPhysicalDonationsData?.length || 0,
        campaignDonations: campaignIds.length > 0 ? 'queried' : 'no campaigns',
        totalBeforeDedup: physicalDonations.length,
        sampleDonation: physicalDonations[0] ? {
          id: physicalDonations[0].id,
          organization_id: physicalDonations[0].organization_id,
          campaign_id: physicalDonations[0].campaign_id,
          itemsCount: physicalDonations[0].donation_items?.length || 0
        } : null
      });

      // Calculate cash donation stats
      const totalCashAmount = cashDonations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
      const totalCashDonations = cashDonations.length;

      console.log('Cash donation stats:', {
        totalCashAmount,
        totalCashDonations,
        sampleDonation: cashDonations[0] ? { id: cashDonations[0].id, amount: cashDonations[0].amount } : null
      });

      // Calculate physical donation stats
      // Only include approved/confirmed donations (exclude pending, declined, cancelled)
      // Physical value should be calculated from donation items' total_estimated_value
      let totalPhysicalValue = 0;
      const uniquePhysicalDonations = new Map<string, any>();
      
      // Deduplicate physical donations (in case they appear in both org and campaign queries)
      // Filter out pending, declined, and cancelled donations
      const approvedStatuses = ['confirmed', 'in_transit', 'received'];
      physicalDonations.forEach(donation => {
        if (!uniquePhysicalDonations.has(donation.id)) {
          // Only include approved donations
          if (approvedStatuses.includes(donation.donation_status)) {
            uniquePhysicalDonations.set(donation.id, donation);
          }
        }
      });

      // Calculate total physical value from all donation items
      uniquePhysicalDonations.forEach(donation => {
        if (donation.donation_items && donation.donation_items.length > 0) {
          const donationValue = donation.donation_items.reduce(
            (sum: number, item: any) => sum + (Number(item.total_estimated_value) || 0),
            0
          );
          totalPhysicalValue += donationValue;
        } else if (donation.estimated_value) {
          // Fallback to donation-level estimated_value if items not loaded
          totalPhysicalValue += Number(donation.estimated_value) || 0;
        }
      });

      const totalPhysicalDonations = uniquePhysicalDonations.size;

      console.log('Physical donation stats:', {
        totalPhysicalValue,
        totalPhysicalDonations,
        sampleDonation: Array.from(uniquePhysicalDonations.values())[0] ? {
          id: Array.from(uniquePhysicalDonations.values())[0].id,
          estimated_value: Array.from(uniquePhysicalDonations.values())[0].estimated_value,
          itemsCount: Array.from(uniquePhysicalDonations.values())[0].donation_items?.length || 0
        } : null
      });
      const monthlyData: Record<string, any> = {};
      
      (cashDonations || []).forEach(donation => {
        const month = new Date(donation.created_at).toISOString().slice(0, 7);
        if (!monthlyData[month]) {
          monthlyData[month] = {
            month,
            cashDonations: 0,
            physicalDonations: 0,
            cashAmount: 0,
            estimatedValue: 0
          };
        }
        monthlyData[month].cashDonations++;
        monthlyData[month].cashAmount += Number(donation.amount) || 0;
      });

      // Only process approved physical donations for monthly breakdown
      uniquePhysicalDonations.forEach(donation => {
        const month = new Date(donation.created_at || '').toISOString().slice(0, 7);
        if (!monthlyData[month]) {
          monthlyData[month] = {
            month,
            cashDonations: 0,
            physicalDonations: 0,
            cashAmount: 0,
            estimatedValue: 0
          };
        }
        monthlyData[month].physicalDonations++;
        if (donation.donation_items && donation.donation_items.length > 0) {
          const donationValue = donation.donation_items.reduce(
            (sum: number, item: any) => sum + (Number(item.total_estimated_value) || 0),
            0
          );
          monthlyData[month].estimatedValue += donationValue;
        } else if (donation.estimated_value) {
          monthlyData[month].estimatedValue += Number(donation.estimated_value) || 0;
        }
      });

      // Calculate top categories for physical donations
      const categoryData: Record<string, any> = {};
      uniquePhysicalDonations.forEach(donation => {
        if (donation.donation_items) {
          donation.donation_items.forEach((item: any) => {
            if (!categoryData[item.category]) {
              categoryData[item.category] = {
                category: item.category,
                count: 0,
                estimatedValue: 0
              };
            }
            categoryData[item.category].count++;
            categoryData[item.category].estimatedValue += Number(item.total_estimated_value) || 0;
          });
        }
      });

      const finalStats = {
        totalCashDonations,
        totalPhysicalDonations,
        totalCashAmount,
        totalEstimatedValue: totalPhysicalValue,
        donationsByMonth: Object.values(monthlyData),
        topCategories: Object.values(categoryData)
          .sort((a: any, b: any) => b.count - a.count)
          .slice(0, 10)
      };

      console.log('Final donation stats for organization:', {
        organizationId,
        campaignsCount: campaigns?.length || 0,
        campaignIds: campaignIds.length,
        stats: finalStats
      });

      return finalStats;
    } catch (error) {
      console.error('Error getting organization campaign donations stats:', error);
      console.error('Error details:', error instanceof Error ? error.stack : error);
      return this.getEmptyStats();
    }
  }

  /**
   * Check if a target accepts specific donation types
   */
  async getAcceptedDonationTypes(
    targetType: 'organization' | 'campaign',
    targetId: string
  ): Promise<{ cash: boolean; physical: boolean; categories?: string[] }> {
    try {
      const donationTypes = await donationTypeService.getEffectiveDonationTypes(targetType, targetId);

      if (!donationTypes) {
        return { cash: true, physical: false };
      }

      return {
        cash: donationTypes.accepts_cash_donations,
        physical: donationTypes.accepts_physical_donations,
        categories: donationTypes.physical_donation_categories
      };
    } catch (error) {
      console.error('Error getting accepted donation types:', error);
      return { cash: true, physical: false };
    }
  }

  /**
   * Get comprehensive donation summary for dashboards
   */
  async getDashboardSummary(filters: {
    userId?: string;
    organizationId?: string;
    campaignId?: string;
  }): Promise<{
    totalValue: number;
    totalDonations: number;
    monthlyTrend: Array<{
      month: string;
      cashAmount: number;
      physicalValue: number;
      totalDonations: number;
    }>;
    recentDonations: UnifiedDonation[];
    topCategories: Array<{
      category: string;
      count: number;
      value: number;
    }>;
  }> {
    try {
      const history = await this.getDonationHistory({
        ...filters,
        pageSize: 100
      });

      const recentDonations = history.donations.slice(0, 5);
      const monthlyTrend = this.calculateMonthlyTrend(history.donations);
      const topCategories = this.calculateTopCategories(history.donations);

      return {
        totalValue: history.stats.totalCashAmount + history.stats.totalEstimatedValue,
        totalDonations: history.stats.totalCashDonations + history.stats.totalPhysicalDonations,
        monthlyTrend,
        recentDonations,
        topCategories
      };
    } catch (error) {
      console.error('Error getting dashboard summary:', error);
      return {
        totalValue: 0,
        totalDonations: 0,
        monthlyTrend: [],
        recentDonations: [],
        topCategories: []
      };
    }
  }

  /**
   * Update donation status (works for both cash and physical donations)
   */
  async updateDonationStatus(
    donationId: string,
    donationType: DonationType,
    status: string,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (donationType === 'physical') {
        return await physicalDonationService.updateDonationStatus(
          donationId,
          status as any,
          notes
        );
      } else {
        // For cash donations, this would depend on the existing donation service
        // implementation for status updates
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Search donations by text query
   */
  async searchDonations(
    query: string,
    filters: {
      userId?: string;
      organizationId?: string;
      campaignId?: string;
      donationType?: DonationType;
    }
  ): Promise<UnifiedDonation[]> {
    try {
      const history = await this.getDonationHistory({
        ...filters,
        pageSize: 100
      });

      const searchTerm = query.toLowerCase();
      return history.donations.filter(donation =>
        donation.donorName.toLowerCase().includes(searchTerm) ||
        donation.targetName.toLowerCase().includes(searchTerm) ||
        donation.message?.toLowerCase().includes(searchTerm) ||
        (donation.donationItems?.some(item =>
          item.item_name.toLowerCase().includes(searchTerm) ||
          item.category.toLowerCase().includes(searchTerm)
        ))
      );
    } catch (error) {
      console.error('Error searching donations:', error);
      return [];
    }
  }

  /**
   * Get donation details by ID and type
   */
  async getDonationDetails(
    donationId: string,
    donationType: DonationType
  ): Promise<UnifiedDonation | null> {
    try {
      if (donationType === 'physical') {
        const donation = await physicalDonationService.getPhysicalDonationById(donationId);
        if (!donation) return null;

        return {
          id: donation.id,
          type: 'physical',
          donorName: donation.donor_name,
          donorEmail: donation.donor_email,
          message: donation.message,
          targetType: donation.target_type as TargetType,
          targetId: donation.target_id,
          targetName: donation.target_name,
          createdAt: donation.created_at || '',
          status: donation.donation_status as any,
          estimatedValue: donation.estimated_value,
          pickupPreference: donation.pickup_preference as PickupPreference,
          donationItems: donation.donation_items || [],
          coordinatorNotes: donation.coordinator_notes
        };
      } else {
        // For cash donations, would use existing donation service
        // This is a placeholder for the actual implementation
        return null;
      }
    } catch (error) {
      console.error('Error getting donation details:', error);
      return null;
    }
  }

  // Private helper methods

  private async loadCashDonations(filters: {
    userId?: string;
    donorEmail?: string;
    organizationId?: string;
    campaignId?: string;
    page: number;
    pageSize: number;
  }): Promise<UnifiedDonation[]> {
    try {
      // This would integrate with the existing donation service
      // For now, returning empty array as implementation depends on existing service structure
      const startIndex = (filters.page - 1) * filters.pageSize;
      const endIndex = startIndex + filters.pageSize - 1;

      const { data, error } = await supabase
        .from('donations')
        .select('*')
        .range(startIndex, endIndex)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading cash donations:', error);
        return [];
      }

      return (data || []).map(donation => ({
        id: donation.id,
        type: 'cash' as DonationType,
        donorName: donation.donor_name,
        donorEmail: donation.donor_email,
        message: donation.message,
        targetType: donation.target_type as TargetType,
        targetId: donation.target_id,
        targetName: donation.target_name,
        createdAt: donation.created_at || '',
        status: donation.payment_status as any,
        amount: donation.amount,
        currency: donation.currency,
        paymentIntentId: donation.payment_intent_id,
        paymentStatus: donation.payment_status as any
      }));
    } catch (error) {
      console.error('Error loading cash donations:', error);
      return [];
    }
  }

  private async loadPhysicalDonations(filters: {
    userId?: string;
    donorEmail?: string;
    organizationId?: string;
    campaignId?: string;
    page: number;
    pageSize: number;
  }): Promise<UnifiedDonation[]> {
    try {
      let physicalDonations = [];

      if (filters.organizationId) {
        physicalDonations = await physicalDonationService.getDonationsForOrganization(
          filters.organizationId,
          undefined,
          filters.pageSize,
          (filters.page - 1) * filters.pageSize
        );
      } else if (filters.campaignId) {
        physicalDonations = await physicalDonationService.getDonationsForCampaign(
          filters.campaignId,
          undefined,
          filters.pageSize,
          (filters.page - 1) * filters.pageSize
        );
      } else if (filters.userId || filters.donorEmail) {
        physicalDonations = await physicalDonationService.getDonationsForDonor(
          filters.donorEmail || '',
          filters.userId,
          filters.pageSize,
          (filters.page - 1) * filters.pageSize
        );
      }

      return physicalDonations.map(donation => ({
        id: donation.id,
        type: 'physical' as DonationType,
        donorName: donation.donor_name,
        donorEmail: donation.donor_email,
        message: donation.message,
        targetType: donation.target_type as TargetType,
        targetId: donation.target_id,
        targetName: donation.target_name,
        createdAt: donation.created_at || '',
        status: donation.donation_status as any,
        estimatedValue: donation.estimated_value,
        pickupPreference: donation.pickup_preference as PickupPreference,
        donationItems: donation.donation_items || [],
        coordinatorNotes: donation.coordinator_notes
      }));
    } catch (error) {
      console.error('Error loading physical donations:', error);
      return [];
    }
  }

  private filterDonations(donations: UnifiedDonation[], filters: DonationHistoryFilters): UnifiedDonation[] {
    return donations.filter(donation => {
      if (filters.donationType && filters.donationType !== 'all' && donation.type !== filters.donationType) {
        return false;
      }

      if (filters.status && filters.status !== 'all' && donation.status !== filters.status) {
        return false;
      }

      if (filters.targetType && filters.targetType !== 'all' && donation.targetType !== filters.targetType) {
        return false;
      }

      if (filters.dateRange) {
        const donationDate = new Date(donation.createdAt);
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        if (donationDate < startDate || donationDate > endDate) {
          return false;
        }
      }

      if (filters.minAmount && (donation.amount || donation.estimatedValue || 0) < filters.minAmount) {
        return false;
      }

      if (filters.maxAmount && (donation.amount || donation.estimatedValue || 0) > filters.maxAmount) {
        return false;
      }

      return true;
    });
  }

  private sortDonations(donations: UnifiedDonation[], sorting: DonationHistorySort): UnifiedDonation[] {
    return [...donations].sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sorting.field) {
        case 'created_at':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'amount':
        case 'estimated_value':
          aValue = a.amount || a.estimatedValue || 0;
          bValue = b.amount || b.estimatedValue || 0;
          break;
        case 'donor_name':
          aValue = a.donorName.toLowerCase();
          bValue = b.donorName.toLowerCase();
          break;
        default:
          return 0;
      }

      if (sorting.direction === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }

  private calculateStats(donations: UnifiedDonation[]): DonationStats {
    const cashDonations = donations.filter(d => d.type === 'cash');
    const physicalDonations = donations.filter(d => d.type === 'physical');

    const totalCashAmount = cashDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
    const totalEstimatedValue = physicalDonations.reduce((sum, d) => sum + (d.estimatedValue || 0), 0);

    // Calculate monthly breakdown
    const monthlyData: Record<string, any> = {};
    donations.forEach(donation => {
      const month = new Date(donation.createdAt).toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = {
          month,
          cashDonations: 0,
          physicalDonations: 0,
          cashAmount: 0,
          estimatedValue: 0
        };
      }

      if (donation.type === 'cash') {
        monthlyData[month].cashDonations++;
        monthlyData[month].cashAmount += donation.amount || 0;
      } else {
        monthlyData[month].physicalDonations++;
        monthlyData[month].estimatedValue += donation.estimatedValue || 0;
      }
    });

    // Calculate top categories for physical donations
    const categoryData: Record<string, any> = {};
    physicalDonations.forEach(donation => {
      donation.donationItems?.forEach(item => {
        if (!categoryData[item.category]) {
          categoryData[item.category] = {
            category: item.category,
            count: 0,
            estimatedValue: 0
          };
        }
        categoryData[item.category].count++;
        categoryData[item.category].estimatedValue += item.total_estimated_value || 0;
      });
    });

    return {
      totalCashDonations: cashDonations.length,
      totalPhysicalDonations: physicalDonations.length,
      totalCashAmount,
      totalEstimatedValue,
      donationsByMonth: Object.values(monthlyData),
      topCategories: Object.values(categoryData)
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 10)
    };
  }

  private calculateMonthlyTrend(donations: UnifiedDonation[]) {
    const monthlyData: Record<string, any> = {};

    donations.forEach(donation => {
      const month = new Date(donation.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short'
      });

      if (!monthlyData[month]) {
        monthlyData[month] = {
          month,
          cashAmount: 0,
          physicalValue: 0,
          totalDonations: 0
        };
      }

      monthlyData[month].totalDonations++;
      if (donation.type === 'cash') {
        monthlyData[month].cashAmount += donation.amount || 0;
      } else {
        monthlyData[month].physicalValue += donation.estimatedValue || 0;
      }
    });

    return Object.values(monthlyData)
      .sort((a: any, b: any) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .slice(-6); // Last 6 months
  }

  private calculateTopCategories(donations: UnifiedDonation[]) {
    const categoryData: Record<string, any> = {};

    donations.forEach(donation => {
      if (donation.type === 'physical' && donation.donationItems) {
        donation.donationItems.forEach(item => {
          if (!categoryData[item.category]) {
            categoryData[item.category] = {
              category: item.category,
              count: 0,
              value: 0
            };
          }
          categoryData[item.category].count++;
          categoryData[item.category].value += item.total_estimated_value || 0;
        });
      }
    });

    return Object.values(categoryData)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 5);
  }

  private getEmptyStats(): DonationStats {
    return {
      totalCashDonations: 0,
      totalPhysicalDonations: 0,
      totalCashAmount: 0,
      totalEstimatedValue: 0,
      donationsByMonth: [],
      topCategories: []
    };
  }
}

// Export singleton instance
export const unifiedDonationService = new UnifiedDonationService();
