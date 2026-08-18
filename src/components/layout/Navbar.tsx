"use client";

import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { useUser } from "@/lib/UserContext";

export default function Navbar() {
  const { user, connecting, connectWallet, disconnectWallet } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/85 backdrop-blur-md font-sans">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 flex items-center justify-between">
        {/* Brand Logo */}
        <Link 
          href="/" 
          className="text-xl font-extrabold text-white tracking-tight flex items-center gap-1"
          onClick={() => setMobileMenuOpen(false)}
        >
          Toy<span className="text-[#00ff87]">Trade</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6 lg:gap-8">
          <div className="flex gap-6">
            <Link href="/listings" className="text-sm font-semibold text-white/70 hover:text-white transition-colors">
              {t("browseToys")}
            </Link>
            <Link href="/listings/create" className="text-sm font-semibold text-white/70 hover:text-white transition-colors">
              {t("sellAToy")}
            </Link>
            <Link href="/messages" className="text-sm font-semibold text-white/70 hover:text-white transition-colors">
              {t("messages")}
            </Link>
          </div>
          
          {/* Language Toggle */}
          <div className="flex items-center gap-1 border border-white/10 bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setLanguage("en")}
              className={`px-2 py-1 text-xs font-bold rounded transition-all ${
                language === "en" ? "bg-[#00ff87] text-black" : "text-white/60 hover:text-white"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage("vi")}
              className={`px-2 py-1 text-xs font-bold rounded transition-all ${
                language === "vi" ? "bg-[#00ff87] text-black" : "text-white/60 hover:text-white"
              }`}
            >
              VI
            </button>
          </div>

          {/* JoyID Connect / Profile Badge */}
          <div>
            {user ? (
              <div className="flex items-center gap-2">
                <span 
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white"
                  title={user.joyIdAddress}
                >
                  <span className="w-2 h-2 rounded-full bg-[#00ff87] animate-pulse"></span>
                  <span>{user.displayName || `🔑 ${user.joyIdAddress.slice(0, 6)}...${user.joyIdAddress.slice(-4)}`}</span>
                </span>
                <button
                  onClick={disconnectWallet}
                  className="text-xs text-white/40 hover:text-red-400 p-1 transition-colors"
                  title="Disconnect Passkey"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button 
                className="rounded-lg bg-gradient-to-r from-[#00ff87] to-[#60efff] px-4 py-2 text-sm font-bold text-black hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                onClick={() => connectWallet()} 
                disabled={connecting}
              >
                {connecting ? t("connecting") : t("fingerprintConnect")}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Header Controls */}
        <div className="flex md:hidden items-center gap-3">
          {/* Mobile Language Toggle */}
          <div className="flex items-center border border-white/10 bg-white/5 rounded-lg p-0.5">
            <button
              onClick={() => setLanguage("en")}
              className={`px-2 py-1 text-xs font-bold rounded ${
                language === "en" ? "bg-[#00ff87] text-black" : "text-white/60"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage("vi")}
              className={`px-2 py-1 text-xs font-bold rounded ${
                language === "vi" ? "bg-[#00ff87] text-black" : "text-white/60"
              }`}
            >
              VI
            </button>
          </div>

          {/* Hamburger Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg border border-white/15 bg-white/5 text-white/80 hover:text-white focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#0a0e12] px-5 py-6 flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col gap-3">
            <Link 
              href="/listings" 
              className="px-3 py-2.5 rounded-lg bg-white/5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              🧸 {t("browseToys")}
            </Link>
            <Link 
              href="/listings/create" 
              className="px-3 py-2.5 rounded-lg bg-white/5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              ✨ {t("sellAToy")}
            </Link>
            <Link 
              href="/messages" 
              className="px-3 py-2.5 rounded-lg bg-white/5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              💬 {t("messages")}
            </Link>
          </div>

          <div className="pt-2 border-t border-white/10">
            {user ? (
              <div className="flex items-center justify-between rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-xs font-medium text-white">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00ff87]"></span>
                  <span>{user.displayName || `🔑 ${user.joyIdAddress.slice(0, 6)}...`}</span>
                </div>
                <button
                  onClick={() => {
                    disconnectWallet();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs text-red-400 hover:underline"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button 
                className="w-full rounded-lg bg-gradient-to-r from-[#00ff87] to-[#60efff] py-3 text-sm font-bold text-black hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-[#00ff87]/10"
                onClick={async () => {
                  await connectWallet();
                  setMobileMenuOpen(false);
                }} 
                disabled={connecting}
              >
                {connecting ? t("connecting") : t("fingerprintConnect")}
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
