import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Cabana component states', robots: { index:false, follow:false } };
export default function StatesLayout({children}:{children:React.ReactNode}) {return children;}
