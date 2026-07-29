-- Payments table — records every completed Stripe charge.
-- Inserted from the client after stripe.confirmCardPayment succeeds,
-- and also updated by the Stripe webhook for authoritative status.

CREATE TABLE IF NOT EXISTS payments (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id            uuid REFERENCES appointments(id) ON DELETE SET NULL,
  stripe_payment_intent_id  text UNIQUE NOT NULL,
  amount                    integer NOT NULL,   -- in smallest currency unit (cents)
  currency                  text NOT NULL DEFAULT 'usd',
  status                    text NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  client_name               text,
  client_email              text,
  service_name              text,
  metadata                  jsonb,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Anon can insert (payment confirmed in browser before user may be logged in)
CREATE POLICY "anon_insert_payments"
  ON payments FOR INSERT TO anon WITH CHECK (true);

-- Authenticated users (clients + admin) can read their own or all
CREATE POLICY "auth_all_payments"
  ON payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_payments_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION set_payments_updated_at();
