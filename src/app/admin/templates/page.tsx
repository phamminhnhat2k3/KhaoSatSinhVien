import Link from "next/link";
import {Role} from "@prisma/client";
import {AppShell} from "@/components/AppShell";
import {DeleteTemplateForm} from "@/components/DeleteTemplateForm";
import {requireUser} from "@/lib/access";
import {db} from "@/lib/db";
import {questionTypes} from "@/modules/templates/rules";

export default async function TemplatesPage({searchParams}:{searchParams:Promise<{saved?:string;updated?:string;versioned?:string;deleted?:string}>}){
  const user=await requireUser(Role.ADMIN),params=await searchParams;
  const templates=await db.surveyTemplate.findMany({include:{
    questions:{orderBy:{position:"asc"},include:{options:{orderBy:{position:"asc"}}}},
    campaigns:{select:{id:true}},courseCampaigns:{select:{id:true}}
  },orderBy:{createdAt:"desc"}});
  return <AppShell name={user.name} role="Quản trị viên" wide>
    <Link className="text-button" href="/admin">← Trung tâm điều hành</Link>
    <div className="section-heading"><div><p className="eyebrow">Kho nội dung</p><h1>Thư viện mẫu khảo sát</h1></div><Link className="button" href="/admin/templates/new">＋ Tạo mẫu</Link></div>
    <p className="lead">Mẫu chưa sử dụng được chỉnh sửa hoặc xóa. Chỉnh sửa mẫu đã dùng sẽ tạo phiên bản mới, bảo toàn phiếu và kết quả cũ.</p>
    {params.saved&&<p className="notice" role="status">{params.versioned?"Đã lưu phiên bản mới. Các đợt khảo sát hiện có vẫn giữ mẫu cũ.":params.updated?"Đã cập nhật mẫu khảo sát thành công.":"Đã lưu mẫu khảo sát thành công."}</p>}
    {params.deleted&&<p className="notice" role="status">Đã xóa mẫu khảo sát chưa sử dụng.</p>}
    <div className="stack">{!templates.length&&<div className="card empty-state">Chưa có mẫu. Tạo mẫu đầu tiên để bắt đầu.</div>}
    {templates.map(t=>{
      const uses=new Set([...t.campaigns,...t.courseCampaigns].map(c=>c.id)).size;
      return <article className="card template-card" key={t.id}>
        <div className="section-heading"><div><h2>{t.title}</h2><p className="muted">Phiên bản {t.version} · {t.questions.length} câu hỏi · Được dùng trong {uses} đợt · {t.createdAt.toLocaleDateString("vi-VN",{timeZone:"Asia/Ho_Chi_Minh"})}</p></div>
          <div className="actions template-library-actions"><Link className="button" href={`/admin/templates/new?edit=${t.id}`}>Chỉnh sửa</Link><Link className="button secondary" href={`/admin/templates/new?copy=${t.id}`}>Tạo bản sao</Link><DeleteTemplateForm id={t.id} title={t.title} version={t.version} used={uses>0}/></div>
        </div>
        {uses>0&&<p className="muted">Mẫu đã dùng: không thể xóa. Chỉnh sửa sẽ lưu thành phiên bản mới để bạn chọn cho các đợt tiếp theo.</p>}
        <details><summary className="text-button">Xem nội dung câu hỏi</summary>{t.questions.map((q,i)=><section className="question" key={q.id}><strong>{i+1}. {q.content}</strong><p className="muted">{questionTypes[q.type]} · {q.required?"Bắt buộc":"Không bắt buộc"}{q.type==="SCALE"&&` · ${q.scaleMin}–${q.scaleMax}, bước ${q.scaleStep}`}</p>{q.options.map(o=><p key={o.id}>• {o.label}</p>)}</section>)}</details>
      </article>;
    })}</div>
  </AppShell>;
}
