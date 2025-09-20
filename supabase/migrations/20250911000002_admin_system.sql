-- Migration: Add admin roles and activity logging system
-- This migration adds role-based access control and audit logging for admin functionality

-- Add role column to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin'));

-- Create index on role for better query performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- Create admin activity log table for audit trail
CREATE TABLE IF NOT EXISTS admin_activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL, -- 'user', 'organization', 'campaign', etc.
    target_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_user_id ON admin_activity_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_action ON admin_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_target ON admin_activity_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created_at ON admin_activity_log(created_at DESC);

-- Update RLS policies for user_profiles to allow admin access
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Allow users to view their own profile and admins to view all profiles
CREATE POLICY "Users can view own profile or admins can view all" 
ON user_profiles FOR SELECT 
USING (
    auth.uid() = id OR 
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'super_admin')
    )
);

-- Allow users to update their own profile and admins to update any profile
CREATE POLICY "Users can update own profile or admins can update any" 
ON user_profiles FOR UPDATE 
USING (
    auth.uid() = id OR 
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'super_admin')
    )
);

-- Admin activity log policies - only admins can read, system can write
CREATE POLICY "Only admins can view activity logs" 
ON admin_activity_log FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'super_admin')
    )
);

CREATE POLICY "System can insert activity logs" 
ON admin_activity_log FOR INSERT 
WITH CHECK (true);

-- Update organizations policies for admin access
DROP POLICY IF EXISTS "Organizations are viewable by everyone" ON organizations;
CREATE POLICY "Organizations viewable by everyone or admin management" 
ON organizations FOR SELECT 
USING (
    verification_status = 'verified' OR
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'super_admin')
    )
);

-- Allow admins to update any organization
CREATE POLICY "Admins can update organizations" 
ON organizations FOR UPDATE 
USING (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'super_admin')
    )
);

-- Update campaigns policies for admin access
DROP POLICY IF EXISTS "Campaigns are viewable by everyone" ON campaigns;
CREATE POLICY "Campaigns viewable by everyone or admin management" 
ON campaigns FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM organizations 
        WHERE id = campaigns.organization_id 
        AND verification_status = 'verified'
    ) OR
    EXISTS (
        SELECT 1 FROM organizations 
        WHERE id = campaigns.organization_id 
        AND user_id = auth.uid()
    ) OR
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'super_admin')
    )
);

-- Allow admins to update any campaign
CREATE POLICY "Admins can update campaigns" 
ON campaigns FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM organizations 
        WHERE id = campaigns.organization_id 
        AND user_id = auth.uid()
    ) OR
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'super_admin')
    )
);

-- Function to automatically log admin activities
CREATE OR REPLACE FUNCTION log_admin_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if the acting user is an admin
    IF EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'super_admin')
    ) THEN
        INSERT INTO admin_activity_log (
            admin_user_id,
            action,
            target_type,
            target_id,
            old_values,
            new_values
        ) VALUES (
            auth.uid(),
            TG_OP,
            TG_TABLE_NAME,
            COALESCE(NEW.id, OLD.id),
            CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
            CASE WHEN TG_OP = 'INSERT' THEN to_jsonb(NEW) 
                 WHEN TG_OP = 'UPDATE' THEN to_jsonb(NEW) 
                 ELSE NULL END
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for important tables
DROP TRIGGER IF EXISTS log_user_profiles_changes ON user_profiles;
CREATE TRIGGER log_user_profiles_changes
    AFTER UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION log_admin_activity();

DROP TRIGGER IF EXISTS log_organizations_changes ON organizations;
CREATE TRIGGER log_organizations_changes
    AFTER UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION log_admin_activity();

DROP TRIGGER IF EXISTS log_campaigns_changes ON campaigns;
CREATE TRIGGER log_campaigns_changes
    AFTER UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION log_admin_activity();
