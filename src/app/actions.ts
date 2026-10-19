"use server";

import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export async function loginAction(_: string | undefined, formData: FormData) {
  try {
    await signIn("credentials", { email: formData.get("email"), password: formData.get("password"), redirectTo: "/dashboard" });
  } catch (error) {
    if (error instanceof AuthError) return "Email hoặc mật khẩu không đúng.";
    throw error;
  }
}

export async function logoutAction() { await signOut({ redirectTo: "/login" }); }
export async function goHome() { redirect("/dashboard"); }
