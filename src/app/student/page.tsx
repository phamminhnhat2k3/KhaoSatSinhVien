import Link from "next/link";
import { Role } from "@prisma/client";
import { AppShell } from "@/components/AppShell";
import { requireUser } from "@/lib/access";
import { db } from "@/lib/db";

export default async function StudentPage({ searchParams }: { searchParams: Promise<{ submitted?: string }> }) {
  const user = await requireUser(Role.STUDENT);
  const student = await db.studentProfile.findUniqueOrThrow({ where: { userId: user.id } });
  const participations = await db.surveyParticipation.findMany({ where: { studentId: student.id }, include: { campaign: { include: { targets: { include: { class: { include: { course: true } } } } } } }, orderBy: { campaign: { endsAt: "asc" } } });
  const pending = participations.filter((item) => item.status !== "COMPLETED" && item.campaign.status === "PUBLISHED");
  return <AppShell name={user.name} role="Sinh viên"><p className="eyebrow">Không gian của bạn</p><h1>Ý kiến của bạn tạo nên thay đổi.</h1><p className="lead">Phản hồi được tách khỏi danh tính trước khi đưa vào báo cáo. Hãy góp ý cụ thể, tôn trọng và không tự nhận diện trong phần tự luận.</p>
    {(await searchParams).submitted && <p className="notice">Cảm ơn bạn! Phản hồi đã được ghi nhận ẩn danh.</p>}
    <section className="grid"><article className="card"><span className="muted">Cần hoàn thành</span><div className="stat">{pending.length}</div></article><article className="card"><span className="muted">Đã hoàn thành</span><div className="stat">{participations.filter((item) => item.status === "COMPLETED").length}</div></article></section>
    <h2 style={{marginTop: "2rem"}}>Khảo sát được giao</h2><section className="grid">{pending.length ? pending.map(({ campaign, status }) => <article className="card" key={campaign.id}><span className="pill">{status === "DRAFT" ? "Đang làm" : "Mới"}</span><h3>{campaign.title}</h3><p className="muted">{campaign.targets[0]?.class.course.name}<br/>Hạn: {campaign.endsAt.toLocaleDateString("vi-VN")}</p><Link className="button" href={`/student/surveys/${campaign.id}`}>Thực hiện khảo sát</Link></article>) : <article className="card"><h3>Bạn đã hoàn thành 🎉</h3><p className="muted">Hiện không còn khảo sát nào cần thực hiện.</p></article>}</section>
  </AppShell>;
}
