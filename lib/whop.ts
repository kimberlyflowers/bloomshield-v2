export const whopVariants = {
  pro: process.env.WHOP_PRO_VARIANT_ID,
  unlimited: process.env.WHOP_UNLIMITED_VARIANT_ID,
};

export function whopConfigured() {
  return !!(process.env.WHOP_API_KEY && process.env.WHOP_WEBHOOK_SECRET &&
    process.env.WHOP_ACCOUNT_ID && whopVariants.pro && whopVariants.unlimited);
}

export async function whopRequest(path: string, options?: RequestInit) {
  const base = process.env.WHOP_SANDBOX === 'true'
    ? 'https://sandbox-api.whop.com/api/v1' : 'https://api.whop.com/api/v1';
  return fetch(base + path, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.WHOP_API_KEY}`,
      'Content-Type': 'application/json',
      'Api-Version-Date': '2026-11-06',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(4000),
  });
}
