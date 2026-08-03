import Link from 'next/link';
import type { ReactNode } from 'react';

type QuickActionCardProps = {
  title: string;
  description: string;
  href: string;
  icon?: ReactNode;
  disabled?: boolean;
};

export function QuickActionCard({
  title,
  description,
  href,
  icon,
  disabled = false,
}: QuickActionCardProps) {
  if (disabled) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 opacity-70">
        <div className="flex items-start gap-4">
          {icon && (
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-600">
              {icon}
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-800">
                {title}
              </h3>

              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
                Próximamente
              </span>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              {description}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm"
    >
      <div className="flex items-start gap-4">
        {icon && (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            {icon}
          </div>
        )}

        <div>
          <h3 className="font-semibold text-slate-900">
            {title}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
}