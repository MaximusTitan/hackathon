import { signUpAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { SmtpMessage } from "../smtp-message";

export default async function Signup(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  if ("message" in searchParams) {
    return (
      <div className="w-full flex-1 flex items-center h-screen sm:max-w-2xl justify-center gap-2 p-4">
        <FormMessage message={searchParams} />
      </div>
    );
  }

  return (
    <div className="bg-white/50 rounded-xl shadow-md p-8 max-w-md w-full">
      <form className="flex flex-col">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Sign up</h1>
        <p className="text-sm text-gray-600 mb-6">
          Already have an account?{" "}
          <Link className="text-rose-600 font-medium underline" href="/sign-in">
            Sign in
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
            <Label htmlFor="password" className="text-gray-700 font-medium">
              Password
            </Label>
            <Input
              type="password"
              name="password"
              placeholder="Your password"
              minLength={6}
              required
              className="rounded-lg border-2 border-gray-200 py-3 px-4 bg-white/80 
              focus:border-rose-500 focus:ring focus:ring-rose-200 transition-all 
              text-gray-800 placeholder:text-gray-400 hover:border-gray-300"
            />
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

          <FormMessage message={searchParams} />
        </div>
      </form>
    </div>
  );
}
