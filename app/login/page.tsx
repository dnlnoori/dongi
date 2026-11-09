'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LockKeyhole, WalletCards } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.replace('/dashboard'); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : 'ورود انجام نشد.'); }
    finally { setLoading(false); }
  }
  return <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_right,_#e9e8ff,_transparent_38%),linear-gradient(135deg,#f8faff,#f2f5fb)] px-4 py-10">
    <div className="w-full max-w-[430px]">
      <div className="mb-7 flex flex-col items-center text-center"><span className="mb-3 flex h-14 w-14 items-center justify-center rounded-[20px] bg-indigo-600 text-white shadow-xl shadow-indigo-200"><WalletCards size={27} /></span><h1 className="text-3xl font-black tracking-tight">خوش برگشتی!</h1><p className="mt-2 text-sm text-slate-500">برای مدیریت صورتحساب‌های گروهی وارد شو</p></div>
      <form onSubmit={submit} className="surface p-6 sm:p-8">
        <h2 className="mb-6 text-lg font-extrabold">ورود به حساب فروشنده</h2>
        <label className="label">ایمیل</label><input className="field mb-4" type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@example.com" dir="ltr" />
        <label className="label">رمز عبور</label><input className="field mb-5" type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="رمز عبور" dir="ltr" />
        {error && <p className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        {!isSupabaseConfigured() && <p className="mb-4 rounded-xl bg-amber-50 p-3 text-xs leading-6 text-amber-800">ابتدا تنظیمات Supabase را انجام بده. <Link href="/setup" className="font-bold underline">راهنمای راه‌اندازی</Link></p>}
        <button disabled={loading || !isSupabaseConfigured()} className="btn-primary flex w-full items-center justify-center gap-2">{loading ? 'در حال ورود…' : 'ورود'}<ArrowLeft size={17}/></button>
        <p className="mt-5 text-center text-sm text-slate-500">حساب نداری؟ <Link href="/register" className="font-extrabold text-indigo-600">ثبت‌نام کن</Link></p>
      </form>
      <p className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-400"><LockKeyhole size={13}/> اطلاعات فروشنده به‌صورت امن نگهداری می‌شود</p>
    </div>
  </main>;
}
