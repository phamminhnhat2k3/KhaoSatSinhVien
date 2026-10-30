import Link from "next/link";
import { notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { AppShell } from "@/components/AppShell";
import { PublishForm, CancelCampaignForm } from "@/components/CampaignForm";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/access";
import { getAudience } from "@/modules/survey-campaign/audience";

export default async function ReviewCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(Role.ADMIN);
  const campaign = await db.surveyCampaign.findUnique({ where: { id: (await params).id }, include: { faculty: true, semester: true, template: true, courseTemplate: true, courseTargets: { include: { course: true } }, _count: { select: { participations: true } } } });
  if (!campaign) notFound();
  const students = campaign.status === "DRAFT" ? await getAudience(db, campaign) : [];
  return <AppShell name={user.name} role="Quản trị viên" wide><Link className="text-button" href="/admin">← Quản lý khảo sát</Link><p className="eyebrow">Kiểm tra trước khi giao phiếu</p><h1>{campaign.title}</h1><section className="card stack"><p><strong>Phạm vi:</strong> {campaign.scope === "UNIVERSITY" ? "Toàn trường" : campaign.scope === "FACULTY" ? campaign.faculty?.name : "Theo lớp học phần (đợt cũ)"}</p><p className="notice">Xét duyệt khoa: {campaign.approvedAt ? "Đã duyệt" : "Chưa duyệt"} · {campaign.reviewNote ?? "Chưa có ý kiến"}. Quản trị viên có quyền công bố trực tiếp và thao tác được ghi nhật ký.</p><p><strong>Học kỳ:</strong> {campaign.semester?.name ?? "Đợt cũ chưa phân học kỳ"}</p><p><strong>Mẫu chung:</strong> {campaign.template.title}</p>{campaign.courseTemplate && <p><strong>Phần môn:</strong> {campaign.courseTemplate.title} · {campaign.courseTargets.map(t => t.course.name).join(", ")}</p>}<p className="notice">{campaign.status === "DRAFT" ? `Dự kiến ${campaign.scope === "LEGACY_CLASS" ? campaign._count.participations : students.length} sinh viên. Danh sách sẽ được chốt theo dữ liệu tại thời điểm bạn bấm Công bố.` : `Đã giao ${campaign._count.participations} phiếu. Danh sách đã được chốt.`}</p>{campaign.status === "DRAFT" && <><div className="actions">{campaign.scope!=="LEGACY_CLASS"&&<Link className="button secondary" href={`/admin/campaigns/new?edit=${campaign.id}`}>Sửa đợt nháp</Link>}</div><PublishForm campaignId={campaign.id}/><details><summary className="text-button">Hủy đợt khảo sát</summary><CancelCampaignForm campaignId={campaign.id}/></details></>}</section>{campaign.status === "DRAFT" && campaign.scope !== "LEGACY_CLASS" && <section className="card table-wrap section-title"><h2>Xem trước người nhận (tối đa 50 dòng)</h2><table><thead><tr><th>MSSV</th><th>Sinh viên</th><th>Lớp hành chính</th><th>Phần môn sẽ nhận</th></tr></thead><tbody>{students.slice(0, 50).map(s => <tr key={s.id}><td>{s.studentCode}</td><td>{s.user.name}</td><td>{s.academicClass?.code ?? "Chưa phân lớp"}</td><td>{[...new Map(s.enrollments.map(e => [e.class.courseId, e.class.course.name])).values()].join(", ") || "Chỉ phần chung"}</td></tr>)}</tbody></table></section>}</AppShell>;
}
