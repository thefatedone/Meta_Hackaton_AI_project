import { Icon } from './icon';
import type { CompatibilityStatus } from '../compatibility/engine';
export function StatusBadge({status}:{status:CompatibilityStatus}){return <span className={'status-badge status-'+status.toLowerCase()}><Icon name={status==='COMPATIBLE'?'check':status==='INCOMPATIBLE'?'close':'help'}/><span className="status-label">TEST DATA · {status}</span></span>;}
