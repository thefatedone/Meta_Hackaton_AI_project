'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from './icon';
const links=[['/','AI Assistant'],['/preferences','Preferences'],['/comparison','Product Comparison'],['/solution','Complete Solution']];
export function SiteHeader(){const pathname=usePathname();return <header className="site-header"><div className="header-inner"><Link className="brand" href="/"><span className="brand-symbol"><Icon name="cart"/></span><span>MatchCart<span className="brand-caption">From problem to working solution.</span></span></Link><nav aria-label="Main navigation"><ul>{links.map(([href,label])=><li key={href}><Link href={href} aria-current={pathname===href?'page':undefined}>{label}</Link></li>)}</ul></nav></div></header>;}
