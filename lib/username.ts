export const usernamePattern = /^[a-z0-9](?:[a-z0-9_-]{1,30}[a-z0-9])?$/;

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}
