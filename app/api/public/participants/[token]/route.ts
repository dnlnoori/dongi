import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const admin = createAdminClient();
    const { data: participant, error } = await admin.from('participants')
      .select('id,name,amount,status,share_token,paid_at,invoice_id,seller_id')
      .eq('share_token', token).maybeSingle();
    if (error) throw error;
    if (!participant) return NextResponse.json({ error: 'لینک پرداخت پیدا نشد.' }, { status: 404 });
    const [{ data: invoice, error: invoiceError }, { data: profile }] = await Promise.all([
      admin.from('invoices').select('id,title,total_amount,note,card_number,status,created_at,public_token').eq('id', participant.invoice_id).single(),
      admin.from('profiles').select('business_name').eq('id', participant.seller_id).maybeSingle(),
    ]);
    if (invoiceError || !invoice) throw invoiceError || new Error('صورتحساب پیدا نشد.');
    const { seller_id: _sellerId, ...publicParticipant } = participant;
    return NextResponse.json({ participant: publicParticipant, invoice: { ...invoice, seller_name: profile?.business_name || 'فروشنده' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'خطای داخلی' }, { status: 500 });
  }
}
