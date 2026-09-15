export function Logo({ compact = false }: { compact?: boolean }) {
  return <div className="logo-wrap"><div className="logo-mark"><span>O</span></div>{!compact && <div><strong>ORIGIN</strong><small>HUB</small></div>}</div>;
}
