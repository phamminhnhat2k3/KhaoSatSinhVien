import {expect,test} from "@playwright/test";
import {PrismaClient} from "@prisma/client";
import {hash} from "argon2";
import {randomUUID} from "node:crypto";
test.use({actionTimeout:15000});
test("danh sách giảng viên gọn, kết hợp bộ lọc, phân trang và sửa nhanh",async({page})=>{
 test.skip(!process.env.ISOLATED_FEATURE_DB,"Chỉ chạy database nghiệm thu riêng.");test.setTimeout(120000);
 const db=new PrismaClient(),tag=`DIR-${randomUUID().slice(0,6)}`,password=randomUUID(),ids:string[]=[];
 try{
  expect(new URL(process.env.DATABASE_URL!).pathname).toBe(`/${process.env.ISOLATED_FEATURE_DB}`);
  const passwordHash=await hash(password),faculty=await db.faculty.create({data:{code:tag,name:tag}}),other=await db.faculty.create({data:{code:`${tag}-B`,name:`${tag} khác`}});
  const admin=await db.user.create({data:{name:tag,email:`${tag}@example.invalid`,passwordHash,roles:{create:{role:"ADMIN"}}}});ids.push(admin.id);
  for(let i=0;i<22;i++){const u=await db.user.create({data:{name:`${tag} GV ${i}`,email:`${tag}-${i}@example.invalid`,passwordHash,active:i!==1,roles:{create:i===0||i===21?[{role:"LECTURER"},{role:"DEAN"}]:[{role:"LECTURER"}]},lecturer:{create:{lecturerCode:`${tag}-${String(i).padStart(2,"0")}`,facultyId:i<20?faculty.id:other.id}}}});ids.push(u.id);}
  for(let i=0;i<3;i++)await db.course.create({data:{code:`${tag}-${i}`,name:`${tag} Môn ${i}`,facultyId:faculty.id,lecturers:{connect:{userId:ids[1]}}}});
  await page.goto("/login");await page.getByLabel("Email",{exact:true}).fill(admin.email);await page.getByLabel("Mật khẩu",{exact:true}).fill(password);await page.getByRole("button",{name:"Đăng nhập",exact:true}).click();await expect(page).toHaveURL(/\/admin$/);
  await page.goto(`/admin/lecturers?q=${tag}`);await expect(page.locator(".lecturer-create")).not.toHaveAttribute("open","");await expect(page.locator("main tbody tr")).toHaveCount(20);
  const first=page.locator("main tbody tr").filter({has:page.getByRole("button",{name:`${tag} GV 0`,exact:true})});
  await expect(first.locator(".lecturer-courses .entity-name")).toHaveCount(3);await first.getByRole("button",{name:`${tag} Môn 2`,exact:true}).click();await expect(page.getByRole("dialog",{name:`Thông tin ${tag} Môn 2`,exact:true})).toBeVisible();await page.getByRole("button",{name:"Đóng thông tin",exact:true}).click();
  await first.getByRole("button",{name:"Sửa nhanh",exact:true}).click();const dialog=page.getByRole("dialog",{name:`Chỉnh sửa ${tag} GV 0`,exact:true});await expect(dialog.getByLabel("Họ tên",{exact:true})).toHaveAttribute("readonly","");await dialog.getByRole("button",{name:"Lưu giảng viên",exact:true}).click();await expect(dialog.getByRole("status")).toHaveText("Đã lưu giảng viên.");await dialog.getByRole("button",{name:"Đóng chỉnh sửa",exact:true}).click();
  await page.getByRole("link",{name:"Trang sau →",exact:true}).click();await expect(page).toHaveURL(/q=.*page=2/);await expect(page.locator("main tbody tr")).toHaveCount(2);
  await page.getByRole("combobox",{name:"Vai trò",exact:true}).selectOption("DEAN");await page.getByRole("button",{name:"Lọc danh sách",exact:true}).click();await expect(page.locator("main tbody tr")).toHaveCount(2);await expect(page.getByRole("navigation",{name:"Phân trang giảng viên",exact:true})).toContainText("Trang 1/1");
  await page.getByRole("combobox",{name:"Khoa",exact:true}).selectOption(faculty.id);await page.getByRole("button",{name:"Lọc danh sách",exact:true}).click();await expect(page.locator("main tbody tr")).toHaveCount(1);
  await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:".playwright-cli/lecturer-directory-desktop.png",fullPage:true});await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:".playwright-cli/lecturer-directory-mobile.png",fullPage:true});
  await page.getByRole("combobox",{name:"Vai trò",exact:true}).selectOption("LECTURER");await page.getByRole("combobox",{name:"Trạng thái",exact:true}).selectOption("false");await page.getByRole("button",{name:"Lọc danh sách",exact:true}).click();await expect(page.locator("main tbody tr")).toHaveCount(1);await expect(page.locator("main tbody tr")).toContainText(`${tag} GV 1`);
  await page.getByLabel("Tìm giảng viên",{exact:true}).fill("không-có-kết-quả");await page.getByRole("button",{name:"Lọc danh sách",exact:true}).click();await expect(page.getByRole("heading",{name:"Không tìm thấy giảng viên phù hợp",exact:true})).toBeVisible();
  await page.getByRole("link",{name:"Thêm giảng viên",exact:true}).click();await expect(page.locator(".lecturer-create")).toHaveAttribute("open","");await expect(page.getByRole("heading",{name:"Thêm giảng viên",exact:true})).toBeVisible();await page.goto(`/admin/users?q=${encodeURIComponent(`${tag}-0@example.invalid`)}`);const userRow=page.locator("main tbody tr").filter({hasText:`${tag} GV 0`});await expect(userRow.locator(".lecturer-courses .entity-name")).toHaveCount(3);
 }finally{await db.user.updateMany({where:{id:{in:ids}},data:{active:false}});await db.$disconnect();}
});
