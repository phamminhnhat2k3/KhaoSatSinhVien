import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { loadEnvFile } from "node:process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

loadEnvFile(".env");
const require = createRequire(import.meta.url);
const source = new URL(process.env.DATABASE_URL);
const database = `student_survey_test_${randomBytes(6).toString("hex")}`;
assert.match(database, /^student_survey_test_[0-9a-f]{12}$/);
assert.notEqual(database, source.pathname.slice(1));
const target = new URL(source); target.pathname = `/${database}`;
const env = { ...process.env, DATABASE_URL: target.href, AUTH_TRUST_HOST: "true", RUN_FEATURE_E2E: "1", ISOLATED_FEATURE_DB: database, MIN_REPORT_RESPONSES: "2", RUN_DB_E2E: "", PLAYWRIGHT_BASE_URL: "http://127.0.0.1:3015" };
const db = new PrismaClient();
let created = false;
function run(file, args) {
  const result = spawnSync(process.execPath, [file, ...args], { env, stdio: "inherit", windowsHide: true });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Kiểm tra không đạt (exit ${result.status}).`);
}
try {
  await db.$executeRawUnsafe(`CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  created = true;
  run(join(dirname(require.resolve("prisma/package.json")), "build/index.js"), ["migrate", "deploy"]);
  run(join(dirname(require.resolve("@playwright/test/package.json")), "cli.js"), ["test", "--workers=1", ...process.argv.slice(2)]);
} catch (error) {
  console.error(error instanceof Error ? error.message : "Không thể chạy nghiệm thu.");
  process.exitCode = 1;
} finally {
  if (created) {
    assert.match(database, /^student_survey_test_[0-9a-f]{12}$/);
    await db.$executeRawUnsafe(`DROP DATABASE \`${database}\``);
    console.log("Đã dọn database nghiệm thu riêng; database ứng dụng được giữ nguyên.");
  }
  await db.$disconnect();
}
