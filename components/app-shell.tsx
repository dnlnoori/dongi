import Link from 'next/link';
import { BarChart3, FilePlus2, Files, Settings, WalletCards, LogOut, CircleHelp } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

const links = [
  { href: '/dashboard', label: 'نمای کلی', icon: BarChart3 },
  { href: '/dashboard/new', label: 'صورتحساب جدید', icon: FilePlus2 },
  { href: '/dashboard/settings', label: 'تنظیمات', icon: Settings },
];

export async function AppShell({ children }: { children: React.ReactNode }) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) redirect('/setup');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('business_name').eq('id', user.id).maybeSingle();

  return <div className="min-h-screen lg:flex">
    <aside className="hidden w-[250px] shrink-0 border-l border-slate-200/80 bg-white px-5 py-7 lg:flex lg:flex-col">
      <Link href="/dashboard" className="mb-10 flex items-center gap-3 px-2">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200"><WalletCards size={23} /></span>
        <span><strong className="block text-xl tracking-tight">دنگی</strong><small className="text-xs text-slate-400">پرداخت گروهی، ساده‌تر</small></span>
      </Link>
      <div className="mb-3 px-3 text-[11px] font-bold text-slate-400">فضای کاری</div>
      <nav className="space-y-1">
        {links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700"><Icon size={18} />{label}</Link>)}
      </nav>
      <div className="mt-auto rounded-2xl bg-slate-50 p-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700"><CircleHelp size={16} /> راهنمای دنگی</div>
        <p className="text-xs leading-6 text-slate-500">صورتحساب بسازید، لینک را برای مشتری بفرستید و وضعیت سهم همه را پیگیری کنید.</p>
      </div>
    </aside>
    <div className="min-w-0 flex-1">
      <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-md sm:px-7">
        <div className="flex items-center gap-3 lg:hidden"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white"><WalletCards size={19} /></span><strong className="text-lg">دنگی</strong></div>
        <div className="hidden text-sm text-slate-500 lg:block">پنل مدیریت فروشنده</div>
        <div className="flex items-center gap-3">
          <div className="hidden text-left sm:block"><div className="text-sm font-bold">{profile?.business_name || 'کسب‌وکار من'}</div><div className="text-[11px] text-slate-400">{user.email}</div></div>
          <form action="/auth/signout" method="post"><button className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50" title="خروج"><LogOut size={17} /></button></form>
        </div>
      </header>
      <main className="mx-auto max-w-[1440px] px-4 py-6 pb-24 sm:px-7 sm:py-8">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-3 border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur lg:hidden">
        {links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="flex flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-bold text-slate-500"><Icon size={19} />{label}</Link>)}
      </nav>
    </div>
  </div>;
}
