import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SubSentry AI – Personal Subscription & Auto-Debit Auditor',
  description:
    'Intelligent recurring finance auditor for tracking UPI AutoPay, bank mandates, subscriptions, price increases, and potential savings.',
  icons: {
    icon: '/favicon.ico'
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-slate-100 antialiased min-h-screen selection:bg-primary/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}
