# Chỉnh sửa và xóa mẫu khảo sát

- Trong **Thư viện mẫu**, mỗi mẫu có **Chỉnh sửa**, **Tạo bản sao** và **Xóa**.
- Mẫu chưa được gắn vào đợt khảo sát: **Chỉnh sửa → Lưu thay đổi** cập nhật ngay mẫu đó. Số phiên bản tăng lên để phát hiện biểu mẫu cũ đang mở ở tab khác.
- Mẫu đã dùng, kể cả chỉ dùng ở phần đánh giá môn/giảng viên: **Chỉnh sửa → Lưu phiên bản mới** tạo mẫu mới. Không sửa câu hỏi, lựa chọn, câu trả lời hoặc liên kết mẫu của các đợt hiện có. Admin chọn phiên bản mới khi tạo/sửa đợt nháp tiếp theo.
- Thư viện hiển thị phiên bản và số đợt sử dụng, không đếm hai lần nếu một đợt dùng cùng mẫu cho cả phần chung và phần môn. Các lựa chọn mẫu trong trang tạo đợt có thêm số phiên bản khi lớn hơn 1.
- **Xóa** yêu cầu xác nhận và chỉ áp dụng mẫu chưa sử dụng. Mẫu đang tham chiếu ở bất kỳ trạng thái đợt nào đều được bảo vệ. Xóa mẫu chưa dùng xóa các câu hỏi/lựa chọn liên quan và ghi nhật ký trong cùng giao dịch.
- Máy chủ kiểm tra lại quyền admin, phiên bản và tham chiếu ngay lúc ghi. Nếu có người vừa sử dụng mẫu sau khi thư viện được mở, thao tác xóa vẫn bị chặn. Không chỉ dựa vào trạng thái nút trên giao diện.
- Nháp chỉnh sửa tách riêng với nháp tạo mới/bản sao và theo phiên bản nguồn. Lưu thất bại không xóa nháp.
- Nghiệm thu gồm sửa trực tiếp, tạo phiên bản bảo toàn phiếu cũ, hủy xác nhận xóa, xóa mẫu chưa dùng và chặn xóa khi mẫu vừa được gắn vào đợt.
