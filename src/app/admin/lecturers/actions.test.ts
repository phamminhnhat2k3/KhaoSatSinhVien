import {expect,test,vi} from "vitest";
vi.mock("@/lib/access",()=>({requireUser:vi.fn().mockRejectedValue(new Error("FORBIDDEN"))}));
vi.mock("@/lib/db",()=>({db:{$transaction:vi.fn()}}));
vi.mock("next/cache",()=>({revalidatePath:vi.fn()}));
import {requireUser} from "@/lib/access";
import {db} from "@/lib/db";
import {saveLecturer} from "./actions";
test("chặn gọi trực tiếp thao tác ghi giảng viên khi không có quyền admin",async()=>{
  await expect(saveLecturer(undefined,new FormData())).rejects.toThrow("FORBIDDEN");
  expect(requireUser).toHaveBeenCalledWith("ADMIN");
  expect(db.$transaction).not.toHaveBeenCalled();
});
