"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { Tier, getLevelProgress, getNextLevelXP } from "@/lib/tiers";
import { initPiSdk, authenticatePi } from "@/lib/pi-sdk";

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

function checkPiBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  if (typeof window !== "undefined" && !!(window as any)?.Pi?.authenticate) return true;
  const ua = navigator.userAgent;
  return /Pi Browser|minepi/i.test(ua);
}

function checkSandbox(): boolean {
  if (process.env.NEXT_PUBLIC_PI_SANDBOX === "true") return true;
  if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("sandbox") === "true") return true;
  return false;
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

  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const inPiBrowser = checkPiBrowser();
      const sandbox = checkSandbox();
      const usePi = inPiBrowser || sandbox;

      if (!usePi) {
        const storedWallet = localStorage.getItem("axiomid_wallet");
        const walletAddress = storedWallet && storedWallet.startsWith("demo:")
          ? storedWallet
          : `demo:${crypto.randomUUID().slice(0, 8)}`;
        localStorage.setItem("axiomid_wallet", walletAddress);

        const res = await fetch("/api/auth/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ walletAddress }),
        });

        if (!res.ok) throw new Error("Demo auth failed");
        const data = await res.json();
        setUser(data.user);
        return;
      }

      await initPiSdk(sandbox);
      const { accessToken, user: piUser } = await authenticatePi(["username"]);
      const walletAddress = `pi:${piUser.uid}`;

      const res = await fetch("/api/auth/pi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken,
          uid: piUser.uid,
          username: piUser.username,
          walletAddress,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Authentication failed");
      }

      const data = await res.json();
      localStorage.setItem("axiomid_wallet", walletAddress);
      setUser(data.user);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Connection failed";
      console.error("Auth error:", message);
      setError(message);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  useEffect(() => {
    const inPiBrowser = checkPiBrowser();
    setIsPiBrowser(inPiBrowser);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (authAttempted.current) return;
    authAttempted.current = true;

    const inPiBrowser = checkPiBrowser();
    const sandbox = checkSandbox();
    const usePi = inPiBrowser || sandbox;

    if (usePi) {
      connectWallet();
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
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: user.walletAddress, name }),
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
    try {
      const res = await fetch("/api/agent/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: user.walletAddress }),
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
