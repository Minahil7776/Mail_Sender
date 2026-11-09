'use client';
import { useEffect, useState } from 'react';
import Shell from '../../components/Shell';
import { Empty } from '../../components/ui';
import { useToast } from '../../components/Toast';
import { api } from '../../lib/api';

export default function Contacts() {
  const [list, setList] = useState(null); const [text, setText] = useState(''); const [q, setQ] = useState(''); const [open, setOpen] = useState(false); const toast = useToast();
  const load = () => api('/contacts').then(setList);
  useEffect(() => { load(); }, []);
  const imp = async () => { const r = await api('/contacts/import', 'POST', { text }); toast(`${r.added} added, ${r.skipped} skipped`); setText(''); setOpen(false); load(); };
  const rows = (list || []).filter((c) => (c.name + c.email).toLowerCase().includes(q.toLowerCase()));
  return (
    <Shell title="Contacts" subtitle={list ? `${list.length} saved contacts` : ''} action={<button className="btn" onClick={() => setOpen(!open)}>{open ? 'Close' : 'Import contacts'}</button>}>
      {open && <div className="card"><h2>Import contacts</h2><div className="hint">One per line as <code>Name,email@example.com</code>, or just the email. Duplicates and invalid addresses are skipped.</div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} />
        <div className="row"><button className="btn" onClick={imp} disabled={!text.trim()}>Import</button>
          <label className="btn sec" style={{ margin: 0 }}>Upload CSV<input type="file" accept=".csv,.txt" hidden onChange={(e) => e.target.files[0]?.text().then(setText)} /></label></div></div>}
      <div className="card flush">
        <div className="card-h"><h2>All contacts</h2><input className="search" placeholder="Search by name or email" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        {list && !rows.length ? <Empty title="No contacts" text="Import a list to get started." /> :
          <div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th /></tr></thead><tbody>
            {rows.slice(0, 500).map((c) => <tr key={c._id}><td>{c.name || <span className="muted">-</span>}</td><td>{c.email}</td>
              <td style={{ textAlign: 'right' }}><button className="btn sm red" onClick={() => api(`/contacts/${c._id}`, 'DELETE').then(load)}>Remove</button></td></tr>)}
          </tbody></table></div>}
        {rows.length > 500 && <div className="empty">Showing first 500 of {rows.length}. Use search to narrow down.</div>}
      </div>
    </Shell>
  );
}
