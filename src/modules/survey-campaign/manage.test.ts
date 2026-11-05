import {expect,test,vi} from "vitest";
import {saveCampaignDraft,cancelCampaignDraft} from "./manage";
const input={title:"Khảo sát khoa",academicClassIds:["home"],scope:"FACULTY",facultyId:"f",semesterId:"s",templateId:"t",courseTemplateId:"ct",courseIds:["A","A"],startsAt:"2026-01-01",endsAt:"2027-01-01"};
test("sửa nháp có điều kiện, thay môn mà không gửi yêu cầu duyệt lại trong cùng giao dịch",async()=>{
  const tx={academicClass:{count:vi.fn().mockResolvedValue(1)},course:{count:vi.fn().mockResolvedValue(1)},surveyCampaign:{update:vi.fn().mockResolvedValue({id:"c",title:input.title})},auditLog:{create:vi.fn()},lecturerProfile:{findMany:vi.fn().mockResolvedValue([{userId:"dean"}])},notification:{createMany:vi.fn()}};
  await saveCampaignDraft(tx as never,"admin",input,"c");
  expect(tx.surveyCampaign.update).toHaveBeenCalledWith(expect.objectContaining({where:{id:"c",status:"DRAFT",scope:{in:["FACULTY","UNIVERSITY"]},participations:{none:{}},submissions:{none:{}}},data:expect.objectContaining({approvedAt:null,approvedBy:null,reviewNote:null,courseTargets:{deleteMany:{},create:[{courseId:"A"}]}})}));
  expect(tx.notification.createMany).not.toHaveBeenCalled();
  expect(tx.lecturerProfile.findMany).not.toHaveBeenCalled();
});
test("không ghi đợt khi môn không thuộc phạm vi, chỉ cho hủy bản nháp",async()=>{
  const tx={academicClass:{count:vi.fn().mockResolvedValue(1)},course:{count:vi.fn().mockResolvedValue(0)},surveyCampaign:{update:vi.fn()},auditLog:{create:vi.fn()}};
  await expect(saveCampaignDraft(tx as never,"admin",input,"c")).rejects.toThrow("Môn học phải thuộc khoa");
  expect(tx.surveyCampaign.update).not.toHaveBeenCalled();
  await cancelCampaignDraft(tx as never,"admin","c");
  expect(tx.surveyCampaign.update).toHaveBeenCalledWith({where:{id:"c",status:"DRAFT"},data:{status:"CANCELLED",approvedAt:null,approvedBy:null}});
});

test("từ chối lớp khác khoa trước khi lưu đợt",async()=>{
 const tx={academicClass:{count:vi.fn().mockResolvedValue(0)},surveyCampaign:{create:vi.fn()}};
 await expect(saveCampaignDraft(tx as never,"admin",input)).rejects.toThrow("Lớp hành chính");
 expect(tx.surveyCampaign.create).not.toHaveBeenCalled();
});
