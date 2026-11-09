import { CheckCircle2, Clock3, CircleDashed } from 'lucide-react';

export function StatusBadge({ status }: { status: string }) {
  if (status === 'paid') return <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700"><CheckCircle2 size={14} /> تسویه‌شده</span>;
  if (status === 'partial') return <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700"><Clock3 size={14} /> پرداخت ناقص</span>;
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600"><CircleDashed size={14} /> در انتظار</span>;
}
