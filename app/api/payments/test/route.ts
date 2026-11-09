import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPaymentProvider } from '@/lib/providers/payment';

export async function POST(request: Request) {
  try {
    if (process.env.PAYMENT_PROVIDER && process.env.PAYMENT_PROVIDER !== 'test') {
      return NextResponse.json({ error: 'درگاه تستی غیرفعال است.' }, { status: 403 });
    }
    const { shareToken } = await request.json();
    if (!shareToken || typeof shareToken !== 'string') return NextResponse.json({ error: 'لینک پرداخت معتبر نیست.' }, { status: 400 });
    const admin = createAdminClient();
    const provider = getPaymentProvider(admin);
    let data;
    try { data = await provider.completeCheckout(shareToken); }
    catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'پرداخت ناموفق بود.' }, { status: 400 }); }
    return NextResponse.json({ ok: true, result: data, provider: 'test', message: 'پرداخت آزمایشی با موفقیت ثبت شد؛ هیچ وجه واقعی جابه‌جا نشده است.' });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'خطای داخلی' }, { status: 500 });
  }
}
