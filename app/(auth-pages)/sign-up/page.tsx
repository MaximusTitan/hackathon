"use client";

import { signUpAction } from "@/app/actions";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState, Suspense } from "react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

// Create a client component that uses useSearchParams
function SignupForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  
  const searchParams = useSearchParams();
  const message = searchParams.get("message");

  const validatePasswords = () => {
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    if (!validatePasswords()) {
      event.preventDefault();
      toast.error("Passwords do not match");
      return false;
    }
    // Allow the form action to proceed
    return true;
  };

  if (message) {
    return (
      <div className="w-full flex-1 flex items-center sm:max-w-2xl justify-center gap-2 p-4">
        <FormMessage message={{ message }} />
      </div>
    );
  }

  return (
    <div className="bg-white/50 rounded-xl shadow-md p-8 max-w-md w-full">
      <form className="flex flex-col" action={signUpAction} onSubmit={handleSubmit}>
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Sign up</h1>
        <p className="text-sm text-gray-600 mb-6">
          Already have an account?{" "}
          <Link className="text-rose-600 font-medium underline" href="/sign-in">
            Sign in
          </Link>
        </p>
        <div className="flex flex-col gap-4 [&>input]:mb-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name" className="text-gray-700 font-medium">
              Full Name
            </Label>
            <Input
              name="name"
              placeholder="John Doe"
              required
              className="rounded-lg border-2 border-gray-200 py-3 px-4 bg-white/80 
              focus:border-rose-500 focus:ring focus:ring-rose-200 transition-all 
              text-gray-800 placeholder:text-gray-400 hover:border-gray-300"
            />
          </div>

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
            <Label htmlFor="linkedin" className="text-gray-700 font-medium">
              LinkedIn Profile
            </Label>
            <Input
              name="linkedin"
              placeholder="https://linkedin.com/in/yourprofile"
              className="rounded-lg border-2 border-gray-200 py-3 px-4 bg-white/80 
              focus:border-rose-500 focus:ring focus:ring-rose-200 transition-all 
              text-gray-800 placeholder:text-gray-400 hover:border-gray-300"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password" className="text-gray-700 font-medium">
              Password
            </Label>
            <Input
              type="password"
              name="password"
              placeholder="Your password"
              minLength={6}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border-2 border-gray-200 py-3 px-4 bg-white/80 
              focus:border-rose-500 focus:ring focus:ring-rose-200 transition-all 
              text-gray-800 placeholder:text-gray-400 hover:border-gray-300"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
              Confirm Password
            </Label>
            <Input
              type="password"
              name="confirmPassword"
              placeholder="Confirm your password"
              minLength={6}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onBlur={validatePasswords}
              className="rounded-lg border-2 border-gray-200 py-3 px-4 bg-white/80 
              focus:border-rose-500 focus:ring focus:ring-rose-200 transition-all 
              text-gray-800 placeholder:text-gray-400 hover:border-gray-300"
            />
            {passwordError && (
              <p className="text-red-500 text-sm mt-1">{passwordError}</p>
            )}
          </div>
          
          <div className="mt-2">
            <SubmitButton
              formAction={signUpAction}
              pendingText="Signing up..."
              className="bg-rose-600 hover:bg-rose-700 text-white py-2 px-4 rounded-lg w-full font-medium"
            >
              Sign up
            </SubmitButton>
          </div>

          {message && <FormMessage message={{ message }} />}
        </div>
      </form>
    </div>
  );
}

// Main page component with Suspense
export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="bg-white/50 rounded-xl shadow-md p-8 max-w-md w-full flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}
