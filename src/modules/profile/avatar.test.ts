import { expect, test } from "vitest";
import { avatarMime, MAX_AVATAR_BYTES, primaryRole } from "./avatar";
test("ảnh chỉ nhận PNG JPEG WEBP và giới hạn kích thước",()=>{
  expect(avatarMime(Buffer.from('<svg onload="alert(1)"></svg>'))).toBeNull();
  expect(avatarMime(Buffer.alloc(MAX_AVATAR_BYTES+1))).toBeNull();
  const png=Buffer.alloc(40);Buffer.from([137,80,78,71,13,10,26,10]).copy(png);png.write("IHDR",12);expect(avatarMime(png)).toBe("image/png");
  const jpg=Buffer.alloc(40);jpg.set([255,216,255]);jpg.set([255,217],38);expect(avatarMime(jpg)).toBe("image/jpeg");
  const webp=Buffer.alloc(40);webp.write("RIFF");webp.writeUInt32LE(32,4);webp.write("WEBP",8);webp.write("VP8 ",12);expect(avatarMime(webp)).toBe("image/webp");
  webp.writeUInt32LE(100,4);expect(avatarMime(webp)).toBeNull();
});
test("mỗi người chỉ được tính vào một nhóm vai trò",()=>{
  expect(primaryRole(["LECTURER","DEAN"])).toBe("DEAN");
  expect(primaryRole(["ADMIN","DEAN","LECTURER"])).toBe("ADMIN");
  expect(primaryRole(["STUDENT"])).toBe("STUDENT");
  expect(primaryRole([])).toBe("OTHER");
});
