import { expect, test, type Page } from "@playwright/test";
import { PrismaClient, type Role } from "@prisma/client";
import { hash } from "argon2";
import { randomUUID } from "node:crypto";

test("các trang chính dùng được trên điện thoại và máy tính bảng", async ({ page }) => {
  test.skip(!process.env.ISOLATED_FEATURE_DB, "Chỉ chạy trên database nghiệm thu riêng.");
  test.setTimeout(180000);
  expect(new URL(process.env.DATABASE_URL!).pathname).toBe(`/${process.env.ISOLATED_FEATURE_DB}`);
  const db = new PrismaClient();
  const tag = randomUUID().slice(0, 8);
  const password = randomUUID();
  const users: { id: string; email: string; role: Role }[] = [];
  const routes: Record<Role, string[]> = {
    ADMIN: ["/admin", "/admin/users", "/admin/academic", "/admin/classes/new", "/admin/assignments", "/admin/templates/new", "/admin/campaigns/new"],
    STUDENT: ["/student", "/profile", "/help"],
    LECTURER: ["/lecturer", "/results"],
    DEAN: ["/dean", "/dean/people"],
  };
  async function login(email: string) {
    await page.context().clearCookies();
    await page.goto("/login");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await expect(page).toHaveURL(/\/(admin|student|lecturer|dean)$/);
  }
  async function check(page: Page, route: string, width: number) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(route);
    await expect(page.locator("main")).toBeVisible();
    const layout = await page.evaluate(() => {
      const nav = document.querySelector(".nav-links");
      const items = nav && [...nav.querySelectorAll(":scope > a, :scope > button, :scope > form")];
      return {
        pageWidth: document.documentElement.scrollWidth,
        viewportWidth: innerWidth,
        navRight: nav?.getBoundingClientRect().right ?? 0,
        navLabelsOverflow: items?.filter(item => item.scrollWidth > item.clientWidth + 1).map(item => item.textContent?.trim()) ?? [],
        clippedItems: items?.filter(item => {
          const rect = item.getBoundingClientRect();
          return rect.left < -1 || rect.right > innerWidth + 1;
        }).map(item => item.textContent?.trim()) ?? [],
      };
    });
    expect.soft(layout.pageWidth, `${route} ${width}px: trang bị tràn ngang`).toBeLessThanOrEqual(width);
    expect.soft(layout.navRight, `${route} ${width}px: thanh điều hướng bị tràn`).toBeLessThanOrEqual(width + 1);
    expect.soft(layout.clippedItems, `${route} ${width}px: mục điều hướng nằm ngoài màn hình`).toEqual([]);
    expect.soft(layout.navLabelsOverflow, `${route} ${width}px: nhãn điều hướng bị chồng lấn`).toEqual([]);
    if (width <= 390 && route === "/admin/users") {
      await expect(page.locator(".user-directory tbody tr").first()).toBeVisible();
      expect(await page.locator(".user-directory tbody tr").first().evaluate(row => getComputedStyle(row).display)).toBe("block");
      await expect(page.locator(".user-directory tbody tr").first().locator("td:nth-child(2)")).toBeVisible();
    }
    if (width <= 390 && route === "/admin/classes/new") {
      expect(await page.locator(".table-wrap").first().evaluate(box => box.scrollWidth > box.clientWidth)).toBe(true);
    }
    if (width === 320 && ["/student", "/lecturer"].includes(route)) {
      const columns = await page.locator('section[aria-label="Tiến độ khảo sát theo học kỳ"], section[aria-label="Tổng quan khảo sát giảng dạy"]').evaluate(section => getComputedStyle(section).gridTemplateColumns.split(" ").length);
      expect(columns).toBe(2);
    }
  }
  try {
    const passwordHash = await hash(password);
    for (const role of ["ADMIN", "STUDENT", "LECTURER", "DEAN"] as Role[]) {
      const email = `responsive-${tag}-${role.toLowerCase()}@example.invalid`;
      const user = await db.user.create({ data: {
        name: `Responsive ${role}`,
        email,
        passwordHash,
        roles: { create: role === "DEAN" ? [{ role: "DEAN" }, { role: "LECTURER" }] : [{ role }] },
        ...(role === "STUDENT" ? { student: { create: { studentCode: `R-${tag}` } } } :
          role === "LECTURER" || role === "DEAN" ? { lecturer: { create: { lecturerCode: `R-${tag}-${role}` } } } : {}),
      } });
      users.push({ id: user.id, email, role });
    }
    for (const user of users) {
      await login(user.email);
      for (const route of routes[user.role]) for (const width of [320, 390, 768]) await check(page, route, width);
      await page.setViewportSize({ width: 320, height: 844 });
      await page.goto(routes[user.role][0]);
      const menu = page.locator(".mobile-menu");
      await menu.locator("summary").click();
      await expect(menu.getByRole("link", { name: "Hồ sơ cá nhân" })).toBeVisible();
      await expect(menu.getByRole("button", { name: "Đăng xuất" })).toBeVisible();
    }
  } finally {
    await db.auditLog.deleteMany({ where: { actorId: { in: users.map(user => user.id) } } });
    await db.user.deleteMany({ where: { id: { in: users.map(user => user.id) } } });
    await db.$disconnect();
  }
});
