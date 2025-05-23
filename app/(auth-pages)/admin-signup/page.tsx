import { signUpAdminAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default async function AdminSignup(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;
  return (
    <div className="bg-white/50 rounded-xl shadow-md p-8 max-w-md w-full">
      <form className="flex flex-col">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Admin Sign up</h1>
        <p className="text-sm text-gray-600 mb-6">
          Register as an admin user
        </p>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name" className="text-gray-700 font-medium">
              Name
            </Label>
            <Input
              name="name"
              placeholder="Your full name"
              required
              className="rounded-lg border-2 border-gray-200 py-3 px-4 bg-white/80"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-gray-700 font-medium">
              Email
            </Label>
            <Input
              name="email"
              placeholder="admin@example.com"
              required
              className="rounded-lg border-2 border-gray-200 py-3 px-4 bg-white/80"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password" className="text-gray-700 font-medium">
              Password
            </Label>
            <Input
              type="password"
              name="password"
              placeholder="Minimum 6 characters"
              minLength={6}
              required
              className="rounded-lg border-2 border-gray-200 py-3 px-4 bg-white/80"
            />
          </div>

          <div className="mt-2">
            <SubmitButton
              formAction={signUpAdminAction}
              pendingText="Creating admin account..."
              className="bg-rose-600 hover:bg-rose-700 text-white py-2 px-4 rounded-lg w-full font-medium"
            >
              Create Admin Account
            </SubmitButton>
          </div>

          <FormMessage message={searchParams} />
        </div>
      </form>
    </div>
  );
}
