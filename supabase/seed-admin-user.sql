-- Seeder script to create an admin user in Supabase auth
-- This script should be run manually in the Supabase SQL editor
-- or via the Supabase CLI after creating a user through the auth UI

-- First, you need to create a user through Supabase Auth (either via the dashboard or signup form)
-- Then run this script with the user's UUID to make them an admin

-- Replace 'USER_UUID_HERE' with the actual UUID of the user you want to make admin
-- You can find this UUID in the Supabase Auth > Users dashboard
-- IMPORTANT: First create the user account in Supabase Auth, then run this script

-- Example usage:
-- 1. Go to Supabase Auth > Users and create a new user or find an existing one
-- 2. Copy their UUID  
-- 3. Replace 'USER_UUID_HERE' below with that UUID
-- 4. Run this script in the SQL editor

DO $$
DECLARE
    admin_user_id UUID := 'USER_UUID_HERE'; -- Replace with actual user UUID from Supabase Auth > Users
    user_exists BOOLEAN := FALSE;
BEGIN
    -- Check if user exists in auth.users
    SELECT EXISTS(
        SELECT 1 FROM auth.users WHERE id = admin_user_id
    ) INTO user_exists;
    
    IF NOT user_exists THEN
        RAISE EXCEPTION 'User with ID % does not exist in auth.users. Please create the user first through Supabase Auth.', admin_user_id;
    END IF;
    
    -- Check if user profile already exists
    IF EXISTS(SELECT 1 FROM user_profiles WHERE id = admin_user_id) THEN
        -- Update existing user profile to admin
        UPDATE user_profiles 
        SET 
            role = 'admin',
            user_type = 'individual',
            full_name = COALESCE(full_name, 'Admin User'),
            updated_at = NOW()
        WHERE id = admin_user_id;
        
        RAISE NOTICE 'Updated existing user % to admin role', admin_user_id;
    ELSE
        -- Create new user profile with admin role
        INSERT INTO user_profiles (
            id,
            user_type,
            full_name,
            role,
            created_at,
            updated_at
        ) VALUES (
            admin_user_id,
            'individual',
            'Admin User',
            'admin',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Created new admin user profile for %', admin_user_id;
    END IF;
    
    -- Log the admin creation
    INSERT INTO admin_activity_log (
        admin_user_id,
        action,
        target_type,
        target_id,
        new_values,
        created_at
    ) VALUES (
        admin_user_id,
        'create_admin_user',
        'user',
        admin_user_id,
        jsonb_build_object('role', 'admin'),
        NOW()
    );
END $$;

-- To create a super admin instead, use this version:
-- Replace 'SUPER_ADMIN_UUID_HERE' with the actual UUID

/*
DO $$
DECLARE
    super_admin_user_id UUID := 'SUPER_ADMIN_UUID_HERE'; -- Replace with actual user UUID
    user_exists BOOLEAN := FALSE;
BEGIN
    -- Check if user exists in auth.users
    SELECT EXISTS(
        SELECT 1 FROM auth.users WHERE id = super_admin_user_id
    ) INTO user_exists;
    
    IF NOT user_exists THEN
        RAISE EXCEPTION 'User with ID % does not exist in auth.users. Please create the user first through Supabase Auth.', super_admin_user_id;
    END IF;
    
    -- Check if user profile already exists
    IF EXISTS(SELECT 1 FROM user_profiles WHERE id = super_admin_user_id) THEN
        -- Update existing user profile to super admin
        UPDATE user_profiles 
        SET 
            role = 'super_admin',
            user_type = 'individual',
            full_name = COALESCE(full_name, 'Super Admin'),
            updated_at = NOW()
        WHERE id = super_admin_user_id;
        
        RAISE NOTICE 'Updated existing user % to super_admin role', super_admin_user_id;
    ELSE
        -- Create new user profile with super admin role
        INSERT INTO user_profiles (
            id,
            user_type,
            full_name,
            role,
            created_at,
            updated_at
        ) VALUES (
            super_admin_user_id,
            'individual',
            'Super Admin',
            'super_admin',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Created new super admin user profile for %', super_admin_user_id;
    END IF;
    
    -- Log the super admin creation
    INSERT INTO admin_activity_log (
        admin_user_id,
        action,
        target_type,
        target_id,
        new_values,
        created_at
    ) VALUES (
        super_admin_user_id,
        'create_super_admin_user',
        'user',
        super_admin_user_id,
        jsonb_build_object('role', 'super_admin'),
        NOW()
    );
END $$;
*/

-- Instructions:
-- 1. Create a user account through Supabase Auth dashboard or your app's signup form
-- 2. Go to Supabase > Authentication > Users and copy the user's UUID
-- 3. Replace 'USER_UUID_HERE' above with the actual UUID
-- 4. Run this script in Supabase > SQL Editor
-- 5. The user will now have admin privileges and can access the admin dashboard

-- Alternative: Quick admin creation with email
-- If you know the user's email instead of UUID, use this:

/*
DO $$
DECLARE
    user_email TEXT := 'admin@example.com'; -- Replace with actual email
    found_user_id UUID;
    user_exists BOOLEAN := FALSE;
BEGIN
    -- Find user by email
    SELECT id INTO found_user_id 
    FROM auth.users 
    WHERE email = user_email;
    
    IF found_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % does not exist. Please create the user first.', user_email;
    END IF;
    
    -- Update or create user profile
    INSERT INTO user_profiles (
        id,
        user_type,
        full_name,
        role,
        created_at,
        updated_at
    ) VALUES (
        found_user_id,
        'individual',
        'Admin User',
        'admin',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        role = 'admin',
        updated_at = NOW();
    
    -- Log the admin creation
    INSERT INTO admin_activity_log (
        admin_user_id,
        action,
        target_type,
        target_id,
        new_values,
        created_at
    ) VALUES (
        found_user_id,
        'create_admin_user',
        'user',
        found_user_id,
        jsonb_build_object('role', 'admin'),
        NOW()
    );
    
    RAISE NOTICE 'Successfully granted admin role to user: %', user_email;
END $$;
*/
