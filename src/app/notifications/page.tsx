import { redirect } from "next/navigation";
import { requireUser } from "@/lib/access";
export default async function NotificationsPage() {
  await requireUser();
  redirect("/profile?notifications=1");
}
