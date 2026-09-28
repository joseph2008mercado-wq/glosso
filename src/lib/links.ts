export function isWebsiteUrl(value: string): boolean {
  if (!/^https?:\/\//i.test(value) || /[\s\\\u0000-\u001f\u007f]/.test(value)) return false;
  try {
    const url = new URL(value);
    return !!url.hostname && !url.username && !url.password;
  } catch { return false; }
}

export function isUpdateUrl(value: string): boolean {
  if (/^https:\/\//i.test(value)) return isWebsiteUrl(value);
  if (!/^\/(?!\/)/.test(value) || /[\s\\\u0000-\u001f\u007f]/.test(value)) return false;
  try { return new URL(value, 'https://glosso.org').origin === 'https://glosso.org'; }
  catch { return false; }
}
