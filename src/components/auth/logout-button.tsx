'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } finally {
      router.replace('/login');
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      disabled={isLoading}
      onClick={handleLogout}
      className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50"
    >
      {isLoading
        ? 'Cerrando sesión…'
        : 'Cerrar sesión'}
    </button>
  );
}