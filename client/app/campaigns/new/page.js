'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Shell from '../../../components/Shell';
import { useToast } from '../../../components/Toast';
import { api } from '../../../lib/api';

const DEFAULT_MESSAGE = '<p>Hello {{name}},</p><p>Write your message here.</p>';

function MessageEditor({ initialHtml, onChange }) {
  const editorRef = useRef(null);
  const selectionRef = useRef(null);
  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = initialHtml;
  }, [initialHtml]);
  const commands = [
    { command: 'bold', label: 'B', title: 'Bold' },
    { command: 'italic', label: 'I', title: 'Italic' },
    { command: 'underline', label: 'U', title: 'Underline' },
    { command: 'insertUnorderedList', label: '• List', title: 'Bulleted list' },
    { command: 'insertOrderedList', label: '1. List', title: 'Numbered list' },
  ];

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection?.rangeCount && editorRef.current?.contains(selection.anchorNode)) {
      selectionRef.current = selection.getRangeAt(0).cloneRange();
    }
  };

  const runCommand = (command) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    if (selectionRef.current) {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(selectionRef.current);
    }
    document.execCommand(command, false);
    saveSelection();
    onChange(editor.innerHTML);
  };

  return (
    <div className="message-editor">
      <div className="editor-toolbar" role="toolbar" aria-label="Message formatting">
        {commands.map(({ command, label, title }) => (
          <button
            key={command}
            type="button"
            className="editor-tool"
            title={title}
            aria-label={title}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => runCommand(command)}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        ref={editorRef}
        className="message-content"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label="Message content"
        aria-multiline="true"
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
        onBlur={saveSelection}
      />
    </div>
  );
}

export default function NewCampaign() {
  const [f, setF] = useState({ name: '', subject: '', html: DEFAULT_MESSAGE, useContacts: true, emails: '', scheduledAt: '', mode: 'now' });
  const [n, setN] = useState(0); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const router = useRouter(); const toast = useToast();
  useEffect(() => { api('/admin/stats').then((s) => setN(s.contacts)); }, []);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const extra = f.emails.split(/[\s,;]+/).filter((x) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x)).length;
  const total = (f.useContacts ? n : 0) + extra;
  const submit = async (e) => {
    e.preventDefault(); setErr('');
    try {
      if (f.mode === 'later' && !f.scheduledAt) throw new Error('Pick a date and time for the schedule');
      setBusy(true);
      const scheduledAt = f.mode === 'later' ? new Date(f.scheduledAt).toISOString() : '';
      const { id } = await api('/campaigns', 'POST', { ...f, scheduledAt });
      if (f.mode === 'now') await api(`/campaigns/${id}/start`, 'POST');
      toast(f.mode === 'now' ? 'Campaign started' : 'Campaign scheduled'); router.push(`/campaigns/${id}`);
    } catch (x) { setErr(x.message); setBusy(false); }
  };
  return (
    <Shell title="New campaign" subtitle="Compose your message, choose recipients and decide when to send.">
      <form className="cols" onSubmit={submit}>
        <div>
          {err && <div className="alert err">{err}</div>}
          <div className="card"><h2>1. Message</h2>
            <div className="two"><div><label>Campaign name</label><input value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. November offer" required /></div>
              <div><label>Subject line</label><input value={f.subject} onChange={(e) => set('subject', e.target.value)} required /></div></div>
            <label>Message</label><div className="hint">Type normally—press Enter for a new line. Use {'{{name}}'} to personalize the greeting.</div>
            <MessageEditor initialHtml={DEFAULT_MESSAGE} onChange={(html) => set('html', html)} />
          </div>
          <div className="card"><h2>2. Recipients</h2>
            <div className="row" style={{ marginBottom: 14 }}><input type="checkbox" checked={f.useContacts} onChange={(e) => set('useContacts', e.target.checked)} id="uc" />
              <label htmlFor="uc" style={{ margin: 0 }}>Include all saved contacts ({n})</label></div>
            <label>Additional emails</label><div className="hint">Separate with commas, spaces or new lines.</div>
            <textarea value={f.emails} onChange={(e) => set('emails', e.target.value)} style={{ minHeight: 80 }} />
            <div className="muted">{total} recipient{total === 1 ? '' : 's'} (duplicates are removed on save)</div>
          </div>
          <div className="card"><h2>3. Delivery</h2>
            <div className="opts">
              <div className={`opt ${f.mode === 'now' ? 'on' : ''}`} onClick={() => set('mode', 'now')}><b>Send now</b><span>Starts immediately</span></div>
              <div className={`opt ${f.mode === 'later' ? 'on' : ''}`} onClick={() => set('mode', 'later')}><b>Schedule</b><span>Pick a date and time</span></div>
            </div>
            {f.mode === 'later' && <><label>Send at</label><input type="datetime-local" value={f.scheduledAt} onChange={(e) => set('scheduledAt', e.target.value)} /></>}
            <button className="btn" disabled={busy}>{busy ? 'Saving...' : f.mode === 'now' ? 'Start sending' : 'Schedule campaign'}</button>
          </div>
        </div>
        <div className="card" style={{ position: 'sticky', top: 20 }}><h2>Live preview</h2>
          <div className="preview"><div className="meta"><b>{f.subject || 'Subject line'}</b></div>
            <iframe title="preview" sandbox="" srcDoc={`<body style="font-family:Arial,sans-serif;font-size:14px;color:#222;padding:16px">${f.html.replace(/{{name}}/g, 'Customer')}<p style="font-size:12px;color:#888">Unsubscribe</p></body>`} /></div>
        </div>
      </form>
    </Shell>
  );
}
