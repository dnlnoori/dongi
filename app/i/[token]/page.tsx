'use client';
import { use, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronLeft, Clock3, Info, Link2, Plus, ReceiptText, RefreshCw, Trash2, Users, WalletCards } from 'lucide-react';
import { formatDate, formatMoney, isValidIranianMobile, normalizeDigits, normalizePhone } from '@/lib/utils';

type PublicParticipant = { id: string; name: string; amount: number; status: 'pending'|'paid'; share_token: string; paid_at: string | null; created_at: string };
type PublicInvoice = { id: string; title: string; total_amount: number; status: string; note: string | null; card_number: string | null; public_token: string; created_at: string; seller_name: string };
type PersonDraft = { id: number; name: string; phone: string; value: string };

export default function PublicInvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [invoice, setInvoice] = useState<PublicInvoice | null>(null);
  const [participants, setParticipants] = useState<PublicParticipant[]>([]);
  const [paidAmount, setPaidAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'equal'|'percent'|'amount'>('equal');
  const [people, setPeople] = useState<PersonDraft[]>([{id:1,name:'',phone:'',value:''},{id:2,name:'',phone:'',value:''}]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');

  async function load(currentToken = token) {
    if (!currentToken) return;
    setLoading(true);
    const response = await fetch(`/api/public/invoices/${currentToken}`, { cache: 'no-store' });
    const result = await response.json();
    if (response.ok) { setInvoice(result.invoice); setParticipants(result.participants || []); setPaidAmount(result.paid_amount || 0); }
    else setError(result.error || 'صورتحساب پیدا نشد.');
    setLoading(false);
  }
  useEffect(() => { if (token) load(token); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);
  useEffect(() => {
    if (!token) return;
    const timer = window.setInterval(() => { load(token); }, 12000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const calculated = useMemo(() => {
    if (!invoice) return [] as number[];
    const total = Number(invoice.total_amount);
    if (mode === 'equal') {
      const base = Math.floor(total / people.length); const remainder = total % people.length;
      return people.map((_,i)=>base+(i<remainder?1:0));
    }
    if (mode === 'percent') {
      const vals = people.map(p=>Math.max(0, Number(p.value)||0));
      const amounts = vals.map(v=>Math.round(total*v/100));
      if (vals.reduce((s,v)=>s+v,0) === 100 && amounts.length) amounts[amounts.length-1] += total-amounts.reduce((s,v)=>s+v,0);
      return amounts;
    }
    return people.map(p=>Math.max(0, Number(p.value)||0));
  }, [invoice, mode, people]);
  const allocated = calculated.reduce((s,v)=>s+v,0);
  const percentSum = people.reduce((s,p)=>s+(Number(p.value)||0),0);
  const canSubmit = Boolean(invoice && people.length && people.every(p=>p.name.trim() && isValidIranianMobile(p.phone)) && calculated.every(a=>Number.isSafeInteger(a)&&a>0) && (mode==='percent' ? percentSum===100 : allocated===Number(invoice.total_amount)));
  const remaining = invoice ? Math.max(0, Number(invoice.total_amount)-paidAmount) : 0;

  function updatePerson(id:number, key:keyof PersonDraft, value:string) { setPeople(old=>old.map(p=>p.id===id?{...p,[key]:value}:p)); }
  function addPerson() { setPeople(old=>[...old,{id:Math.max(0,...old.map(p=>p.id))+1,name:'',phone:'',value:''}]); }
  function removePerson(id:number) { if (people.length>1) setPeople(old=>old.filter(p=>p.id!==id)); }
  async function submitSplit() {
    if (!canSubmit || !invoice) return;
    setSubmitting(true); setError(''); setNotice('');
    try {
      const payload = people.map((p,i)=>({name:p.name.trim(),phone:normalizePhone(p.phone),amount:calculated[i]}));
      const response = await fetch(`/api/public/invoices/${token}/split`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({participants:payload}) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'ثبت تقسیم انجام نشد.');
      setNotice('سهم‌ها ثبت شدند. لینک پرداخت اختصاصی هر نفر ساخته و پیامک آزمایشی آن ثبت شد.');
      await load(token);
    } catch(err) { setError(err instanceof Error ? err.message : 'خطای نامشخص'); }
    finally { setSubmitting(false); }
  }

  if (loading) return <main className="flex min-h-screen items-center justify-center p-5 text-sm text-slate-400">در حال بارگذاری صورتحساب…</main>;
  if (!invoice) return <main className="flex min-h-screen items-center justify-center p-5"><div className="surface max-w-md p-8 text-center"><ReceiptText className="mx-auto mb-3 text-slate-400" size={30}/><h1 className="font-black">صورتحساب در دسترس نیست</h1><p className="mt-2 text-sm text-slate-500">{error || 'لینک ممکن است اشتباه یا منقضی شده باشد.'}</p></div></main>;

  return <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_#e9e8ff,_transparent_35%),#f6f8fc] px-3 py-8 sm:px-5 sm:py-12">
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white"><WalletCards size={19}/></span><span className="text-xl font-black">دنگی</span></div>
      <section className="surface overflow-hidden">
        <div className="bg-gradient-to-l from-indigo-700 to-violet-600 px-5 py-7 text-white sm:px-8 sm:py-9"><div className="mb-4 flex items-center justify-between gap-3"><span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">صورتحساب گروهی</span><span className="text-xs text-indigo-100">{invoice.seller_name}</span></div><p className="text-sm text-indigo-100">{invoice.title}</p><div className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{formatMoney(invoice.total_amount)}</div><p className="mt-3 text-xs text-indigo-100">ایجاد شده در {formatDate(invoice.created_at)}</p></div>
        <div className="p-5 sm:p-8">
          <div className="mb-6 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-emerald-50 p-4"><div className="mb-1 flex items-center gap-2 text-xs font-bold text-emerald-700"><CheckCircle2 size={15}/> پرداخت‌شده</div><div className="text-lg font-black text-emerald-800">{formatMoney(paidAmount)}</div></div><div className="rounded-2xl bg-amber-50 p-4"><div className="mb-1 flex items-center gap-2 text-xs font-bold text-amber-700"><Clock3 size={15}/> مانده حساب</div><div className="text-lg font-black text-amber-800">{formatMoney(remaining)}</div></div></div>
          {invoice.note && <div className="mb-6 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm leading-7 text-slate-600"><Info className="ml-1 inline text-indigo-500" size={16}/>{invoice.note}</div>}
          {invoice.card_number && <div className="mb-6 rounded-2xl border border-slate-100 p-4"><div className="mb-2 text-xs font-bold text-slate-500">شماره کارت فروشنده</div><div className="text-lg font-black tracking-widest" dir="ltr">{invoice.card_number}</div></div>}

          {participants.length === 0 ? <>
            <div className="mb-5"><h2 className="text-xl font-black">سهم هر نفر را مشخص کنید</h2><p className="mt-2 text-sm leading-7 text-slate-500">روش تقسیم را انتخاب کنید، نام و شماره موبایل افراد را وارد کنید تا برای هر نفر لینک پرداخت جداگانه ساخته شود.</p></div>
            <div className="mb-5 grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1">{([['equal','مساوی'],['percent','درصدی'],['amount','مبلغ دلخواه']] as const).map(([key,label])=><button key={key} onClick={()=>setMode(key)} className={`rounded-xl px-2 py-3 text-xs font-extrabold transition ${mode===key?'bg-white text-indigo-700 shadow-sm':'text-slate-500 hover:text-slate-800'}`}>{label}</button>)}</div>
            <div className="space-y-3">{people.map((person,index)=><div key={person.id} className="rounded-2xl border border-slate-200 p-4"><div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-xs font-black text-indigo-700">{new Intl.NumberFormat('fa-IR').format(index+1)}</span><strong className="text-sm">اطلاعات نفر {new Intl.NumberFormat('fa-IR').format(index+1)}</strong></div>{people.length>1&&<button onClick={()=>removePerson(person.id)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="حذف فرد"><Trash2 size={16}/></button>}</div><div className="grid gap-3 sm:grid-cols-2"><div><label className="label">نام و نام خانوادگی</label><input className="field" value={person.name} onChange={e=>updatePerson(person.id,'name',e.target.value)} placeholder="مثلاً علی رضایی"/></div><div><label className="label">شماره موبایل</label><input className="field" inputMode="tel" value={person.phone} onChange={e=>updatePerson(person.id,'phone',e.target.value)} placeholder="09123456789" dir="ltr"/></div>{mode!=='equal'&&<div className="sm:col-span-2"><label className="label">{mode==='percent'?'سهم درصدی':'سهم به تومان'}</label><input className="field" inputMode="decimal" value={person.value} onChange={e=>updatePerson(person.id,'value',normalizeDigits(e.target.value).replace(/[^0-9.]/g,''))} placeholder={mode==='percent'?'مثلاً ۲۵':'مثلاً ۶۰۰۰۰۰'} dir="ltr"/></div>}</div><div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"><span className="text-xs text-slate-500">سهم محاسبه‌شده</span><strong className="text-sm">{formatMoney(calculated[index]||0)}</strong></div></div>)}</div>
            <button onClick={addPerson} disabled={people.length>=50} className="btn-secondary mt-4 inline-flex w-full items-center justify-center gap-2 disabled:opacity-50"><Plus size={17}/> افزودن نفر جدید</button>
            <div className="mt-5 rounded-2xl bg-indigo-50 p-4"><div className="flex items-center justify-between text-sm"><span className="font-bold text-indigo-900">مجموع سهم‌ها</span><strong className="text-indigo-900">{formatMoney(allocated)}</strong></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-indigo-100"><div className="h-full rounded-full bg-indigo-600 transition-all" style={{width:`${Math.min(100, allocated/Number(invoice.total_amount)*100)}%`}}/></div><div className="mt-2 flex justify-between text-xs text-indigo-700"><span>{mode==='percent'?`مجموع درصد: ${new Intl.NumberFormat('fa-IR').format(percentSum)}٪`: 'مبلغ باقی‌مانده برای تقسیم'}</span><strong>{mode==='percent'?`${new Intl.NumberFormat('fa-IR').format(100-percentSum)}٪` : formatMoney(Number(invoice.total_amount)-allocated)}</strong></div></div>
            {error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm leading-6 text-rose-700">{error}</p>}
            <button disabled={!canSubmit||submitting} onClick={submitSplit} className="btn-primary mt-5 flex w-full items-center justify-center gap-2 py-3.5">{submitting?'در حال ثبت سهم‌ها…':'ثبت سهم‌ها و ساخت لینک پرداخت'}<ChevronLeft size={17}/></button>
            <p className="mt-3 text-center text-[11px] leading-6 text-slate-400">در حالت درصدی مجموع درصدها باید ۱۰۰٪ و در حالت مبلغ دلخواه مجموع سهم‌ها باید برابر مبلغ کل باشد.</p>
          </> : <>
            <div className="mb-5 flex items-center justify-between"><div><h2 className="text-xl font-black">وضعیت تسویه افراد</h2><p className="mt-1 text-xs text-slate-500">هر فرد می‌تواند از لینک اختصاصی خودش پرداخت کند.</p></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{new Intl.NumberFormat('fa-IR').format(participants.filter(p=>p.status==='paid').length)} از {new Intl.NumberFormat('fa-IR').format(participants.length)} پرداخت</span></div>
            {notice && <p className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}
            <div className="space-y-3">{participants.map(p=><div key={p.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 p-4"><div className="flex min-w-0 items-center gap-3"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${p.status==='paid'?'bg-emerald-50 text-emerald-600':'bg-slate-100 text-slate-400'}`}>{p.status==='paid'?<CheckCircle2 size={20}/>:<Users size={18}/>}</span><div className="min-w-0"><div className="truncate text-sm font-extrabold">{p.name}</div><div className="mt-1 text-xs text-slate-400">{p.status==='paid'?`پرداخت در ${formatDate(p.paid_at)}`:'در انتظار پرداخت'}</div></div></div><div className="shrink-0 text-left"><div className="font-black">{formatMoney(p.amount)}</div>{p.status==='paid'?<span className="text-[11px] font-bold text-emerald-600">تسویه شد</span>:<a href={`/pay/${p.share_token}`} className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-indigo-600">لینک پرداخت <Link2 size={13}/></a>}</div></div>)}</div>
            <button onClick={()=>load(token)} className="btn-secondary mt-5 flex w-full items-center justify-center gap-2"><RefreshCw size={15}/> بروزرسانی وضعیت پرداخت‌ها</button>
          </>}
        </div>
      </section>
      <p className="mt-5 text-center text-[11px] leading-6 text-slate-400">پرداخت در این نسخه آزمایشی است و هیچ وجه واقعی جابه‌جا نمی‌شود.</p>
    </div>
  </main>;
}
