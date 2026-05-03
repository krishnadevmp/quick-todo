/** Generate a UUID v4 using the Web Crypto API (available in all modern browsers and Node 15+) */
export function generateId(): string {
  return crypto.randomUUID();
}
