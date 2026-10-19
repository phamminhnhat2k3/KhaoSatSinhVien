import { redirect } from "next/navigation";
import { requireUser } from "@/lib/access";

export default async function Dashboard() {
  const user = await requireUser();
  if (user.roles.includes("ADMIN")) redirect("/admin");
  if (user.roles.includes("LECTURER")) redirect("/lecturer");
  redirect("/student");
}
