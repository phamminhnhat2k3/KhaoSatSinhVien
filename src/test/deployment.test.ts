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

  expect(dockerfile).toContain("EXPOSE 3005");
  expect(dockerfile).toContain('"--port", "3005"');
  expect(compose).toContain('"3005:3005"');
  expect(compose).toContain("DATABASE_URL_DOCKER");
  expect(compose).toContain("service_completed_successfully");
  expect(compose).toContain("mysql_data:/var/lib/mysql");
  expect(dockerignore).toContain(".env*");
  expect(gitignore).toContain(".env*");
  expect(example).toContain("REPLACE_WITH_AT_LEAST_32_RANDOM_CHARACTERS");
  expect(example).not.toContain("vitrung65");
  expect(readme).toContain("docker compose up -d --build");
  expect(readme).toContain("http://localhost:3005");
});
