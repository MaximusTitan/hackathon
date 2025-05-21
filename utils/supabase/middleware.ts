import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export const updateSession = async (request: NextRequest) => {
  try {
    // Create an unmodified response
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            );
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    // This will refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    const { data: { user } } = await supabase.auth.getUser();

    // protected routes
    if (request.nextUrl.pathname.startsWith("/protected") && !user) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    // Admin routes protection
    if (request.nextUrl.pathname.startsWith("/admin")) {
      if (!user) {
        return NextResponse.redirect(new URL("/sign-in", request.url));
      }
      
      // Check if user has admin role, or role is null/empty
      const { data: { user: userData } } = await supabase.auth.getUser();
      const userRole = userData?.user_metadata?.role;
      
      if (!(userRole === "admin" || userRole == null || userRole === "")) {
        return NextResponse.redirect(new URL("/User/dashboard", request.url));
      }
    }
    
    // User routes protection
    if (request.nextUrl.pathname.startsWith("/User") && !user) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    if (request.nextUrl.pathname === "/" && user) {
      // Redirect to admin dashboard if role is admin, null, or empty string
      const userRole = user.user_metadata?.role;
      if (userRole === "admin" || userRole == null || userRole === "") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
      // If userRole is "user", do NOT redirect (let them see the home page)
    }

    return response;
  } catch (e) {
    // If you are here, a Supabase client could not be created!
    // This is likely because you have not set up environment variables.
    // Check out http://localhost:3000 for Next Steps.
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};
