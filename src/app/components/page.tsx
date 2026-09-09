import type { Metadata } from 'next';
import { DesignSystemGallery } from '@/components/features/design-system';

export const metadata: Metadata = {
  title: 'Cabana UI — components',
  description: 'The Cabana component library: the tokens, controls, and surfaces the guest app is built from.',
};

export default function ComponentsPage() {
  return <DesignSystemGallery />;
}
