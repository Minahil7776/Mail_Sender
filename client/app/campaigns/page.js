'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Shell from '../../components/Shell';
import { Badge, Progress, Empty } from '../../components/ui';
import { useToast } from '../../components/Toast';
import { api, fmtDate } from '../../lib/api';

export default function Campaigns() {
  const [list, setList] = useState(null); const [q, setQ] = useState(''); const [tab, setTab] = useState('all'); const toast = useToast();
  const load = () => api('/campaigns').then(setList);
  useEffect(() => { load(); const t = setInterval(load, 4000); return () => clearInterval(t); }, []);
  const act = async (id, a, msg, m = 'POST') => { try { await api(`/campaigns/${id}${a}`, m); toast(msg); load(); } catch (e) { toast(e.message, 'err'); } };
  const rows = (list || []).filter((c) => (tab === 'all' || c.status === tab) && (c.name + c.subject).toLowerCase().includes(q.toLowerCase()));
  return (
    <Shell title="Campaigns" subtitle="Create, schedule and monitor every send." action={<Link href="/campaigns/new" className="btn">New campaign</Link>}>
      <div className="card flush">
        <div className="card-h">
          <div className="tabs">{['all', 'sending', 'scheduled', 'paused', 'completed', 'draft'].map((t) => <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t}</button>)}</div>
          <input className="search" placeholder="Search campaigns" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {list && !rows.length ? <Empty title="No campaigns found" text="Try a different filter or create a new campaign." /> :
          <div className="table-wrap"><table><thead><tr><th>Campaign</th><th>Status</th><th>Progress</th><th>Sent / Failed</th><th>Scheduled</th><th /></tr></thead><tbody>
            {rows.map((c) => <tr key={c._id}>
              <td><Link href={`/campaigns/${c._id}`}><b>{c.name}</b></Link><div className="sub">{c.subject}</div></td>
              <td><Badge s={c.status} /></td><td><Progress c={c} /></td><td>{c.sent} / {c.failed}</td><td className="muted">{fmtDate(c.scheduledAt)}</td>
              <td><div className="row" style={{ justifyContent: 'flex-end' }}>
                {['draft', 'paused', 'scheduled'].includes(c.status) && <button className="btn sm" onClick={() => act(c._id, '/start', 'Campaign started')}>Send now</button>}
                {['sending', 'scheduled'].includes(c.status) && <button className="btn sm sec" onClick={() => act(c._id, '/pause', 'Campaign paused')}>Pause</button>}
                <button className="btn sm red" onClick={() => confirm('Delete this campaign?') && act(c._id, '', 'Campaign deleted', 'DELETE')}>Delete</button>
              </div></td></tr>)}
          </tbody></table></div>}
      </div>
    </Shell>
  );
}
