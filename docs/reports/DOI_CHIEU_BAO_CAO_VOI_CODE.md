# Đối chiếu báo cáo với dự án KhaoSatSinhVien

Cập nhật ngày 03/11/2026. Dùng code và Prisma schema hiện tại làm căn cứ về phạm vi; không dùng các chức năng đề xuất trong báo cáo cũ như bằng chứng đã triển khai.

## Bản báo cáo đang sử dụng

- Tuần 2: `BaoCaoTuan2_TLCN_sat_du_an.docx` — phân tích yêu cầu, 4 vai trò, 11 nhóm chức năng và quy tắc nghiệp vụ.
- Tuần 3: `BaoCaoTuan3_TLCN_bo_sung_database.docx` — Use Case, thiết kế dữ liệu, sơ đồ tổng quan và SVG chi tiết.
- Hai file gốc trong `C:/ChatGPT` được giữ nguyên. Bản tuần 3 cũ ở `docs/bao-cao` không phải bản vừa hiệu chỉnh.

## Căn cứ nội dung

| Nội dung | Code kiểm tra |
| --- | --- |
| Chỉ có ADMIN, STUDENT, LECTURER, DEAN | `prisma/schema.prisma`, `src/lib/access.ts` |
| Trưởng khoa chỉ xem các đợt cấp khoa và báo cáo của khoa | `src/app/dean/page.tsx`, `src/modules/reporting/access.ts`, `src/modules/academic/permissions.ts` |
| Admin quản lý dữ liệu, phân công, tạo và công bố khảo sát | `src/app/admin/actions.ts`, `src/app/admin/lecturers/actions.ts`, `src/app/admin/academic/actions.ts` |
| Phạm vi khoa hoặc toàn trường; toàn trường chỉ phần chung | `src/modules/survey-campaign/input.ts`, `audience.ts` |
| Giao đúng môn đã đăng ký, đúng giảng viên thực dạy và chốt khi công bố | `src/modules/survey-campaign/audience.ts`, `teaching.ts`, `src/modules/response/questions.ts` |
| Lưu nháp thủ công, kiểm tra và gửi một lần trong thời hạn | `src/components/SurveyForm.tsx`, `src/modules/response/service.ts`, `rules.ts` |
| Mẫu đã dùng chỉnh sửa thành phiên bản mới, không được xóa | `src/modules/templates/manage.ts` |
| Báo cáo đóng/hết hạn, ngưỡng cho phần và câu; quyền xem, CSV | `src/modules/reporting/service.ts`, `access.ts`, `src/app/api/reports/campaigns/[id]/export/route.ts` |
| Admin xem từng bài ẩn danh, không nối với tên người gửi | `src/app/admin/campaigns/[id]/responses/[submissionId]/page.tsx`, `prisma/schema.prisma` |
| Thông báo trong web khi công bố/đóng, đọc theo tài khoản | `src/modules/notifications/service.ts`, `src/components/NotificationLink.tsx` |
| Hồ sơ, đổi mật khẩu và ảnh đại diện tự cập nhật | `src/app/profile/actions.ts`, `src/app/api/avatars/route.ts` |
| Đăng nhập Credentials, mật khẩu băm Argon2 | `src/auth.ts` |

Kế hoạch được duyệt bên ngoài trước khi tạo khảo sát là quy trình do người dùng xác nhận. Website không có chức năng tải, lưu hay xác minh văn bản kế hoạch; không mô tả như thể website đã tự kiểm chứng việc phê duyệt.

## Những phần đã bỏ khỏi chức năng chính

Không có quy trình giải trình/kế hoạch cải thiện, xử lý vi phạm, phản ánh ngoài khảo sát, tự nhận diện phản hồi bất thường, phân tích xu hướng nhiều học kỳ, nhắc hạn theo lịch, gửi email/push, SSO, đồng bộ dữ liệu đào tạo hoặc sao lưu tự động. Không viết những phần này là đã làm xong.

Từ ngữ cần giữ chính xác: báo cáo CSV, không phải PDF/Excel; lưu nháp sinh viên bằng nút bấm, không tự lưu; hết hạn thì chặn nhận bài và có thể mở báo cáo đủ ngưỡng, không đồng nghĩa đã có tác vụ định kỳ đổi trạng thái và gửi thông báo đóng.

## Mốc thời gian và giới hạn chứng cứ

Lịch sử Git đang có bắt đầu từ 23/10/2026. Không thể dùng lịch sử này để chứng minh một chức năng đã được code vào ngày 14/10 hoặc 21/10 ghi trên hai tài liệu gốc.

Một số mốc có thể đối chiếu:

- `0442800` — 28/10: phạm vi khoa/toàn trường và dữ liệu sinh viên.
- `0a4dcad` — 30/10: đánh giá người thực dạy và chốt phân công.
- `9cbe84f` — 31/10: Trưởng khoa chỉ đọc kết quả, bỏ luồng duyệt trên web.
- `c6baab6` — 02/11: tinh gọn phiếu theo phần và trang giảng viên.

Tuần 2 được viết dưới dạng yêu cầu; tuần 3 dưới dạng đặc tả/thiết kế. Các tính năng code ở những mốc sau không được nhận là đã hoàn thành lập trình trong tuần 2 hoặc tuần 3. Lịch tuần 4–5 là kế hoạch trong tài liệu; khi lập báo cáo kết quả cần đối chiếu code, commit và kiểm tra tương ứng với ngày báo cáo.

## Kiểm tra tài liệu

Chạy `kiem_tra_bao_cao_tuan3.py` bằng Python của workspace dependencies. Bài kiểm tra đối chiếu vai trò, mã chức năng–Use Case, loại bỏ nhóm chức năng không có, metadata, tên bảng và hai sơ đồ nhúng. Kiểm tra cấu trúc không thay thế việc đọc nội dung và xem từng trang được xuất từ Word.
