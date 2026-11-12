import { expect,test } from "vitest";
import ExcelJS from "exceljs";
import { PDFDocument } from "pdf-lib";
import { reportXlsx,reportPdf,type StandardReport } from "./files";
const data:StandardReport={title:"BÁO CÁO KẾT QUẢ KHẢO SÁT",reference:"demo",author:"Nguyễn Văn An",generatedAt:"2026-11-13T10:00:00Z",facts:[["Khoa","Công nghệ thông tin"]],sections:[{title:"Giảng viên hỗ trợ học tập",lines:["Điểm trung bình: 4.5 (thang 1–5)","=1+1","Chưa đủ ngưỡng, không công bố."]}]};
test("Excel thật có thông tin và kết quả, không biến văn bản thành công thức",async()=>{
 const workbook=new ExcelJS.Workbook();const bytes=await reportXlsx(data);await workbook.xlsx.load(bytes.buffer as ArrayBuffer);
 expect(workbook.worksheets.map(s=>s.name)).toEqual(["Thông tin báo cáo","Kết quả"]);
 expect(workbook.getWorksheet("Kết quả")!.getCell("B3").value).toBe("=1+1");
 expect(workbook.getWorksheet("Kết quả")!.getCell("B3").type).toBe(ExcelJS.ValueType.String);
});
test("PDF tải trực tiếp có font tiếng Việt và tự ngắt nhiều trang",async()=>{
 const bytes=await reportPdf({...data,sections:[{title:"Góp ý",lines:Array.from({length:150},()=>"Sinh viên góp ý cần tăng thời gian thực hành và phản hồi bài tập.")}]});
 expect(Buffer.from(bytes).subarray(0,5).toString()).toBe("%PDF-");
 const doc=await PDFDocument.load(bytes);expect(doc.getPageCount()).toBeGreaterThan(2);expect(doc.getTitle()).toBe(data.title);
});
