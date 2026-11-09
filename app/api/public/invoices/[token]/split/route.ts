import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSmsProvider } from '@/lib/providers/sms';
import { normalizePhone, isValidIranianMobile } from '@/lib/utils';

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const body = await request.json();
    if (!Array.isArray(body.participants) || body.participants.length < 1 || body.participants.length > 50) {
      return NextResponse.json({ error: 'تعداد افراد باید بین ۱ تا ۵۰ نفر باشد.' }, { status: 400 });
    }
    const participants = body.participants.map((p: { name?: string; phone?: string; amount?: number }) => ({
      name: String(p.name || '').trim(), phone: normalizePhone(String(p.phone || '')), amount: Number(p.amount),
    }));
    if (participants.some(p => !p.name || !isValidIranianMobile(p.phone) || !Number.isSafeInteger(p.amount) || p.amount <= 0)) {
      return NextResponse.json({ error: 'نام، شماره موبایل یا مبلغ یکی از افراد معتبر نیست.' }, { status: 400 });
    }
    const admin = createAdminClient();
    const { data, error } = await admin.rpc('create_invoice_splits', { p_invoice_token: token, p_participants: participants });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    const { data: invoice, error: invoiceError } = await admin.from('invoices').select('id,seller_id,title').eq('public_token', token).single();
    if (invoiceError || !invoice) throw invoiceError || new Error('صورتحساب پیدا نشد.');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const sms = getSmsProvider(admin);
    for (const p of (data || []) as { id: string; phone: string; name: string; amount: number; share_token: string }[]) {
      await sms.send({
        sellerId: invoice.seller_id,
        invoiceId: invoice.id,
        participantId: p.id,
        to: p.phone,
        body: `سلام ${p.name}، سهم شما از صورتحساب «${invoice.title}» مبلغ ${Number(p.amount).toLocaleString('fa-IR')} تومان است. برای پرداخت: ${appUrl}/pay/${p.share_token}`,
      });
    }
    return NextResponse.json({ ok: true, participants: data, message: 'سهم‌ها ثبت شد؛ پیامک‌های آزمایشی در گزارش فروشنده ثبت شدند.' });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'خطای داخلی' }, { status: 500 });
  }
}
