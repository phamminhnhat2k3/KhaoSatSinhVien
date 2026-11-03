# Đối chiếu báo cáo với dự án KhaoSatSinhVien

Cập nhật ngày 03/11/2026. Dùng code và Prisma schema hiện tại làm căn cứ về phạm vi; không dùng các chức năng đề xuất trong báo cáo cũ như bằng chứng đã triển khai.

## Bản báo cáo đang sử dụng

- Tuần 2: `BaoCaoTuan2_TLCN_sat_du_an.docx` — phân tích yêu cầu, 4 vai trò, 11 nhóm chức năng và quy tắc nghiệp vụ.
- Tuần 3: người dùng đã đổi tên thành `BaoCaoTuan3_TLCN.docx`; không ghi đè bản đang được người dùng chỉnh sửa. Nội dung đã giao gồm Use Case, thiết kế dữ liệu, sơ đồ tổng quan và SVG chi tiết.
- Tuần 4: `BaoCaoTuan4_TLCN.docx` — kết quả triển khai đến 28/10, bốn ô ảnh trống và lộ trình tuần 4–12 cập nhật 03/11.
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

Đính chính sau khi đọc toàn bộ lịch sử Git: repository được khởi tạo ngày 16/10/2026 (`d20c079`), có MVP ngày 19/10 (`ae7e9f3`). Nhận định trước đây rằng Git chỉ bắt đầu từ 23/10 là sai do đọc log giới hạn số lượng commit. Không dùng nhận định đó để phân chia các tuần.

Lịch tuần dùng ngày báo cáo do người dùng cung cấp: tuần 2 ngày 14/10, tuần 3 ngày 21/10, tuần 4 ngày 28/10. MVP đã xuất hiện trong tuần 3; không thể mô tả toàn bộ dự án như thể chưa bắt đầu code cho đến tuần 4. Tuần 4 là tiếp tục triển khai từ nền đã có. File tuần 3 đang mở được giữ nguyên; khi hiệu chỉnh tiếp cần sửa các câu gợi ý rằng code chỉ bắt đầu từ tuần 4.

Một số mốc có thể đối chiếu:

- `d20c079` — 16/10: khởi tạo repository.
- `ae7e9f3`, `c4d3a73`, `050ed33` — 19/10: MVP, học vụ và MySQL chạy trực tiếp trên máy.
- `839af00`, `6cf9f85` — 22/10: giao diện và trình tạo mẫu kéo thả, các trang quản trị riêng.
- `386ba32`, `69bc3dc` — 23/10: hồ sơ, thông báo, logo trường và Admin xem bài gửi ẩn danh.

- `0442800` — 28/10: phạm vi khoa/toàn trường và dữ liệu sinh viên.
- `0a4dcad` — 30/10: đánh giá người thực dạy và chốt phân công.
- `9cbe84f` — 31/10: Trưởng khoa chỉ đọc kết quả, bỏ luồng duyệt trên web.
- `c6baab6` — 02/11: tinh gọn phiếu theo phần và trang giảng viên.

Tuần 2 là yêu cầu; tuần 3 tập trung đặc tả/thiết kế nhưng đã có nền code ngày 19/10. Không gán các tính năng sau 28/10 vào phần đã hoàn thành của báo cáo tuần 4. Tại mốc 28/10 chỉ có ba role đăng nhập; DEAN xuất hiện từ 29/10, đánh giá người thực dạy và sửa/xóa mẫu từ 30/10. Kế hoạch tuần 5–12 là dự kiến rà soát/hoàn thiện từ demo hiện tại, không phải kết quả đã hoàn thành.

Ảnh chụp bổ sung trong báo cáo tuần 4 chỉ minh họa chức năng. Nếu chụp bằng demo hiện tại, bố cục có thể đã thay đổi sau 28/10; ảnh không phải bằng chứng xác nhận ngày hoàn thành. Thay ô trống bằng ảnh thật và bỏ dòng hướng dẫn chụp sau khi chèn.

## Kiểm tra tài liệu

Chạy `kiem_tra_bao_cao_tuan3.py` bằng Python của workspace dependencies. Bài kiểm tra đối chiếu vai trò, mã chức năng–Use Case, loại bỏ nhóm chức năng không có, metadata, tên bảng và hai sơ đồ nhúng. Kiểm tra cấu trúc không thay thế việc đọc nội dung và xem từng trang được xuất từ Word.

## Lộ trình và kiểm tra tuần 4

Dữ liệu lịch nằm trong `ke_hoach_tuan4_12.json`. Tuần 10 đặt mục tiêu có bản demo ổn định và tài liệu; tuần 11–12 dự phòng sửa lỗi, kiểm tra lại và bàn giao. Hạn dự kiến tuần 12 là 23/12/2026 theo nhịp ngày báo cáo đã cung cấp. Đây là kế hoạch trong phạm vi đề tài, không phải cam kết hệ thống đạt quy mô vận hành toàn trường.

Chạy `kiem_tra_bao_cao_tuan4.py` để kiểm tra ngày, các ô ảnh, lịch liên tiếp và đối chiếu snapshot Git. Kết quả QA tài liệu ngày 03/11 không được đưa ngược thành số liệu kiểm thử của ngày 28/10.
