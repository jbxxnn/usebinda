-- Migration 002: Fix default role to 'provider'
-- Since Binda is for service providers, all signups should default to provider role
-- Customers don't need accounts (they book as guests)

-- Update the default for new users
ALTER TABLE public.users 
  ALTER COLUMN role SET DEFAULT 'provider';

-- Update the trigger function to default to provider
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'provider')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Update any existing customer accounts to provider
-- (Uncomment if you want to convert existing test accounts)
-- UPDATE public.users SET role = 'provider' WHERE role = 'customer';

