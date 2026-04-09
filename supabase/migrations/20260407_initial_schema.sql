-- Create user_profiles table to link Supabase users with HubSpot contacts
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  hubspot_contact_id TEXT UNIQUE,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create tickets table for custom portal IDs and synchronization metadata
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hubspot_id TEXT UNIQUE,
  portal_id TEXT UNIQUE, -- e.g., "SOL-1001"
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on tickets
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tickets"
  ON public.tickets FOR SELECT
  USING (auth.uid() = user_id);

-- Create a sequence for portal IDs if we want them numeric
CREATE SEQUENCE IF NOT EXISTS portal_ticket_seq START 1001;

-- Function to generate portal_id automatically
CREATE OR REPLACE FUNCTION generate_portal_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.portal_id IS NULL THEN
    NEW.portal_id := 'SOL-' || nextval('portal_ticket_seq')::TEXT;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_portal_id
BEFORE INSERT ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION generate_portal_id();
