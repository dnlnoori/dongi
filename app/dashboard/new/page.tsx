'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, FilePlus2, Info, MessageCircle, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { formatMoney, isValidIranianMobile, normalizeDigits, normalizePhone } from '@/lib/utils';

export default function NewInvoicePage() {
  const router = useRouter();
  const [title, setTitle] = useState('صورتحساب گروهی');
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [card, setCard] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function loadDefaults() {
      const supabase = createClient();
      const { data } = await supabase.from('profiles').select('card_number,default_note').maybeSingle();
      if (data) { setCard(data.card_number || ''); setNote(data.default_note || ''); }
    }
    loadDefaults();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setSuccess('');
    const total = Number(amount.replaceAll(',', '').replaceAll('٬', ''));
    if (!Number.isSafeInteger(total) || total <= 0) { setError('مبلغ کل را به‌صورت عدد صحیح و بیشتر از صفر وارد کن.'); return; }
    if (!isValidIranianMobile(phone)) { setError('شماره موبایل مشتری معتبر نیست.'); return; }
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ابتدا وارد حساب فروشنده شو.');
      const { data, error } = await supabase.from('invoices').insert({
        seller_id: user.id, title: title.trim() || 'صورتحساب گروهی', total_amount: total,
        customer_phone: normalizePhone(phone), note: note.trim() || null, card_number: card.trim() || null,
      }).select('id,public_token').single();
      if (error) throw error;
      const smsResponse = await fetch('/api/sms/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ invoiceId: data.id, to: normalizePhone(phone), kind: 'invoice' }) });
      if (!smsResponse.ok) {
        const result = await smsResponse.json().catch(() => ({}));
        setSuccess(`صورتحساب ساخته شد، اما ثبت پیامک آزمایشی ناموفق بود: ${result.error || 'خطای نامشخص'}`);
      } else setSuccess('صورتحساب ساخته شد و پیامک آزمایشی در گزارش پیامک‌ها ثبت شد.');
      router.push(`/dashboard/invoices/${data.id}?created=1`);
      router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : 'ساخت صورتحساب انجام نشد.'); }
    finally { setLoading(false); }
  }

  return <div className="mx-auto max-w-3xl">
    <Link href="/dashboard" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600"><ArrowRight size={17}/> بازگشت به داشبورد</Link>
    <div className="mb-6"><p className="mb-2 text-sm font-bold text-indigo-600">صورتحساب جدید</p><h1 className="text-2xl font-black sm:text-3xl">ساخت صورتحساب گروهی</h1><p className="mt-2 text-sm leading-7 text-slate-500">مبلغ کل را وارد کن. لینک تقسیم صورتحساب برای مشتری پیامک می‌شود تا سهم افراد را مشخص کند.</p></div>
    <form onSubmit={submit} className="surface p-5 sm:p-8">
      <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-5"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><FilePlus2 size={22}/></span><div><h2 className="font-extrabold">اطلاعات صورتحساب</h2><p className="mt-1 text-xs text-slate-400">فیلدهای ستاره‌دار الزامی هستند</p></div></div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className="label">عنوان صورتحساب</label><input className="field" value={title} onChange={e=>setTitle(e.target.value)} placeholder="مثلاً سفارش میز ۴" /></div>
        <div><label className="label">مبلغ کل (تومان) *</label><input className="field text-lg font-black" inputMode="numeric" required value={amount} onChange={e=>setAmount(normalizeDigits(e.target.value).replace(/[^0-9]/g,''))} placeholder="مثلاً ۲,۴۰۰,۰۰۰" dir="ltr"/><p className="mt-2 text-xs text-slate-400">{amount && Number(amount) > 0 ? `مبلغ: ${formatMoney(Number(amount))}` : 'مبلغ را بدون جداکننده وارد کن.'}</p></div>
        <div><label className="label">شماره موبایل مشتری اصلی *</label><input className="field" required inputMode="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="09123456789" dir="ltr"/><p className="mt-2 text-xs text-slate-400">لینک تقسیم صورتحساب به این شماره ارسال آزمایشی می‌شود.</p></div>
      </div>
      <div className="my-7 border-t border-slate-100"/>
      <div className="mb-4 flex items-center gap-2"><ShieldCheck size={18} className="text-indigo-600"/><h3 className="font-extrabold">اطلاعات تکمیلی برای این سفارش</h3></div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div><label className="label">شماره کارت (اختیاری)</label><input className="field" value={card} onChange={e=>setCard(e.target.value)} placeholder="6037-....-....-...." dir="ltr"/><p className="mt-2 text-xs text-slate-400">در صفحه صورتحساب برای افراد نمایش داده می‌شود.</p></div>
        <div><label className="label">توضیحات سفارش (اختیاری)</label><textarea className="field min-h-[100px] resize-y" value={note} onChange={e=>setNote(e.target.value)} placeholder="مثلاً هزینه ارسال و مالیات در مبلغ لحاظ شده است."/></div>
      </div>
      <div className="mt-6 rounded-2xl bg-indigo-50/80 p-4 text-sm leading-7 text-indigo-800"><Info className="ml-1 inline" size={16}/> بعد از ساخت، مشتری وارد صفحه تقسیم می‌شود و می‌تواند سهم هر نفر را بر اساس مبلغ یا درصد تعیین کند. لینک پرداخت هر نفر جداگانه ساخته خواهد شد.</div>
      {error && <p className="mt-5 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {success && <p className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{success}</p>}
      <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Link href="/dashboard" className="btn-ghost text-center">انصراف</Link><button disabled={loading} className="btn-primary inline-flex items-center justify-center gap-2"><MessageCircle size={17}/>{loading ? 'در حال ساخت…' : 'ساخت صورتحساب و ثبت پیامک تستی'}</button></div>
    </form>
  </div>;
}
