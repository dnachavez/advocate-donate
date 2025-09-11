-- Add fund_usage_description column to campaigns table
-- This column stores how the campaign funds will be used

ALTER TABLE campaigns 
ADD COLUMN fund_usage_description TEXT;

-- Add a comment to the column for documentation
COMMENT ON COLUMN campaigns.fund_usage_description IS 'Detailed description of how the campaign funds will be used and allocated';
