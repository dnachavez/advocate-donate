-- Fix RLS policy for physical_donations to allow organizations to view and update campaign donations
-- Physical donations to campaigns don't have organization_id set, so we need to check campaign ownership

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Organizations can view their received physical donations" ON physical_donations;
DROP POLICY IF EXISTS "Organizations can update their received physical donations" ON physical_donations;

-- Create updated SELECT policy that checks both organization_id AND campaign_id
CREATE POLICY "Organizations can view their received physical donations" ON physical_donations
    FOR SELECT USING (
        -- Direct organization donations
        EXISTS (
            SELECT 1 FROM organizations o
            WHERE o.id = physical_donations.organization_id 
            AND o.user_id = auth.uid()
        )
        OR
        -- Campaign donations (check if the campaign belongs to the user's organization)
        EXISTS (
            SELECT 1 FROM campaigns c
            JOIN organizations o ON o.id = c.organization_id
            WHERE c.id = physical_donations.campaign_id
            AND o.user_id = auth.uid()
        )
    );

-- Create updated UPDATE policy that checks both organization_id AND campaign_id
CREATE POLICY "Organizations can update their received physical donations" ON physical_donations
    FOR UPDATE USING (
        -- Direct organization donations
        EXISTS (
            SELECT 1 FROM organizations o
            WHERE o.id = physical_donations.organization_id 
            AND o.user_id = auth.uid()
        )
        OR
        -- Campaign donations (check if the campaign belongs to the user's organization)
        EXISTS (
            SELECT 1 FROM campaigns c
            JOIN organizations o ON o.id = c.organization_id
            WHERE c.id = physical_donations.campaign_id
            AND o.user_id = auth.uid()
        )
    );

COMMENT ON POLICY "Organizations can view their received physical donations" ON physical_donations IS 
'Allows organization owners to view all physical donations made to their organization or campaigns';

COMMENT ON POLICY "Organizations can update their received physical donations" ON physical_donations IS 
'Allows organization owners to update status of physical donations made to their organization or campaigns';

