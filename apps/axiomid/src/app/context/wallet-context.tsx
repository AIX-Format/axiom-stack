"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { Tier, getLevelProgress, getNextLevelXP } from "@/lib/tiers";
import { ensurePiSdk } from "@/lib/pi-sdk";

export interface User {
  id: string;
  walletAddress: string;
  piUsername?: string | null;
  xp: number;
  tier: Tier;
  actions: { type: string; xp: number; timestamp: string }[];
  agent?: {
    id: string;
    name: string;
    status: string;
    lastActive: string | null;
  } | null;
}

interface WalletContextType {
  user: User | null;
  isLoading: boolean;
  isConnecting: boolean;
  error: string | null;
  isPiBrowser: boolean;
  connectWallet: () => Promise<void>;
  claimAction: (actionType: string) => Promise<boolean>;
  refreshUser: () => Promise<void>;
  createAgent: (name?: string) => Promise<boolean>;
  activateAgent: () => Promise<boolean>;
  levelProgress: number;
  nextXP: number | null;
}

const WalletContext = createContext<WalletContextType | null>(null);

function getSandboxFlag(): boolean {
  if (process.env.NEXT_PUBLIC_PI_SANDBOX === "true") return true;
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    if (params.get("sandbox") === "true") return true;
  }
  return false;
}

const SANDBOX = getSandboxFlag();
const AUTH_TIMEOUT_MS = 15000;

function detectPiBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  if (typeof window !== "undefined" && !!(window as any)?.Pi?.authenticate) return true;
  return /Pi Browser|minepi/i.test(navigator.userAgent);
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms)
    ),
  ]);
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPiBrowser, setIsPiBrowser] = useState(false);

  const levelProgress = user ? getLevelProgress(user.xp, user.tier) : 0;
  const nextXP = user ? getNextLevelXP(user.tier) : null;

  const authAttempted = useRef(false);

  useEffect(() => {
    setIsPiBrowser(detectPiBrowser());
    console.log("[AUTH DEBUG] SANDBOX flag:", SANDBOX, "| env:", process.env.NEXT_PUBLIC_PI_SANDBOX, "| url:", window.location.search.includes("sandbox=true"));
  }, []);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    const debug = (label: string, data?: unknown) => {
      console.log(`[AUTH DEBUG] ${label}`, data ?? "");
    };

    try {
      let walletAddress = "";
      let piUid = "";
      let piUsername = "";
      let accessToken = "";

      const inPiBrowser = detectPiBrowser();
      const isSandbox = getSandboxFlag();
      const inIframe = typeof window !== "undefined" && window.self !== window.parent;
      
      debug("inPiBrowser", inPiBrowser);
      debug("isSandbox", isSandbox);
      debug("inIframe", inIframe);
      debug("hasPi", typeof window !== "undefined" && !!window.Pi);

      const usePi = inPiBrowser || isSandbox;
      debug("usePi", usePi);

      if (usePi) {
        debug("loading Pi SDK...");
        await withTimeout(ensurePiSdk(isSandbox), AUTH_TIMEOUT_MS);
        const pi = typeof window !== "undefined" ? (window as any).Pi : undefined;
        debug("Pi SDK loaded", !!pi?.authenticate);
        if (!pi?.authenticate) throw new Error("Pi SDK not available");

        debug("calling Pi.authenticate...");
        const scopes = isSandbox
          ? ["username", "payments"]
          : ["username", "payments", "wallet_address"];
        debug("scopes requested:", scopes);
        const auth = (await withTimeout(
          pi.authenticate({
            scopes,
            onIncompletePaymentFound: (payment: any) => {
              console.warn("Incomplete payment:", payment?.identifier);
            }
          }),
          AUTH_TIMEOUT_MS
        )) as any;
        debug("Pi.authenticate done", { uid: auth?.user?.uid, username: auth?.user?.username });

        piUid = auth.user.uid;
        piUsername = auth.user.username;
        accessToken = auth.accessToken;
        walletAddress = `pi:${piUid}`;
      } else {
        debug("using demo wallet");
        // Reuse stored wallet if available, otherwise generate new demo wallet
        const storedWallet = localStorage.getItem("axiomid_wallet");
        if (storedWallet && storedWallet.startsWith("demo:")) {
          walletAddress = storedWallet;
        } else {
          walletAddress = `demo:${crypto.randomUUID().slice(0, 8)}`;
        }
      }

      debug("saving wallet to localStorage", walletAddress);
      localStorage.setItem("axiomid_wallet", walletAddress);
      if (accessToken) localStorage.setItem("axiomid_token", accessToken);

      const endpoint = usePi ? "/api/auth/pi" : "/api/auth/connect";
      const body = usePi
        ? JSON.stringify({ accessToken, uid: piUid, walletAddress, username: piUsername })
        : JSON.stringify({ walletAddress, piUid, piUsername, accessToken });
      debug(`POST ${endpoint}`, { walletAddress, hasAccessToken: !!accessToken });
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });

      if (!res.ok) {
        const err = await res.json();
        debug(`${endpoint} failed`, err);
        throw new Error(err.error || "Authentication failed");
      }

      const data = await res.json();
      debug(`${endpoint} success`, data.user);
      setUser(data.user);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Connection failed";
      debug("connectWallet error", message);
      console.error(err);
      setError(message);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  useEffect(() => {
    if (authAttempted.current) return;
    authAttempted.current = true;

    const inPiBrowser = detectPiBrowser();
    const isSandbox = getSandboxFlag();
    const inIframe = typeof window !== "undefined" && window.self !== window.parent;
    const isPiEnv = inPiBrowser || isSandbox;
    console.log("[AUTH DEBUG] auto-auth: SANDBOX=", isSandbox, "PiBrowser=", inPiBrowser, "inIframe=", inIframe, "isPiEnv=", isPiEnv);

    if (isPiEnv) {
      connectWallet();
    } else {
      const storedWallet = localStorage.getItem("axiomid_wallet");
      const storedToken = localStorage.getItem("axiomid_token");
      if (storedWallet) {
        fetch("/api/auth/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ walletAddress: storedWallet, accessToken: storedToken || undefined }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.user) setUser(data.user);
          })
          .catch(() => {});
      }
    }
  }, [connectWallet]);

  const claimAction = useCallback(async (actionType: string) => {
    if (!user) return false;
    try {
      const res = await fetch("/api/action/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: user.walletAddress, actionType }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Failed to claim");
        return false;
      }

      const data = await res.json();
      setUser(data.user);
      return true;
    } catch (err) {
      console.error("Claim error:", err);
      return false;
    }
  }, [user]);

  const refreshUser = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/user/status?walletAddress=${user.walletAddress}`);
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  const createAgent = useCallback(async (name?: string) => {
    if (!user) return false;
    const token = localStorage.getItem("axiomid_token");
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: user.walletAddress, name, accessToken: token || undefined }),
      });
      if (!res.ok) return false;
      await refreshUser();
      return true;
    } catch {
      return false;
    }
  }, [user, refreshUser]);

  const activateAgent = useCallback(async () => {
    if (!user) return false;
    const token = localStorage.getItem("axiomid_token");
    try {
      const res = await fetch("/api/agent/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: user.walletAddress, accessToken: token || undefined }),
      });
      if (!res.ok) return false;
      await refreshUser();
      return true;
    } catch {
      return false;
    }
  }, [user, refreshUser]);

  return (
    <WalletContext.Provider
      value={{
        user,
        isLoading,
        isConnecting,
        error,
        isPiBrowser,
        connectWallet,
        claimAction,
        refreshUser,
        createAgent,
        activateAgent,
        levelProgress,
        nextXP,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return ctx;
}
