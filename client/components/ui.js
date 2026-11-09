export const Badge = ({ s }) => <span className={`badge ${s}`}>{s}</span>;
export const Progress = ({ c }) => {
  const p = c.total ? Math.round(((c.sent + c.failed) / c.total) * 100) : 0;
  return <div><div className={`bar ${p === 100 ? 'done' : ''}`}><i style={{ width: `${p}%` }} /></div><span className="muted">{p}% &middot; {c.sent + c.failed} of {c.total}</span></div>;
};
export const Empty = ({ title, text, children }) => <div className="empty"><b>{title}</b>{text}{children && <div style={{ marginTop: 14 }}>{children}</div>}</div>;
