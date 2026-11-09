import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const admin = createAdminClient();
    const { data: invoice, error } = await admin.from('invoices')
      .select('id,title,total_amount,status,note,card_number,public_token,created_at,updated_at,seller_id')
      .eq('public_token', token).maybeSingle();
    if (error) throw error;
    if (!invoice) return NextResponse.json({ error: 'صورتحساب پیدا نشد.' }, { status: 404 });
    const [{ data: participants, error: peopleError }, { data: profile }] = await Promise.all([
      admin.from('participants').select('id,name,amount,status,share_token,paid_at,created_at').eq('invoice_id', invoice.id).order('created_at'),
      admin.from('profiles').select('business_name').eq('id', invoice.seller_id).maybeSingle(),
    ]);
    if (peopleError) throw peopleError;
    const paidAmount = (participants || []).filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0);
    const { seller_id: _sellerId, ...publicInvoice } = invoice;
    return NextResponse.json({ invoice: { ...publicInvoice, seller_name: profile?.business_name || 'فروشنده' }, participants: participants || [], paid_amount: paidAmount });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'خطای داخلی' }, { status: 500 });
  }
}
