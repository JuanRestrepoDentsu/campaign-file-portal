import Link from 'next/link';

import { LogoutButton } from '@/components/auth/logout-button';

type PrivateHeaderProps = {
  userName: string;
  isAdmin?: boolean;
};

export function PrivateHeader({
  userName,
  isAdmin = false,
}: PrivateHeaderProps) {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-6">
          <Link
            href="/portal"
            className="text-lg font-semibold"
          >
            Campaign Portal
          </Link>

          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/portal"
              className="text-slate-600 hover:text-slate-950"
            >
              Inicio
            </Link>

            {isAdmin && (
              <Link
                href="/admin"
                className="text-slate-600 hover:text-slate-950"
              >
                Administración
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600">
            {userName}
          </span>

          <LogoutButton />
        </div>
      </div>
    </header>
  );
}