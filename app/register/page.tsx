'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WalletCards } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export default function RegisterPage() {
  const router = useRouter();
  const [business, setBusiness] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setMessage(''); setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { business_name: business || 'کسب‌وکار من' } } });
      if (error) throw error;
      if (data.session) { router.replace('/dashboard'); router.refresh(); }
      else setMessage('حساب ساخته شد. اگر تأیید ایمیل در Supabase فعال است، ایمیل خود را تأیید کن و سپس وارد شو.');
    } catch (err) { setError(err instanceof Error ? err.message : 'ثبت‌نام انجام نشد.'); }
    finally { setLoading(false); }
  }
  return <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_right,_#e9e8ff,_transparent_38%),linear-gradient(135deg,#f8faff,#f2f5fb)] px-4 py-10">
    <div className="w-full max-w-[440px]">
      <div className="mb-7 flex flex-col items-center text-center"><span className="mb-3 flex h-14 w-14 items-center justify-center rounded-[20px] bg-indigo-600 text-white shadow-xl shadow-indigo-200"><WalletCards size={27}/></span><h1 className="text-3xl font-black">شروع با دنگی</h1><p className="mt-2 text-sm text-slate-500">حساب فروشنده‌ات را در چند ثانیه بساز</p></div>
      <form onSubmit={submit} className="surface p-6 sm:p-8">
        <h2 className="mb-6 text-lg font-extrabold">ساخت حساب فروشنده</h2>
        <label className="label">نام کسب‌وکار</label><input className="field mb-4" value={business} onChange={e=>setBusiness(e.target.value)} placeholder="مثلاً کافه آفتاب" />
        <label className="label">ایمیل</label><input className="field mb-4" type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@example.com" dir="ltr" />
        <label className="label">رمز عبور (حداقل ۸ کاراکتر)</label><input className="field mb-5" type="password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)} placeholder="رمز عبور" dir="ltr" />
        {error && <p className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        {message && <p className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm leading-6 text-emerald-800">{message}</p>}
        <button disabled={loading || !isSupabaseConfigured()} className="btn-primary w-full">{loading ? 'در حال ساخت حساب…' : 'ساخت حساب'}</button>
        <p className="mt-5 text-center text-sm text-slate-500">قبلاً ثبت‌نام کردی؟ <Link href="/login" className="font-extrabold text-indigo-600">وارد شو</Link></p>
      </form>
    </div>
  </main>;
}
