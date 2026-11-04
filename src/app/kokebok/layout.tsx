import './kokebok.css';
import './deling.css';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mi kokebok', robots: { index: false, follow: false } };
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
