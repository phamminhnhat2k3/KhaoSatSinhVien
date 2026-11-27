import { readFileSync } from "node:fs";
import { expect, test } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

test("Docker deployment keeps secrets outside Git and exposes the documented port", () => {
  const dockerfile = read("Dockerfile");
  const compose = read("compose.yaml");
  const dockerignore = read(".dockerignore");
  const gitignore = read(".gitignore");
  const example = read(".env.example");
  const readme = read("README.md");
  const packageJson = JSON.parse(read("package.json"));
  const playwright = read("playwright.config.ts");

  expect(dockerfile).toContain("EXPOSE 3005");
  expect(dockerfile.match(/--fetch-timeout=300000/g)).toHaveLength(2);
  expect(dockerfile.match(/COPY package\.json pnpm-lock\.yaml pnpm-workspace\.yaml/g)).toHaveLength(2);
  expect(dockerfile.indexOf("install --yes --no-install-recommends openssl")).toBeLessThan(dockerfile.indexOf("FROM base AS dependencies"));
  expect(dockerfile).toContain("/app/prisma-generated-client");
  expect(dockerfile).toContain("$prisma_dir/node_modules/.prisma/client");
  expect(dockerfile).toContain('"--port", "3005"');
  expect(dockerfile).toContain('CMD ["pnpm", "exec", "next", "start"');
  expect(compose).toContain('"3005:3005"');
  expect(compose).toContain("DATABASE_URL_DOCKER");
  expect(compose).toContain("AUTH_URL: ${APP_URL:-http://localhost:3005}");
  expect(compose).toContain("service_completed_successfully");
  expect(compose).toContain("mysql_data:/var/lib/mysql");
  expect(compose).toContain("--lower_case_table_names=1");
  expect(compose).toContain("avatars_data:/app/.data/avatars");
  expect(dockerignore).toContain(".env*");
  expect(gitignore).toContain(".env*");
  expect(example).toContain("REPLACE_WITH_AT_LEAST_32_RANDOM_CHARACTERS");
  expect(example).not.toContain("vitrung65");
  expect(readme).toContain("docker compose up -d --build");
  expect(readme).toContain("http://localhost:3005");
  expect(readme).toContain("git clone https://github.com/phamminhnhat2k3/KhaoSatSinhVien.git");
  expect(readme).toContain("pnpm db:admin");
  expect(packageJson.scripts["db:admin"]).toBe("node --env-file=.env --import tsx prisma/create-admin.ts");
  expect(packageJson.scripts.dev).toBe("next dev --port 3005");
  expect(playwright).toContain("http://127.0.0.1:3005");
});
