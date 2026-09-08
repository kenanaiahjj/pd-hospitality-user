import type { Metadata } from 'next';
import { QueryProvider } from '@/lib/queries';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hospitality guest app prototype',
  description: 'A clickable guest-stay prototype for booking-linked arrival, offline access, hotel services, and front desk support.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className="antialiased"
      >
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
