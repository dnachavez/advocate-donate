import { supabase } from '@/integrations/supabase/client';
import { ImpactEvidence } from '@/types/organizations';

export const evidenceService = {
    /**
     * Submit new impact evidence
     */
    async submitEvidence(evidence: Omit<ImpactEvidence, 'id' | 'submitted_at' | 'created_at' | 'updated_at' | 'status'>) {
        // Cast to any to bypass type check for new table
        const { data, error } = await (supabase
            .from('impact_evidence' as any)
            .insert({
                target_type: evidence.target_type,
                target_id: evidence.target_id,
                title: evidence.title,
                description: evidence.description,
                media_urls: evidence.media_urls,
                created_by: evidence.created_by,
                status: 'submitted'
            })
            .select()
            .single());

        if (error) throw error;
        return data;
    },

    /**
     * Get evidence for a specific target (campaign or organization)
     */
    async getEvidenceForTarget(targetType: 'campaign' | 'organization', targetId: string) {
        // Cast to any to bypass type check for new table
        const { data, error } = await (supabase
            .from('impact_evidence' as any)
            .select('*')
            .eq('target_type', targetType)
            .eq('target_id', targetId)
            .order('submitted_at', { ascending: false }));

        if (error) throw error;
        return data as unknown as ImpactEvidence[];
    },

    /**
     * Get all evidence for an organization (including campaign evidence)
     */
    async getOrganizationEvidence(organizationId: string) {
        // First get the organization's campaigns to get their IDs/slugs
        const { data: campaigns } = await supabase
            .from('campaigns')
            .select('slug')
            .eq('organization_id', organizationId);

        const campaignSlugs = campaigns?.map(c => c.slug) || [];

        // Build query to get evidence for the org OR its campaigns
        // Note: This is a bit complex with the current structure, so we might need two queries or a complex OR
        // Simpler approach: Get org evidence AND campaign evidence separately and merge

        const { data: orgEvidence, error: orgError } = await (supabase
            .from('impact_evidence' as any)
            .select('*')
            .eq('target_type', 'organization')
            .eq('target_id', organizationId) // Assuming organization target_id is the ID or slug. The upload form uses slug or ID.
        );

        if (orgError) throw orgError;

        let allEvidence = [...(orgEvidence || [])];

        if (campaignSlugs.length > 0) {
            const { data: campaignEvidence, error: campError } = await (supabase
                .from('impact_evidence' as any)
                .select('*')
                .eq('target_type', 'campaign')
                .in('target_id', campaignSlugs)
            );

            if (campError) throw campError;
            allEvidence = [...allEvidence, ...(campaignEvidence || [])];
        }

        // Sort by date
        return (allEvidence as any[]).sort((a, b) =>
            new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
        ) as unknown as ImpactEvidence[];
    },

    /**
     * Delete evidence
     */
    async deleteEvidence(id: string) {
        const { error } = await (supabase
            .from('impact_evidence' as any)
            .delete()
            .eq('id', id));

        if (error) throw error;
    },

    /**
     * Update evidence
     */
    async updateEvidence(id: string, updates: Partial<ImpactEvidence>) {
        const { data, error } = await (supabase
            .from('impact_evidence' as any)
            .update(updates)
            .eq('id', id)
            .select()
            .single());

        if (error) throw error;
        return data;
    }
};
