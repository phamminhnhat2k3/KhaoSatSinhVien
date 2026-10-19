import { readFileSync, existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("cấu hình MySQL local", () => {
  it("dùng MySQL trực tiếp và migration được lưu trong repo", () => {
    const env = readFileSync(".env.example", "utf8");
    const schema = readFileSync("prisma/schema.prisma", "utf8");
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));
    expect(env).toContain("@127.0.0.1:3306/student_survey");
    expect(schema).toMatch(/provider\s*=\s*"mysql"/);
    expect(pkg.scripts["db:migrate"]).toBe("prisma migrate deploy");
    expect(pkg.scripts["db:check"]).toBe("prisma migrate status");
    expect(existsSync("prisma/migrations/20261019000000_init/migration.sql")).toBe(true);
    expect(existsSync("docker-compose.yml")).toBe(false);
  });
});
