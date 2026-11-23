'use client';

// بيخفي هيدر وفوتر الموقع جوه صفحات الداش بورد (/admin)

import { usePathname } from 'next/navigation';

export default function SiteShell({
  header,
  footer,
  children,
}: {
  header: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const isAdmin = usePathname().startsWith('/admin');

  if (isAdmin) return <>{children}</>;

  return (
    <>
      {header}
      <main className="flex-1">{children}</main>
      {footer}
    </>
  );
}