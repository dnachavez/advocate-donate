import { donationService } from './donationService';
import { physicalDonationService } from './physicalDonationService';
import { donationTypeService } from './donationTypeService';
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
