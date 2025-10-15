-- Binda Core Database Schema
-- Migration 001: Create core tables for MVP

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('provider', 'customer')) DEFAULT 'provider',
  username TEXT UNIQUE, -- For provider's public booking page (e.g., binda.app/john)
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on username for fast lookup
CREATE INDEX users_username_idx ON public.users(username) WHERE username IS NOT NULL;
CREATE INDEX users_role_idx ON public.users(role);

-- Services table
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL CHECK (price >= 0), -- In cents
  duration INTEGER NOT NULL CHECK (duration > 0), -- In minutes
  buffer_minutes INTEGER NOT NULL DEFAULT 0 CHECK (buffer_minutes >= 0),
  service_areas TEXT[] NOT NULL DEFAULT '{}', -- Array of ZIP codes
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for services
CREATE INDEX services_user_id_idx ON public.services(user_id);
CREATE INDEX services_active_idx ON public.services(active);

-- Bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- Nullable for guests
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  customer_zip TEXT NOT NULL,
  date_time TIMESTAMPTZ NOT NULL,
  notes TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')) DEFAULT 'pending',
  payment_status TEXT NOT NULL CHECK (payment_status IN ('unpaid', 'deposit', 'paid', 'refunded')) DEFAULT 'unpaid',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for bookings
CREATE INDEX bookings_service_id_idx ON public.bookings(service_id);
CREATE INDEX bookings_provider_id_idx ON public.bookings(provider_id);
CREATE INDEX bookings_customer_id_idx ON public.bookings(customer_id);
CREATE INDEX bookings_date_time_idx ON public.bookings(date_time);
CREATE INDEX bookings_status_idx ON public.bookings(status);
CREATE INDEX bookings_provider_date_idx ON public.bookings(provider_id, date_time);

-- Payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount >= 0), -- In cents
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')) DEFAULT 'pending',
  stripe_payment_intent_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for payments
CREATE INDEX payments_booking_id_idx ON public.payments(booking_id);
CREATE INDEX payments_stripe_payment_intent_id_idx ON public.payments(stripe_payment_intent_id);

-- Messages table (SMS/Email log)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('confirmation', 'reminder_24h', 'reminder_2h', 'on_my_way', 'rebook', 'review')),
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'email')),
  recipient TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed')) DEFAULT 'pending',
  error_message TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for messages
CREATE INDEX messages_booking_id_idx ON public.messages(booking_id);
CREATE INDEX messages_sent_at_idx ON public.messages(sent_at);
CREATE INDEX messages_status_idx ON public.messages(status);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public can read provider profiles" ON public.users
  FOR SELECT USING (role = 'provider' AND username IS NOT NULL);

-- Services policies
CREATE POLICY "Providers can manage own services" ON public.services
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public can read active services" ON public.services
  FOR SELECT USING (active = true);

-- Bookings policies
CREATE POLICY "Providers can read own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = provider_id);

CREATE POLICY "Customers can read own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Providers can update own bookings" ON public.bookings
  FOR UPDATE USING (auth.uid() = provider_id);

CREATE POLICY "Anyone can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (true);

-- Payments policies
CREATE POLICY "Users can read related payments" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = payments.booking_id
      AND (bookings.provider_id = auth.uid() OR bookings.customer_id = auth.uid())
    )
  );

CREATE POLICY "System can manage payments" ON public.payments
  FOR ALL USING (true);

-- Messages policies
CREATE POLICY "Users can read related messages" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = messages.booking_id
      AND (bookings.provider_id = auth.uid() OR bookings.customer_id = auth.uid())
    )
  );

CREATE POLICY "System can manage messages" ON public.messages
  FOR ALL USING (true);

-- Create a function to handle new user registration
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

-- Create trigger to automatically create user record on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;


