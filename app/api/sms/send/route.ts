import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSmsProvider } from '@/lib/providers/sms';
import { isValidIranianMobile, normalizePhone } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'ابتدا وارد حساب فروشنده شو.' }, { status: 401 });
    const { invoiceId, to, kind } = await request.json();
    if (!invoiceId || !to || !isValidIranianMobile(String(to))) return NextResponse.json({ error: 'اطلاعات پیامک یا شماره موبایل معتبر نیست.' }, { status: 400 });
    const admin = createAdminClient();
    const { data: invoice, error } = await admin.from('invoices').select('id,seller_id,title,public_token,total_amount').eq('id', invoiceId).eq('seller_id', user.id).single();
    if (error || !invoice) return NextResponse.json({ error: 'صورتحساب پیدا نشد.' }, { status: 404 });
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const link = `${appUrl}/i/${invoice.public_token}`;
    const body = kind === 'invoice'
      ? `صورتحساب «${invoice.title}» به مبلغ ${Number(invoice.total_amount).toLocaleString('fa-IR')} تومان آماده تقسیم است. برای تعیین سهم افراد وارد شوید: ${link}`
      : `لینک پرداخت سهم شما از صورتحساب «${invoice.title}»: ${link}`;
    const sms = getSmsProvider(admin);
    await sms.send({ sellerId: user.id, invoiceId: invoice.id, to: normalizePhone(String(to)), body });
    return NextResponse.json({ ok: true, provider: 'mock', message: 'پیامک فقط در گزارش آزمایشی ثبت شد و ارسال واقعی انجام نشده است.' });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'خطای داخلی' }, { status: 500 });
  }
}
