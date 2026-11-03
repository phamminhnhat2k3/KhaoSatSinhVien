# Đối chiếu báo cáo với dự án KhaoSatSinhVien

Cập nhật ngày 03/11/2026. Dùng code và Prisma schema hiện tại làm căn cứ về phạm vi; không dùng các chức năng đề xuất trong báo cáo cũ như bằng chứng đã triển khai.

## Bản báo cáo đang sử dụng

- Tuần 2: `BaoCaoTuan2_TLCN_sat_du_an.docx` — phân tích yêu cầu, 4 vai trò, 11 nhóm chức năng và quy tắc nghiệp vụ.
- Tuần 3: người dùng đã đổi tên thành `BaoCaoTuan3_TLCN.docx`; không ghi đè bản đang được người dùng chỉnh sửa. Nội dung đã giao gồm Use Case, thiết kế dữ liệu, sơ đồ tổng quan và SVG chi tiết.
- Tuần 4: `BaoCaoTuan4_TLCN.docx` — nội dung nền website và luồng khảo sát, bốn ô ảnh trống và phân bổ nội dung tuần 4–12. Ngày 28/10 là ngày báo cáo, không phải hạn chốt code.
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

Theo xác nhận của người dùng, lịch báo cáo và thời gian thực hiện dự án là hai mốc riêng. Báo cáo được chia hợp lý trong 12 tuần; phần đã code sớm có thể được trình bày ở tuần sau. Code dùng để xác nhận chức năng có thật, không dùng ngày commit để ép chức năng phải nằm trong một tuần báo cáo cụ thể. Không viết rằng một chức năng chỉ bắt đầu được làm ở tuần đó nếu không có căn cứ.

Tuần 2 tập trung yêu cầu, tuần 3 thiết kế dữ liệu, tuần 4 bắt đầu trình bày phần code. Đây là trình tự trình bày báo cáo, không khẳng định dự án thực tế chưa có code trước tuần 4. Giữ nguyên bản tuần 3 đang được người dùng chỉnh sửa.

Một số mốc có thể đối chiếu:

- `d20c079` — 16/10: khởi tạo repository.
- `ae7e9f3`, `c4d3a73`, `050ed33` — 19/10: MVP, học vụ và MySQL chạy trực tiếp trên máy.
- `839af00`, `6cf9f85` — 22/10: giao diện và trình tạo mẫu kéo thả, các trang quản trị riêng.
- `386ba32`, `69bc3dc` — 23/10: hồ sơ, thông báo, logo trường và Admin xem bài gửi ẩn danh.

- `0442800` — 28/10: phạm vi khoa/toàn trường và dữ liệu sinh viên.
- `0a4dcad` — 30/10: đánh giá người thực dạy và chốt phân công.
- `9cbe84f` — 31/10: Trưởng khoa chỉ đọc kết quả, bỏ luồng duyệt trên web.
- `c6baab6` — 02/11: tinh gọn phiếu theo phần và trang giảng viên.

Các mốc Git trên chỉ để tham khảo lịch sử thực tế, không quy định phân bổ tuần báo cáo. Không mô tả chức năng chưa có là đã hoàn thành. Việc trình bày phần có thật ở một tuần dự kiến không đồng nghĩa cam kết ngày hoàn thành; các mục kiểm tra và dự phòng vẫn là kế hoạch.

Ảnh chụp dùng demo hiện tại để minh họa chức năng, không xác nhận ngày code. Thay ô trống bằng ảnh thật và bỏ dòng hướng dẫn chụp sau khi chèn.

## Kiểm tra tài liệu

Chạy `kiem_tra_bao_cao_tuan3.py` bằng Python của workspace dependencies. Bài kiểm tra đối chiếu vai trò, mã chức năng–Use Case, loại bỏ nhóm chức năng không có, metadata, tên bảng và hai sơ đồ nhúng. Kiểm tra cấu trúc không thay thế việc đọc nội dung và xem từng trang được xuất từ Word.

## Lộ trình và kiểm tra tuần 4

Dữ liệu lịch nằm trong `ke_hoach_tuan4_12.json`. Tuần 10 đặt mục tiêu có bản demo ổn định và tài liệu; tuần 11–12 dự phòng sửa lỗi, kiểm tra lại và bàn giao. Hạn dự kiến tuần 12 là 23/12/2026 theo nhịp ngày báo cáo đã cung cấp. Đây là kế hoạch trong phạm vi đề tài, không phải cam kết hệ thống đạt quy mô vận hành toàn trường.

Chạy `kiem_tra_bao_cao_tuan4.py` để kiểm tra các ô ảnh, lịch báo cáo liên tiếp, phần dự phòng và cách tách lịch báo cáo khỏi ngày code. Không dùng số bài test hiện tại làm số liệu kiểm thử của một ngày trong quá khứ.
