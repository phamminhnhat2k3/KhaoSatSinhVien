# Phân công học kỳ và giao khảo sát theo lớp hành chính

Cập nhật ngày 06/11/2026.

## Thao tác của Admin

1. Tạo khoa, học kỳ và lớp hành chính trong **Khoa và học vụ**. Phân sinh viên vào lớp hành chính.
2. Tạo các lớp học phần trong **Lớp học phần**, rồi phân công giảng viên thực dạy. Một môn có thể có nhiều nhóm học khác người dạy. Nếu cùng giảng một nhóm, chọn nhiều giảng viên trong nhóm đó.
3. Mở **Phân công học kỳ** (`/admin/assignments`). Chọn học kỳ, khoa, lớp hành chính, sau đó chọn các môn/lớp học phần học chung và lưu. Mỗi môn chọn một nhóm học. Không cần tạo đăng ký riêng cho từng sinh viên.
4. Với sinh viên học khác, vào **Tất cả người dùng**, mở quản lý học vụ của sinh viên và tìm **Điều chỉnh môn học riêng**. Chọn học kỳ, giữ các môn thực học, bỏ môn được miễn và chọn nhóm học khác nếu đổi người dạy. Lưu danh sách riêng sẽ thay đăng ký của riêng học kỳ đang chọn. Danh sách riêng rỗng có nghĩa không học môn nào trong học kỳ đó.
5. Bấm **Dùng lại phân công chung** để bỏ danh sách riêng và các đăng ký riêng của học kỳ đó. Sinh viên tiếp tục nhận phân công chung, kể cả khi phân công chung thay đổi sau này.
6. Khi tạo đợt theo khoa, chọn tuần tự **Học kỳ → Khoa → Lớp hành chính**. Có thể chọn nhiều lớp trong cùng khoa. Đổi học kỳ hoặc khoa sẽ xóa lựa chọn lớp cũ để tránh giao nhầm.
7. Chọn mẫu chung. Nếu đánh giá giảng dạy, chọn thêm mẫu môn học, các môn cần khảo sát và đối tượng **Từng giảng viên thực sự dạy lớp đã đăng ký** (mặc định). Soạn các câu hỏi về môn và hoạt động giảng dạy trong mẫu này. Mỗi cặp môn–giảng viên được đánh giá riêng. Chế độ chất lượng môn học vẫn chỉ cho kết quả chung theo môn.
8. Kiểm tra trang xem trước người nhận, môn và giảng viên, rồi công bố. Đợt toàn trường vẫn dùng phần chung, không lọc theo lớp hoặc khoa.

## Quy tắc dữ liệu

- `ClassStudyAssignment` nối lớp hành chính với lớp học phần. Học kỳ, môn và người dạy được xác định từ lớp học phần.
- `StudentStudyPlan` đánh dấu sinh viên có danh sách riêng trong một học kỳ. Danh sách thực học riêng nằm trong `Enrollment`. Khi có đánh dấu này, sinh viên không kế thừa phân công chung của học kỳ đó.
- Khi chưa có danh sách riêng, hệ thống kế thừa phân công lớp và giữ các đăng ký bổ sung đã có trong dữ liệu cũ. Nếu đăng ký cũ không còn đúng, Admin cần lưu lại toàn bộ danh sách riêng hoặc dùng nút khôi phục phân công chung để dọn đăng ký riêng của học kỳ.
- `CampaignAcademicClass` lưu các lớp hành chính được chọn nhận đợt khảo sát. Lớp phải thuộc khoa của đợt. Đợt nháp cũ chưa chọn lớp cần được sửa trước khi công bố.
- Khi công bố, chỉ sinh viên đang hoạt động, có vai trò Sinh viên và thuộc lớp được chọn mới nhận phiếu. Các môn và người dạy được chốt trong `ParticipationCourse` và `ParticipationTeaching`.
- Thay đổi lớp, đăng ký hay người dạy sau công bố không sửa phiếu đã giao. Bài trả lời vẫn được lưu ẩn danh, tách khỏi bảng theo dõi hoàn thành.
- Các thao tác quản lý chỉ dành cho Admin và có nhật ký. Trưởng khoa tiếp tục chỉ xem kết quả theo quyền hiện có.

## Kiểm tra đã thực hiện

- 105 bài test đạt, bao gồm phân công chung, danh sách riêng, miễn toàn bộ môn, khôi phục mặc định, sai khoa/học kỳ và chọn trùng nhóm của một môn.
- 22 kịch bản nghiệm thu Playwright đạt trên database tạm riêng, bao gồm các luồng cũ và phân công theo lớp mới.
- TypeScript, ESLint, Prisma validate và build Next.js đạt. Đối chiếu MySQL với Prisma không có sai lệch cấu trúc.
- Migration `20261106090000_class_study_plans` chỉ thêm ba bảng và khóa ngoại. Đã áp dụng trên database local, không xóa tài khoản hoặc kết quả khảo sát hiện có.

Chưa thực hiện việc xóa dữ liệu mẫu và tạo lại bộ dữ liệu mới. Sơ đồ đầy đủ SVG/HTML/draw.io/DBML/Mermaid đã bổ sung ba bảng, ảnh PNG và bản sơ đồ tinh gọn cũ chưa cập nhật.

## Hệ học lớp hành chính

Khi tạo lớp, chọn Chính quy (CQ), Vừa học vừa làm (VLVH) hoặc Đào tạo từ xa (ĐTTX). Các danh sách thêm sinh viên, chuyển lớp, lọc người dùng, phân công học kỳ và tạo đợt hiển thị nhãn hệ cạnh mã/tên lớp, ví dụ `CNTT01 · Công nghệ thông tin 01 [VLVH]`. Mã và tên gốc không tự đổi. Sinh viên có hệ học thông qua lớp hành chính, không nhập lại riêng cho từng người.

Đổi hệ của lớp hiện có tại **Khoa, lớp hành chính và học kỳ → Lớp hành chính → Hệ học → Lưu hệ học**. Migration `20261106100000_academic_class_education` thêm một cột có mặc định Chính quy. Admin cần rà và chọn lại hệ cho các lớp cũ thuộc hệ khác. Việc đổi nhãn hệ không sửa nội dung hoặc người nhận phiếu đã giao. Hệ của lớp học phần hiện có vẫn được giữ, thay đổi này không tự phân công lại môn hoặc giảng viên.
