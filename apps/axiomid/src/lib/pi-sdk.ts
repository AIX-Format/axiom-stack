import { PiSdkBase } from "@pinetwork/pi-sdk-js";

export type { PiUser, PaymentData } from "@pinetwork/pi-sdk-js";

PiSdkBase.paymentBasePath = "api/pi/payment";

export interface PiAuthResult {
  accessToken: string;
  user: { uid: string; username: string; name: string };
}

export function getPiSdk(): PiSdkBase {
  return new PiSdkBase();
}

function shouldUseSandbox(): boolean {
  if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_PI_SANDBOX === "true") return true;
  if (typeof window !== "undefined") {
    if (new URLSearchParams(window.location.search).get("sandbox") === "true") return true;
    try {
      if (window.self !== window.top && document.referrer.includes("sandbox.minepi.com")) return true;
    } catch {}
  }
  return false;
}

export async function connectPi(): Promise<PiAuthResult> {
  const sandbox = shouldUseSandbox();

  if (sandbox && typeof window !== "undefined") {
    (window as any).RAILS_ENV = "development";
  }

  const pi = getPiSdk();
  await pi.connect();

  if (!PiSdkBase.connected || !PiSdkBase.user || !PiSdkBase.accessToken) {
    throw new Error("Pi SDK authentication failed");
  }

  return {
    accessToken: PiSdkBase.accessToken,
    user: {
      uid: PiSdkBase.user.uid ?? PiSdkBase.user.name,
      username: PiSdkBase.user.username ?? PiSdkBase.user.name,
      name: PiSdkBase.user.name,
    },
  };
}

export function isPiSdkLoaded(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window as any).Pi?.init;
}

export function isPiSdkConnected(): boolean {
  return PiSdkBase.connected;
}
