import type { Metadata } from 'next';
import './globals.css';
import SiteHeader from '@/components/SiteHeader';
import PwaRegister from '@/components/PwaRegister';

export const metadata: Metadata = {
  title: { default: 'Digital Fire Circle', template: '%s · Digital Fire Circle' },
  description: 'Stories, elders, languages and wisdom around a digital fire.',
  manifest: '/manifest.webmanifest'
};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en"><body><PwaRegister/><SiteHeader/><main>{children}</main><footer className="footer">The fire is digital. The tradition is real.</footer></body></html>;
}
