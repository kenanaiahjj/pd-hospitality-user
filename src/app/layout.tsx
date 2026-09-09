import type { Metadata } from 'next';
import { QueryProvider } from '@/lib/queries';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cabana — your stay, in one place',
  description:
    'Cabana is a light, mobile-first guest app for hotel stays: arrival, on-property services, room charges, and the front desk in a single calm surface.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
