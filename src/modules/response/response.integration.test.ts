import { describe, expect, it, vi } from "vitest";
import { submitResponse } from "./service";

function database(status: "INVITED" | "COMPLETED" = "INVITED") {
  const tx = {
    surveyParticipation: {
      findUnique: vi.fn().mockResolvedValue({ id: "p1", status, campaign: { status: "PUBLISHED", startsAt: new Date("2026-01-01"), endsAt: new Date("2026-12-31"), template: { questions: [{ id: "q1", type: "SCALE", required: true, options: [] }] } } }),
      update: vi.fn().mockResolvedValue({})
    },
    submission: { create: vi.fn().mockResolvedValue({ id: "anonymous-submission" }) }
  };
  return { tx, db: { $transaction: vi.fn((callback) => callback(tx)) } };
}

describe("gửi phản hồi trong transaction", () => {
  it("tạo submission không định danh và cập nhật tham gia", async () => {
    const { db, tx } = database();
    await submitResponse(db as never, "c1", "s1", { q1: "5" }, new Date("2026-10-19"));
    expect(tx.submission.create).toHaveBeenCalledWith({ data: { campaignId: "c1", answers: { create: [{ questionId: "q1", value: "5" }] } } });
    expect(tx.surveyParticipation.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "COMPLETED" }) }));
  });
  it("ngăn gửi trùng trước khi tạo submission", async () => {
    const { db, tx } = database("COMPLETED");
    await expect(submitResponse(db as never, "c1", "s1", { q1: "5" }, new Date("2026-10-19"))).rejects.toThrow("đã hoàn thành");
    expect(tx.submission.create).not.toHaveBeenCalled();
  });
});
