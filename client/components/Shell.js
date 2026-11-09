'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '../lib/api';

export default function Shell({ title, subtitle, action, children }) {
  const [user, setUser] = useState(null);
  const path = usePathname(); const router = useRouter();
  useEffect(() => { api('/auth/me').then(setUser).catch(() => router.push('/login')); }, []);
  if (!user) return <div className="center muted">Loading...</div>;
  const nav = [['/dashboard', 'Overview'], ['/campaigns', 'Campaigns'], ['/contacts', 'Contacts']];
  return (
    <div className="layout">
      <aside className="side">
        <div className="brand">DispatchMail<small>Mail operations</small></div>
        <div className="nav-h">Workspace</div>
        {nav.map(([h, l]) => <Link key={h} href={h} className={path.startsWith(h) ? 'active' : ''}>{l}</Link>)}
        {user.role === 'superadmin' && <><div className="nav-h">Administration</div>
          <Link href="/admin" className={path.startsWith('/admin') ? 'active' : ''}>Users</Link></>}
        <div className="grow" />
        <div className="user"><div className="avatar">{user.name?.[0]?.toUpperCase()}</div>
          <div><b>{user.name}</b><span>{user.role === 'superadmin' ? 'Super admin' : 'Member'}</span></div></div>
        <button className="signout" onClick={() => { localStorage.clear(); router.push('/login'); }}>Sign out</button>
      </aside>
      <main className="main">
        <div className="top"><div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{action}</div>
        {children}
      </main>
    </div>
  );
}
