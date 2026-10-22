import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { expect, it } from "vitest";

it("lệnh seed nạp DATABASE_URL từ .env và giữ mật khẩu đặt trong terminal", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  expect(pkg.prisma.seed).toBe(pkg.scripts["db:seed"]);
  const args = pkg.scripts["db:seed"].split(" ");
  expect(args.shift()).toBe("node");
  expect(args.pop()).toBe("prisma/seed.ts");
  const directory = mkdtempSync(join(process.cwd(), ".seed-env-test-"));
  try {
    const envPath = join(directory, ".env");
    const entryPath = join(directory, "probe.ts");
    writeFileSync(envPath, 'DATABASE_URL="mysql://test:fake@localhost/test"\nSEED_PASSWORD="file-password"\n');
    writeFileSync(entryPath, 'const result: boolean = process.env.DATABASE_URL === "mysql://test:fake@localhost/test" && process.env.SEED_PASSWORD === "terminal-password"; if (!result) process.exit(1);');
    const env: NodeJS.ProcessEnv = { ...process.env, SEED_PASSWORD: "terminal-password" };
    delete env.DATABASE_URL;
    const result = spawnSync(process.execPath, [...args.map((arg: string) => arg === "--env-file=.env" ? `--env-file=${envPath}` : arg), entryPath], { env, encoding: "utf8" });
    expect(result.error).toBeUndefined();
    expect(result.status, result.stderr).toBe(0);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
