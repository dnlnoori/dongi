'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowUpLeft, CheckCircle2, Clock3, FilePlus2, Search, Wallet, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatDate, formatMoney } from '@/lib/utils';
import { StatusBadge } from '@/components/status-badge';
import type { Invoice } from '@/lib/types';

type InvoiceRow = Invoice & { participants?: { id: string; status: string; amount: number }[] };

export default function DashboardPage() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data, error } = await supabase.from('invoices').select('*, participants(id,status,amount)').order('created_at', { ascending: false });
      if (error) setError(error.message);
      setInvoices((data || []) as InvoiceRow[]); setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => invoices.filter(inv => {
    const matchesSearch = `${inv.title} ${inv.customer_phone || ''}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filter === 'all' || inv.status === filter;
    const created = new Date(inv.created_at);
    const matchesFrom = !dateFrom || created >= new Date(`${dateFrom}T00:00:00`);
    const matchesTo = !dateTo || created <= new Date(`${dateTo}T23:59:59`);
    return matchesSearch && matchesStatus && matchesFrom && matchesTo;
  }), [invoices, search, filter, dateFrom, dateTo]);

  const totalAmount = invoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
  const paidAmount = invoices.reduce((sum, inv) => sum + (inv.participants || []).filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0), 0);
  const pendingCount = invoices.filter(inv => inv.status !== 'paid').length;
  const peopleCount = invoices.reduce((sum, inv) => sum + (inv.participants?.length || 0), 0);

  return <div>
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p className="mb-2 text-sm font-bold text-indigo-600">خلاصه عملکرد</p><h1 className="text-2xl font-black tracking-tight sm:text-3xl">داشبورد فروشنده</h1><p className="mt-2 text-sm text-slate-500">همه صورتحساب‌ها و پرداخت‌های گروهی را یک‌جا مدیریت کن.</p></div>
      <Link href="/dashboard/new" className="btn-primary inline-flex items-center justify-center gap-2"><FilePlus2 size={18}/> ساخت صورتحساب جدید</Link>
    </div>

    <div className="mb-7 grid grid-cols-2 gap-3 xl:grid-cols-4">
      <Stat icon={<Wallet size={19}/>} label="مجموع صورتحساب‌ها" value={formatMoney(totalAmount)} tint="indigo" />
      <Stat icon={<CheckCircle2 size={19}/>} label="مبلغ تسویه‌شده" value={formatMoney(paidAmount)} tint="green" />
      <Stat icon={<Clock3 size={19}/>} label="صورتحساب باز" value={new Intl.NumberFormat('fa-IR').format(pendingCount)} suffix="صورتحساب" tint="amber" />
      <Stat icon={<Users size={19}/>} label="افراد ثبت‌شده" value={new Intl.NumberFormat('fa-IR').format(peopleCount)} suffix="نفر" tint="blue" />
    </div>

    <section className="surface overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div><h2 className="text-lg font-extrabold">صورتحساب‌های اخیر</h2><p className="mt-1 text-xs text-slate-400">وضعیت و جزئیات پرداخت‌ها را بررسی کن</p></div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <div className="relative col-span-2"><Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"/><input className="field h-10 pr-9 text-sm sm:w-52" placeholder="جست‌وجوی صورتحساب…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
          <select className="field h-10 text-sm sm:w-36" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">همه وضعیت‌ها</option><option value="open">در انتظار</option><option value="partial">پرداخت ناقص</option><option value="paid">تسویه‌شده</option></select>
          <input aria-label="از تاریخ" type="date" className="field h-10 text-xs sm:w-36" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} />
          <input aria-label="تا تاریخ" type="date" className="field h-10 text-xs sm:w-36" value={dateTo} onChange={e=>setDateTo(e.target.value)} />
        </div>
      </div>
      {error && <p className="m-5 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {loading ? <div className="p-12 text-center text-sm text-slate-400">در حال دریافت اطلاعات…</div> : filtered.length === 0 ? <div className="flex flex-col items-center px-5 py-14 text-center"><span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><Wallet size={25}/></span><h3 className="font-extrabold">{invoices.length ? 'موردی پیدا نشد' : 'هنوز صورتحسابی نساختی'}</h3><p className="mt-2 max-w-sm text-sm leading-7 text-slate-500">{invoices.length ? 'عبارت جست‌وجو یا فیلتر را تغییر بده.' : 'اولین صورتحساب گروهی را بساز و لینک آن را برای مشتری بفرست.'}</p>{!invoices.length && <Link href="/dashboard/new" className="btn-primary mt-5">ساخت اولین صورتحساب</Link>}</div> : <>
        <div className="hidden overflow-x-auto md:block"><table className="w-full text-right text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-6 py-4 font-bold">عنوان صورتحساب</th><th className="px-4 py-4 font-bold">مبلغ کل</th><th className="px-4 py-4 font-bold">افراد</th><th className="px-4 py-4 font-bold">وضعیت</th><th className="px-4 py-4 font-bold">تاریخ ایجاد</th><th className="px-6 py-4"></th></tr></thead><tbody className="divide-y divide-slate-100">{filtered.map(inv=><tr key={inv.id} className="hover:bg-slate-50/70"><td className="px-6 py-4"><div className="font-bold">{inv.title}</div><div className="mt-1 text-xs text-slate-400">{inv.customer_phone || 'بدون شماره مشتری'}</div></td><td className="px-4 py-4 font-extrabold tabular-nums">{formatMoney(inv.total_amount)}</td><td className="px-4 py-4 text-slate-600">{new Intl.NumberFormat('fa-IR').format(inv.participants?.length || 0)} نفر</td><td className="px-4 py-4"><StatusBadge status={inv.status}/></td><td className="px-4 py-4 text-xs text-slate-500">{formatDate(inv.created_at)}</td><td className="px-6 py-4"><Link href={`/dashboard/invoices/${inv.id}`} className="inline-flex items-center gap-1 font-bold text-indigo-600">جزئیات <ArrowLeft size={15}/></Link></td></tr>)}</tbody></table></div>
        <div className="divide-y divide-slate-100 md:hidden">{filtered.map(inv=><Link key={inv.id} href={`/dashboard/invoices/${inv.id}`} className="block p-4 transition hover:bg-slate-50"><div className="mb-3 flex items-start justify-between gap-2"><div><div className="font-extrabold">{inv.title}</div><div className="mt-1 text-xs text-slate-400">{formatDate(inv.created_at)}</div></div><StatusBadge status={inv.status}/></div><div className="flex items-end justify-between"><div><div className="text-xs text-slate-400">مبلغ کل</div><div className="mt-1 font-black">{formatMoney(inv.total_amount)}</div></div><div className="text-xs text-slate-500">{new Intl.NumberFormat('fa-IR').format(inv.participants?.length || 0)} نفر <ArrowUpLeft className="mr-1 inline" size={14}/></div></div></Link>)}</div>
      </>}
    </section>
    <p className="mt-5 text-center text-[11px] text-slate-400">دنگی · نسخه آزمایشی · پرداخت‌ها در این نسخه شبیه‌سازی می‌شوند</p>
  </div>;
}

function Stat({ icon, label, value, suffix, tint }: { icon: React.ReactNode; label: string; value: string; suffix?: string; tint: 'indigo'|'green'|'amber'|'blue' }) {
  const colors = { indigo: 'bg-indigo-50 text-indigo-600', green: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600', blue: 'bg-sky-50 text-sky-600' };
  return <div className="surface p-4 sm:p-5"><div className="mb-4 flex items-center justify-between"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors[tint]}`}>{icon}</span>{suffix && <span className="text-[10px] text-slate-400">{suffix}</span>}</div><div className="mb-1 text-xs text-slate-500">{label}</div><div className="stat-number text-lg font-black sm:text-xl">{value}</div></div>;
}
