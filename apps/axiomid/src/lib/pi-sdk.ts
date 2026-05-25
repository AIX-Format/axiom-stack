function patchPostMessage(): void {
  if (typeof window === "undefined") return;
  try {
    const orig = window.postMessage.bind(window);
    (window as any).postMessage = function (
      message: unknown,
      targetOrigin: string,
      ...rest: [] | [Transferable[]]
    ) {
      if (
        typeof targetOrigin === "string" &&
        (targetOrigin === "https://sandbox.minepi.com" ||
          targetOrigin === "https://app-cdn.minepi.com")
      ) {
        return orig(message, "*", ...rest);
      }
      return orig(message, targetOrigin, ...rest);
    };
  } catch {}
}

let initPromise: Promise<void> | null = null;

export function ensurePiSdk(sandbox?: boolean): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Not in browser"));
  }

  if (sandbox) patchPostMessage();

  if (initPromise) return initPromise;

  const pi = (window as any)?.Pi;

  if (pi?.authenticate) {
    initPromise = Promise.resolve();
    return initPromise;
  }

  if (pi?.init) {
    initPromise = pi.init({ version: "2.0", sandbox: !!sandbox })
      .then(() => {}).catch(() => {});
    return initPromise;
  }

  initPromise = new Promise<void>((resolve) => {
    const script = document.createElement("script");
    script.src = "https://sdk.minepi.com/pi-sdk.js";
    script.async = true;
    if (sandbox) script.setAttribute("data-sandbox", "true");
    script.onload = () => {
      const wait = () => {
        const p = (window as any)?.Pi;
        if (p?.init) {
          p.init({ version: "2.0", sandbox: !!sandbox })
            .then(() => {
              if ((window as any)?.Pi?.authenticate) resolve();
              else setTimeout(wait, 300);
            })
            .catch(resolve);
        } else if (p?.authenticate) {
          resolve();
        } else {
          setTimeout(wait, 300);
        }
      };
      wait();
    };
    script.onerror = () => {
      console.error("Failed to load Pi SDK");
      resolve();
    };
    document.head.appendChild(script);
  });

  return initPromise;
}
