import { env } from "~/env.mjs";

const BASE_URL = `https://${env.PUBLIC_DOMAIN}`;
export const getActivityDetailURL = (id: number) =>
  `${BASE_URL}/volunteeractivity/detail/${id}`;
