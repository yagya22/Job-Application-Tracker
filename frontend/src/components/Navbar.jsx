import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { useNotifications } from "../hooks/useNotifications";
import { useTheme } from "../contexts/ThemeContext";

export default function Navbar() {
  const location = useLocation();
  const { dark, toggle } = useTheme();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [bellOpen,   setBellOpen]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const bellRef   = useRef(null);
  const mobileRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (bellRef.current   && !bellRef.current.contains(e.target))   setBellOpen(false);
      if (mobileRef.current && !mobileRef.current.contains(e.target)) setMobileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const navLink = (to, label) => {
    const active = location.pathname === to;
    return (
      <Link
        to={to}
        className={`font-display text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-150 ${
          active
            ? "bg-amber-400 text-ink"
            : "text-gray-400 hover:text-white hover:bg-white/10"
        }`}
      >
        {label}
      </Link>
    );
  };

  const mobileNavLink = (to, label) => {
    const active = location.pathname === to;
    return (
      <Link
        to={to}
        className={`block w-full text-left font-display text-sm font-semibold px-4 py-3 rounded-lg transition-all ${
          active ? "bg-amber-400 text-ink" : "text-gray-300 hover:text-white hover:bg-white/10"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <nav className="bg-ink border-b border-white/5 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
          <span className="font-display font-bold text-white text-lg tracking-tight">VisaTrack</span>
          <span className="hidden sm:inline text-xs font-mono text-gray-500 mt-0.5">Europe & Remote</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden sm:flex items-center gap-1 flex-1 justify-center">
          {navLink("/", "Search Jobs")}
          {navLink("/tracker", "My Applications")}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-1 flex-shrink-0">

          {/* Dark mode toggle */}
          <button
            onClick={toggle}
            className="p-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            aria-label="Toggle dark mode"
          >
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* Notification bell */}
          <div className="relative" ref={bellRef}>
            <button
              onClick={() => setBellOpen((o) => !o)}
              className="relative p-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              aria-label="Notifications"
            >
              <BellIcon />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-400 rounded-full animate-pulse-soft" />
              )}
            </button>

            {bellOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-900 rounded-xl shadow-lift border border-gray-100 dark:border-gray-800 overflow-hidden animate-fade-up">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
                  <div>
                    <span className="font-display font-semibold text-ink dark:text-gray-100 text-sm">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="ml-2 text-xs font-mono bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-gray-400 hover:text-ink dark:hover:text-white transition-colors font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-12 text-center">
                      <span className="text-3xl mb-2 block">🎉</span>
                      <p className="text-sm text-gray-400">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => !n.read && markRead(n.id)}
                        className={`px-5 py-3.5 border-b border-gray-50 dark:border-gray-800/50 last:border-0 transition-colors cursor-pointer ${
                          n.read
                            ? "opacity-60"
                            : "bg-amber-50/60 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-base mt-0.5">{n.type === "follow_up" ? "⏰" : "📋"}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-ink dark:text-gray-200 leading-snug">{n.message}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                            </p>
                          </div>
                          {!n.read && <span className="w-2 h-2 bg-amber-400 rounded-full mt-1.5 flex-shrink-0" />}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="sm:hidden p-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            aria-label="Menu"
          >
            {mobileOpen ? <XIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileOpen && (
        <div ref={mobileRef} className="sm:hidden border-t border-white/5 bg-ink px-4 py-3 flex flex-col gap-1 animate-fade-up">
          {mobileNavLink("/", "Search Jobs")}
          {mobileNavLink("/tracker", "My Applications")}
        </div>
      )}
    </nav>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1"  x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22"   x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1"  y1="12" x2="3"  y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22"  y1="19.78" x2="5.64"  y2="18.36" />
      <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22" />
    </svg>
  );
}
function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6"  x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6"  y1="6" x2="18" y2="18" />
    </svg>
  );
}
