'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Shell from '../../../components/Shell';
import { Badge, Progress, Empty } from '../../../components/ui';
import { useToast } from '../../../components/Toast';
import { api, fmtDate } from '../../../lib/api';

export default function Detail() {
  const { id } = useParams(); const [c, setC] = useState(null); const toast = useToast();
  const load = () => api(`/campaigns/${id}`).then(setC).catch((e) => toast(e.message, 'err'));
  useEffect(() => { load(); const t = setInterval(load, 4000); return () => clearInterval(t); }, [id]);
  const act = async (a, msg) => { await api(`/campaigns/${id}${a}`, 'POST'); toast(msg); load(); };
  if (!c) return <Shell title="Campaign"><div className="muted">Loading...</div></Shell>;
  const pending = c.total - c.sent - c.failed;
  const stats = [['Recipients', c.total], ['Delivered', c.sent], ['Failed', c.failed], ['Remaining', pending]];
  return (
    <Shell title={c.name} subtitle={c.subject} action={<div className="row">
      {['draft', 'paused', 'scheduled'].includes(c.status) && <button className="btn" onClick={() => act('/start', 'Campaign started')}>Send now</button>}
      {['sending', 'scheduled'].includes(c.status) && <button className="btn sec" onClick={() => act('/pause', 'Campaign paused')}>Pause</button>}
      {c.failed > 0 && c.status === 'completed' && <button className="btn sec" onClick={() => act('/retry', 'Retrying failed emails')}>Retry failed</button>}
    </div>}>
      <Link href="/campaigns" className="crumb">&larr; All campaigns</Link>
      <div className="card"><div className="row between" style={{ marginBottom: 12 }}><Badge s={c.status} />
        <span className="muted">{c.scheduledAt ? `Scheduled: ${fmtDate(c.scheduledAt)}` : `Created: ${fmtDate(c.createdAt)}`}{c.completedAt && ` | Completed: ${fmtDate(c.completedAt)}`}</span></div>
        <Progress c={c} /></div>
      <div className="grid">{stats.map(([l, v]) => <div className="stat" key={l}><span>{l}</span><b>{v}</b></div>)}</div>
      <div className="card flush"><div className="card-h"><h2>Failed deliveries</h2><span className="muted">Showing up to 200</span></div>
        {c.recipients.length ? <div className="table-wrap"><table><thead><tr><th>Email</th><th>Reason</th></tr></thead><tbody>
          {c.recipients.map((r) => <tr key={r.email}><td>{r.email}</td><td className="muted">{r.error || 'Unknown error'}</td></tr>)}</tbody></table></div>
          : <Empty title="No failures" text="Every processed email so far was delivered." />}
      </div>
    </Shell>
  );
}
