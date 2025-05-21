import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default async function Login(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;
  return (
    <div className="bg-white/50 rounded-xl shadow-md p-8 max-w-md w-full">
      <form className="flex flex-col">
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
            <Input
              type="password"
              name="password"
              placeholder="Your password"
              required
              className="rounded-lg border-2 border-gray-200 py-3 px-4 bg-white/80 
              focus:border-rose-500 focus:ring focus:ring-rose-200 transition-all 
              text-gray-800 placeholder:text-gray-400 hover:border-gray-300"
            />
          </div>

          <div className="mt-2">
            <SubmitButton
              pendingText="Signing In..."
              formAction={signInAction}
              className="bg-rose-600 hover:bg-rose-700 text-white py-2 px-4 rounded-lg w-full font-medium"
            >
              Sign in
            </SubmitButton>
          </div>

          <FormMessage message={searchParams} />
        </div>
      </form>
    </div>
  );
}
