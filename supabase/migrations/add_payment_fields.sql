-- Add payment fields to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS price INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS razorpay_key_id TEXT;

-- Add payment fields to registrations table
ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS payment_id TEXT,
ADD COLUMN IF NOT EXISTS order_id TEXT,
ADD COLUMN IF NOT EXISTS amount_paid INTEGER DEFAULT 0;
