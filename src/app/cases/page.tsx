import type { Metadata } from 'next';
import { CasesPage } from '@/components/features/cases';

export const metadata: Metadata = {
  title: 'Cabana cases',
  description: 'How requests, bookings, payments and chats work in the Cabana pilot.',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <CasesPage />;
}
