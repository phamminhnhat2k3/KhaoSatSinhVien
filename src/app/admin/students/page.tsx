import { redirect } from "next/navigation";
export default async function StudentsPage({ searchParams }: { searchParams: Promise<Record<string,string | undefined>> }) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [k,v] of Object.entries(params)) if (v) query.set(k,v);
  if (!query.has("role")) query.set("role","STUDENT");
  redirect(`/admin/users?${query}`);
}
