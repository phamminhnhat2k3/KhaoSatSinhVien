# Database diagram — Chức năng đang dùng · 01/11/2026

Nguồn: đối chiếu MySQL, 24 model Prisma và các chức năng hiện có. Bản sơ đồ chính giữ 25 bảng (gồm liên kết môn–giảng viên tự động), 116 cột và 40 khóa ngoại. Chỉ lược 3 cột xét duyệt đã ngừng dùng; không thay đổi cấu trúc database. Không bao gồm _prisma_migrations.

- database-web.drawio: sơ đồ draw.io, có thể di chuyển/chỉnh sửa riêng từng bảng, cột và đường nối. Mở bằng File → Open From → Device.
- database-web.xml: cùng nội dung XML không nén để sao chép/chỉnh mã.
- database-web.dbml và database-web.mmd: nguồn sơ đồ theo chức năng đang dùng.
- database.dbml và database.mmd: bản cấu trúc MySQL đầy đủ, giữ cả các cột lịch sử để đối chiếu.

- **Bản dễ đọc:** mở database-simple.html; ảnh database-simple.png hoặc vector database-simple.svg. Chia thành 4 nhóm nghiệp vụ, chỉ giữ bảng/cột và quan hệ chính; một bảng có thể lặp ở các nhóm.
- database-simple.mmd: nguồn Mermaid của bản tinh gọn.
- Mở database-diagram.html bằng trình duyệt: phóng to/thu nhỏ, chọn bảng để làm nổi bật quan hệ. File hoạt động ngoại tuyến.
- database.dbml: có thể dán vào dbdiagram.io để chỉnh sửa sơ đồ.
- database.mmd: sơ đồ ERD Mermaid gồm toàn bộ cột, khóa chính và khóa ngoại.
- database-diagram.svg: bản đầy đủ dạng vector, phóng to không vỡ chữ hoặc đường nối. Mở bằng trình duyệt; dùng Ctrl + cuộn chuột để phóng to/thu nhỏ.
- database-diagram.png: ảnh raster của sơ đồ; dùng SVG khi cần phóng lớn.

Sinh viên thuộc khoa thông qua AcademicClass. Giảng viên và môn học có facultyId. Trưởng khoa là UserRole.DEAN trên tài khoản giảng viên, không có bảng riêng.

SurveyParticipation giữ trạng thái được giao/hoàn thành. Submission không có studentId/participationId; Answer chứa nội dung phản hồi. Không vẽ liên kết giữa sinh viên và bài trả lời vì database không có khóa ngoại đó.

Đã lược approvedAt, approvedBy, reviewNote khỏi sơ đồ chính vì web không còn bước xét duyệt của Trưởng khoa. Ba cột này vẫn tồn tại trong MySQL và bản DBML đầy đủ.

SurveyTarget và CourseClass.lecturerId vẫn được web đọc để xem báo cáo/phiếu khảo sát cũ, nên giữ trên sơ đồ và ghi chú là phần lịch sử. CourseTeaching, ParticipationTeaching, CampaignCourse, ParticipationCourse vẫn dùng cho phân công và giao đánh giá; Notification/AuditLog vẫn dùng cho thông báo và nhật ký, dù không phải mỗi bảng đều có một màn hình riêng.
