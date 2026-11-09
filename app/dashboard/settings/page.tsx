'use client';
import { useEffect, useState } from 'react';
import { Check, CreditCard, Save, Settings2, Store } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function SettingsPage() {
  const [business, setBusiness] = useState('');
  const [phone, setPhone] = useState('');
  const [card, setCard] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data, error } = await supabase.from('profiles').select('business_name,phone,card_number,default_note').maybeSingle();
      if (error) setError(error.message);
      if (data) { setBusiness(data.business_name || ''); setPhone(data.phone || ''); setCard(data.card_number || ''); setNote(data.default_note || ''); }
      setLoading(false);
    }
    load();
  }, []);
  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError(''); setSaved(false);
    const supabase = createClient();
    const { error } = await supabase.from('profiles').update({ business_name: business.trim() || 'کسب‌وکار من', phone: phone.trim() || null, card_number: card.trim() || null, default_note: note.trim() || null, updated_at: new Date().toISOString() });
    if (error) setError(error.message); else setSaved(true);
    setSaving(false);
  }
  return <div className="mx-auto max-w-3xl">
    <div className="mb-7"><p className="mb-2 text-sm font-bold text-indigo-600">شخصی‌سازی</p><h1 className="text-2xl font-black sm:text-3xl">تنظیمات فروشنده</h1><p className="mt-2 text-sm text-slate-500">اطلاعات پیش‌فرض کسب‌وکارت را ثبت کن تا هنگام ساخت صورتحساب سریع‌تر باشی.</p></div>
    {loading ? <div className="surface p-10 text-center text-sm text-slate-400">در حال دریافت تنظیمات…</div> : <form onSubmit={save} className="space-y-5">
      <section className="surface p-5 sm:p-7"><div className="mb-6 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Store size={20}/></span><div><h2 className="font-extrabold">اطلاعات کسب‌وکار</h2><p className="mt-1 text-xs text-slate-400">این نام در صفحه عمومی صورتحساب نمایش داده می‌شود.</p></div></div>
        <div className="grid gap-5 sm:grid-cols-2"><div><label className="label">نام کسب‌وکار</label><input className="field" value={business} onChange={e=>setBusiness(e.target.value)} placeholder="نام فروشگاه یا کسب‌وکار"/></div><div><label className="label">شماره تماس فروشنده</label><input className="field" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="0912…" dir="ltr"/></div></div>
      </section>
      <section className="surface p-5 sm:p-7"><div className="mb-6 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><CreditCard size={20}/></span><div><h2 className="font-extrabold">اطلاعات پرداخت</h2><p className="mt-1 text-xs text-slate-400">مقادیر زیر به‌صورت پیش‌فرض برای صورتحساب‌های جدید استفاده می‌شوند.</p></div></div>
        <div className="space-y-5"><div><label className="label">شماره کارت پیش‌فرض</label><input className="field" value={card} onChange={e=>setCard(e.target.value)} placeholder="6037-....-....-...." dir="ltr"/></div><div><label className="label">توضیحات پیش‌فرض صورتحساب</label><textarea className="field min-h-[110px] resize-y" value={note} onChange={e=>setNote(e.target.value)} placeholder="توضیحاتی که معمولاً برای سفارش‌ها نمایش می‌دهی…"/></div></div>
      </section>
      {error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {saved && <p className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700"><Check size={16}/> تنظیمات با موفقیت ذخیره شد.</p>}
      <div className="flex justify-end"><button disabled={saving} className="btn-primary inline-flex items-center gap-2"><Save size={17}/>{saving ? 'در حال ذخیره…' : 'ذخیره تنظیمات'}</button></div>
    </form>}
    <div className="mt-7 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-xs leading-7 text-amber-800"><Settings2 className="ml-1 inline" size={15}/> شماره کارت صرفاً جهت نمایش اطلاعات سفارش است. پرداخت واقعی در این نسخه از طریق درگاه بانکی انجام نمی‌شود.</div>
  </div>;
}
