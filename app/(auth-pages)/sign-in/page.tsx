"use client";

import { signInAction } from "@/app/actions";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

// SignInForm component that uses useSearchParams hook
function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const searchParams = useSearchParams();
  const message = searchParams.get("message");
  const returnUrl = searchParams.get("returnUrl");

  // Create a custom action that includes the returnUrl
  const customSignInAction = async (formData: FormData) => {
    // Append the returnUrl to the form data
    if (returnUrl) {
      formData.append("returnUrl", returnUrl);
    }
    return signInAction(formData);
  };

  return (
    <div className="bg-white/50 rounded-xl shadow-md p-8 max-w-md w-full">
      <form className="flex flex-col" action={customSignInAction}>
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Sign in</h1>
        <p className="text-sm text-gray-600 mb-6">
          Don't have an account?{" "}
          <Link className="text-rose-600 font-medium underline" href="/sign-up">
            Sign up
          </Link>
        </p>
        <div className="flex flex-col gap-4 [&>input]:mb-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-gray-700 font-medium">
              Email
            </Label>
            <Input
              name="email"
              placeholder="you@example.com"
              required
              className="rounded-lg border-2 border-gray-200 py-3 px-4 bg-white/80 
              focus:border-rose-500 focus:ring focus:ring-rose-200 transition-all 
              text-gray-800 placeholder:text-gray-400 hover:border-gray-300"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="password" className="text-gray-700 font-medium">
                Password
              </Label>
              <Link
                className="text-xs text-rose-600 underline"
                href="/forgot-password"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Your password"
                required
                className="rounded-lg border-2 border-gray-200 py-3 px-4 pr-12 bg-white/80 
                focus:border-rose-500 focus:ring focus:ring-rose-200 transition-all 
                text-gray-800 placeholder:text-gray-400 hover:border-gray-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="mt-2">
            <SubmitButton
              pendingText="Signing In..."
              className="bg-rose-600 hover:bg-rose-700 text-white py-2 px-4 rounded-lg w-full font-medium"
            >
              Sign in
            </SubmitButton>
          </div>

          {message && <FormMessage message={{ message }} />}
        </div>
      </form>
    </div>
  );
}

// Main page component with Suspense
export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white/50 rounded-xl shadow-md p-8 max-w-md w-full flex items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
