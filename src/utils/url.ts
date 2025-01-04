export function getBaseUrl() {
  if (typeof window !== "undefined") return window.location.origin;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export const getActivityDetailURL = ({
  id,
  version,
}: {
  id: number;
  version: number;
}) => `${getBaseUrl()}/volunteer/activity/detail/${id}?v=${version}`;
