import type { SupabaseClient } from '@supabase/supabase-js';

export type SmsMessage = {
  sellerId: string;
  invoiceId: string;
  participantId?: string | null;
  to: string;
  body: string;
};

export interface SmsProvider {
  send(message: SmsMessage): Promise<void>;
}

/** Mock adapter: records an SMS in the database but never contacts a telecom network. */
export class MockSmsProvider implements SmsProvider {
  constructor(private readonly admin: SupabaseClient) {}
  async send(message: SmsMessage) {
    const { error } = await this.admin.from('sms_logs').insert({
      seller_id: message.sellerId,
      invoice_id: message.invoiceId,
      participant_id: message.participantId || null,
      to_phone: message.to,
      body: message.body,
      provider: 'mock',
      status: 'logged_test_only',
    });
    if (error) throw error;
  }
}

export function getSmsProvider(admin: SupabaseClient): SmsProvider {
  const provider = process.env.SMS_PROVIDER || 'mock';
  if (provider === 'mock') return new MockSmsProvider(admin);
  throw new Error(`SMS provider "${provider}" is not implemented yet. Add its adapter in lib/providers/sms.ts.`);
}
