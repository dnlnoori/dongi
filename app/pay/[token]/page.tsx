'use client';
import { use, useEffect, useState } from 'react';
import { CheckCircle2, Clock3, CreditCard, LockKeyhole, ShieldCheck, WalletCards } from 'lucide-react';
import { formatDate, formatMoney } from '@/lib/utils';

type PayData = {
  participant: { id:string; name:string; amount:number; status:string; paid_at:string|null; share_token:string };
  invoice: { title:string; total_amount:number; note:string|null; card_number:string|null; status:string; created_at:string; public_token:string; seller_name:string };
};
export default function PayPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [data,setData] = useState<PayData|null>(null);
  const [loading,setLoading] = useState(true);
  const [paying,setPaying] = useState(false);
  const [error,setError] = useState('');
  const [message,setMessage] = useState('');
  async function load(current=token) {
    if(!current) return;
    setLoading(true);
    const response=await fetch(`/api/public/participants/${current}`,{cache:'no-store'});
    const result=await response.json();
    if(response.ok) setData(result); else setError(result.error||'لینک پرداخت معتبر نیست.');
    setLoading(false);
  }
  useEffect(()=>{if(token) load(token); // eslint-disable-next-line react-hooks/exhaustive-deps
  },[token]);
  async function pay() {
    if(!token) return;
    setPaying(true);setError('');setMessage('');
    try {
      const response=await fetch('/api/payments/test',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({shareToken:token})});
      const result=await response.json();
      if(!response.ok) throw new Error(result.error||'پرداخت انجام نشد.');
      setMessage(result.message); await load(token);
    } catch(err) {setError(err instanceof Error?err.message:'خطای نامشخص');}
    finally {setPaying(false);}
  }
  if(loading) return <main className="flex min-h-screen items-center justify-center text-sm text-slate-400">در حال بارگذاری لینک پرداخت…</main>;
  if(!data) return <main className="flex min-h-screen items-center justify-center p-5"><div className="surface max-w-md p-8 text-center"><CreditCard className="mx-auto mb-3 text-slate-400" size={30}/><h1 className="font-black">لینک پرداخت پیدا نشد</h1><p className="mt-2 text-sm text-slate-500">{error}</p></div></main>;
  const paid=data.participant.status==='paid';
  return <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_right,_#e9e8ff,_transparent_38%),linear-gradient(135deg,#f8faff,#f2f5fb)] px-4 py-10">
    <div className="w-full max-w-[500px]">
      <div className="mb-6 flex items-center justify-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white"><WalletCards size={19}/></span><span className="text-xl font-black">دنگی</span></div>
      <section className="surface overflow-hidden">
        <div className="bg-gradient-to-l from-indigo-700 to-violet-600 px-6 py-7 text-white"><div className="mb-4 flex items-center justify-between"><span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">لینک پرداخت اختصاصی</span><span className="text-xs text-indigo-100">{data.invoice.seller_name}</span></div><p className="text-sm text-indigo-100">{data.invoice.title}</p><h1 className="mt-2 text-3xl font-black">{formatMoney(data.participant.amount)}</h1><p className="mt-2 text-xs text-indigo-100">سهم {data.participant.name}</p></div>
        <div className="p-6 sm:p-8">
          {paid ? <div className="mb-6 rounded-2xl bg-emerald-50 p-5 text-center"><span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><CheckCircle2 size={29}/></span><h2 className="text-xl font-black text-emerald-800">پرداخت شما ثبت شده است</h2><p className="mt-2 text-sm text-emerald-700">زمان پرداخت: {formatDate(data.participant.paid_at)}</p></div> : <div className="mb-6 rounded-2xl bg-amber-50 p-4"><div className="flex items-center gap-2 text-sm font-bold text-amber-800"><Clock3 size={17}/> در انتظار پرداخت</div><p className="mt-2 text-xs leading-6 text-amber-700">پس از پرداخت آزمایشی، وضعیت سهم شما در صورتحساب گروهی به‌روزرسانی می‌شود.</p></div>}
          <div className="space-y-3 rounded-2xl border border-slate-100 p-4"><Row label="نام پرداخت‌کننده" value={data.participant.name}/><Row label="مبلغ سهم" value={formatMoney(data.participant.amount)}/><Row label="مبلغ کل سفارش" value={formatMoney(data.invoice.total_amount)}/><Row label="فروشنده" value={data.invoice.seller_name}/>{data.invoice.card_number&&<Row label="شماره کارت اعلام‌شده" value={data.invoice.card_number}/>}</div>
          {data.invoice.note&&<p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs leading-6 text-slate-500">{data.invoice.note}</p>}
          {error&&<p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
          {message&&<p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm leading-6 text-emerald-700">{message}</p>}
          {!paid&&<button disabled={paying} onClick={pay} className="btn-primary mt-6 flex w-full items-center justify-center gap-2 py-3.5"><CreditCard size={18}/>{paying?'در حال ثبت پرداخت آزمایشی…':'پرداخت آزمایشی سهم من'}</button>}
          <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-400"><LockKeyhole size={13}/> ارتباط امن · <ShieldCheck size={13}/> نسخه آزمایشی</div>
          <p className="mt-3 text-center text-[11px] leading-6 text-slate-400">این دکمه فقط وضعیت پرداخت را در محیط آزمایشی تغییر می‌دهد و به بانک متصل نیست.</p>
        </div>
      </section>
      <p className="mt-5 text-center text-xs text-slate-400">ساخته‌شده با دنگی</p>
    </div>
  </main>;
}
function Row({label,value}:{label:string;value:string}) {return <div className="flex items-center justify-between gap-3 text-sm"><span className="text-xs text-slate-400">{label}</span><strong className="text-left text-sm">{value}</strong></div>;}
