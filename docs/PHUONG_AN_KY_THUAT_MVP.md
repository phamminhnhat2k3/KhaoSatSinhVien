# Phương án kỹ thuật cho phiên bản MVP

## 1. Mục tiêu

Xây dựng một hệ thống khảo sát và phản hồi sinh viên có thể chạy hoàn chỉnh trên môi trường local. MVP phải chứng minh được quy trình nghiệp vụ cốt lõi từ lúc quản trị viên tạo khảo sát đến khi sinh viên gửi câu trả lời và người có thẩm quyền xem báo cáo tổng hợp.

MVP được xem là thành công khi:

- Quản trị viên tạo, cấu hình và công bố được một đợt khảo sát.
- Sinh viên đăng nhập, xem khảo sát cần thực hiện và gửi câu trả lời hợp lệ.
- Hệ thống ghi nhận trạng thái hoàn thành nhưng không công khai danh tính người trả lời trong báo cáo.
- Giảng viên và quản trị viên xem được kết quả tổng hợp đúng phạm vi được phân quyền.
- Các luồng quan trọng có kiểm thử tự động và đạt tiêu chí nghiệm thu.

## 2. Phạm vi chức năng MVP

### 2.1. Chức năng bắt buộc

1. Đăng nhập, đăng xuất và quản lý phiên làm việc.
2. Phân quyền theo vai trò sinh viên, giảng viên và quản trị viên.
3. Quản lý người dùng, môn học, lớp học phần và quan hệ đăng ký học.
4. Tạo và chỉnh sửa mẫu khảo sát.
5. Hỗ trợ câu hỏi một lựa chọn, nhiều lựa chọn, thang điểm và tự luận.
6. Tạo đợt khảo sát, chọn đối tượng, đặt thời gian và công bố khảo sát.
7. Hiển thị danh sách khảo sát sinh viên cần thực hiện.
8. Lưu bản nháp, kiểm tra dữ liệu và gửi câu trả lời.
9. Ngăn gửi trùng khi khảo sát không cho phép thực hiện lại.
10. Thống kê tỷ lệ tham gia, điểm trung bình và phân bố câu trả lời.
11. Hiển thị phản hồi tự luận theo đúng phạm vi quyền truy cập.
12. Dashboard cơ bản theo từng vai trò.
13. Tra cứu lịch sử khảo sát và xuất báo cáo cơ bản.

### 2.2. Chưa đưa vào MVP

- Nhắc khảo sát thông minh theo hành vi người dùng.
- Phát hiện phản hồi bất thường bằng mô hình nâng cao.
- Phân tích xu hướng qua nhiều học kỳ ở mức chuyên sâu.
- Quy trình tiếp nhận phản ánh ngoài khảo sát.
- Quy trình giải trình, phê duyệt và theo dõi cải tiến nhiều cấp.
- Đồng bộ tự động với hệ thống đào tạo hoặc đăng nhập một lần của trường.

Các chức năng này được giữ trong định hướng phát triển sau MVP và không được làm ảnh hưởng đến tiến độ hoàn thiện luồng cốt lõi.

## 3. Công nghệ sử dụng

| Thành phần | Công nghệ | Mục đích |
| --- | --- | --- |
| Web framework | Next.js và TypeScript | Xây dựng giao diện, API và logic phía máy chủ trong cùng dự án |
| Giao diện | React và Tailwind CSS | Xây dựng giao diện nhất quán, responsive và dễ bảo trì |
| Cơ sở dữ liệu | MySQL | Lưu dữ liệu nghiệp vụ có quan hệ và hỗ trợ giao dịch |
| ORM | Prisma | Khai báo mô hình dữ liệu, migration và truy vấn an toàn kiểu dữ liệu |
| Xác thực | Auth.js với Credentials provider | Đăng nhập nội bộ bằng tài khoản và mật khẩu trong giai đoạn MVP |
| Kiểm tra dữ liệu | Zod | Dùng chung quy tắc kiểm tra dữ liệu ở biểu mẫu và máy chủ |
| Unit và integration test | Vitest | Kiểm thử logic nghiệp vụ, quyền truy cập và tầng dịch vụ |
| End-to-end test | Playwright | Kiểm thử các hành trình chính trên trình duyệt |
| Chất lượng mã nguồn | ESLint và Prettier | Phát hiện lỗi phổ biến và thống nhất định dạng mã nguồn |

Không khóa cứng số phiên bản trong tài liệu này. Phiên bản cụ thể sẽ được ghi trong `package.json` khi khởi tạo dự án và chỉ nâng cấp sau khi toàn bộ kiểm thử đạt.

## 4. Kiến trúc tổng thể

MVP sử dụng kiến trúc **modular monolith**. Giao diện, API và nghiệp vụ được triển khai trong một ứng dụng Next.js, nhưng mã nguồn được chia theo mô-đun nghiệp vụ để có thể tách dịch vụ khi dự án phát triển thành khóa luận.

Luồng xử lý chung:

```text
Trình duyệt
    |
    v
Next.js UI và Route Handlers
    |
    v
Tầng xác thực, phân quyền và dịch vụ nghiệp vụ
    |
    v
Prisma ORM
    |
    v
MySQL
```

Quy tắc kiến trúc:

- Giao diện không truy cập Prisma trực tiếp.
- Route Handler hoặc Server Action chỉ tiếp nhận yêu cầu, xác thực dữ liệu và gọi dịch vụ nghiệp vụ.
- Dịch vụ nghiệp vụ chịu trách nhiệm kiểm tra quyền, trạng thái khảo sát và quy tắc gửi phản hồi.
- Các thao tác liên quan nhiều bảng phải chạy trong transaction.
- Báo cáo chỉ đọc dữ liệu đã được kiểm tra phạm vi truy cập.
- Các mô-đun không nhập mã nội bộ của nhau ngoài giao diện công khai đã định nghĩa.

## 5. Mô-đun nghiệp vụ

### 5.1. Identity

Quản lý tài khoản, mật khẩu, phiên đăng nhập, trạng thái tài khoản và vai trò.

### 5.2. Academic

Quản lý học kỳ, môn học, lớp học phần, giảng viên phụ trách và sinh viên đăng ký học.

### 5.3. Survey Template

Quản lý mẫu khảo sát, nhóm câu hỏi, thứ tự câu hỏi, loại câu hỏi, lựa chọn và quy tắc bắt buộc.

### 5.4. Survey Campaign

Quản lý đợt khảo sát, thời gian hiệu lực, đối tượng tham gia, trạng thái và phạm vi công bố kết quả.

### 5.5. Response

Quản lý bản nháp, gửi phản hồi, kiểm tra câu trả lời, ngăn gửi trùng và tách dữ liệu trả lời khỏi thông tin nhận diện trực tiếp.

### 5.6. Reporting

Tổng hợp tỷ lệ hoàn thành, điểm trung bình, phân bố lựa chọn, phản hồi tự luận và xuất báo cáo.

### 5.7. Audit

Ghi nhận các thao tác quản trị quan trọng như tạo, chỉnh sửa, công bố, đóng hoặc mở lại khảo sát.

## 6. Vai trò và quyền hạn

| Nghiệp vụ | Sinh viên | Giảng viên | Quản trị viên |
| --- | --- | --- | --- |
| Xem khảo sát được giao | Có | Không | Có |
| Lưu nháp và gửi phản hồi | Có | Không | Không |
| Xem lịch sử hoàn thành của bản thân | Có | Không | Có theo phạm vi quản lý |
| Xem kết quả tổng hợp | Không mặc định | Có khi được công bố | Có |
| Xem danh tính người phản hồi | Không | Không | Không trong báo cáo |
| Quản lý mẫu khảo sát | Không | Không trong MVP | Có |
| Tạo và công bố đợt khảo sát | Không | Không trong MVP | Có |
| Quản lý dữ liệu học vụ | Không | Không trong MVP | Có |
| Xuất báo cáo | Không | Có theo phạm vi | Có |

Quyền phải được kiểm tra ở phía máy chủ. Việc ẩn nút trên giao diện chỉ hỗ trợ trải nghiệm người dùng và không thay thế kiểm tra phân quyền.

## 7. Mô hình dữ liệu dự kiến

### 7.1. Nhóm tài khoản và học vụ

- `User`: tài khoản, mật khẩu đã băm, họ tên, trạng thái.
- `Role`: danh mục vai trò.
- `UserRole`: quan hệ nhiều vai trò cho một tài khoản nếu cần mở rộng.
- `StudentProfile`: thông tin sinh viên.
- `LecturerProfile`: thông tin giảng viên.
- `Semester`: học kỳ.
- `Course`: môn học.
- `CourseClass`: lớp học phần gắn với học kỳ và giảng viên.
- `Enrollment`: sinh viên đăng ký lớp học phần.

### 7.2. Nhóm khảo sát

- `SurveyTemplate`: thông tin mẫu khảo sát và phiên bản.
- `Question`: nội dung, loại câu hỏi, bắt buộc và thứ tự.
- `QuestionOption`: các lựa chọn của câu hỏi.
- `SurveyCampaign`: đợt khảo sát, thời gian, trạng thái và cấu hình công bố.
- `SurveyTarget`: lớp học phần hoặc nhóm đối tượng được khảo sát.
- `SurveyParticipation`: ghi nhận sinh viên được mời, trạng thái nháp hoặc hoàn thành.
- `Submission`: một lượt phản hồi đã gửi, không chứa khóa ngoại trực tiếp đến người dùng.
- `Answer`: câu trả lời gắn với lượt phản hồi và câu hỏi.
- `AuditLog`: nhật ký thao tác quản trị.

### 7.3. Nguyên tắc ẩn danh

- `SurveyParticipation` dùng để xác định một sinh viên có quyền tham gia và đã hoàn thành hay chưa.
- Khi gửi bài, hệ thống cập nhật trạng thái tham gia và tạo `Submission` trong cùng transaction.
- `Submission` không lưu `userId`, `studentId` hoặc `participationId`.
- Không ghi nội dung câu trả lời vào application log.
- Báo cáo chỉ được công bố khi số phản hồi đạt ngưỡng tối thiểu do hệ thống cấu hình. Giá trị khởi tạo đề xuất là 5.
- Phản hồi tự luận phải được cảnh báo không nhập thông tin tự nhận diện.

Thiết kế này giảm khả năng truy ngược trực tiếp. Khi triển khai thực tế cần đánh giá thêm nguy cơ suy luận danh tính từ thời điểm gửi, nhóm quá nhỏ hoặc nội dung tự luận.

## 8. Trạng thái và quy tắc nghiệp vụ chính

### 8.1. Trạng thái đợt khảo sát

```text
DRAFT -> PUBLISHED -> CLOSED
  |          |
  v          v
CANCELLED  CANCELLED
```

- Chỉ khảo sát `DRAFT` mới được sửa cấu trúc câu hỏi.
- Khảo sát `PUBLISHED` nhận phản hồi trong khoảng thời gian hiệu lực.
- Khảo sát `CLOSED` không nhận phản hồi mới và có thể tổng hợp báo cáo.
- Khảo sát `CANCELLED` không tiếp tục sử dụng.

### 8.2. Quy tắc gửi phản hồi

1. Người dùng phải đăng nhập và có vai trò sinh viên.
2. Sinh viên phải thuộc đối tượng của đợt khảo sát.
3. Đợt khảo sát phải đang công bố và còn thời hạn.
4. Mọi câu hỏi bắt buộc phải có câu trả lời hợp lệ.
5. Sinh viên chưa gửi phản hồi trước đó, trừ khi quản trị viên đã mở lại quyền thực hiện.
6. Cập nhật trạng thái hoàn thành và lưu phản hồi phải thành công hoặc thất bại cùng nhau.

## 9. Thiết kế API dự kiến

API sử dụng Route Handlers dưới tiền tố `/api`. Tên endpoint có thể được tinh chỉnh khi triển khai nhưng phải giữ nguyên ranh giới nghiệp vụ.

| Phương thức và endpoint | Mục đích | Vai trò |
| --- | --- | --- |
| `POST /api/auth/sign-in` | Đăng nhập | Công khai |
| `GET /api/me` | Lấy người dùng hiện tại | Đã đăng nhập |
| `GET /api/surveys/assigned` | Danh sách khảo sát được giao | Sinh viên |
| `GET /api/surveys/{id}` | Lấy nội dung khảo sát | Sinh viên hoặc quản trị viên theo quyền |
| `PUT /api/surveys/{id}/draft` | Lưu bản nháp | Sinh viên |
| `POST /api/surveys/{id}/submit` | Gửi phản hồi | Sinh viên |
| `GET /api/admin/templates` | Danh sách mẫu khảo sát | Quản trị viên |
| `POST /api/admin/templates` | Tạo mẫu khảo sát | Quản trị viên |
| `POST /api/admin/campaigns` | Tạo đợt khảo sát | Quản trị viên |
| `POST /api/admin/campaigns/{id}/publish` | Công bố đợt khảo sát | Quản trị viên |
| `POST /api/admin/campaigns/{id}/close` | Đóng đợt khảo sát | Quản trị viên |
| `GET /api/reports/campaigns/{id}` | Xem báo cáo tổng hợp | Giảng viên hoặc quản trị viên theo quyền |
| `GET /api/reports/campaigns/{id}/export` | Xuất báo cáo | Giảng viên hoặc quản trị viên theo quyền |

Mọi dữ liệu đầu vào phải được kiểm tra bằng schema Zod. Lỗi API sử dụng một cấu trúc thống nhất gồm mã lỗi, thông báo an toàn cho người dùng và mã theo dõi nội bộ khi cần.

## 10. Cấu trúc thư mục dự kiến

```text
src/
  app/
    (auth)/
    (student)/
    (lecturer)/
    (admin)/
    api/
  components/
  modules/
    identity/
    academic/
    survey-template/
    survey-campaign/
    response/
    reporting/
    audit/
  lib/
    auth/
    db/
    validation/
  test/
prisma/
  schema.prisma
  migrations/
  seed.ts
tests/
  e2e/
docs/
```

Mỗi mô-đun chứa kiểu dữ liệu, schema kiểm tra, dịch vụ, truy vấn và test của riêng mình. Thành phần giao diện dùng chung được đặt trong `components`.

## 11. Bảo mật và quyền riêng tư

- Mật khẩu được băm bằng thuật toán phù hợp cho mật khẩu như Argon2id và không được lưu dạng rõ.
- Cookie phiên đăng nhập phải đặt `HttpOnly`, `SameSite` và `Secure` khi chạy qua HTTPS.
- Mọi thao tác thay đổi dữ liệu phải xác thực phiên và kiểm tra quyền ở máy chủ.
- Kiểm tra dữ liệu đầu vào ở ranh giới hệ thống và không tin dữ liệu từ trình duyệt.
- Không đưa bí mật, chuỗi kết nối hoặc mật khẩu mẫu vào Git.
- Dùng biến môi trường cho cấu hình nhạy cảm và cung cấp `.env.example` không chứa bí mật.
- Giới hạn tần suất đối với đăng nhập và các endpoint nhạy cảm khi đưa hệ thống ra môi trường dùng chung.
- Nhật ký không chứa mật khẩu, token, nội dung phản hồi hoặc dữ liệu có thể nhận diện người trả lời.
- Sao lưu và thời hạn lưu dữ liệu sẽ được cấu hình theo quy định của nhà trường ở giai đoạn triển khai thực tế.

## 12. Chiến lược kiểm thử

### 12.1. Unit test

Kiểm thử các quy tắc độc lập:

- Chuyển trạng thái khảo sát.
- Kiểm tra thời gian hiệu lực.
- Kiểm tra câu hỏi bắt buộc và loại câu trả lời.
- Tính tỷ lệ tham gia, điểm trung bình và phân bố lựa chọn.
- Xác định quyền theo vai trò và phạm vi dữ liệu.

### 12.2. Integration test

Kiểm thử dịch vụ với cơ sở dữ liệu kiểm thử:

- Tạo mẫu và đợt khảo sát.
- Công bố và đóng khảo sát.
- Gửi phản hồi trong transaction.
- Ngăn gửi trùng.
- Không tạo phản hồi dở dang khi transaction lỗi.
- Không trả báo cáo khi chưa đủ ngưỡng ẩn danh.

### 12.3. End-to-end test

Ba hành trình bắt buộc:

1. Quản trị viên đăng nhập, tạo mẫu, tạo đợt và công bố khảo sát.
2. Sinh viên đăng nhập, lưu nháp, hoàn tất và gửi phản hồi.
3. Giảng viên đăng nhập và xem báo cáo đã được công bố mà không thấy danh tính sinh viên.

### 12.4. Cổng chất lượng trước khi bàn giao

Mỗi thay đổi phải đạt:

```text
lint -> typecheck -> unit test -> integration test -> build -> e2e test
```

Nếu một bước không đạt thì thay đổi chưa đủ điều kiện bàn giao. Mỗi thay đổi hoàn chỉnh phải có một commit Git tương ứng theo `AGENTS.md`.

## 13. Môi trường và cấu hình

Giai đoạn đầu sử dụng hai môi trường:

- `development`: chạy local để phát triển.
- `test`: dùng cơ sở dữ liệu riêng cho kiểm thử tự động.

Các biến môi trường dự kiến:

```text
DATABASE_URL=
AUTH_SECRET=
APP_URL=
MIN_REPORT_RESPONSES=5
```

Dữ liệu seed cần cung cấp tối thiểu một quản trị viên, một giảng viên, một sinh viên, một lớp học phần và một mẫu khảo sát để phục vụ phát triển và nghiệm thu.

## 14. Lộ trình triển khai MVP

### Giai đoạn 1. Khởi tạo nền tảng

- Khởi tạo Next.js, TypeScript, Tailwind CSS và công cụ chất lượng mã nguồn.
- Cấu hình MySQL, Prisma và môi trường kiểm thử.
- Thiết lập cấu trúc mô-đun và pipeline kiểm tra local.

### Giai đoạn 2. Tài khoản và dữ liệu học vụ

- Xây dựng mô hình người dùng, vai trò và phiên đăng nhập.
- Xây dựng môn học, lớp học phần và đăng ký học.
- Hoàn thiện kiểm thử phân quyền.

### Giai đoạn 3. Quản trị khảo sát

- Xây dựng mẫu khảo sát và câu hỏi.
- Xây dựng đợt khảo sát, đối tượng, thời gian và trạng thái.
- Hoàn thiện giao diện quản trị cơ bản.

### Giai đoạn 4. Sinh viên trả lời khảo sát

- Xây dựng danh sách khảo sát được giao.
- Lưu nháp, kiểm tra và gửi phản hồi.
- Hoàn thiện cơ chế chống gửi trùng và tách định danh.

### Giai đoạn 5. Báo cáo và nghiệm thu

- Xây dựng dashboard và báo cáo tổng hợp.
- Áp dụng ngưỡng ẩn danh và phân quyền xem báo cáo.
- Hoàn thiện xuất báo cáo, kiểm thử end-to-end và tài liệu sử dụng.

## 15. Tiêu chí nghiệm thu MVP

- Ba vai trò đăng nhập và chỉ truy cập đúng chức năng được cấp.
- Quản trị viên tạo được khảo sát gồm đủ bốn loại câu hỏi đã xác định.
- Chỉ sinh viên thuộc đối tượng mới thấy và thực hiện được khảo sát.
- Không thể gửi khi thiếu câu bắt buộc, hết hạn hoặc đã gửi trước đó.
- Lưu phản hồi và ghi nhận hoàn thành bảo đảm tính toàn vẹn giao dịch.
- Báo cáo tính đúng tỷ lệ tham gia, điểm trung bình và phân bố lựa chọn.
- Báo cáo không chứa định danh trực tiếp của sinh viên.
- Giảng viên không xem được báo cáo ngoài phạm vi được phân công.
- Hệ thống không công bố báo cáo khi chưa đạt ngưỡng ẩn danh.
- Toàn bộ lint, typecheck, test, build và các kịch bản nghiệm thu đều đạt.

## 16. Rủi ro và hướng xử lý

| Rủi ro | Ảnh hưởng | Hướng xử lý |
| --- | --- | --- |
| Phạm vi MVP tăng liên tục | Chậm hoàn thành luồng cốt lõi | Chỉ nhận chức năng mới sau khi đánh giá và xếp vào giai đoạn sau MVP |
| Có thể suy luận danh tính từ nhóm nhỏ | Ảnh hưởng quyền riêng tư | Dùng ngưỡng công bố, giới hạn bộ lọc và không lưu liên kết trực tiếp trong phản hồi |
| Dữ liệu học vụ chưa có nguồn chính thức | Không tạo đúng đối tượng khảo sát | Dùng seed hoặc nhập dữ liệu quản trị trong MVP và thiết kế mô-đun sẵn cho tích hợp sau này |
| Sửa mẫu sau khi đã nhận phản hồi | Sai lệch dữ liệu báo cáo | Khóa cấu trúc khảo sát sau khi công bố và sử dụng phiên bản mẫu |
| Báo cáo chậm khi dữ liệu tăng | Trải nghiệm kém | Tối ưu truy vấn, thêm chỉ mục và cân nhắc bảng tổng hợp ở giai đoạn sau |

## 17. Quyết định mặc định để bắt đầu

- Một tài khoản có thể có nhiều vai trò nhưng giao diện chọn vai trò hiện hành theo phiên.
- Quản trị viên nhập hoặc seed dữ liệu học vụ trong giai đoạn local.
- Sinh viên đánh giá theo lớp học phần và giảng viên phụ trách.
- Kết quả chỉ hiển thị sau khi đợt khảo sát đóng và đạt tối thiểu 5 phản hồi.
- Xuất báo cáo MVP ưu tiên CSV. Xuất PDF được thực hiện sau khi luồng báo cáo ổn định.
- Giao diện sử dụng tiếng Việt và hỗ trợ tốt trên máy tính lẫn điện thoại.

Những quyết định này có thể được điều chỉnh trước khi triển khai mô hình dữ liệu. Sau khi migration đầu tiên được sử dụng, mọi thay đổi cấu trúc phải đi qua migration mới và có kiểm thử tương ứng.
