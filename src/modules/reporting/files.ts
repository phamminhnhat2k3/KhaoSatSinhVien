import ExcelJS from "exceljs";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFile } from "node:fs/promises";
import type { getCampaignReport } from "./service";
import type { ComparisonData } from "@/components/ComparisonTable";

export type StandardReport = { title: string; reference: string; author: string; generatedAt: string; facts: [string, string][]; sections: { title: string; lines: string[] }[] };
export function campaignDocument(report: Awaited<ReturnType<typeof getCampaignReport>>, author: string): StandardReport {
  return { title: "BÁO CÁO KẾT QUẢ KHẢO SÁT", reference: report.id, author, generatedAt: new Date().toISOString(), facts: [["Đợt khảo sát", report.title], ["Phạm vi", report.course], ["Học kỳ", report.semester], ["Thời gian khảo sát", `${date(report.startsAt)} – ${date(report.endsAt)}`], ["Tiến độ", `${report.completed}/${report.invited} sinh viên hoàn thành (${report.participationRate}%)`], ["Bài nộp trong phạm vi", String(report.responses)], ["Ngưỡng ẩn danh", `${report.minimum} phản hồi cho mỗi phần và tiêu chí`]], sections: report.questions.map(q => ({ title: q.content, lines: q.suppressed ? ["Chưa đủ ngưỡng ẩn danh, không công bố kết quả tiêu chí."] : [`Số trả lời: ${q.respondents}/${q.invited} người được giao.`, ...(q.average !== undefined ? [`Điểm trung bình: ${q.average} (thang ${q.scaleMin}–${q.scaleMax}).`] : []), ...(q.distribution?.map(d => `${d.label}: ${d.count}`) ?? []), ...(q.comments?.map(c => `Góp ý: ${c}`) ?? [])] })) };
}
export function noteDocument(note: { id: string; title: string; observation: string; plan: string; author: { name: string }; sentAt: Date | null; snapshot: unknown }): StandardReport {
  const data = note.snapshot as ComparisonData & { capturedAt: string };
  return { title: "BÁO CÁO NHẬN XÉT VÀ HƯỚNG CẢI THIỆN", reference: note.id, author: note.author.name, generatedAt: new Date().toISOString(), facts: [["Tiêu đề", note.title], ["Đợt khảo sát", data.title], ["Khoa", data.faculty], ["Học kỳ", data.semester], ["Môn học", data.course.name], ["Ngày gửi", date(note.sentAt?.toISOString() ?? "")], ["Số liệu ghi nhận lúc", date(data.capturedAt)]], sections: [...data.teachers.filter(t => data.selected.includes(t.id)).map(t => ({ title: t.name, lines: [`Phiếu có câu trả lời: ${t.responses}/${t.invited}.`, ...t.points.map(p => `${p.question} · Thang ${p.min}–${p.max}: ${p.average === null ? "Chưa đủ ngưỡng" : `${p.average} (${p.respondents} trả lời)`}${data.comparison ? ` · Điểm chung: ${p.baseline ?? "Chưa đủ ngưỡng"} · Chênh lệch: ${p.average !== null && p.baseline !== null ? (p.average-p.baseline).toFixed(2) : "—"}` : ""}`)] })), ...(data.trend ? [{ title: `Đối chiếu học kỳ ${data.trend.title}`, lines: data.trend.teachers.flatMap(t => t.points.map(p => `${t.name} · ${p.question}: Đợt đối chiếu ${p.before ?? "Không tương thích / thiếu ngưỡng"}, đợt đang xem ${p.after ?? "Thiếu ngưỡng"} · Chênh lệch: ${p.difference ?? "—"}`)) }] : []), { title: "Nhận xét", lines: [note.observation] }, { title: "Hướng cải thiện và thời gian dự kiến", lines: [note.plan] }, { title: "Cách đọc kết quả", lines: [`Điểm chung có trọng số số người trả lời, tính các ô đạt ngưỡng ${data.minimum} phản hồi, gồm giảng viên đang chọn. Không tự xếp hạng giảng viên. Khác lớp, hệ học và tỷ lệ tham gia có thể ảnh hưởng kết quả.`, "Bản đã gửi giữ nguyên nội dung và số liệu căn cứ, không nối danh tính sinh viên với bài nộp."] }] };
}
function date(value: string) { return value ? new Date(value).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : "Không có"; }
function clean(text: string) { return text.replace(/\p{Cc}/gu, char => ["\n","\r","\t"].includes(char) ? char : ""); }
export async function reportXlsx(document: StandardReport) {
  const workbook = new ExcelJS.Workbook(); workbook.creator = "Cổng khảo sát sinh viên";
  const summary = workbook.addWorksheet("Thông tin báo cáo"); summary.columns = [{ width: 28 }, { width: 95 }];
  summary.addRow([document.title]); summary.addRows([["Mã báo cáo", document.reference], ["Người lập", document.author], ["Ngày xuất", date(document.generatedAt)], ...document.facts]);
  const detail = workbook.addWorksheet("Kết quả"); detail.columns = [{ width: 65 }, { width: 100 }]; detail.addRow(["Nội dung / tiêu chí", "Kết quả"]);
  for (const section of document.sections) for (const line of section.lines) detail.addRow([clean(section.title), clean(line)]);
  for (const sheet of workbook.worksheets) {
    sheet.views = [{ state: "frozen", ySplit: 1 }];
    sheet.getRow(1).font = { bold: true, size: 12 }; sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8EEF4" } };
    sheet.eachRow(row => row.eachCell(cell => { cell.alignment = { vertical: "top", wrapText: true }; }));
    sheet.pageSetup = { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
  }
  return new Uint8Array(await workbook.xlsx.writeBuffer());
}
export async function reportPdf(document: StandardReport) {
  const pdf = await PDFDocument.create(); pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(await readFile(`${process.cwd()}/assets/fonts/NotoSans-Regular.ttf`), { subset: true });
  let page = pdf.addPage([595.28,841.89]), y = 795;
  function paragraph(text: string, size = 10, gap = 6) {
    const width = 499, lineHeight = size*1.5;
    for (const paragraph of clean(text).split(/\r?\n/)) {
      const lines: string[] = []; let line = "";
      for (const word of paragraph.split(/\s+/)) {
        if (font.widthOfTextAtSize(`${line} ${word}`,size) <= width) { line = line ? `${line} ${word}` : word; continue; }
        if (line) { lines.push(line); line = ""; }
        for (const char of word) { if (font.widthOfTextAtSize(line+char,size)>width) { lines.push(line); line=""; } line+=char; }
      }
      lines.push(line);
      for (const textLine of lines) { if(y<65) { page=pdf.addPage([595.28,841.89]); y=795; } page.drawText(textLine,{x:48,y,size,font,color:rgb(0,0,0)}); y-=lineHeight; }
    }
    y-=gap;
  }
  paragraph("TRƯỜNG ĐẠI HỌC CÔNG NGHỆ KỸ THUẬT TP HỒ CHÍ MINH",10,3);
  paragraph("Cổng khảo sát và phản hồi sinh viên",10,12);
  paragraph(document.title,14,12);
  for(const [label,value] of [["Mã báo cáo",document.reference],["Người lập",document.author],["Ngày xuất",date(document.generatedAt)],...document.facts]) paragraph(`${label}: ${value}`,10,2);
  for(const section of document.sections) { if(y<110) {page=pdf.addPage([595.28,841.89]);y=795;} paragraph(section.title,11,4); for(const line of section.lines) paragraph(line); }
  const pages=pdf.getPages(); pages.forEach((p,i)=>{
    p.drawText("Báo cáo trong phạm vi được cấp quyền, không công bố danh tính sinh viên.",{x:48,y:43,size:8,font});
    p.drawText("Không thay thế quyết định đánh giá hoặc xếp loại.",{x:48,y:31,size:8,font});
    p.drawText(`Trang ${i+1}/${pages.length}`,{x:480,y:20,size:9,font});
  });
  pdf.setTitle(document.title); pdf.setAuthor(document.author);
  return pdf.save();
}
export async function reportResponse(document: StandardReport, format: string) {
  const pdf=format==="pdf";
  const bytes=pdf ? await reportPdf(document) : await reportXlsx(document);
  return new Response(Buffer.from(bytes), { headers: { "Content-Type": pdf ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="report-${document.reference.replace(/[^\w-]/g,"")}.${pdf?"pdf":"xlsx"}"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
