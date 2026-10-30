import {readFileSync} from "node:fs";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {chromium} from "@playwright/test";
import {expect,test} from "vitest";
import {RoleTags} from "@/components/RoleTags";

test("tag vai trò giữ nhãn rõ ràng, hỗ trợ nhiều vai trò và không lặp",()=>{
  const html=renderToStaticMarkup(createElement(RoleTags,{roles:["LECTURER","DEAN","DEAN"]}));
  expect(html.match(/role-tag--dean/g)).toHaveLength(1);
  expect(html).toContain("Giảng viên");expect(html).toContain("Trưởng khoa");
  expect(renderToStaticMarkup(createElement(RoleTags,{roles:["Sinh viên"]}))).toContain("role-tag--student");
});

test("bốn vai trò có màu riêng, tương phản đủ đọc và không tràn trên điện thoại",async()=>{
  const browser=await chromium.launch();
  try{
    const page=await browser.newPage();
    const css=readFileSync("src/app/management.css","utf8");
    const html=renderToStaticMarkup(createElement(RoleTags,{roles:["STUDENT","LECTURER","DEAN","ADMIN"]}));
    await page.setContent(`<html lang="vi"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body>${html}</body></html>`);
    const colors=await page.locator(".role-tag").evaluateAll(tags=>tags.map(tag=>{const s=getComputedStyle(tag);return{color:s.color,background:s.backgroundColor};}));
    expect(new Set(colors.map(c=>c.background)).size).toBe(4);
    const luminance=(rgb:string)=>rgb.match(/\d+/g)!.slice(0,3).map(Number).map(v=>{const n=v/255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4;}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
    for(const color of colors){const values=[luminance(color.color),luminance(color.background)].sort((a,b)=>a-b);expect((values[1]+.05)/(values[0]+.05)).toBeGreaterThanOrEqual(4.5);}
    for(const width of [1440,320]){
      await page.setViewportSize({width,height:300});
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      await page.screenshot({path:`.playwright-cli/role-tags-${width}.png`});
    }
  }finally{await browser.close();}
});
