"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { UserCircle2, LogOut } from "lucide-react";

export default function HeaderNav() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    // Fetch user on mount and on route change
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setRole(data.user?.user_metadata?.role ?? null);
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

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/sign-in");
  }

  return (
    <header className="w-full bg-white/80 border-b border-gray-200 shadow-sm mb-2">
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-bold text-lg text-rose-600">
            EventHub
          </Link>
          <Link href="/" className="text-gray-700 hover:text-rose-600 font-medium">
            Events
          </Link>
          {user && role === "user" && (
            <Link href="/User/dashboard" className="text-gray-700 hover:text-rose-600 font-medium">
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
            <>
              <Link href="/profile" className="flex items-center">
                <UserCircle2 className="w-8 h-8 text-rose-600" />
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center p-2 rounded border border-rose-600 text-rose-600 hover:bg-rose-50"
                title="Logout"
                aria-label="Logout"
                type="button"
              >
                <LogOut className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
