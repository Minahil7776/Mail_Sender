'use client';
import { createContext, useCallback, useContext, useState } from 'react';
const Ctx = createContext(() => {});
export const useToast = () => useContext(Ctx);
export function ToastProvider({ children }) {
  const [list, setList] = useState([]);
  const push = useCallback((msg, type = 'ok') => {
    const id = Math.random(); setList((l) => [...l, { id, msg, type }]);
    setTimeout(() => setList((l) => l.filter((x) => x.id !== id)), 3500);
  }, []);
  return <Ctx.Provider value={push}>{children}<div className="toasts">{list.map((t) => <div key={t.id} className={`toast ${t.type}`}>{t.msg}</div>)}</div></Ctx.Provider>;
}
