"use server";
import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import { db } from "@/lib/db";
import { gmailConfig,sendResetEmail } from "@/modules/profile/gmail";
import { requestPasswordReset,resetPassword,resetMessage } from "@/modules/profile/password-reset";
export async function forgotPasswordAction(_:string|undefined,form:FormData) {
  let base:string;
  try{base=gmailConfig().base;}catch{return "Gửi email chưa được cấu hình. Vui lòng liên hệ quản trị viên.";}
  try{return await requestPasswordReset(db,String(form.get("email")??""),base,sendResetEmail);}catch{return resetMessage;}
}
export async function resetPasswordAction(_:string|undefined,form:FormData) {
  try{await resetPassword(db,Object.fromEntries(form));}catch{return "Không đặt lại được mật khẩu. Kiểm tra mật khẩu mới ít nhất 8 ký tự, xác nhận trùng khớp và liên kết chưa dùng hoặc hết hạn.";}
  await signOut({redirect:false});
  redirect("/login?passwordReset=1");
}
