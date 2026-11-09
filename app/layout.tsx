import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'دنگی | تقسیم و تسویه گروهی',
  description: 'صورتحساب گروهی بسازید، سهم هر نفر را مشخص کنید و پرداخت‌ها را یک‌جا پیگیری کنید.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fa" dir="rtl"><body>{children}</body></html>;
}
