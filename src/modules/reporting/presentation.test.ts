import {expect,test} from "vitest";
import {matchesReportFilters,campaignReportHref,initialReportSection} from "./presentation";
const campaign={title:"Cơ khí thực hành",semesterId:"hk1",status:"PUBLISHED" as const,startsAt:new Date("2026-10-01"),endsAt:new Date("2026-11-30")},now=new Date("2026-11-01");
test("kết hợp từ khóa, học kỳ và trạng thái thực theo thời gian",()=>{
 expect(matchesReportFilters(campaign,{q:" CƠ KHÍ ",semesterId:"hk1",phase:"OPEN"},now)).toBe(true);
 expect(matchesReportFilters(campaign,{semesterId:"hk2"},now)).toBe(false);
 expect(matchesReportFilters(campaign,{q:"khác"},now)).toBe(false);
 expect(matchesReportFilters(campaign,{phase:"EXPIRED"},new Date("2026-12-01"))).toBe(true);
 expect(matchesReportFilters(campaign,{phase:"OPEN"},new Date("2026-12-01"))).toBe(false);
});
test("mở báo cáo giữ bộ lọc và dẫn tới phần kết quả",()=>{
 const href=campaignReportHref("id",{q:"Cơ khí & A",semesterId:"hk1",phase:"CLOSED"});
 const url=new URL(href,"http://test.local");expect(url.searchParams.get("q")).toBe("Cơ khí & A");expect(url.searchParams.get("campaign")).toBe("id");expect(url.hash).toBe("#ket-qua");
});

test("giao diện giảng viên mở trước một môn đủ ngưỡng, chế độ thường vẫn xem tất cả",()=>{
 const sections=[{id:"pending",responses:1},{id:"ready",responses:5}];
 expect(initialReportSection(sections,5,true)).toBe("ready");
 expect(initialReportSection(sections,5,false)).toBe("all");
 expect(initialReportSection([{id:"pending",responses:1}],5,true)).toBe("pending");
 expect(initialReportSection([],5,true)).toBe("all");
});
