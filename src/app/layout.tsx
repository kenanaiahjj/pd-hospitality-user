import type { Metadata } from 'next';
import { Newsreader } from 'next/font/google';
import { QueryProvider } from '@/lib/queries';
import './globals.css';

/* The editorial serif for page titles and place names, after Places. */
const serif = Newsreader({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Cabana — your stay, in one place',
  description:
    'Cabana is a light, mobile-first guest app for hotel stays: arrival, on-property services, room charges, and the front desk in a single calm surface.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={serif.variable}>
      <body className="antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
