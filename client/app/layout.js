import './globals.css';
import { ToastProvider } from '../components/Toast';
export const metadata = { title: 'DispatchMail', description: 'Bulk mail management' };
export default function RootLayout({ children }) { return <html lang="en"><body><ToastProvider>{children}</ToastProvider></body></html>; }
