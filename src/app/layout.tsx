import type { Metadata } from "next";
import "./globals.css";
import "./management.css";

export const metadata: Metadata = { title: "Lắng nghe sinh viên", description: "Hệ thống khảo sát và phản hồi sinh viên" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body>{children}</body></html>;
}
