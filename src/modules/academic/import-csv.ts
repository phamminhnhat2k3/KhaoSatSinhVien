export const importColumns = {
  students: ["name", "email", "studentCode", "academicClassCode"],
  lecturers: ["name", "email", "lecturerCode", "facultyCode", "dean"],
  assignments: ["semesterName", "academicClassCode", "courseClassCode"],
} as const;
export type ImportKind = keyof typeof importColumns;
export function parseImportCsv(raw: string, kind: ImportKind) {
  if (raw.length > 200000 || raw.includes("\uFFFD")) throw new Error("Tệp phải là CSV UTF-8, tối đa 200 KB.");
  const source = raw.replace(/^\uFEFF/, "");
  const header = source.split(/\r?\n/, 1)[0];
  const delimiter = header.includes(";") && !header.includes(",") ? ";" : ",";
  const rows: string[][] = []; let row: string[] = [], field = "", quoted = false, closed = false;
  const pushField = () => { row.push(field.trim()); field = ""; closed = false; };
  const pushRow = () => { pushField(); if (row.some(Boolean)) rows.push(row); row = []; };
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (quoted) { if (c === '"') { if (source[i+1] === '"') { field += '"'; i++; } else { quoted = false; closed = true; } } else field += c; }
    else if (c === delimiter) pushField();
    else if (c === "\r" || c === "\n") { if (c === "\r" && source[i+1] === "\n") i++; pushRow(); }
    else if (c === '"' && !field && !closed) quoted = true;
    else { if (closed || c === '"') throw new Error("CSV sai dấu ngoặc kép. Hãy xuất lại tệp CSV UTF-8."); field += c; }
  }
  if (quoted) throw new Error("CSV chưa đóng dấu ngoặc kép.");
  if (field || row.length || closed) pushRow();
  const columns = importColumns[kind];
  if (!rows.length || rows[0].join(",") !== columns.join(",")) throw new Error(`Dòng tiêu đề phải đúng thứ tự: ${columns.join(",")}`);
  const data = rows.slice(1);
  if (!data.length || data.length > 200) throw new Error("Mỗi lần nhập từ 1 đến 200 dòng dữ liệu.");
  return data.map((values, index) => ({ line: index+2, values, data: Object.fromEntries(columns.map((key, i) => [key, values[i] ?? ""])), error: values.length === columns.length ? "" : "Số cột không khớp tiêu đề." }));
}
