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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="w-full bg-white/80 border-b border-gray-200 shadow-sm mb-2 sticky top-0 z-50 backdrop-blur-sm">
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-bold text-lg text-rose-600">
            Hackon
          </Link>
          <Link
            href="/"
            className="text-gray-700 hover:text-rose-600 font-medium"
          >
            Events
          </Link>
          {user && role === "user" && (
            <Link
              href="/User/dashboard"
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
            <Link
              href={
                user.user_metadata?.role === "admin"
                  ? "/admin/profile"
                  : "/User/profile"
              }
              className="flex items-center gap-2 bg-rose-50 text-rose-600 py-1.5 px-3 rounded-full hover:bg-rose-100 transition-colors"
            >
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white">
                {getInitials(user.user_metadata?.name || user.email)}
              </span>
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
