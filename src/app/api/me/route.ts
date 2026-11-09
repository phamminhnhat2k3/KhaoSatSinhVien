import { currentUser } from "@/lib/access";
export async function GET() { const user = await currentUser(); return Response.json(user, { status: user ? 200 : 401, headers: { "Cache-Control": "private, no-store" } }); }
