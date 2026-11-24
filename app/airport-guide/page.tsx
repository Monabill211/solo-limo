'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { createClient } from '../lib/supabase/client';

const WHATSAPP_URL = 'https://wa.me/201044443195';

type Step = { title?: string; text: string; tip?: string };
type Guide = { slug: string; title: string; intro?: string; steps: Step[] };

const CHECKLIST = [1, 2, 3, 4, 5];
const TIPS = [1, 2, 3, 4];

const badgeClass =
  'inline-block rounded-full border border-gold/40 bg-gold/10 text-sm font-bold text-gold-light';

const ic = (path: React.ReactNode, size = 'h-6 w-6') => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={size}
  >
    {path}
  </svg>
);

const PLANE_LANDING = (
  <>
    <path d="M2 22h20" />
    <path d="M3.77 10.77 2 9l2-4.5 1.1.55c.55.28.9.84.9 1.46v1l2 1 2.5-5 1.5.75-1.7 7.45L18 14c1 .5 2 1.5 1.5 2.5s-1.5 1-2.5.5l-6-2z" />
  </>
);
const PLANE_TAKEOFF = (
  <>
    <path d="M2 22h20" />
    <path d="M6.36 17.4 4 17l-2-4 1.1-.55a2 2 0 0 1 1.8 0l.17.1a2 2 0 0 0 1.8 0L8 12 5 6l.9-.45a2 2 0 0 1 2.09.2l4.02 3a2 2 0 0 0 2.1.2l4.19-2.06a2.41 2.41 0 0 1 1.73-.17L21 7a1.4 1.4 0 0 1 .87 1.99l-.38.76c-.23.45-.6.82-1.07 1.04l-12.06 5.6a2 2 0 0 1-1.7 0" />
  </>
);
const PLANE = (
  <>
    <path d="M21 3L3 10.5l6.5 2.5L12 21l9-18z" />
    <path d="M9.5 13L21 3" />
  </>
);

const tabIcon = (slug: string) =>
  ic(slug === 'arrival' ? PLANE_LANDING : slug === 'departure' ? PLANE_TAKEOFF : PLANE, 'h-5 w-5');

// كل سطر = خطوة. الشكل الاختياري:  العنوان | الشرح | نصيحة
function parseSteps(content: string): Step[] {
  return content
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split('|').map((p) => p.trim());
      if (parts.length === 1) return { text: parts[0] };
      return { title: parts[0] || undefined, text: parts[1] ?? '', tip: parts[2] || undefined };
    });
}

export default function AirportGuidePage() {
  const t = useTranslations('AirportPage');
  const isAr = useLocale() === 'ar';

  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(0);
  const [checked, setChecked] = useState<number[]>([]);

  // الأدلة الجاهزة من ملفات اللغة (بتظهر لو الداتابيز فاضية أو فيها مشكلة)
  const fallbackGuides = (): Guide[] =>
    (
      [
        ['arrival', 'a'],
        ['departure', 'd'],
      ] as const
    ).map(([slug, prefix]) => {
      const steps: Step[] = [];
      for (let n = 1; n <= 6; n++) {
        const key = `${prefix}${n}`;
        if (!t.has(`${key}Title`)) continue;
        steps.push({
          title: t(`${key}Title`),
          text: t(`${key}Text`),
          tip: t.has(`${key}Tip`) ? t(`${key}Tip`) : undefined,
        });
      }
      return { slug, title: t(`tab_${slug}`), intro: t(`${slug}Intro`), steps };
    });

  useEffect(() => {
    let alive = true;

    createClient()
      .from('airport_guides')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (!alive) return;

        if (error || !data || data.length === 0) {
          setGuides(fallbackGuides());
        } else {
          setGuides(
            data.map((g: any) => ({
              slug: g.slug,
              title: isAr ? g.title_ar : g.title_en,
              intro: t.has(`${g.slug}Intro`) ? t(`${g.slug}Intro`) : undefined,
              steps: parseSteps(isAr ? g.content_ar : g.content_en),
            }))
          );
        }
        setActive(0);
        setLoading(false);
      });

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAr]);

  const toggleCheck = (n: number) =>
    setChecked((p) => (p.includes(n) ? p.filter((x) => x !== n) : [...p, n]));

  const current = guides[active];
  const count = guides.length;

  return (
    <div>
      {/* ---------- الهيدر ---------- */}
      <section
        className="relative isolate overflow-hidden border-b border-line"
        style={{ paddingBlock: '4.5rem 4rem' }}
      >
        <div className="absolute inset-0 -z-10 bg-linear-to-b from-navy-light to-navy" />
        <span className="pointer-events-none absolute -top-24 start-1/4 -z-10 h-80 w-80 rounded-full bg-gold/15 blur-3xl" />
        <span className="pointer-events-none absolute -bottom-24 end-1/4 -z-10 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />

        <div
          className="w-full max-w-3xl text-center"
          style={{ marginInline: 'auto', paddingInline: '1rem' }}
        >
          <span className={badgeClass} style={{ padding: '0.3rem 1rem', marginBlockEnd: '1.25rem' }}>
            {t('badge')}
          </span>

          <h1
            className="text-4xl font-extrabold leading-tight text-white md:text-5xl md:leading-tight"
            style={{ marginBlockEnd: '1rem' }}
          >
            {t.rich('title', {
              g: (chunks) => (
                <span className="bg-linear-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
                  {chunks}
                </span>
              ),
            })}
          </h1>

          <p className="text-lg leading-9 text-white/75">{t('intro')}</p>
        </div>
      </section>

      {/* ---------- قبل ما تسافر ---------- */}
      <section style={{ paddingBlock: '4rem 0' }}>
        <div
          className="w-full max-w-4xl"
          style={{ marginInline: 'auto', paddingInline: '1rem' }}
        >
          <div className="text-center" style={{ marginBlockEnd: '2rem' }}>
            <span className={badgeClass} style={{ padding: '0.25rem 0.9rem', marginBlockEnd: '0.9rem' }}>
              {t('checkBadge')}
            </span>
            <h2 className="text-3xl font-extrabold text-white md:text-4xl">{t('checkTitle')}</h2>
            <p className="text-muted" style={{ marginBlockStart: '0.6rem' }}>
              {t('checkSubtitle')}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {CHECKLIST.map((n) => {
              const on = checked.includes(n);
              return (
                <button
                  key={n}
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  onClick={() => toggleCheck(n)}
                  style={{ padding: '1rem 1.1rem' }}
                  className={`flex items-start gap-3 rounded-2xl border text-start transition duration-300 ${
                    on
                      ? 'border-gold bg-gold/10'
                      : 'border-line bg-navy-light hover:border-gold/60'
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-sm font-bold transition ${
                      on ? 'border-gold bg-gold text-navy' : 'border-line text-transparent'
                    }`}
                  >
                    ✓
                  </span>
                  <span className="flex flex-col gap-1">
                    <span className={`font-bold ${on ? 'text-gold-light' : 'text-white'}`}>
                      {t(`check${n}Title`)}
                    </span>
                    <span className="text-sm leading-7 text-muted">{t(`check${n}Text`)}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <p className="text-center text-sm text-muted" style={{ marginBlockStart: '1rem' }}>
            {t('checkProgress', { done: checked.length, total: CHECKLIST.length })}
          </p>
        </div>
      </section>

      {/* ---------- الخطوات (من الداتابيز) ---------- */}
      <section style={{ paddingBlock: '4.5rem' }}>
        <div
          className="w-full max-w-4xl"
          style={{ marginInline: 'auto', paddingInline: '1rem' }}
        >
          <div className="text-center" style={{ marginBlockEnd: '2rem' }}>
            <span className={badgeClass} style={{ padding: '0.25rem 0.9rem', marginBlockEnd: '0.9rem' }}>
              {t('stepsBadge')}
            </span>
            <h2 className="text-3xl font-extrabold text-white md:text-4xl">{t('stepsTitle')}</h2>
          </div>

          {loading ? (
            <div className="flex flex-col gap-5">
              <div className="mx-auto h-12 w-full max-w-md animate-pulse rounded-full border border-line bg-navy-light" />
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-2xl border border-line bg-navy-light"
                />
              ))}
            </div>
          ) : (
            <>
              {/* السويتش (بيظهر لو فيه أكتر من دليل) */}
              {count > 1 && (
                <div
                  role="tablist"
                  className="relative mx-auto grid w-full max-w-xl rounded-full border border-line bg-navy-light"
                  style={{
                    padding: '0.3rem',
                    marginBlockEnd: '3rem',
                    gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))`,
                  }}
                >
                  <span
                    className="absolute inset-y-[0.3rem] rounded-full bg-linear-to-br from-gold to-gold-light shadow-lg shadow-gold/40 transition-[inset-inline-start] duration-500 ease-[cubic-bezier(0.6,-0.2,0.3,1.3)]"
                    style={{
                      width: `calc((100% - 0.6rem) / ${count})`,
                      insetInlineStart: `calc(0.3rem + ${active} * (100% - 0.6rem) / ${count})`,
                    }}
                  />
                  {guides.map((g, i) => (
                    <button
                      key={g.slug}
                      type="button"
                      role="tab"
                      aria-selected={active === i}
                      onClick={() => setActive(i)}
                      style={{ padding: '0.65rem 0.5rem' }}
                      className={`relative z-10 flex items-center justify-center gap-2 truncate font-bold transition-colors duration-300 ${
                        active === i ? 'text-navy' : 'text-muted hover:text-white'
                      }`}
                    >
                      <span className="hidden sm:block">{tabIcon(g.slug)}</span>
                      <span className="truncate">{g.title}</span>
                    </button>
                  ))}
                </div>
              )}

              {current && (
                <div key={current.slug} className="animate-[fadeIn_0.5s_ease-out]">
                  {count === 1 && (
                    <h3 className="text-center text-2xl font-extrabold text-gold" style={{ marginBlockEnd: '1rem' }}>
                      {current.title}
                    </h3>
                  )}

                  {current.intro && (
                    <p
                      className="mx-auto max-w-2xl text-center leading-9 text-white/75"
                      style={{ marginBlockEnd: '2.5rem' }}
                    >
                      {current.intro}
                    </p>
                  )}

                  <ol className="relative flex flex-col gap-6">
                    <span className="absolute bottom-6 top-6 start-6 w-0.5 bg-linear-to-b from-gold via-gold/40 to-transparent" />

                    {current.steps.map((s, i) => (
                      <li key={i} className="relative flex gap-4 sm:gap-5">
                        <span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-gold bg-navy text-lg font-extrabold text-gold shadow-lg shadow-gold/20">
                          {i + 1}
                        </span>

                        <div
                          className="flex-1 rounded-2xl border border-line bg-navy-light transition duration-300 hover:-translate-y-0.5 hover:border-gold/60"
                          style={{ padding: '1.25rem 1.4rem' }}
                        >
                          {s.title ? (
                            <>
                              <h3
                                className="text-lg font-bold text-white md:text-xl"
                                style={{ marginBlockEnd: '0.5rem' }}
                              >
                                {s.title}
                              </h3>
                              {s.text && <p className="leading-8 text-muted">{s.text}</p>}
                            </>
                          ) : (
                            <p className="text-lg leading-8 text-white">{s.text}</p>
                          )}

                          {s.tip && (
                            <p
                              className="flex items-start gap-2.5 rounded-xl border border-gold/30 bg-gold/5 text-sm leading-7 text-gold-light"
                              style={{ padding: '0.7rem 0.9rem', marginBlockStart: '0.9rem' }}
                            >
                              {s.tip}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ---------- نصائح سريعة ---------- */}
      <section className="border-y border-line bg-navy-light/50" style={{ paddingBlock: '4.5rem' }}>
        <div
          className="w-full max-w-6xl"
          style={{ marginInline: 'auto', paddingInline: '1rem' }}
        >
          <div className="text-center" style={{ marginBlockEnd: '2.5rem' }}>
            <span className={badgeClass} style={{ padding: '0.25rem 0.9rem', marginBlockEnd: '0.9rem' }}>
              {t('tipsBadge')}
            </span>
            <h2 className="text-3xl font-extrabold text-white md:text-4xl">{t('tipsTitle')}</h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {TIPS.map((n) => (
              <div
                key={n}
                className="group rounded-3xl border border-line bg-navy transition duration-300 hover:-translate-y-1.5 hover:border-gold hover:shadow-xl hover:shadow-gold/10"
                style={{ padding: '1.6rem 1.4rem' }}
              >
    
                <h3 className="font-bold text-white" style={{ marginBlockEnd: '0.4rem' }}>
                  {t(`tip${n}Title`)}
                </h3>
                <p className="text-sm leading-7 text-muted">{t(`tip${n}Text`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- الاستقبال من سولو ليمو ---------- */}
      <section style={{ paddingBlock: '4.5rem' }}>
        <div
          className="w-full max-w-4xl"
          style={{ marginInline: 'auto', paddingInline: '1rem' }}
        >
          <div
            className="relative overflow-hidden rounded-3xl border border-gold/40 bg-linear-to-br from-navy-light to-navy text-center shadow-2xl shadow-black/40"
            style={{ padding: '3.25rem 1.5rem' }}
          >
            <span className="pointer-events-none absolute -top-20 start-1/2 h-60 w-60 -translate-x-1/2 rounded-full bg-gold/20 blur-3xl" />

            <span
              className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-gold/40 bg-gold/10 text-gold"
              style={{ marginBlockEnd: '1.25rem' }}
            >
              {ic(PLANE, 'h-8 w-8')}
            </span>

            <h2
              className="relative text-3xl font-extrabold text-white md:text-4xl"
              style={{ marginBlockEnd: '0.9rem' }}
            >
              {t('ctaTitle')}
            </h2>
            <p
              className="relative mx-auto max-w-xl leading-9 text-white/75"
              style={{ marginBlockEnd: '1.75rem' }}
            >
              {t('ctaText')}
            </p>

            <div className="relative flex flex-wrap justify-center gap-3">
              <Link
                href="/cars"
                style={{ padding: '0.85rem 2.2rem' }}
                className="rounded-xl bg-linear-to-br from-gold to-gold-light text-lg font-bold text-navy transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gold/40"
              >
                {t('ctaBook')}
              </Link>
              <a
                href={`${WHATSAPP_URL}?text=${encodeURIComponent(t('ctaWaMessage'))}`}
                target="_blank"
                rel="noreferrer"
                style={{ padding: '0.85rem 2.2rem' }}
                className="rounded-xl border border-white/25 bg-white/10 text-lg font-bold text-white transition hover:-translate-y-0.5 hover:border-[#25d366] hover:bg-[#25d366]"
              >
                {t('ctaWhatsapp')}
              </a>
            </div>
          </div>

          <p
            className="flex items-start justify-center gap-2 text-center text-sm leading-7 text-muted"
            style={{ marginBlockStart: '1.5rem' }}
          >
            <span aria-hidden>ℹ️</span>
            {t('disclaimer')}
          </p>
        </div>
      </section>
    </div>
  );
}