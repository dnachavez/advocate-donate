-- Create comprehensive user system tables for Bridge-Needs platform
-- This migration creates organizations, campaigns, and user profiles tables

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create user_profiles table to extend Supabase auth.users
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('individual', 'nonprofit')),
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    profile_picture_url TEXT,
    bio TEXT,
    location VARCHAR(255),
    website TEXT,
    
    -- Organization-specific fields (only used when user_type = 'nonprofit')
    organization_name VARCHAR(255),
    registration_number VARCHAR(100),
    tax_id VARCHAR(50),
    organization_description TEXT,
    organization_logo_url TEXT,
    organization_category VARCHAR(100),
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    verification_documents JSONB,
    
    -- Settings and preferences
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    privacy_settings JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_organization_fields CHECK (
        (user_type = 'individual' AND organization_name IS NULL) OR
        (user_type = 'nonprofit' AND organization_name IS NOT NULL)
    )
);

-- Create organizations table for verified nonprofit organizations
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    mission_statement TEXT,
    
    -- Contact information
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    website TEXT,
    
    -- Location
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Philippines',
    postal_code VARCHAR(20),
    
    -- Organization details
    category VARCHAR(100) NOT NULL,
    subcategories TEXT[], -- Array of subcategories
    registration_number VARCHAR(100) NOT NULL,
    tax_id VARCHAR(50),
    founded_year INTEGER,
    
    -- Media
    logo_url TEXT,
    banner_url TEXT,
    images TEXT[], -- Array of image URLs
    
    -- Verification and status
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'suspended')),
    verification_documents JSONB,
    verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Impact metrics
    beneficiaries_served INTEGER DEFAULT 0,
    total_raised DECIMAL(12,2) DEFAULT 0,
    active_campaigns_count INTEGER DEFAULT 0,
    
    -- Settings
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    accepts_direct_donations BOOLEAN DEFAULT true,
    
    -- Social media
    social_media JSONB DEFAULT '{}', -- {facebook, twitter, instagram, linkedin}
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create campaigns table
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    slug VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    short_description VARCHAR(500),
    
    -- Financial goals
    goal_amount DECIMAL(12,2) NOT NULL CHECK (goal_amount > 0),
    raised_amount DECIMAL(12,2) DEFAULT 0 CHECK (raised_amount >= 0),
    currency VARCHAR(3) DEFAULT 'PHP',
    
    -- Campaign timeline
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    deadline_type VARCHAR(20) DEFAULT 'flexible' CHECK (deadline_type IN ('flexible', 'fixed')),
    
    -- Category and targeting
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    target_audience VARCHAR(255),
    beneficiaries_count INTEGER,
    
    -- Media
    featured_image_url TEXT,
    images TEXT[], -- Array of image URLs
    videos TEXT[], -- Array of video URLs
    
    -- Campaign status
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
    is_urgent BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    
    -- Impact and updates
    impact_description TEXT,
    updates JSONB DEFAULT '[]', -- Array of campaign updates
    
    -- Statistics
    supporters_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    
    -- Settings
    minimum_donation DECIMAL(10,2) DEFAULT 1.00,
    suggested_amounts DECIMAL(10,2)[] DEFAULT '{25.00, 50.00, 100.00, 250.00}',
    accepts_anonymous_donations BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Update donations table to properly reference organizations and campaigns
ALTER TABLE donations 
    ADD COLUMN user_id UUID REFERENCES user_profiles(id),
    ADD COLUMN organization_id UUID REFERENCES organizations(id),
    ADD COLUMN campaign_id UUID REFERENCES campaigns(id);

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_type ON user_profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_user_profiles_verification_status ON user_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_organizations_user_id ON organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_category ON organizations(category);
CREATE INDEX IF NOT EXISTS idx_organizations_verification_status ON organizations(verification_status);
CREATE INDEX IF NOT EXISTS idx_organizations_is_active ON organizations(is_active);
CREATE INDEX IF NOT EXISTS idx_campaigns_organization_id ON campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_slug ON campaigns(slug);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_category ON campaigns(category);
CREATE INDEX IF NOT EXISTS idx_campaigns_end_date ON campaigns(end_date);
CREATE INDEX IF NOT EXISTS idx_donations_user_id ON donations(user_id);
CREATE INDEX IF NOT EXISTS idx_donations_organization_id ON donations(organization_id);
CREATE INDEX IF NOT EXISTS idx_donations_campaign_id ON donations(campaign_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at 
    BEFORE UPDATE ON organizations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at 
    BEFORE UPDATE ON campaigns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Organizations policies
CREATE POLICY "Organizations are viewable by everyone" ON organizations
    FOR SELECT USING (is_active = true);

CREATE POLICY "Organization owners can update their organization" ON organizations
    FOR ALL USING (auth.uid() = user_id);

-- Campaigns policies  
CREATE POLICY "Active campaigns are viewable by everyone" ON campaigns
    FOR SELECT USING (status IN ('active', 'completed'));

CREATE POLICY "Organization owners can manage their campaigns" ON campaigns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM organizations 
            WHERE organizations.id = campaigns.organization_id 
            AND organizations.user_id = auth.uid()
        )
    );

-- Function to create user profile after auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (
        id, 
        user_type, 
        full_name, 
        phone_number,
        organization_name,
        registration_number,
        website
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'user_type', 'individual'),
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'phone_number', ''),
        NEW.raw_user_meta_data->>'organization_name',
        NEW.raw_user_meta_data->>'registration_number', 
        NEW.raw_user_meta_data->>'website'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on auth signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update campaign statistics
CREATE OR REPLACE FUNCTION update_campaign_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.campaign_id IS NOT NULL AND NEW.payment_status = 'succeeded' THEN
        UPDATE campaigns 
        SET 
            raised_amount = raised_amount + NEW.amount,
            supporters_count = supporters_count + 1
        WHERE id = NEW.campaign_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.campaign_id IS NOT NULL THEN
        -- Remove old amount if it was succeeded
        IF OLD.payment_status = 'succeeded' THEN
            UPDATE campaigns 
            SET 
                raised_amount = raised_amount - OLD.amount,
                supporters_count = supporters_count - 1
            WHERE id = OLD.campaign_id;
        END IF;
        -- Add new amount if it's succeeded
        IF NEW.payment_status = 'succeeded' THEN
            UPDATE campaigns 
            SET 
                raised_amount = raised_amount + NEW.amount,
                supporters_count = supporters_count + 1
            WHERE id = NEW.campaign_id;
        END IF;
    ELSIF TG_OP = 'DELETE' AND OLD.campaign_id IS NOT NULL AND OLD.payment_status = 'succeeded' THEN
        UPDATE campaigns 
        SET 
            raised_amount = raised_amount - OLD.amount,
            supporters_count = supporters_count - 1
        WHERE id = OLD.campaign_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update campaign statistics on donation changes
CREATE TRIGGER update_campaign_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON donations
    FOR EACH ROW
    EXECUTE FUNCTION update_campaign_stats();

-- Function to update organization statistics
CREATE OR REPLACE FUNCTION update_organization_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.organization_id IS NOT NULL AND NEW.payment_status = 'succeeded' THEN
        UPDATE organizations 
        SET total_raised = total_raised + NEW.amount
        WHERE id = NEW.organization_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.organization_id IS NOT NULL THEN
        -- Remove old amount if it was succeeded
        IF OLD.payment_status = 'succeeded' THEN
            UPDATE organizations 
            SET total_raised = total_raised - OLD.amount
            WHERE id = OLD.organization_id;
        END IF;
        -- Add new amount if it's succeeded
        IF NEW.payment_status = 'succeeded' THEN
            UPDATE organizations 
            SET total_raised = total_raised + NEW.amount
            WHERE id = NEW.organization_id;
        END IF;
    ELSIF TG_OP = 'DELETE' AND OLD.organization_id IS NOT NULL AND OLD.payment_status = 'succeeded' THEN
        UPDATE organizations 
        SET total_raised = total_raised - OLD.amount
        WHERE id = OLD.organization_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update organization statistics on donation changes
CREATE TRIGGER update_organization_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON donations
    FOR EACH ROW
    EXECUTE FUNCTION update_organization_stats();
