import { RouteFocus } from '@/components/route-focus';
import { JourneyNav } from '@/components/journey-nav';
import { SessionNotice } from '@/components/session-notice';
import { RequestProvider } from '@/state/request-context';
import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site-header';
import './globals.css';
export const metadata: Metadata = { title: 'MatchCart — working solutions', description: 'Accessible router selection prototype with fictional catalog data.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body><a className="skip-link" href="#main">Skip to main content</a><RequestProvider><SiteHeader /><div className="demo-notice"><strong>Demo prototype.</strong> All stores, products, prices and technicians are fictional. No purchases or bookings.</div><main id="main" tabIndex={-1}><RouteFocus /><JourneyNav /><SessionNotice />{children}</main><footer><span><strong>MatchCart</strong> · A clearer path to getting connected.</span><span>Meta Global AI Developer Hackathon 2026 · Startup Track</span></footer></RequestProvider></body></html>; }

