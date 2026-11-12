import ExcelJS from "exceljs";
import { Unzip, UnzipInflate } from "fflate";

export async function importFileText(file: File) {
  if (!file.size || file.size>200000) throw new Error("Chọn CSV hoặc XLSX không quá 200 KB.");
  const bytes=new Uint8Array(await file.arrayBuffer());
  if(file.name.toLowerCase().endsWith(".csv"))return new TextDecoder("utf-8",{fatal:true}).decode(bytes);
  if(!file.name.toLowerCase().endsWith(".xlsx"))throw new Error("Chỉ nhận tệp .csv hoặc .xlsx, không nhận .xls hoặc .xlsm.");
  let expanded=0, entries=0;
  const zip=new Unzip(entry=>{
    if(++entries>100 || (entry.originalSize??0)>4*1024*1024)throw new Error("Tệp Excel quá lớn sau giải nén.");
    let size=0;
    entry.ondata=(error,data)=>{ if(error)throw error; size+=data.length; expanded+=data.length; if(size>4*1024*1024||expanded>8*1024*1024)throw new Error("Tệp Excel quá lớn sau giải nén."); };
    entry.start();
  });zip.register(UnzipInflate);
  for(let offset=0;offset<bytes.length;offset+=512)zip.push(bytes.subarray(offset,offset+512),offset+512>=bytes.length);
  const workbook=new ExcelJS.Workbook(); await workbook.xlsx.load(bytes.buffer as ArrayBuffer);
  if(workbook.worksheets.length!==1)throw new Error("Tệp nhập chỉ được có một trang tính.");
  const sheet=workbook.worksheets[0];
  if(sheet.rowCount>201 || sheet.columnCount>5)throw new Error("Tối đa 200 dòng dữ liệu và 5 cột. Dùng đúng tệp mẫu.");
  const lines:string[]=[];
  sheet.eachRow({includeEmpty:true},row=>{
    const values:string[]=[];
    for(let col=1;col<=sheet.columnCount;col++) {
      const value=row.getCell(col).value;
      if(value!==null && typeof value!=="string" && typeof value!=="number" && typeof value!=="boolean")throw new Error("Không nhận công thức, liên kết, ô ngày hoặc nội dung phức tạp. Dùng văn bản cho mã và tên học kỳ.");
      values.push(`"${String(value??"").replaceAll('"','""')}"`);
    }
    if(values.some(v=>v!=='""'))lines.push(values.join(","));
  });
  return lines.join("\r\n");
}
