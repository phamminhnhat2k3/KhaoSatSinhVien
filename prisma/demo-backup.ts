import assert from "node:assert/strict";
import { randomBytes, createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import type { PrismaClient } from "@prisma/client";

export async function databaseCounts(db: PrismaClient) {
  const tables = await db.$queryRaw<{ name: string }[]>`SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME`;
  const counts: Record<string, number> = {};
  for (const { name } of tables) {
    assert(/^[A-Za-z0-9_]+$/.test(name), "Tên bảng không hợp lệ để sao lưu.");
    const rows = await db.$queryRawUnsafe<{ total: bigint }[]>(`SELECT COUNT(*) AS total FROM \`${name}\``);
    counts[name] = Number(rows[0].total);
  }
  return counts;
}

export async function backupAndVerify(db: PrismaClient) {
  const source = new URL(process.env.DATABASE_URL!);
  const database = decodeURIComponent(source.pathname.slice(1));
  assert(database && /^[A-Za-z0-9_]+$/.test(database), "Cần tên database hợp lệ.");
  const mysqlBin = resolve(process.env.ProgramFiles ?? "C:/Program Files", "MySQL/MySQL Server 8.0/bin");
  assert(existsSync(join(mysqlBin, "mysqldump.exe")) && existsSync(join(mysqlBin, "mysql.exe")), "Không tìm thấy công cụ sao lưu MySQL 8.0.");
  const directory = resolve(".data/backups", `before-demo-${new Date().toISOString().replace(/[:.]/g, "-")}`);
  mkdirSync(directory, { recursive: true });
  const sqlPath = join(directory, "database.sql");
  const before = await databaseCounts(db);
  const env = { ...process.env, MYSQL_PWD: decodeURIComponent(source.password) };
  const connection = ["--protocol=TCP", `--host=${source.hostname}`, `--port=${source.port || "3306"}`, `--user=${decodeURIComponent(source.username)}`, "--default-character-set=utf8mb4"];
  const dump = spawnSync(join(mysqlBin, "mysqldump.exe"), [...connection, "--single-transaction", "--routines", "--events", "--triggers", "--hex-blob", "--set-gtid-purged=OFF", "--no-tablespaces", `--result-file=${sqlPath}`, database], { env, windowsHide: true });
  assert(!dump.error && dump.status === 0, "Sao lưu MySQL không thành công. Chưa thay dữ liệu.");
  const sql = readFileSync(sqlPath);
  assert(sql.length > 100 && /CREATE TABLE/i.test(sql.toString("utf8")), "File sao lưu không đầy đủ.");
  if (existsSync("TAI_KHOAN_MAU.md")) copyFileSync("TAI_KHOAN_MAU.md", join(directory, "TAI_KHOAN_MAU_CU.md"));

  const temporaryName = `student_survey_backup_check_${randomBytes(6).toString("hex")}`;
  assert(/^student_survey_backup_check_[a-f0-9]{12}$/.test(temporaryName) && temporaryName !== database);
  const target = new URL(source); target.pathname = `/${temporaryName}`;
  const { PrismaClient } = await import("@prisma/client");
  const check = new PrismaClient({ datasources: { db: { url: target.href } } });
  let created = false;
  try {
    await db.$executeRawUnsafe(`CREATE DATABASE \`${temporaryName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    created = true;
    const restore = spawnSync(join(mysqlBin, "mysql.exe"), [...connection, `--database=${temporaryName}`], { env, input: sql, windowsHide: true });
    assert(!restore.error && restore.status === 0, "Bản sao lưu chưa khôi phục thử được. Chưa thay dữ liệu.");
    assert.deepEqual(await databaseCounts(check), before, "Số dòng trong bản khôi phục không khớp database gốc.");
    assert.deepEqual(await databaseCounts(db), before, "Dữ liệu đang được thay đổi trong lúc sao lưu. Chưa thay dữ liệu.");
    writeFileSync(join(directory, "manifest.json"), JSON.stringify({ database, createdAt: new Date().toISOString(), sha256: createHash("sha256").update(sql).digest("hex"), restoredAndVerified: true, counts: before }, null, 2) + "\n", "utf8");
  } finally {
    await check.$disconnect();
    if (created) await db.$executeRawUnsafe(`DROP DATABASE \`${temporaryName}\``);
  }
  return { directory, counts: before };
}
