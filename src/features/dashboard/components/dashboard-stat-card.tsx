import Link from 'next/link';
import type { ReactNode } from 'react';

type DashboardStatCardProps = {
  title: string;
  value: number;
  description: string;
  href?: string;
  icon?: ReactNode;
};

export function DashboardStatCard({
  title,
  value,
  description,
  href,
  icon,
}: DashboardStatCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-600">
            {title}
          </p>

          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {value.toLocaleString('es-CO')}
          </p>
        </div>

        {icon && (
          <div className="flex size-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            {icon}
          </div>
        )}
      </div>

      <p className="mt-3 text-sm text-slate-500">
        {description}
      </p>

      {href && (
        <p className="mt-5 text-sm font-medium text-slate-950">
          Administrar →
        </p>
      )}
    </>
  );

  const className =
    'block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md';

  if (href) {
    return (
      <Link
        href={href}
        className={className}
      >
        {content}
      </Link>
    );
  }

  return (
    <article className={className}>
      {content}
    </article>
  );
}