import { expect,test } from "vitest";
import ExcelJS from "exceljs";
import { zipSync } from "fflate";
import { importFileText } from "./import-excel";
import { parseImportCsv } from "./import-csv";
async function file(workbook:ExcelJS.Workbook){return new File([new Uint8Array(await workbook.xlsx.writeBuffer())],"data.xlsx");}
test("nhập XLSX giữ tiếng Việt và mã dạng chữ, dùng lại kiểm tra CSV",async()=>{
 const workbook=new ExcelJS.Workbook(),sheet=workbook.addWorksheet("Nhập");sheet.addRows([["name","email","studentCode","academicClassCode"],["Nguyễn, Văn An","an@example.com","000123","CNTT01"]]);
 const rows=parseImportCsv(await importFileText(await file(workbook)),"students");
 expect(rows[0].data).toMatchObject({name:"Nguyễn, Văn An",studentCode:"000123"});
});
test("từ chối công thức, nhiều trang và quá 200 dòng",async()=>{
 const workbook=new ExcelJS.Workbook(),sheet=workbook.addWorksheet("Nhập");sheet.getCell("A1").value={formula:"1+1",result:2};
 await expect(importFileText(await file(workbook))).rejects.toThrow("công thức");
 sheet.getCell("A1").value="name";workbook.addWorksheet("Khác");await expect(importFileText(await file(workbook))).rejects.toThrow("một trang tính");
 workbook.removeWorksheet("Khác");sheet.getCell("A202").value="An";await expect(importFileText(await file(workbook))).rejects.toThrow("200 dòng");
});
test("chặn tệp nén phình to, tệp giả và định dạng cũ",async()=>{
 const bomb=zipSync({"xl/worksheets/sheet1.xml":new Uint8Array(5*1024*1024)});
 await expect(importFileText(new File([bomb],"data.xlsx"))).rejects.toThrow("quá lớn");
 await expect(importFileText(new File(["not an excel"],"data.xlsx"))).rejects.toThrow();
 await expect(importFileText(new File(["data"],"data.xls"))).rejects.toThrow(".xls");
});
