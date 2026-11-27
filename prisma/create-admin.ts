import { PrismaClient } from "@prisma/client";
import { createInitialAdmin } from "./admin-bootstrap";
const db = new PrismaClient();
createInitialAdmin(db, { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD })
  .then(() => console.log("Đã tạo tài khoản quản trị viên."))
  .catch(() => {
    console.error("Chưa tạo được admin. Kiểm tra kết nối, email chưa tồn tại và ADMIN_PASSWORD từ 12 đến 100 ký tự.");
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
