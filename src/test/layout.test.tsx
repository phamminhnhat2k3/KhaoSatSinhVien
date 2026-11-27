import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { chromium } from "@playwright/test";
import { expect, test, vi } from "vitest";
import { AppShell } from "@/components/AppShell";

vi.mock("@/app/actions", () => ({ logoutAction: async () => {} }));
vi.mock("next/navigation", () => ({ usePathname: () => "/student", useRouter: () => ({ push: vi.fn() }) }));

test("khung trang hiển thị tiếng Việt, điều hướng và co giãn không tràn ngang", async () => {
  const browser = await chromium.launch(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL as "msedge" } : {});
  try {
    const page = await browser.newPage();
    await page.route("http://layout.test/hcm-ute-logo.png", route => route.fulfill({ path: resolve("public/hcm-ute-logo.png"), contentType: "image/png" }));
    await page.route("http://layout.test/", route => route.fulfill({ contentType: "text/html", body: "<html></html>" }));
    await page.goto("http://layout.test/");
    const css = readFileSync(resolve("src/app/globals.css"), "utf8").replace('@import "tailwindcss";', "") + readFileSync(resolve("src/app/management.css"), "utf8");
    const html = renderToStaticMarkup(createElement(AppShell, { name: "Nguyễn Minh Nhật", role: "Sinh viên", children: createElement("div", null,
      createElement("p", { className: "eyebrow" }, "Không gian của bạn"),
      createElement("h1", null, "Ý kiến của bạn tạo nên thay đổi."),
      createElement("p", { className: "lead" }, "Phản hồi được tách khỏi danh tính trước khi đưa vào báo cáo. Hãy góp ý cụ thể, tôn trọng và không tự nhận diện trong phần tự luận."),
      createElement("section", { className: "grid" }, ...["Cần hoàn thành", "Đã hoàn thành"].map((label, index) => createElement("article", { className: "card", key: label }, createElement("span", { className: "muted" }, label), createElement("div", { className: "stat" }, index + 1)))),
      createElement("h2", { style: { marginTop: "2rem" } }, "Khảo sát được giao"),
      createElement("article", { className: "card stack" }, createElement("span", { className: "pill" }, "Mới"), createElement("h3", null, "Khảo sát chất lượng học phần"), createElement("p", { className: "muted" }, "Chia sẻ trải nghiệm học tập của bạn."), createElement("a", { className: "button", href: "/student/surveys/preview" }, "Thực hiện khảo sát"))
    ) }));
    await page.setContent(`<html lang="vi"><head><base href="http://layout.test/"><meta charset="UTF-8"><style>${css}</style></head><body>${html}</body></html>`);
    const logo = page.getByRole("img", { name: /HCM-UTE/ });
    expect(await logo.evaluate(el => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    expect(await page.locator("header .brand-mark").count()).toBe(0);
    await page.keyboard.press("Tab");
    expect(await page.getByRole("link", { name: "Đi đến nội dung chính" }).evaluate(el => el === document.activeElement)).toBe(true);
    await page.keyboard.press("Enter");
    expect(await page.locator("main").evaluate(el => el === document.activeElement)).toBe(true);
    for (const width of [1440, 1024, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (width <= 760) {
        const menu = page.locator(".mobile-menu");
        await menu.locator("summary").click();
        expect(await menu.getByRole("button", { name: "Đăng xuất" }).isVisible()).toBe(true);
        await menu.locator("summary").click();
      } else expect(await page.getByRole("button", { name: "Đăng xuất" }).isVisible()).toBe(true);
      expect(await page.getByRole("link", { name: "Trang chủ" }).getAttribute("href")).toBe("/dashboard");
      expect(await page.locator("header").getByRole("link", { name: "Hướng dẫn", exact: true }).isVisible()).toBe(true);
      if (width === 1440) {
        expect(await page.locator("header.nav").evaluate(el => el.getBoundingClientRect().height)).toBeLessThanOrEqual(86);
        const items = await page.locator(".nav-links > a, .nav-links > button, .nav-links > form").evaluateAll(els => els.map(el => { const r = el.getBoundingClientRect(); return r.top + r.height / 2; }));
        expect(Math.max(...items) - Math.min(...items)).toBeLessThan(3);
      }
      const heading = await page.locator("h1").evaluate(el => ({ size: parseFloat(getComputedStyle(el).fontSize), line: parseFloat(getComputedStyle(el).lineHeight) }));
      expect(heading.line / heading.size).toBeGreaterThanOrEqual(1.3);
      if (width === 1440 || width === 390) await page.screenshot({ path: `.playwright-cli/layout-${width}.png`, fullPage: true });
    }
  } finally { await browser.close(); }
}, 30000);
