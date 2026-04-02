// TODO(GST-26): Confirm correct affiliate URL for "subscriptions" partner (currently strompris.no — awaiting CEO confirmation)
import affiliatesData from "@/config/affiliates.json";

export type AffiliateKey = "electricity" | "loans" | "mobile" | "insurance" | "subscriptions" | "savings" | "credit_card" | "food";

export interface Affiliate {
  partnerName: string;
  url: string;
  cta: string;
  category: string;
}

export type AffiliatesConfig = Record<AffiliateKey, Affiliate>;

export const affiliates: AffiliatesConfig =
  affiliatesData as AffiliatesConfig;

export function getAffiliate(key: string | null): Affiliate | null {
  if (!key || !(key in affiliates)) return null;
  return affiliates[key as AffiliateKey];
}
