import { cookies } from 'next/headers';
import { safeReturnPath } from '../lib/return-path';
import LoginForm from './LoginForm';

export default async function LoginPage({ searchParams }: {
  searchParams: Promise<{ mode?: string; next?: string; error?: string }>;
}) {
  const { mode, next, error } = await searchParams;
  const nextPath = safeReturnPath(next);
  const confirmationFailed = error === 'confirmation';
  const confirmationError = confirmationFailed ? (await cookies()).get('solo-confirmation-error')?.value : undefined;
  return <LoginForm key={JSON.stringify([mode, nextPath, error, confirmationError])} signup={mode === 'signup'} nextPath={nextPath} confirmationFailed={confirmationFailed} confirmationError={confirmationError} />;
}
