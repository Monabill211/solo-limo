import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { BLOG_POSTS } from '@/app/lib/blog';

export function generateStaticParams() {
  return BLOG_POSTS.map(({ slug }) => ({ slug }));
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((article) => article.slug === slug);
  if (!post) notFound();

  const t = await getTranslations('Blog');

  return (
    <article className="mx-auto w-full max-w-3xl px-5 py-16">
      <Link href="/blog" className="font-bold text-gold hover:underline">{t('viewAll')}</Link>
      <div className="my-6 rounded-3xl border border-line bg-navy-light p-6 sm:p-10">
        <p className="font-bold text-gold">{t(`p${post.n}Category`)}</p>
        <h1 className="my-3 text-3xl font-extrabold text-white sm:text-4xl">{t(`p${post.n}Title`)}</h1>
        <p className="mb-6 leading-8 text-muted">{t(`p${post.n}Excerpt`)}</p>
        <div className="space-y-4 leading-8 text-white">
          {t(`p${post.n}Body`).split('\n').map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        </div>
        <Link href={post.service} className="mt-8 inline-block rounded-xl bg-gold px-5 py-3 font-bold text-navy">
          {t('viewService')}
        </Link>
      </div>
    </article>
  );
}
