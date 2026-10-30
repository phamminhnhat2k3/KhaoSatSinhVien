# Khảo sát theo khoa và toàn trường

## Phân biệt dữ liệu

- **Khoa (`Faculty`)**: đơn vị quản lý sinh viên và tổ chức đợt khảo sát.
- **Lớp hành chính (`AcademicClass`)**: lớp quản lý sinh viên, thuộc một khoa; sinh viên có một lớp hành chính hiện tại.
- **Môn học (`Course`)**: học phần như A, B, C.
- **Lớp học phần (`CourseClass`)**: một lớp đăng ký môn trong một học kỳ, có giảng viên phụ trách.
- **Ghi danh (`Enrollment`)**: sinh viên đăng ký lớp học phần nào. Đây là nguồn xác định môn thực học, không phải lớp hành chính.

## Cách sử dụng

1. Admin vào **Khoa / Lớp hành chính / Học kỳ** để tạo các danh mục.
2. Vào **Tất cả sinh viên** để tìm theo MSSV/tên/email, lọc khoa/lớp hoặc mở hồ sơ học vụ.
3. Khi thêm sinh viên, chọn khoa và lớp hành chính; có thể chọn nhiều lớp học phần hoặc bổ sung sau trong hồ sơ.
4. Tạo đợt mới, chọn học kỳ và phạm vi:
   - **Theo khoa**: mẫu chung cho sinh viên đang hoạt động thuộc khoa. Có thể chọn thêm mẫu đánh giá môn và danh sách môn thuộc học kỳ.
   - **Toàn trường**: một mẫu chung cho tất cả sinh viên đang hoạt động, không lọc khoa/lớp/môn; dùng cho cơ sở vật chất, dịch vụ, chất lượng trường.
5. Sau khi tạo nháp, bấm **Xem và công bố** để xem số người nhận và phần môn dự kiến.
6. Bấm **Công bố** để chốt danh sách và gửi thông báo trong cùng transaction. Không có người nhận thì đợt giữ nguyên trạng thái nháp và hiển thị lỗi.

## Phân phối nội dung

Ví dụ một đợt khoa chọn các môn A/B/C/D/E:

| Sinh viên | Môn đăng ký trong học kỳ | Phiếu nhận được |
|---|---|---|
| SV1 | A, B, C | Phần chung + A, B, C |
| SV2 | A, D, E | Phần chung + A, D, E |
| SV3 | Không học môn nào thuộc phạm vi | Chỉ phần chung |

Đăng ký của học kỳ khác không được tính. Học hai lớp cùng một môn trong học kỳ chỉ nhận một phần đánh giá môn đó. Mỗi sinh viên chỉ có một phiếu trong một đợt; phiếu gồm nhiều phần. Cả lưu nháp và gửi đều được kiểm tra phía máy chủ, từ chối câu hỏi hoặc môn không được giao.

## Chốt danh sách và dữ liệu cũ

- Danh sách được lấy tại thời điểm công bố, bao gồm thay đổi ghi danh hoặc trạng thái tài khoản trước đó.
- Đổi khoa/lớp hoặc đăng ký thêm môn sau công bố không tự sửa phiếu đã giao. Chưa có thao tác bổ sung người nhận vào đợt đã công bố; cần chuẩn bị dữ liệu trước hoặc tạo đợt bổ sung.
- Migration chỉ bổ sung bảng/cột, không suy đoán khoa từ `User.department`, không sửa tài khoản, ghi danh hoặc câu trả lời cũ.
- Sinh viên cũ chưa có lớp hành chính được đánh dấu để admin phân lớp. Vẫn nhận được khảo sát toàn trường nếu tài khoản hoạt động.
- Các đợt cũ giữ phạm vi `LEGACY_CLASS` và danh sách đã giao, tiếp tục trả lời/xem kết quả theo cơ chế cũ. Chỉ đợt mới dùng phạm vi khoa/toàn trường.

## Kết quả và quyền riêng tư

- Câu trả lời phần môn lưu mã môn nhưng không lưu mã sinh viên trong `Submission`/`Answer`.
- Admin xem từng phiếu thấy các phần môn đúng với phiếu đó, giữ cơ chế ẩn danh hiện có.
- Báo cáo mỗi môn dùng người được giao và các phiếu có phần môn đó; không lấy toàn bộ sinh viên của khoa làm mẫu số.
- Từng môn phải đủ ngưỡng ẩn danh trước khi hiện kết quả. Giảng viên chỉ xem môn có lớp mình phụ trách trong đúng học kỳ, không xem phần chung của khoa/toàn trường. Có thể chọn đánh giá chung môn hoặc đánh giá từng giảng viên thực dạy, chốt theo lớp đăng ký; xem [hướng dẫn đánh giá giảng viên](DANH_GIA_GIANG_VIEN_THUC_DAY.md).
- Mẫu câu hỏi chung và mẫu môn có thể dùng lại từ thư viện hiện có; không cần tạo câu hỏi thủ công cho từng sinh viên.

## Nghiệm thu

Chạy `pnpm build` rồi `pnpm test:e2e:isolated`. Bộ kiểm tra tạo một database tạm có tên được kiểm tra trước khi tạo/xóa; không sử dụng tài khoản thật làm người nhận thử. Kiểm tra có trường hợp A/B/C và A/D/E, môn khác học kỳ, trùng lớp cùng môn, tài khoản khóa, thay đổi dữ liệu trước/sau công bố, phạm vi toàn trường và bộ lọc sinh viên. Database tạm được dọn sau khi chạy.
