export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
export function avatarMime(bytes: Uint8Array): string | null {
  if (bytes.length < 32 || bytes.length > MAX_AVATAR_BYTES) return null;
  const b = Buffer.from(bytes);
  if (b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) && b.toString("ascii",12,16)==="IHDR") return "image/png";
  if (b[0]===255 && b[1]===216 && b[2]===255 && b[b.length-2]===255 && b[b.length-1]===217) return "image/jpeg";
  if (b.toString("ascii",0,4)==="RIFF" && b.toString("ascii",8,12)==="WEBP" && ["VP8 ","VP8L","VP8X"].includes(b.toString("ascii",12,16)) && b.readUInt32LE(4)===b.length-8) return "image/webp";
  return null;
}
export function primaryRole(roles: readonly string[]) {
  return ["ADMIN","DEAN","LECTURER","STUDENT"].find(r=>roles.includes(r)) ?? "OTHER";
}
