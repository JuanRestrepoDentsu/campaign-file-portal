'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

type CompletePasswordResponse = {
  authenticated?: boolean;
  message?: string;
  errors?: {
    password?: string[];
    confirmation?: string[];
  };
};

export default function CompletePasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(
        '/api/auth/complete-password',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            password,
            confirmation,
          }),
        },
      );

      const data =
        (await response.json()) as CompletePasswordResponse;

      if (!response.ok) {
        const fieldError =
          data.errors?.password?.[0] ??
          data.errors?.confirmation?.[0];

        setError(
          fieldError ??
            data.message ??
            'No fue posible guardar la contraseña.',
        );

        return;
      }

      router.push('/portal');
      router.refresh();
    } catch {
      setError('No fue posible comunicarse con el servidor.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-5 rounded-2xl border bg-white p-8 shadow-sm"
      >
        <div>
          <h1 className="text-2xl font-semibold">
            Crea tu contraseña
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Debes reemplazar la contraseña temporal antes de continuar.
          </p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-sm font-medium"
          >
            Nueva contraseña
          </label>

          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="confirmation"
            className="text-sm font-medium"
          >
            Confirmar contraseña
          </label>

          <input
            id="confirmation"
            type="password"
            autoComplete="new-password"
            required
            value={confirmation}
            onChange={(event) =>
              setConfirmation(event.target.value)
            }
            className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2"
          />
        </div>

        <p className="text-xs text-slate-500">
          Mínimo 10 caracteres, incluyendo mayúscula, minúscula,
          número y carácter especial.
        </p>

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-slate-900 px-4 py-2.5 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading
            ? 'Guardando…'
            : 'Establecer contraseña'}
        </button>
      </form>
    </main>
  );
}