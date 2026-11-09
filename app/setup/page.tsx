import Link from 'next/link';
import { Database, ShieldCheck, Terminal } from 'lucide-react';
export default function SetupPage() {
  return <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-4 py-12">
    <div className="surface p-6 sm:p-10">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><Database size={24}/></div>
      <h1 className="text-2xl font-black">راه‌اندازی اولیه دنگی</h1>
      <p className="mt-3 leading-8 text-slate-600">برای فعال شدن ورود، ذخیره‌سازی صورتحساب‌ها و داشبورد، یک پروژه Supabase بساز و مراحل زیر را انجام بده.</p>
      <ol className="mt-6 space-y-5 text-sm leading-7 text-slate-600">
        <li><strong className="text-slate-900">۱. ساخت دیتابیس:</strong> در Supabase یک پروژه بساز و محتوای فایل <code dir="ltr">supabase/migrations/0001_init.sql</code> را در SQL Editor اجرا کن.</li>
        <li><strong className="text-slate-900">۲. تنظیم متغیرها:</strong> فایل <code dir="ltr">.env.example</code> را به <code dir="ltr">.env.local</code> کپی کن و مقادیر Project URL، anon key و service role key را وارد کن.</li>
        <li><strong className="text-slate-900">۳. اجرای برنامه:</strong> دستورهای <code dir="ltr">npm install</code> و سپس <code dir="ltr">npm run dev</code> را اجرا کن.</li>
        <li><strong className="text-slate-900">۴. ثبت‌نام:</strong> از صفحه ثبت‌نام حساب فروشنده بساز. در تنظیمات Auth پروژه Supabase می‌توانی تأیید ایمیل را برای محیط تست خاموش کنی.</li>
      </ol>
      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-4"><ShieldCheck className="mb-2 text-emerald-600"/><strong className="text-sm">کلید امن</strong><p className="mt-1 text-xs leading-6 text-slate-500">کلید service role فقط در سرور و متغیرهای محیطی Vercel قرار می‌گیرد؛ هرگز آن را در کد مرورگر قرار نده.</p></div>
        <div className="rounded-2xl bg-slate-50 p-4"><Terminal className="mb-2 text-indigo-600"/><strong className="text-sm">آماده استقرار</strong><p className="mt-1 text-xs leading-6 text-slate-500">بعد از تنظیم متغیرها، پروژه را به GitHub متصل و در Vercel Deploy کن.</p></div>
      </div>
      <Link href="/login" className="btn-primary mt-7 inline-flex">رفتن به ورود</Link>
    </div>
  </main>;
}
