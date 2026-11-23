import type { Metadata } from 'next';
import AdminShell from '../components/admin/AdminShell';

export const metadata: Metadata = {
  title: 'سولو ليمو | لوحة التحكم',
  robots: { index: false, follow: false },
};

// TODO: حماية الداش بورد (التأكد إن المستخدم أدمن) لما نربط Supabase Auth

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}