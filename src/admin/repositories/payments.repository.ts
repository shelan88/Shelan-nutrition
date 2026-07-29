/**
 * payments.repository.ts
 *
 * CRUD helpers for the `payments` table.
 */

import { supabase } from "@/lib/supabase";

export interface PaymentRow {
  id:                       string;
  appointment_id:           string | null;
  stripe_payment_intent_id: string;
  amount:                   number;
  currency:                 string;
  status:                   "pending" | "succeeded" | "failed" | "refunded";
  client_name:              string | null;
  client_email:             string | null;
  service_name:             string | null;
  metadata:                 Record<string, string> | null;
  created_at:               string;
  updated_at:               string;
}

/** Fetch all payments, newest first. */
export async function getPayments(): Promise<PaymentRow[]> {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[payments.repository] getPayments:", error.message);
    return [];
  }
  return (data ?? []) as PaymentRow[];
}

/** Insert a new payment record immediately after Stripe confirms the charge. */
export async function recordPayment(params: {
  stripe_payment_intent_id: string;
  amount:                   number;
  currency:                 string;
  status:                   PaymentRow["status"];
  client_name?:             string | null;
  client_email?:            string | null;
  service_name?:            string | null;
  appointment_id?:          string | null;
  metadata?:                Record<string, string>;
}): Promise<PaymentRow | null> {
  const { data, error } = await supabase
    .from("payments")
    .insert({
      stripe_payment_intent_id: params.stripe_payment_intent_id,
      amount:                   params.amount,
      currency:                 params.currency,
      status:                   params.status,
      client_name:              params.client_name   ?? null,
      client_email:             params.client_email  ?? null,
      service_name:             params.service_name  ?? null,
      appointment_id:           params.appointment_id ?? null,
      metadata:                 params.metadata       ?? {},
    })
    .select()
    .single();
  if (error) {
    console.error("[payments.repository] recordPayment:", error.message);
    return null;
  }
  return data as PaymentRow;
}
