"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { UserCircle2, LogOut } from "lucide-react";

type UserProfile = {
  photo_url?: string | null;
  name?: string | null;
};

export default function HeaderNav() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();

    // Fetch user on mount and on route change
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setRole(data.user?.user_metadata?.role ?? null);

      // Fetch user profile for photo_url
      if (data.user) {
        const { data: profileData } = await supabase
          .from("user_profiles")
          .select("photo_url, name")
          .eq("id", data.user.id)
          .single();
        setProfile(profileData || {});
      } else {
        setProfile(null);
      }
    };
    fetchUser();

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      fetchUser();
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [pathname]);

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
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/sign-in");
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
    user?.user_metadata?.role === "admin"
      ? "/admin/profile"
      : "/User/profile";

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
          {user && role === "user" && (
            <Link
              href="/dashboard"
              className="text-gray-700 hover:text-rose-600 font-medium"
            >
              Registered Events
            </Link>
          )}
        </div>
        <div className="flex items-center gap-4">
          {!user ? (
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
          ) : (
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
                    getInitials(profile?.name || user.email || '')
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
          )}
        </div>
      </nav>
    </header>
  );
}
