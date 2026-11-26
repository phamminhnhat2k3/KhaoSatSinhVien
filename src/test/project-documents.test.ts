import { existsSync } from "node:fs";
import { expect, test } from "vitest";

test("project documents keep the survey reports without unrelated coursework", () => {
  expect(existsSync("docs/reports/BaoCaoTuan2_TLCN_sat_du_an.docx")).toBe(true);
  expect(existsSync("docs/reports/BaoCaoTuan5_TLCN_ban_nop.docx")).toBe(true);
  expect(existsSync("Tai_lieu_on_tap_Chuong_7_Bug_Reports.docx")).toBe(false);
  expect(existsSync("outputs/01a1eebc-b332-7580-a6d7-748f466feda3/24810119_BugHunt.xlsx")).toBe(false);
});
