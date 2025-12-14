-- Add RLS policy to allow organizations to view donations made to them
-- This fixes the issue where organizations cannot see donations in their dashboard

-- Drop existing policy if it exists (to allow re-running this migration)
DROP POLICY IF EXISTS "Organizations can view their received donations" ON donations;

-- Create policy for organizations to view donations made to them
-- This allows organization owners to see:
-- 1. Direct donations to their organization (organization_id matches)
-- 2. Donations to their campaigns (campaign_id matches a campaign they own)
CREATE POLICY "Organizations can view their received donations" ON donations
    FOR SELECT USING (
        -- Direct organization donations
        EXISTS (
            SELECT 1 FROM organizations o
            WHERE o.id = donations.organization_id 
            AND o.user_id = auth.uid()
        )
        OR
        -- Campaign donations (check if the campaign belongs to the user's organization)
        EXISTS (
            SELECT 1 FROM campaigns c
            JOIN organizations o ON o.id = c.organization_id
            WHERE c.id = donations.campaign_id
            AND o.user_id = auth.uid()
        )
    );

-- Also allow organizations to view donations where organization_id is set
-- even if the donation was made to a campaign (since payment.ts sets both)
COMMENT ON POLICY "Organizations can view their received donations" ON donations IS 
'Allows organization owners to view all donations made to their organization or campaigns';

