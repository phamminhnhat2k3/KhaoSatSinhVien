import { z } from "zod";
export const roleLabels = { ADMIN: "Quản trị viên", LECTURER: "Giảng viên", STUDENT: "Sinh viên" };
export const profileSchema = z.object({
  name: z.string().trim().min(2, "Họ tên cần ít nhất 2 ký tự.").max(100),
  phone: z.string().trim().max(20).refine(v => !v || /^\+?[\d ()-]{8,20}$/.test(v), "Số điện thoại không hợp lệ."),
  department: z.string().trim().max(120, "Đơn vị tối đa 120 ký tự."),
  bio: z.string().trim().max(1000, "Giới thiệu tối đa 1.000 ký tự."),
  coverTheme: z.enum(["blue", "green", "violet"])
});
export const passwordSchema = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8, "Mật khẩu mới cần ít nhất 8 ký tự.").max(100), confirmPassword: z.string() }).refine(v => v.newPassword === v.confirmPassword, "Xác nhận mật khẩu không khớp.").refine(v => v.newPassword !== v.currentPassword, "Mật khẩu mới phải khác mật khẩu hiện tại.");
