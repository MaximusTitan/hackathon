-- Create payment_orders table
CREATE TABLE IF NOT EXISTS public.payment_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id TEXT NOT NULL,
  payment_id TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  event_id UUID NOT NULL REFERENCES public.events(id),
  amount DECIMAL(10,2) NOT NULL,
  receipt TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add index for faster lookup
CREATE INDEX IF NOT EXISTS idx_payment_orders_order_id ON public.payment_orders (order_id);
