import type { SupabaseClient } from '@supabase/supabase-js';

export type PaymentCompletion = { status: string; paid_at?: string; transaction_ref?: string; invoice_status?: string; already_paid?: boolean };
export interface PaymentProvider {
  completeCheckout(shareToken: string): Promise<PaymentCompletion>;
}

/** Test adapter only. It marks a share as paid through the database RPC; no real money moves. */
export class TestPaymentProvider implements PaymentProvider {
  constructor(private readonly admin: SupabaseClient) {}
  async completeCheckout(shareToken: string) {
    const { data, error } = await this.admin.rpc('complete_test_payment', { p_share_token: shareToken });
    if (error) throw error;
    return data as PaymentCompletion;
  }
}

export function getPaymentProvider(admin: SupabaseClient): PaymentProvider {
  const provider = process.env.PAYMENT_PROVIDER || 'test';
  if (provider === 'test') return new TestPaymentProvider(admin);
  throw new Error(`Payment provider "${provider}" is not implemented yet. Add a verified gateway adapter and webhook before enabling it.`);
}
