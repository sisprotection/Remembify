/**
 * In-App Purchases (iOS / Android) via RevenueCat.
 *
 * On web, this module is a no-op — Stripe handles web purchases.
 * On native iOS/Android, it bridges to StoreKit / Play Billing via RevenueCat.
 *
 * Apple REQUIRES IAP for digital goods consumed inside the app
 * (Plus/Pro subscriptions, Embers gem packs). Stripe is not allowed there.
 *
 * Setup (you do this once):
 *   1. Create a RevenueCat account → New project → add iOS app.
 *   2. Paste the RevenueCat *Apple* public SDK key into VITE_REVENUECAT_IOS_KEY.
 *   3. In App Store Connect, create your products (subscriptions + consumables)
 *      and import them into RevenueCat as Entitlements:
 *        - "plus"     → monthly + annual Plus subscription
 *        - "pro"      → monthly + annual Pro subscription
 *        - "lifetime" → one-time non-consumable
 *        - "embers_*" → consumable gem packs (small/medium/large/etc.)
 *   4. In RevenueCat → Project Settings → Webhooks, point to
 *        https://rememberfi.lovable.app/api/public/payments/revenuecat
 *      with the shared secret you set as REVENUECAT_WEBHOOK_SECRET.
 */

import { Capacitor } from "@capacitor/core";

let initialized = false;
let purchasesModule: typeof import("@revenuecat/purchases-capacitor") | null = null;

export const isNativeIAP = () =>
  typeof window !== "undefined" &&
  Capacitor.isNativePlatform() &&
  (Capacitor.getPlatform() === "ios" || Capacitor.getPlatform() === "android");

async function loadPurchases() {
  if (!purchasesModule) {
    purchasesModule = await import("@revenuecat/purchases-capacitor");
  }
  return purchasesModule;
}

export async function initIAP(appUserId: string) {
  if (!isNativeIAP() || initialized) return;
  const { Purchases, LOG_LEVEL } = await loadPurchases();

  const apiKey =
    Capacitor.getPlatform() === "ios"
      ? (import.meta.env.VITE_REVENUECAT_IOS_KEY as string | undefined)
      : (import.meta.env.VITE_REVENUECAT_ANDROID_KEY as string | undefined);

  if (!apiKey) {
    console.warn("[IAP] RevenueCat API key missing — IAP disabled");
    return;
  }

  await Purchases.setLogLevel({ level: LOG_LEVEL.WARN });
  await Purchases.configure({ apiKey, appUserID: appUserId });
  initialized = true;
}

export async function getOfferings() {
  if (!isNativeIAP()) return null;
  const { Purchases } = await loadPurchases();
  const { current } = await Purchases.getOfferings();
  return current ?? null;
}

export async function purchasePackage(pkgIdentifier: string) {
  if (!isNativeIAP()) throw new Error("IAP only available on iOS/Android");
  const { Purchases } = await loadPurchases();
  const offerings = await Purchases.getOfferings();
  const pkg = offerings.current?.availablePackages.find((p) => p.identifier === pkgIdentifier);
  if (!pkg) throw new Error(`Package not found: ${pkgIdentifier}`);
  return Purchases.purchasePackage({ aPackage: pkg });
}

export async function restorePurchases() {
  if (!isNativeIAP()) return null;
  const { Purchases } = await loadPurchases();
  return Purchases.restorePurchases();
}

export async function getCustomerInfo() {
  if (!isNativeIAP()) return null;
  const { Purchases } = await loadPurchases();
  return Purchases.getCustomerInfo();
}
