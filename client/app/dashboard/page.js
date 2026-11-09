'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Shell from '../../components/Shell';
import { Badge, Progress, Empty } from '../../components/ui';
import { api, fmtDate } from '../../lib/api';

export default function Dashboard() {
  const [s, setS] = useState({}); const [c, setC] = useState(null);
  useEffect(() => {
    const load = () => { api('/admin/stats').then(setS).catch(() => {}); api('/campaigns').then(setC).catch(() => {}); };
    load(); const t = setInterval(load, 5000); return () => clearInterval(t);
  }, []);
  const rate = s.sent + s.failed ? Math.round((s.sent / (s.sent + s.failed)) * 100) : null;
  const stats = [['Emails delivered', s.sent, rate !== null ? `${rate}% delivery rate` : 'No sends yet'], ['Failed', s.failed, 'Can be retried per campaign'], ['Active campaigns', s.active, 'Sending or scheduled'], ['Contacts', s.contacts, `${s.campaigns ?? 0} campaigns total`]];
  const live = (c || []).filter((x) => ['sending', 'scheduled'].includes(x.status));
  return (
    <Shell title="Overview" subtitle="Live summary of your email activity." action={<Link href="/campaigns/new" className="btn">New campaign</Link>}>
      <div className="grid">{stats.map(([l, v, n]) => <div className="stat" key={l}><span>{l}</span><b>{v ?? '-'}</b><small>{n}</small></div>)}</div>
      {live.length > 0 && <div className="card flush"><div className="card-h"><h2>In progress</h2></div><div className="table-wrap"><table><tbody>
        {live.map((x) => <tr key={x._id}><td><Link href={`/campaigns/${x._id}`}><b>{x.name}</b></Link><div className="sub">{x.status === 'scheduled' ? `Starts ${fmtDate(x.scheduledAt)}` : x.subject}</div></td><td><Badge s={x.status} /></td><td><Progress c={x} /></td></tr>)}
      </tbody></table></div></div>}
      <div className="card flush"><div className="card-h"><h2>Recent campaigns</h2><Link href="/campaigns" className="btn sec sm">View all</Link></div>
        {c && !c.length ? <Empty title="No campaigns yet" text="Create your first campaign to start sending."><Link href="/campaigns/new" className="btn">New campaign</Link></Empty> :
          <div className="table-wrap"><table><thead><tr><th>Campaign</th><th>Status</th><th>Progress</th><th>Created</th></tr></thead><tbody>
            {(c || []).slice(0, 6).map((x) => <tr key={x._id}><td><Link href={`/campaigns/${x._id}`}><b>{x.name}</b></Link></td><td><Badge s={x.status} /></td><td><Progress c={x} /></td><td className="muted">{fmtDate(x.createdAt)}</td></tr>)}
          </tbody></table></div>}
      </div>
    </Shell>
  );
}
