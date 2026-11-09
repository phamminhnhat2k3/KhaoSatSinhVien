import { expect, test } from "vitest";
import { campaignDraftFromForm, readCampaignDraft } from "./draft";

test("lưu được đợt chưa nhập đủ nhưng chỉ giữ các trường khảo sát", () => {
  const form = new FormData(); form.set("scope", "FACULTY"); form.set("title", "Đang soạn"); form.append("academicClassIds", "class-a"); form.set("password", "must-not-store");
  const draft = campaignDraftFromForm(form);
  expect(draft).toMatchObject({ title: "Đang soạn", templateId: "", startsAt: "", academicClassIds: ["class-a"] });
  expect(draft).not.toHaveProperty("password");
  expect(readCampaignDraft(JSON.stringify(draft))).toEqual(draft);
});
test("bản nháp hỏng hoặc quá giới hạn không được khôi phục", () => {
  expect(readCampaignDraft("{" )).toBeNull(); expect(readCampaignDraft(null)).toBeNull();
  const f = new FormData(); f.set("scope", "UNIVERSITY"); const draft = campaignDraftFromForm(f);
  expect(readCampaignDraft(JSON.stringify({ ...draft, title: "a".repeat(121) }))).toBeNull();
  expect(readCampaignDraft(JSON.stringify({ ...draft, startsAt: "invalid" }))).toBeNull();
});
