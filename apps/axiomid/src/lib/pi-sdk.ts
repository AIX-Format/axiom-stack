function injectPiSdkScript(sandbox?: boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src*="pi-sdk.js"]');
    if (existing && !sandbox) {
      if ((window as any)?.Pi) return resolve();
      existing.remove();
    }
    if (existing && sandbox && existing.getAttribute("data-sandbox") !== "true") {
      delete (window as any).Pi;
      existing.remove();
    }

    const script = document.createElement("script");
    script.src = sandbox
      ? "https://sdk.minepi.com/pi-sdk.js?env=sandbox"
      : "https://sdk.minepi.com/pi-sdk.js";
    script.async = true;
    if (sandbox) script.setAttribute("data-sandbox", "true");
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Pi SDK"));
    document.head.appendChild(script);
  });
}

let initPromise: Promise<void> | null = null;

export function ensurePiSdk(sandbox?: boolean): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Not in browser"));
  }

  if (initPromise) return initPromise;

  initPromise = (async () => {
    const existing = (window as any)?.Pi;

    if (existing && existing.init) {
      await existing.init({ version: "2.0", sandbox: !!sandbox });
      return;
    }

    await injectPiSdkScript(sandbox);

    for (let attempt = 0; attempt < 10; attempt++) {
      const pi = (window as any)?.Pi;
      if (pi?.init) {
        try {
          await pi.init({ version: "2.0", sandbox: !!sandbox });
        } catch {
          // init may have already been called
        }
        if ((window as any)?.Pi?.authenticate) return;
      }
      await new Promise((r) => setTimeout(r, 200));
    }

    throw new Error("Pi SDK failed to initialize");
  })();

  return initPromise;
}
