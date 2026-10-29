export const demoFaculties = [
  { code: "CNTT", name: "Công nghệ thông tin", subjects: ["Nhập môn lập trình", "Cấu trúc dữ liệu và giải thuật", "Cơ sở dữ liệu", "Lập trình hướng đối tượng", "Mạng máy tính", "Công nghệ phần mềm", "Lập trình Web", "Trí tuệ nhân tạo", "An toàn thông tin", "Kiểm thử phần mềm"] },
  { code: "CK", name: "Cơ khí", subjects: ["Vẽ kỹ thuật", "Cơ học kỹ thuật", "Sức bền vật liệu", "Nguyên lý máy", "Chi tiết máy", "Công nghệ chế tạo máy", "Dung sai và kỹ thuật đo", "Vật liệu cơ khí", "CAD CAM CNC", "Thiết kế khuôn mẫu"] },
  { code: "DDT", name: "Điện Điện tử", subjects: ["Mạch điện", "Điện tử cơ bản", "Kỹ thuật số", "Máy điện", "Đo lường điện", "Điện tử công suất", "Vi điều khiển", "Điều khiển tự động", "Hệ thống điện", "Lập trình PLC"] },
  { code: "KT", name: "Kinh tế", subjects: ["Kinh tế vi mô", "Kinh tế vĩ mô", "Nguyên lý kế toán", "Quản trị học", "Marketing căn bản", "Tài chính doanh nghiệp", "Quản trị nhân lực", "Thống kê kinh doanh", "Quản trị chuỗi cung ứng", "Khởi nghiệp"] },
  { code: "NN", name: "Ngoại ngữ", subjects: ["Ngữ âm tiếng Anh", "Ngữ pháp tiếng Anh", "Nghe hiểu", "Nói tiếng Anh", "Đọc hiểu", "Viết học thuật", "Biên dịch", "Phiên dịch", "Văn hóa Anh Mỹ", "Tiếng Anh thương mại"] }
];
const lecturerNames = ["Nguyễn Minh Anh", "Trần Quốc Bảo", "Lê Hoàng Phúc", "Phạm Thị Mai", "Võ Thanh Tùng", "Đặng Ngọc Hà", "Bùi Văn Hùng", "Đỗ Thị Lan", "Hồ Minh Quân", "Ngô Thành Đạt", "Dương Thị Hạnh", "Lý Văn Long", "Nguyễn Thị Thu", "Trần Đức Huy", "Lê Thị Ngọc", "Phạm Quốc Việt", "Võ Thị Ánh", "Đặng Minh Khoa", "Bùi Thanh Sơn", "Đỗ Ngọc Yến"];
const surnames = ["Nguyễn", "Trần", "Lê", "Phạm", "Võ"];
const studentNames = ["Minh Nhật", "Văn Sang", "Thảo Nguyên", "Hoàng Nam", "Ngọc Anh", "Gia Hân", "Đức Minh", "Thanh Trúc", "Quốc Huy", "Phương Linh"];
export const demoAccounts = demoFaculties.flatMap((f, fi) => [
  ...Array.from({ length: 4 }, (_, i) => ({ id: `demo26-user-gv-${f.code}-${i + 1}`, profileId: `demo26-gv-${f.code}-${i + 1}`, code: `DEMO-GV-${f.code}-${i + 1}`, name: lecturerNames[fi * 4 + i], email: `demo.gv.${f.code.toLowerCase()}${i + 1}@example.com`, facultyCode: f.code, kind: "lecturer" as const, dean: i === 0, index: i })),
  ...Array.from({ length: 10 }, (_, i) => ({ id: `demo26-user-sv-${f.code}-${i + 1}`, profileId: `demo26-sv-${f.code}-${i + 1}`, code: `DEMO-SV-${f.code}-${String(i + 1).padStart(2, "0")}`, name: `${surnames[fi]} ${studentNames[i]}`, email: `demo.sv.${f.code.toLowerCase()}${String(i + 1).padStart(2, "0")}@example.com`, facultyCode: f.code, kind: "student" as const, dean: false, index: i }))
]);
export function demoSubjectIndexes(studentIndex: number) {
  return [0, 1, 2 + studentIndex % 8, 2 + (studentIndex + 2) % 8, 2 + (studentIndex + 4) % 8];
}
