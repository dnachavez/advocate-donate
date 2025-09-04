-- Create donation-related tables for Bridge Needs platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create donations table
CREATE TABLE donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    donor_name VARCHAR(255) NOT NULL,
    donor_email VARCHAR(255) NOT NULL,
    donor_phone VARCHAR(20),
    message TEXT,
    is_anonymous BOOLEAN DEFAULT FALSE,
    is_recurring BOOLEAN DEFAULT FALSE,
    frequency VARCHAR(20) CHECK (frequency IN ('monthly', 'quarterly', 'yearly')),
    
    -- Payment information
    payment_intent_id VARCHAR(255) NOT NULL,
    payment_method_id VARCHAR(255),
    payment_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'succeeded', 'failed', 'canceled')),
    
    -- Donation target (campaign, organization, or general)
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('campaign', 'organization', 'general')),
    target_id VARCHAR(255), -- Can be campaign ID, organization slug, or null for general
    target_name VARCHAR(255) NOT NULL, -- Display name of the target
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Create subscriptions table for recurring donations
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donation_id UUID NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
    subscription_id VARCHAR(255) NOT NULL UNIQUE, -- External subscription ID from payment provider
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'paused')),
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('monthly', 'quarterly', 'yearly')),
    
    -- Customer information
    customer_email VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    
    -- Target information
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('campaign', 'organization', 'general')),
    target_id VARCHAR(255),
    target_name VARCHAR(255) NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    next_payment_date TIMESTAMP WITH TIME ZONE,
    canceled_at TIMESTAMP WITH TIME ZONE
);

-- Create donation_receipts table for tax receipts
CREATE TABLE donation_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donation_id UUID NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
    receipt_number VARCHAR(50) NOT NULL UNIQUE,
    receipt_url TEXT,
    tax_deductible_amount DECIMAL(10,2) NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX idx_donations_donor_email ON donations(donor_email);
CREATE INDEX idx_donations_target ON donations(target_type, target_id);
CREATE INDEX idx_donations_created_at ON donations(created_at);
CREATE INDEX idx_donations_payment_status ON donations(payment_status);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_customer_email ON subscriptions(customer_email);
CREATE INDEX idx_subscriptions_next_payment ON subscriptions(next_payment_date);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_donations_updated_at BEFORE UPDATE ON donations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate receipt numbers
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TEXT AS $$
DECLARE
    receipt_num TEXT;
    year_part TEXT;
    sequence_num INTEGER;
BEGIN
    year_part := EXTRACT(YEAR FROM NOW())::TEXT;
    
    -- Get the next sequence number for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(receipt_number FROM 6) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM donation_receipts
    WHERE receipt_number LIKE year_part || '-%';
    
    receipt_num := year_part || '-' || LPAD(sequence_num::TEXT, 6, '0');
    
    RETURN receipt_num;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate receipt numbers
CREATE OR REPLACE FUNCTION set_receipt_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.receipt_number IS NULL THEN
        NEW.receipt_number := generate_receipt_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_receipt_number_trigger BEFORE INSERT ON donation_receipts
    FOR EACH ROW EXECUTE FUNCTION set_receipt_number();

-- Add Row Level Security (RLS) policies
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_receipts ENABLE ROW LEVEL SECURITY;

-- Create policies for donations (donors can view their own donations)
CREATE POLICY "Donors can view their own donations" ON donations
    FOR SELECT USING (donor_email = auth.jwt() ->> 'email');

-- Create policies for subscriptions (customers can view their own subscriptions)
CREATE POLICY "Customers can view their own subscriptions" ON subscriptions
    FOR SELECT USING (customer_email = auth.jwt() ->> 'email');

-- Create policies for receipts (donors can view their own receipts)
CREATE POLICY "Donors can view their own receipts" ON donation_receipts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM donations d 
            WHERE d.id = donation_receipts.donation_id 
            AND d.donor_email = auth.jwt() ->> 'email'
        )
    );

-- Allow service role to perform all operations
CREATE POLICY "Service role can manage all donations" ON donations
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all subscriptions" ON subscriptions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all receipts" ON donation_receipts
    FOR ALL USING (auth.role() = 'service_role');

-- Insert some sample data for testing
INSERT INTO donations (
    amount, donor_name, donor_email, message, target_type, target_id, target_name, 
    payment_intent_id, payment_status, processed_at
) VALUES 
(
    100.00, 'John Doe', 'john.doe@example.com', 'Keep up the great work!', 
    'campaign', '1', 'Emergency Food Distribution for Typhoon Victims',
    'pi_test_1234567890', 'succeeded', NOW()
),
(
    50.00, 'Jane Smith', 'jane.smith@example.com', 'Happy to help!', 
    'organization', 'hope-community-center', 'Hope Community Center',
    'pi_test_0987654321', 'succeeded', NOW()
),
(
    25.00, 'Anonymous Donor', 'anonymous@example.com', '', 
    'general', NULL, 'General Fund',
    'pi_test_1122334455', 'succeeded', NOW()
);

-- Create receipts for the sample donations
INSERT INTO donation_receipts (donation_id, tax_deductible_amount)
SELECT id, amount FROM donations WHERE payment_status = 'succeeded';