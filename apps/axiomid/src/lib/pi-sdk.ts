let _parentProxy: Window | null = null;

function makeParentProxy(target: Window): Window {
  if (!_parentProxy) {
    _parentProxy = new Proxy(target, {
      get(t, prop, receiver) {
        if (prop === "postMessage") {
          return function (
            message: unknown,
            targetOrigin: string,
            ...rest: [] | [Transferable[]]
          ) {
            if (
              typeof targetOrigin === "string" &&
              (targetOrigin === "https://sandbox.minepi.com" || targetOrigin === "https://app-cdn.minepi.com")
            ) {
              return t.postMessage(message, "*", ...rest);
            }
            return t.postMessage(message, targetOrigin, ...rest);
          };
        }
        // Avoid using receiver for cross-origin targets to prevent SecurityError
        try {
          const value = (t as any)[prop];
          if (typeof value === "function") {
            return value.bind(t);
          }
          return value;
        } catch {
          return Reflect.get(t, prop);
        }
      },
    });
  }
  return _parentProxy;
}

let _origPostMessage: typeof window.postMessage | null = null;

function patchPostMessageForSandbox(): void {
  if (typeof window === "undefined") return;

  // Strategy 1: Override window.postMessage directly.
  // Window.prototype.postMessage is {writable: true, configurable: false},
  // so assignment creates an own property on window that shadows the
  // prototype.  Works when window.parent === window (top-level page with
  // no extension override) because window.parent.postMessage resolves to
  // window.postMessage at call time.
  try {
    _origPostMessage = window.postMessage.bind(window);
    (window as any).postMessage = function (
      message: unknown,
      targetOrigin: string,
      ...rest: [] | [Transferable[]]
    ) {
      if (
        typeof targetOrigin === "string" &&
        (targetOrigin === "https://sandbox.minepi.com" || targetOrigin === "https://app-cdn.minepi.com")
      ) {
        return _origPostMessage!(message, "*", ...rest);
      }
      return _origPostMessage!(message, targetOrigin, ...rest);
    };
    return;
  } catch {
    // Fall through
  }

  // Strategy 2: Override window.parent at the instance level.
  // Used when assignment to window.postMessage is blocked (unlikely) or
  // when the extension has defined window.parent as an own property that
  // returns a non-window object.
  const desc = Object.getOwnPropertyDescriptor(Window.prototype, "parent");
  const origGet = desc?.get;
  if (!origGet) return;

  try {
    const own = Object.getOwnPropertyDescriptor(window, "parent");
    if (!own || own.configurable) {
      Object.defineProperty(window, "parent", {
        get() {
          const parent = origGet.call(this);
          if (!parent) return parent;
          return makeParentProxy(parent as Window);
        },
        configurable: true,
        enumerable: true,
      });
      return;
    }
  } catch {
    // Fall through
  }

  // Strategy 3: Prototype-level override (last resort).
  if (!desc?.configurable) return;
  Object.defineProperty(Window.prototype, "parent", {
    get() {
      const parent = origGet.call(this);
      if (!parent) return parent;
      return makeParentProxy(parent as Window);
    },
    configurable: true,
  });
}

function injectPiSdkScript(sandbox?: boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    // Append query parameter to force browser to load a clean script context in sandbox mode
    script.src = sandbox 
      ? "https://sdk.minepi.com/pi-sdk.js?env=sandbox" 
      : "https://sdk.minepi.com/pi-sdk.js";
    script.async = true;
    if (sandbox) {
      script.setAttribute("data-sandbox", "true");
    }
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Pi SDK"));
    document.body.appendChild(script);
  });
}

async function loadFromCdnWithRetry(sandbox?: boolean): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt++) {
    await injectPiSdkScript(sandbox);
    if ((window as any)?.Pi?.authenticate) {
      try {
        (window as any).Pi.init({ version: "2.0", sandbox: !!sandbox });
      } catch {
        // init may already have been called; safe to ignore
      }
      return;
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error("Pi SDK failed to load after 3 attempts");
}

export function ensurePiSdk(sandbox?: boolean): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Not in browser"));
  }
  patchPostMessageForSandbox();

  if (sandbox) {
    // If sandbox mode is requested, check if the pre-existing script tag has data-sandbox="true".
    // If it doesn't, it was loaded in production mode by the parent window. We must remove it
    // and delete window.Pi to force a clean sandbox-mode script reload.
    const existingScript = document.querySelector('script[src*="pi-sdk.js"]');
    const isSandboxScript = existingScript?.getAttribute("data-sandbox") === "true";

    if ((window as any)?.Pi && !isSandboxScript) {
      console.log("[Pi SDK] Deleting pre-existing production SDK to force sandbox reload...");
      try {
        delete (window as any).Pi;
        if (existingScript) {
          existingScript.remove();
        }
      } catch (e) {
        console.warn("[Pi SDK] Failed to clear pre-existing SDK:", e);
      }
    }
  }

  if ((window as any)?.Pi?.authenticate) {
    try {
      (window as any).Pi.init({ version: "2.0", sandbox: !!sandbox });
    } catch {
      // init may already have been called; safe to ignore
    }
    return Promise.resolve();
  }
  return loadFromCdnWithRetry(sandbox);
}
