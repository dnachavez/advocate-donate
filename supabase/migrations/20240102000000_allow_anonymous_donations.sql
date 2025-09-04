-- Allow anonymous donations for public donation forms
-- This migration adds policies to allow anonymous users to create donations

-- Allow anonymous users to insert donations
CREATE POLICY "Allow anonymous donations" ON donations
    FOR INSERT WITH CHECK (true);

-- Allow anonymous users to insert subscriptions (for recurring donations)
CREATE POLICY "Allow anonymous subscriptions" ON subscriptions
    FOR INSERT WITH CHECK (true);

-- Allow anonymous users to insert donation receipts
CREATE POLICY "Allow anonymous donation receipts" ON donation_receipts
    FOR INSERT WITH CHECK (true);

-- Note: These policies allow public donation creation while maintaining
-- read restrictions based on email authentication for privacy