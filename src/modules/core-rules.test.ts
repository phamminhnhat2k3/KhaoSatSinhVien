import { describe, expect, it } from "vitest";
import { canTransition, isAcceptingResponses } from "./survey-campaign/rules";
import { validateAnswers } from "./response/rules";
import { average, ensureReportAvailable, participationRate } from "./reporting/report";

describe("quy tắc chiến dịch", () => {
  it("chỉ cho phép chuyển trạng thái hợp lệ", () => {
    expect(canTransition("DRAFT", "PUBLISHED")).toBe(true);
    expect(canTransition("CLOSED", "PUBLISHED")).toBe(false);
  });
  it("chỉ nhận phản hồi trong thời gian công bố", () => {
    const now = new Date("2026-10-19T10:00:00Z");
    expect(isAcceptingResponses("PUBLISHED", new Date("2026-10-18"), new Date("2026-10-20"), now)).toBe(true);
    expect(isAcceptingResponses("CLOSED", new Date("2026-10-18"), new Date("2026-10-20"), now)).toBe(false);
  });
});

describe("kiểm tra câu trả lời", () => {
  const questions = [
    { id: "single", type: "SINGLE" as const, required: true, optionValues: ["yes", "no"] },
    { id: "scale", type: "SCALE" as const, required: true },
    { id: "text", type: "TEXT" as const, required: false }
  ];
  it("bắt câu bắt buộc và giá trị ngoài lựa chọn", () => {
    expect(validateAnswers(questions, { single: "maybe", scale: "6" })).toEqual({ single: "Lựa chọn không hợp lệ.", scale: "Thang điểm phải từ 1 đến 5." });
  });
  it("chấp nhận dữ liệu hợp lệ", () => expect(validateAnswers(questions, { single: "yes", scale: "5" })).toEqual({}));
});

describe("báo cáo ẩn danh", () => {
  it("tính số liệu và chặn báo cáo dưới ngưỡng", () => {
    expect(participationRate(7, 8)).toBe(87.5);
    expect(average([4, 5, 3])).toBe(4);
    expect(() => ensureReportAvailable("CLOSED", 4, 5)).toThrow("tối thiểu 5");
    expect(() => ensureReportAvailable("CLOSED", 5, 5)).not.toThrow();
  });
});
