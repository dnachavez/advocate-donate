-- Fixed handle_new_user trigger with proper RLS bypass
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_type VARCHAR(20);
    v_full_name VARCHAR(255);
    v_phone_number VARCHAR(20);
BEGIN
    -- Get user type from metadata, default to 'individual'
    v_user_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'individual');
    v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'User');
    v_phone_number := NEW.raw_user_meta_data->>'phone_number';
    
    -- Insert user profile with conditional organization fields
    -- SECURITY DEFINER allows this to bypass RLS policies
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
            v_full_name,
            v_phone_number,
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
            v_full_name,
            v_phone_number
        );
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the detailed error
        RAISE WARNING 'Error creating user profile for % (type: %, name: %): % (SQLSTATE: %)', 
            NEW.id, v_user_type, v_full_name, SQLERRM, SQLSTATE;
        -- Re-raise to prevent user creation
        RAISE;
END;
$$;
