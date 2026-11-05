import { z } from "zod";

export const educationSystems = {
  REGULAR: { name: "Chính quy", tag: "CQ" },
  PART_TIME: { name: "Vừa học vừa làm", tag: "VLVH" },
  DISTANCE: { name: "Đào tạo từ xa", tag: "ĐTTX" }
} as const;
export const educationSystemSchema = z.enum(["REGULAR", "PART_TIME", "DISTANCE"]);
export function educationSystem(value: string) {
  return educationSystems[value as keyof typeof educationSystems] ?? { name: "Chưa xác định", tag: "?" };
}
export function academicClassLabel(group: { code: string; name: string; educationSystem: string }) {
  return `${group.code} · ${group.name} [${educationSystem(group.educationSystem).tag}]`;
}
