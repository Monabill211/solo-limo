'use client';

export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <section lang="ar" dir="rtl" className="space-y-4 rounded-2xl border border-line bg-navy-light p-6">
      <p role="alert" className="font-bold text-white">تعذّر تحميل لوحة التحكم مؤقتاً.</p>
      <button type="button" onClick={reset} className="rounded-xl bg-gold px-5 py-2 font-bold text-navy">
        حاول مرة تانية
      </button>
    </section>
  );
}
