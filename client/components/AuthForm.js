'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../lib/api';

export default function AuthForm({ signup }) {
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false); const router = useRouter();
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { const d = await api(signup ? '/auth/signup' : '/auth/login', 'POST', f); localStorage.setItem('token', d.token); router.push('/dashboard'); }
    catch (x) { setErr(x.message); setBusy(false); }
  };
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <div className="auth-wrap">
      <div className="auth-side">
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>DispatchMail</div>
        <div><h2>Reach your customers with managed, trackable email campaigns.</h2>
          <ul><li>Schedule campaigns and track delivery live</li><li>Manage contacts and unsubscribes in one place</li><li>Daily sending limits handled automatically</li></ul></div>
        <div style={{ fontSize: 12 }}>Secure access for authorised staff only</div>
      </div>
      <div className="auth-form"><form className="auth" onSubmit={submit}>
        <h1>{signup ? 'Create your account' : 'Sign in'}</h1>
        <p className="muted" style={{ margin: '0 0 22px' }}>{signup ? 'Start managing your campaigns.' : 'Welcome back. Enter your details to continue.'}</p>
        {err && <div className="alert err">{err}</div>}
        {signup && <><label>Full name</label><input value={f.name} onChange={set('name')} required /></>}
        <label>Email</label><input type="email" value={f.email} onChange={set('email')} required />
        <label>Password</label><input type="password" value={f.password} onChange={set('password')} required minLength={6} />
        <button className="btn" disabled={busy}>{busy ? 'Please wait...' : signup ? 'Create account' : 'Sign in'}</button>
        <p className="muted" style={{ marginTop: 18 }}>{signup ? <>Already registered? <Link href="/login">Sign in</Link></> : <>New here? <Link href="/signup">Create an account</Link></>}</p>
      </form></div>
    </div>
  );
}
