import Link from 'next/link';
export function SiteHeader() { return <header className="site-header"><Link className="brand" href="/">MatchCart<span>From problem to working solution.</span></Link><nav aria-label="Main navigation"><ul><li><Link href="/">AI Assistant</Link></li><li><Link href="/preferences">Preferences</Link></li><li><Link href="/comparison">Product Comparison</Link></li><li><Link href="/solution">Complete Solution</Link></li></ul></nav></header>; }

