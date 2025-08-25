"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { signOutAction } from "@/app/actions";
import { UserCircle2, LogOut } from "lucide-react";

export default function HeaderNav() {
  const { user, role, profile, refreshAuth } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  // Auto-refresh auth on mount (helps with direct navigation)
  useEffect(() => {
    const timer = setTimeout(() => {
      refreshAuth();
    }, 100);
    return () => clearTimeout(timer);
  }, [refreshAuth]);

  useEffect(() => {
    // Close menu on outside click
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  async function handleLogout() {
    // Use server action to sign out so cookies/session are cleared consistently
    try {
      await signOutAction();
    } catch {
      router.push("/sign-in");
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const profileHref =
    (role === "admin" || role == null || role === "")
      ? "/admin/profile"
      : "/profile";

  // Align admin detection with middleware (admin, null, or empty role considered admin)
  const isAdmin = (role === "admin" || role == null || role === "");

  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('HeaderNav Debug:', { user: !!user, role, isAdmin });
  }

  return (
    <header className="w-full bg-white/80 border-b border-gray-200 shadow-sm mb-2 sticky top-0 z-50 backdrop-blur-sm">
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-bold text-lg text-rose-600">
            <img
              src="https://ygogwzwqvsxataluhhsz.supabase.co/storage/v1/object/public/logo//hack-on-logo.png"
              alt="Hackon Logo"
              className="h-6 w-auto"
            />
          </Link>
          <Link
            href="/"
            className="text-gray-700 hover:text-rose-600 font-medium"
          >
            Events
          </Link>
          {user && !isAdmin && (
            <Link
              href="/dashboard"
              className="text-gray-700 hover:text-rose-600 font-medium"
            >
              Registered Events
            </Link>
          )}
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                className="flex items-center gap-2 bg-rose-50 text-rose-600 py-1.5 px-3 rounded-full hover:bg-rose-100 transition-colors"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Profile menu"
              >
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white overflow-hidden">
                  {profile?.photo_url ? (
                    <img
                      src={profile.photo_url}
                      alt="Profile"
                      className="w-7 h-7 object-cover rounded-full"
                    />
                  ) : (
                    getInitials(profile?.name || user.email || 'U')
                  )}
                </span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-rose-50 text-gray-700 flex items-center gap-2"
                    onClick={() => {
                      setMenuOpen(false);
                      router.push(profileHref);
                    }}
                  >
                    <UserCircle2 className="w-4 h-4" />
                    Profile
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-rose-50 text-gray-700 flex items-center gap-2"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="px-4 py-2 rounded bg-rose-600 text-white hover:bg-rose-700 font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="px-4 py-2 rounded border border-rose-600 text-rose-600 hover:bg-rose-50 font-medium"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
