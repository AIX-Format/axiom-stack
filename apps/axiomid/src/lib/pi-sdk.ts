export function ensurePiSdk(sandbox?: boolean): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Not in browser"));
  }

  const pi = (window as any)?.Pi;

  if (pi?.authenticate) {
    return Promise.resolve();
  }

  if (pi?.init) {
    return pi.init({ version: "2.0", sandbox: !!sandbox }).catch(() => {});
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = sandbox
      ? "https://sdk.minepi.com/pi-sdk.js?env=sandbox"
      : "https://sdk.minepi.com/pi-sdk.js";
    script.async = true;
    if (sandbox) script.setAttribute("data-sandbox", "true");
    script.onload = () => {
      const tryInit = () => {
        const p = (window as any)?.Pi;
        if (p?.init) {
          p.init({ version: "2.0", sandbox: !!sandbox }).then(() => {
            if ((window as any)?.Pi?.authenticate) resolve();
            else setTimeout(tryInit, 300);
          }).catch(resolve);
        } else if (p?.authenticate) {
          resolve();
        } else {
          setTimeout(tryInit, 300);
        }
      };
      tryInit();
    };
    script.onerror = () => reject(new Error("Failed to load Pi SDK"));
    document.head.appendChild(script);
  });
}
