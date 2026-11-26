export function safeReturnPath(value: unknown) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\s]/.test(value.split(/[?#]/, 1)[0])) return '/';
  const base = 'https://local.invalid';
  const url = new URL(value, base);
  return url.origin === base && !url.pathname.startsWith('//') ? url.pathname + url.search + url.hash : '/';
}
