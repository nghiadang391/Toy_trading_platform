"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { useUser } from "@/lib/UserContext";
import UserProfileModal from "@/components/profile/UserProfileModal";

export default function Navbar() {
  const { user, connecting, connectWallet, disconnectWallet } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  // Notifications State
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await fetch(
        `/api/notifications?userId=${encodeURIComponent(user.id || user.joyIdAddress)}`
      );
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // background polling
    }
  };

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const markAllRead = async () => {
    if (!user) return;
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id || user.joyIdAddress, markAll: true }),
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // silent
    }
  };

  const hasUnreadMessage = notifications.some(
    (n) => n.type === "MESSAGE_RECEIVED" && !n.read
  );

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/85 backdrop-blur-md font-sans">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 flex items-center justify-between">
          {/* Brand Logo & Network Badge */}
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-xl font-extrabold text-white tracking-tight flex items-center gap-1"
              onClick={() => setMobileMenuOpen(false)}
            >
              Toy<span className="text-[#00ff87]">Trade</span>
            </Link>
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 select-none"
              title="Connected to Nervos CKB Testnet (Aggron4)"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              Testnet
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            <div className="flex items-center gap-6">
              <Link
                href="/listings"
                prefetch={true}
                className="text-sm font-semibold text-white/70 hover:text-white transition-colors"
              >
                {t("browseToys")}
              </Link>
              <Link
                href="/listings/create"
                className="text-sm font-semibold text-white/70 hover:text-white transition-colors"
              >
                {t("sellAToy")}
              </Link>
              <Link
                href="/messages"
                className="relative text-sm font-semibold text-white/70 hover:text-white transition-colors flex items-center gap-1.5"
              >
                <span>{t("messages")}</span>
                {hasUnreadMessage && (
                  <span className="w-2 h-2 rounded-full bg-[#00ff87] animate-pulse"></span>
                )}
              </Link>
              <Link
                href="/profile"
                className="text-sm font-semibold text-white/70 hover:text-white transition-colors"
              >
                Profile
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

            {/* Notification Bell Dropdown */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                  className="relative p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                  title="Notifications"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#00ff87] text-black font-extrabold text-[9px] flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {notifDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-white/15 bg-[#121417] shadow-2xl p-4 z-50 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Notifications
                      </span>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-[11px] text-[#00ff87] hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-white/40 text-center py-6">
                          No notifications yet.
                        </p>
                      ) : (
                        notifications.map((n) => (
                          <Link
                            key={n.id}
                            href={n.link || "/profile"}
                            onClick={() => setNotifDropdownOpen(false)}
                            className={`block p-2.5 rounded-xl border text-xs transition-colors ${
                              n.read
                                ? "border-white/5 bg-white/[0.02] text-white/60 hover:bg-white/5"
                                : "border-[#00ff87]/30 bg-[#00ff87]/5 text-white hover:bg-[#00ff87]/10"
                            }`}
                          >
                            <p className="font-bold text-[11px] text-[#00ff87] flex items-center justify-between">
                              <span>{n.title}</span>
                              <span className="text-[10px] text-white/40 font-normal">
                                {new Date(n.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </p>
                            <p className="text-[11px] text-white/80 mt-1 line-clamp-2">{n.message}</p>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* JoyID Connect / Profile Badge */}
            <div>
              {user ? (
                <div className="flex items-center gap-2">
                  <Link
                    href="/profile"
                    className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-all group"
                    title="View My Profile"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#00ff87] animate-pulse"></span>
                    <span className="group-hover:text-[#00ff87] transition-colors">
                      {user.displayName ||
                        `🔑 ${user.joyIdAddress.slice(0, 6)}...${user.joyIdAddress.slice(-4)}`}
                    </span>
                  </Link>
                  <button
                    onClick={() => setProfileModalOpen(true)}
                    className="p-1 text-white/40 hover:text-white text-xs transition-colors"
                    title="Quick Edit Profile"
                  >
                    ✎
                  </button>
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

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            {/* Language Toggle Mobile */}
            <button
              onClick={() => setLanguage(language === "en" ? "vi" : "en")}
              className="px-2 py-1 text-xs font-bold rounded border border-white/10 bg-white/5 text-white"
            >
              {language.toUpperCase()}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg border border-white/15 bg-white/5 text-white/80 hover:text-white focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
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
                prefetch={true}
                className="px-3 py-2.5 rounded-lg bg-white/5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("browseToys")}
              </Link>
              <Link
                href="/listings/create"
                className="px-3 py-2.5 rounded-lg bg-white/5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("sellAToy")}
              </Link>
              <Link
                href="/messages"
                className="px-3 py-2.5 rounded-lg bg-white/5 text-sm font-semibold text-white hover:bg-white/10 transition-colors flex items-center justify-between"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span>{t("messages")}</span>
                {hasUnreadMessage && (
                  <span className="w-2 h-2 rounded-full bg-[#00ff87]"></span>
                )}
              </Link>
              <Link
                href="/profile"
                className="px-3 py-2.5 rounded-lg bg-white/5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Profile
              </Link>
            </div>

            <div className="pt-2 border-t border-white/10">
              {user ? (
                <div className="flex items-center justify-between rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-xs font-medium text-white">
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 text-left hover:text-[#00ff87] transition-colors"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#00ff87]"></span>
                    <span>{user.displayName || `🔑 ${user.joyIdAddress.slice(0, 6)}...`}</span>
                  </Link>
                  <button
                    onClick={() => {
                      disconnectWallet();
                      setMobileMenuOpen(false);
                    }}
                    className="text-xs text-red-400 hover:underline ml-2"
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

      {/* Profile Edit Modal */}
      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
    </>
  );
}
