import { expect, test } from "vitest";
import { avatarCrop } from "./crop";

test("cắt giữa ảnh ngang/dọc, phóng to và căn sát mép không ra ngoài ảnh",()=>{
  expect(avatarCrop(800,400,1,0,0)).toEqual({sx:200,sy:0,size:400});
  expect(avatarCrop(400,800,1,0,1)).toEqual({sx:0,sy:400,size:400});
  expect(avatarCrop(800,400,2,-1,1)).toEqual({sx:0,sy:200,size:200});
  expect(avatarCrop(300,300,1,-5,5)).toEqual({sx:0,sy:0,size:300});
  expect(avatarCrop(800,400,.5,0,0)).toEqual({sx:0,sy:-200,size:800});
  expect(avatarCrop(300,300,99,1,-1)).toEqual({sx:200,sy:0,size:100});
});
