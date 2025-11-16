-- Fix handle_new_user trigger to respect user_profiles constraints
-- This migration fixes the "Database error saving new user" issue

-- Drop and recreate the handle_new_user function with proper logic
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_user_type VARCHAR(20);
BEGIN
    -- Get user type from metadata, default to 'individual'
    v_user_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'individual');
    
    -- Insert user profile with conditional organization fields
    IF v_user_type = 'nonprofit' THEN
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
            v_user_type,
            COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
            NEW.raw_user_meta_data->>'phone_number',
            NEW.raw_user_meta_data->>'organization_name',
            NEW.raw_user_meta_data->>'registration_number',
            NEW.raw_user_meta_data->>'website'
        );
    ELSE
        -- For individual users, don't include organization fields
        INSERT INTO public.user_profiles (
            id, 
            user_type, 
            full_name, 
            phone_number
        )
        VALUES (
            NEW.id,
            v_user_type,
            COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
            NEW.raw_user_meta_data->>'phone_number'
        );
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the auth signup
        RAISE WARNING 'Error creating user profile: %', SQLERRM;
        -- Re-raise the exception so Supabase can handle it properly
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment to document the fix
COMMENT ON FUNCTION public.handle_new_user() IS 
'Trigger function to create user profile after auth signup. Respects user_type constraints for organization fields.';
