import { describe, expect, it } from "vitest";
import { demoAccounts, demoFaculties, demoSubjectIndexes } from "./demo-data";
describe("bộ dữ liệu mẫu bổ sung", () => {
  it("có 5 khoa, 50 môn, 20 giảng viên bao gồm 5 trưởng khoa và 50 sinh viên", () => {
    expect(demoFaculties).toHaveLength(5);
    expect(demoFaculties.flatMap(f => f.subjects)).toHaveLength(50);
    expect(demoAccounts.filter(a => a.kind === "lecturer")).toHaveLength(20);
    expect(demoAccounts.filter(a => a.dean)).toHaveLength(5);
    expect(demoAccounts.filter(a => a.kind === "student")).toHaveLength(50);
    expect(new Set(demoAccounts.map(a => a.email)).size).toBe(70);
    expect(new Set(demoAccounts.map(a => a.id)).size).toBe(70);
    expect(new Set(demoAccounts.map(a => a.code)).size).toBe(70);
    for (const f of demoFaculties) {
      const accounts = demoAccounts.filter(a => a.facultyCode === f.code);
      expect(accounts.filter(a => a.dean)).toHaveLength(1);
      expect(accounts.filter(a => a.kind === "student")).toHaveLength(10);
    }
  });
  it("mỗi sinh viên học 5 môn hợp lệ, tổ hợp khác nhau và phủ đủ 10 môn", () => {
    const all = new Set<number>();
    for (let i = 0; i < 10; i++) {
      const subjects = demoSubjectIndexes(i);
      expect(new Set(subjects).size).toBe(5);
      for (const n of subjects) { expect(n).toBeGreaterThanOrEqual(0); expect(n).toBeLessThan(10); all.add(n); }
    }
    expect(all.size).toBe(10);
    expect(demoSubjectIndexes(0)).not.toEqual(demoSubjectIndexes(1));
  });
});
