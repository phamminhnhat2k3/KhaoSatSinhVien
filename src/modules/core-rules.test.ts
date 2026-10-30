import { describe, expect, it } from "vitest";
import { canTransition, isAcceptingResponses, campaignPhase } from "./survey-campaign/rules";
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
  it("phân biệt chờ, mở, hết hạn và giữ đúng mốc bắt đầu/kết thúc",()=>{
    const campaign={status:"PUBLISHED" as const,startsAt:new Date("2026-10-29T17:00:00Z"),endsAt:new Date("2026-10-30T16:59:59.999Z")};
    expect(campaignPhase(campaign,new Date("2026-10-29T16:59:59Z"))).toBe("SCHEDULED");
    expect(campaignPhase(campaign,campaign.startsAt)).toBe("OPEN");expect(campaignPhase(campaign,campaign.endsAt)).toBe("OPEN");
    expect(campaignPhase(campaign,new Date("2026-10-30T17:00:00Z"))).toBe("EXPIRED");
    expect(campaignPhase({...campaign,status:"CLOSED"},campaign.startsAt)).toBe("CLOSED");
  });
});

describe("kiểm tra câu trả lời", () => {
  const questions = [
    { id: "single", type: "SINGLE" as const, required: true, optionValues: ["yes", "no"] },
    { id: "scale", type: "SCALE" as const, required: true },
    { id: "text", type: "TEXT" as const, required: false }
  ];
  it("bắt câu bắt buộc và giá trị ngoài lựa chọn", () => {
    expect(validateAnswers(questions, { single: "maybe", scale: "6" })).toEqual({ single: "Lựa chọn không hợp lệ.", scale: "Điểm phải từ 1 đến 5, theo bước 1." });
  });
  it("chấp nhận dữ liệu hợp lệ", () => expect(validateAnswers(questions, { single: "yes", scale: "5" })).toEqual({}));
});

describe("báo cáo ẩn danh", () => {
  it("tính số liệu và chặn báo cáo dưới ngưỡng", () => {
    expect(participationRate(7, 8)).toBe(87.5);
    expect(average([4, 5, 3])).toBe(4);
    expect(() => ensureReportAvailable("CLOSED", 4, 5)).toThrow("tối thiểu 5");
    expect(() => ensureReportAvailable("CLOSED", 5, 5)).not.toThrow();
    expect(()=>ensureReportAvailable("PUBLISHED",5,5,new Date("2026-01-01"),new Date("2026-10-30"))).not.toThrow();
    expect(()=>ensureReportAvailable("PUBLISHED",5,5,new Date("2027-01-01"),new Date("2026-10-30"))).toThrow("đóng hoặc hết hạn");
  });
});
