'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Shell from '../../components/Shell';
import { useToast } from '../../components/Toast';
import { api, fmtDate } from '../../lib/api';

export default function Admin() {
  const [users, setUsers] = useState(null); const [q, setQ] = useState(''); const router = useRouter(); const toast = useToast();
  const load = () => api('/admin/users').then(setUsers).catch(() => router.push('/dashboard'));
  useEffect(() => { load(); }, []);
  const rows = (users || []).filter((u) => (u.name + u.email).toLowerCase().includes(q.toLowerCase()));
  return (
    <Shell title="Users" subtitle="Manage who can access the platform.">
      <div className="card flush">
        <div className="card-h"><h2>{users?.length ?? 0} accounts</h2><input className="search" placeholder="Search users" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="table-wrap"><table><thead><tr><th>User</th><th>Role</th><th>Campaigns</th><th>Emails sent</th><th>Joined</th><th>Status</th><th /></tr></thead><tbody>
          {rows.map((u) => <tr key={u._id}><td><b>{u.name}</b><div className="sub">{u.email}</div></td><td>{u.role === 'superadmin' ? 'Super admin' : 'Member'}</td><td>{u.campaigns}</td><td>{u.sent}</td><td className="muted">{fmtDate(u.createdAt)}</td>
            <td><span className={`badge ${u.active ? 'completed' : 'paused'}`}>{u.active ? 'Active' : 'Disabled'}</span></td>
            <td>{u.role !== 'superadmin' && <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button className="btn sm sec" onClick={() => api(`/admin/users/${u._id}/toggle`, 'POST').then(() => { toast(u.active ? 'User disabled' : 'User enabled'); load(); })}>{u.active ? 'Disable' : 'Enable'}</button>
              <button className="btn sm red" onClick={() => confirm('Delete this user and all their data?') && api(`/admin/users/${u._id}`, 'DELETE').then(() => { toast('User deleted'); load(); })}>Delete</button></div>}</td></tr>)}
        </tbody></table></div>
      </div>
    </Shell>
  );
}
