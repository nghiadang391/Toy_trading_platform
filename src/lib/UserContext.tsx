"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLanguage } from "./LanguageContext";

export interface UserProfile {
  id: string;
  joyIdAddress: string;
  displayName: string;
  region: "UK" | "VIETNAM";
  avatarUrl?: string | null;
}

interface UserContextType {
  user: UserProfile | null;
  connecting: boolean;
  connectWallet: () => Promise<UserProfile | null>;
  disconnectWallet: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "toytrade_connected_user";

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [connecting, setConnecting] = useState(false);
  const { language } = useLanguage();

  // Restore user session on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id && parsed.joyIdAddress) {
          setUser(parsed);
        }
      }
    } catch (e) {
      console.warn("Failed to load user from localStorage:", e);
    }
  }, []);

  async function connectWallet(): Promise<UserProfile | null> {
    setConnecting(true);
    try {
      const { initConfig, connect } = await import("@joyid/ckb");
      
      const currentOrigin = typeof window !== "undefined" ? window.location.origin : "";
      initConfig({
        name: "ToyTrade",
        joyidAppURL: "https://testnet.joyid.dev",
      });

      const res = await connect();
      if (res && res.address) {
        const defaultName = "Passkey User " + res.address.substring(res.address.length - 4);
        const region = language === "vi" ? "VIETNAM" : "UK";

        let loggedInUser: UserProfile = {
          id: `usr_${res.address.substring(0, 10)}`,
          joyIdAddress: res.address,
          displayName: defaultName,
          region,
          avatarUrl: null,
        };

        try {
          // Register or retrieve user from database
          const apiRes = await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              joyIdAddress: res.address,
              displayName: defaultName,
              region,
            }),
          });

          if (apiRes.ok) {
            loggedInUser = await apiRes.json();
          }
        } catch (dbErr) {
          console.warn("Could not sync user with DB (using client session):", dbErr);
        }

        setUser(loggedInUser);
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(loggedInUser));
        } catch (e) {
          console.warn("Failed to persist user in localStorage:", e);
        }
        return loggedInUser;
      }
      return null;
    } catch (err) {
      console.error("JoyID Connection error:", err);
      return null;
    } finally {
      setConnecting(false);
    }
  }

  function disconnectWallet() {
    setUser(null);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {
      console.warn("Failed to clear user from localStorage:", e);
    }
  }

  return (
    <UserContext.Provider
      value={{
        user,
        connecting,
        connectWallet,
        disconnectWallet,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextType {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
