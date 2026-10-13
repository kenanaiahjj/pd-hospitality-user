import Link from 'next/link';
import { ROUTES } from '@/config/constants';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <nav className="mbe-8 text-sm">
        <Link href={ROUTES.home} className="text-neutral-500 hover:text-neutral-900 active:text-neutral-900 dark:hover:text-neutral-100 dark:active:text-neutral-100">
          ← Home
        </Link>
      </nav>
      {children}
    </div>
  );
}
