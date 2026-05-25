export type PiScope = "username" | "payments" | "wallet_address";

export interface PiAuthResult {
  accessToken: string;
  user: { uid: string; username: string };
}

function getPi(): any {
  if (typeof window === "undefined") throw new Error("Pi SDK only available in browser");
  const pi = (window as any).Pi;
  if (!pi?.init) throw new Error("Pi SDK not loaded");
  return pi;
}

export async function initPiSdk(sandbox?: boolean): Promise<void> {
  const pi = getPi();
  if (pi.authenticate) return;
  await pi.init({ version: "2.0", sandbox: !!sandbox });
  if (!pi.authenticate) throw new Error("Pi SDK init failed");
}

export async function authenticatePi(
  scopes: PiScope[],
  onIncompletePayment?: (payment: any) => void
): Promise<PiAuthResult> {
  const pi = getPi();
  if (!pi.authenticate) throw new Error("Pi SDK not initialized, call initPiSdk first");
  const auth = await pi.authenticate(
    scopes,
    onIncompletePayment ?? (() => {})
  );
  return {
    accessToken: auth.accessToken,
    user: { uid: auth.user.uid, username: auth.user.username },
  };
}
