import ExcelJS from "exceljs";
import { currentUser } from "@/lib/access";
import { importColumns, type ImportKind } from "@/modules/academic/import-csv";
export async function GET(request: Request) {
  if(!(await currentUser())?.roles.includes("ADMIN"))return new Response("Không có quyền truy cập.",{status:403});
  const kind=new URL(request.url).searchParams.get("kind") as ImportKind;
  if(!Object.hasOwn(importColumns,kind))return new Response("Loại dữ liệu không hợp lệ.",{status:400});
  const examples={students:["Nguyễn Văn An","sv.an@example.com","SV001","CNTT25-CQ"],lecturers:["Nguyễn Minh Anh","gv.anh@example.com","GV001","CNTT","no"],assignments:["Học kỳ 1 · 2026–2027","CNTT25-CQ","CNTT101-1-HK1"]};
  const workbook=new ExcelJS.Workbook(),sheet=workbook.addWorksheet("Dữ liệu nhập");
  sheet.addRow([...importColumns[kind]]);sheet.addRow(examples[kind]);
  sheet.columns.forEach(c=>{c.width=32;c.numFmt="@";});sheet.getRow(1).font={bold:true};sheet.views=[{state:"frozen",ySplit:1}];
  return new Response(Buffer.from(await workbook.xlsx.writeBuffer()),{headers:{"Content-Type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","Content-Disposition":`attachment; filename="${kind}-mau.xlsx"`,"Cache-Control":"private, no-store"}});
}
