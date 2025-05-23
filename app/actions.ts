"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const confirmPassword = formData.get("confirmPassword")?.toString();
  const name = formData.get("name")?.toString();
  const linkedin = formData.get("linkedin")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  if (!email || !password || !confirmPassword || !name) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Name, email, and password are required",
    );
  }

  // Check if passwords match
  if (password !== confirmPassword) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Passwords do not match",
    );
  }

  // First create the user account
  const { data: { user }, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        role: "user",
        name: name,
      },
    },
  });

  if (error) {
    console.error(error.code + " " + error.message);
    return encodedRedirect("error", "/sign-up", error.message);
  }
  
  // If user was created successfully, store additional information in profile table
  if (user) {
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert([
        {
          id: user.id,
          name,
          email,
          linkedin: linkedin || null,
        }
      ]);
      
    if (profileError) {
      console.error("Failed to create profile:", profileError.message);
      // We don't redirect here as the user has been created successfully,
      // we just log the error for debugging
    }
  }

  return encodedRedirect(
    "success",
    "/sign-up",
    "Thanks for signing up! Please check your email for a verification link.",
  );
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const returnUrl = formData.get("returnUrl") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  // If returnUrl is provided, redirect to that URL instead of the home page
  if (returnUrl) {
    return redirect(returnUrl);
  }

  return redirect("/"); // Redirect to home page after sign-in if no returnUrl
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
  });

  if (error) {
    console.error(error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password",
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password.",
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Passwords do not match",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password update failed",
    );
  }

  encodedRedirect("success", "/protected/reset-password", "Password updated");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};

export const signUpAdminAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const name = formData.get("name")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  if (!email || !password || !name) {
    return encodedRedirect(
      "error",
      "/admin-signup",
      "All fields are required",
    );
  }

  // Sign up the user
  const {
    data: { user },
    error,
  } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        role: "admin",
        name: name,
      },
    },
  });

  if (error) {
    return encodedRedirect("error", "/admin-signup", error.message);
  }

  // Create admin profile
  if (user) {
    const { error: profileError } = await supabase
      .from("admin_profiles")
      .insert([
        {
          id: user.id,
          name,
          email,
        },
      ]);

    if (profileError) {
      return encodedRedirect(
        "error",
        "/admin-signup",
        "Failed to create admin profile",
      );
    }
  }

  return encodedRedirect(
    "success",
    "/admin-signup",
    "Admin account created! Please check your email for verification.",
  );
};
