# Database diagram — 01/11/2026

Nguồn: cấu trúc MySQL hiện tại, đối chiếu đầy đủ 24 model trong prisma/schema.prisma; thêm bảng liên kết tự động _CourseToLecturerProfile. Không bao gồm _prisma_migrations.

- **Bản dễ đọc:** mở database-simple.html; ảnh database-simple.png hoặc vector database-simple.svg. Chia thành 4 nhóm nghiệp vụ, chỉ giữ bảng/cột và quan hệ chính; một bảng có thể lặp ở các nhóm.
- database-simple.mmd: nguồn Mermaid của bản tinh gọn.
- Mở database-diagram.html bằng trình duyệt: phóng to/thu nhỏ, chọn bảng để làm nổi bật quan hệ. File hoạt động ngoại tuyến.
- database.dbml: có thể dán vào dbdiagram.io để chỉnh sửa sơ đồ.
- database.mmd: sơ đồ ERD Mermaid gồm toàn bộ cột, khóa chính và khóa ngoại.
- database-diagram.svg: bản đầy đủ dạng vector, phóng to không vỡ chữ hoặc đường nối. Mở bằng trình duyệt; dùng Ctrl + cuộn chuột để phóng to/thu nhỏ.
- database-diagram.png: ảnh raster của sơ đồ; dùng SVG khi cần phóng lớn.

Sinh viên thuộc khoa thông qua AcademicClass. Giảng viên và môn học có facultyId. Trưởng khoa là UserRole.DEAN trên tài khoản giảng viên, không có bảng riêng.

SurveyParticipation giữ trạng thái được giao/hoàn thành. Submission không có studentId/participationId; Answer chứa nội dung phản hồi. Không vẽ liên kết giữa sinh viên và bài trả lời vì database không có khóa ngoại đó.

Các trường xét duyệt cũ trong SurveyCampaign và SurveyTarget/lecturerId cũ được giữ để phản ánh đúng database, không có nghĩa ứng dụng hiện còn dùng quy trình Trưởng khoa duyệt khảo sát. approvedBy là cột String lịch sử, không phải khóa ngoại User.
