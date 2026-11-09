'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Copy, ExternalLink, MessageCircle, RefreshCw, Users, Wallet } from 'lucide-react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { formatDate, formatMoney } from '@/lib/utils';
import { StatusBadge } from '@/components/status-badge';
import type { Invoice, Participant } from '@/lib/types';

type SmsLog = { id: string; to_phone: string; status: string; created_at: string; body: string };
export default function InvoiceDetailsPage() {
  const params = useParams<{ id: string }>();
  const [created, setCreated] = useState(false);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [smsLogs, setSmsLogs] = useState<SmsLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  async function load() {
    setLoading(true); setError('');
    const supabase = createClient();
    const [{ data: inv, error: invError }, { data: people, error: peopleError }, { data: logs }] = await Promise.all([
      supabase.from('invoices').select('*').eq('id', params.id).single(),
      supabase.from('participants').select('*').eq('invoice_id', params.id).order('created_at'),
      supabase.from('sms_logs').select('id,to_phone,status,created_at,body').eq('invoice_id', params.id).order('created_at', { ascending: false }),
    ]);
    if (invError) setError(invError.message); else setInvoice(inv as Invoice);
    if (peopleError) setError(peopleError.message); else setParticipants((people || []) as Participant[]);
    setSmsLogs((logs || []) as SmsLog[]); setLoading(false);
  }
  useEffect(() => { load(); setCreated(new URLSearchParams(window.location.search).get('created') === '1'); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const visible = useMemo(() => participants.filter(p => filter === 'all' || p.status === filter), [participants, filter]);
  const paid = participants.filter(p => p.status === 'paid').reduce((sum,p)=>sum+Number(p.amount),0);
  const pending = participants.filter(p => p.status !== 'paid').reduce((sum,p)=>sum+Number(p.amount),0);
  const shareUrl = typeof window !== 'undefined' && invoice ? `${window.location.origin}/i/${invoice.public_token}` : '';
  async function copyLink() { if (!shareUrl) return; await navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(()=>setCopied(false),1800); }

  if (loading) return <div className="surface p-12 text-center text-sm text-slate-400">در حال دریافت صورتحساب…</div>;
  if (!invoice) return <div className="surface p-10 text-center"><p className="font-bold">صورتحساب پیدا نشد.</p><Link href="/dashboard" className="mt-4 inline-block text-sm font-bold text-indigo-600">بازگشت به داشبورد</Link></div>;

  return <div>
    <Link href="/dashboard" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600"><ArrowRight size={17}/> بازگشت به داشبورد</Link>
    {created && <div className="mb-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">صورتحساب با موفقیت ساخته شد. لینک عمومی را می‌توانی کپی و برای مشتری ارسال کنی.</div>}
    {error && <div className="mb-5 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><div className="mb-2 flex items-center gap-2"><p className="text-sm font-bold text-indigo-600">جزئیات صورتحساب</p><StatusBadge status={invoice.status}/></div><h1 className="text-2xl font-black">{invoice.title}</h1><p className="mt-2 text-xs text-slate-400">ساخته‌شده در {formatDate(invoice.created_at)}</p></div><div className="flex flex-wrap gap-2"><button onClick={copyLink} className="btn-secondary inline-flex items-center gap-2"><Copy size={16}/>{copied ? 'کپی شد' : 'کپی لینک مشتری'}</button><a href={`/i/${invoice.public_token}`} target="_blank" rel="noreferrer" className="btn-ghost inline-flex items-center gap-2"><ExternalLink size={16}/> مشاهده صفحه مشتری</a></div></div>
    <div className="mb-6 grid gap-3 sm:grid-cols-3"><Summary icon={<Wallet size={18}/>} label="مبلغ کل" value={formatMoney(invoice.total_amount)}/><Summary icon={<CheckCircle2 size={18}/>} label="تسویه‌شده" value={formatMoney(paid)} green/><Summary icon={<Users size={18}/>} label="مانده حساب" value={formatMoney(pending)} amber/></div>
    <section className="surface overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-extrabold">وضعیت افراد</h2><p className="mt-1 text-xs text-slate-400">زمان ایجاد سهم و زمان پرداخت هر فرد</p></div><div className="flex gap-2"><select className="field h-10 w-36 text-sm" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">همه افراد</option><option value="paid">پرداخت‌شده</option><option value="pending">پرداخت‌نشده</option></select><button onClick={load} className="btn-ghost inline-flex items-center gap-2"><RefreshCw size={15}/> بروزرسانی</button></div></div>
      {participants.length === 0 ? <div className="p-10 text-center"><span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><Users size={22}/></span><h3 className="font-bold">هنوز سهمی ثبت نشده</h3><p className="mt-2 text-sm leading-7 text-slate-500">لینک صورتحساب را برای مشتری بفرست تا افراد و سهم هر نفر را ثبت کند.</p><button onClick={copyLink} className="btn-primary mt-4">کپی لینک تقسیم</button></div> : <>
        <div className="hidden overflow-x-auto md:block"><table className="w-full text-right text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-6 py-4">نام</th><th className="px-4 py-4">شماره موبایل</th><th className="px-4 py-4">سهم</th><th className="px-4 py-4">وضعیت</th><th className="px-4 py-4">زمان ثبت سهم</th><th className="px-6 py-4">زمان پرداخت</th></tr></thead><tbody className="divide-y divide-slate-100">{visible.map(p=><tr key={p.id}><td className="px-6 py-4 font-bold">{p.name}</td><td className="px-4 py-4 text-slate-500" dir="ltr">{p.phone}</td><td className="px-4 py-4 font-extrabold">{formatMoney(p.amount)}</td><td className="px-4 py-4"><StatusBadge status={p.status}/></td><td className="px-4 py-4 text-xs text-slate-500">{formatDate(p.created_at)}</td><td className="px-6 py-4 text-xs text-slate-500">{formatDate(p.paid_at)}</td></tr>)}</tbody></table></div>
        <div className="divide-y divide-slate-100 md:hidden">{visible.map(p=><div key={p.id} className="p-4"><div className="mb-2 flex items-center justify-between"><strong>{p.name}</strong><StatusBadge status={p.status}/></div><div className="mb-2 flex items-center justify-between"><span className="text-xs text-slate-400" dir="ltr">{p.phone}</span><strong>{formatMoney(p.amount)}</strong></div><div className="text-[11px] leading-6 text-slate-400">ثبت سهم: {formatDate(p.created_at)}<br/>پرداخت: {formatDate(p.paid_at)}</div></div>)}</div>
      </>}
    </section>
    <section className="surface mt-6 overflow-hidden"><div className="flex items-center gap-2 border-b border-slate-100 p-5"><MessageCircle size={18} className="text-indigo-600"/><div><h2 className="font-extrabold">گزارش پیامک آزمایشی</h2><p className="mt-1 text-xs text-slate-400">پیام‌ها در این نسخه فقط ثبت می‌شوند و ارسال واقعی ندارند.</p></div></div>{smsLogs.length ? <div className="divide-y divide-slate-100">{smsLogs.map(log=><div key={log.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="text-sm font-bold" dir="ltr">{log.to_phone}</div><p className="mt-1 max-w-2xl text-xs leading-6 text-slate-500">{log.body}</p></div><div className="shrink-0 text-[11px] text-slate-400">{formatDate(log.created_at)} · ثبت آزمایشی</div></div>)}</div> : <p className="p-5 text-sm text-slate-400">هنوز پیامکی ثبت نشده است.</p>}</section>
  </div>;
}
function Summary({ icon, label, value, green, amber }: { icon: React.ReactNode; label: string; value: string; green?: boolean; amber?: boolean }) { return <div className="surface p-4 sm:p-5"><div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${green?'bg-emerald-50 text-emerald-600':amber?'bg-amber-50 text-amber-600':'bg-indigo-50 text-indigo-600'}`}>{icon}</div><div className="text-xs text-slate-500">{label}</div><div className="mt-1 text-lg font-black">{value}</div></div>; }
