import {expect,test,vi} from "vitest";
import {editTemplate,removeTemplate} from "./manage";
import {newQuestion} from "./rules";
const input={title:"Mẫu đã chỉnh sửa",questions:[{...newQuestion("TEXT"),content:"Góp ý của bạn"}]};
function database(common=0,course=0,version=1){
  const tx={$queryRaw:vi.fn().mockResolvedValue([{id:"t"}]),surveyTemplate:{findUniqueOrThrow:vi.fn().mockResolvedValue({id:"t",version,_count:{campaigns:common,courseCampaigns:course}}),update:vi.fn().mockResolvedValue({id:"t",version:2}),create:vi.fn().mockResolvedValue({id:"new",version:2}),delete:vi.fn()},auditLog:{create:vi.fn()}};
  const db={$transaction:vi.fn(async(work:(client:typeof tx)=>unknown)=>work(tx))};return{tx,db};
}
test("sửa mẫu chưa dùng trong giao dịch, khóa mẫu và tăng phiên bản",async()=>{
  const {db,tx}=database();const result=await editTemplate(db as never,"admin","t",1,input);
  expect(tx.$queryRaw).toHaveBeenCalled();expect(result.versioned).toBe(false);
  expect(tx.surveyTemplate.update).toHaveBeenCalledWith(expect.objectContaining({where:{id:"t",version:1},data:expect.objectContaining({version:{increment:1},questions:expect.objectContaining({deleteMany:{}})})}));
  expect(tx.surveyTemplate.create).not.toHaveBeenCalled();
});
test("mẫu đã dùng ở phần chung hoặc phần môn đều tạo mới, không ghi đè mẫu cũ",async()=>{
  for(const [common,course] of [[1,0],[0,1]]){
    const {db,tx}=database(common,course);expect((await editTemplate(db as never,"admin","t",1,input)).versioned).toBe(true);
    expect(tx.surveyTemplate.create).toHaveBeenCalledWith(expect.objectContaining({data:expect.objectContaining({version:2,title:input.title})}));
    expect(tx.surveyTemplate.update).not.toHaveBeenCalled();expect(tx.surveyTemplate.delete).not.toHaveBeenCalled();
  }
});
test("chặn xóa mọi mẫu đang tham chiếu và chặn biểu mẫu chỉnh sửa cũ",async()=>{
  for(const [common,course] of [[1,0],[0,1]]){
    const {db,tx}=database(common,course);await expect(removeTemplate(db as never,"admin","t",1)).rejects.toThrow("Không thể xóa mẫu");expect(tx.surveyTemplate.delete).not.toHaveBeenCalled();
  }
  const {db,tx}=database(0,0,2);await expect(editTemplate(db as never,"admin","t",1,input)).rejects.toThrow("Mẫu đã được cập nhật");await expect(removeTemplate(db as never,"admin","t",1)).rejects.toThrow("Mẫu đã được cập nhật");expect(tx.surveyTemplate.update).not.toHaveBeenCalled();expect(tx.surveyTemplate.delete).not.toHaveBeenCalled();
});
test("xóa mẫu chưa dùng và ghi nhật ký trong cùng giao dịch",async()=>{
  const {db,tx}=database();await removeTemplate(db as never,"admin","t",1);
  expect(tx.surveyTemplate.delete).toHaveBeenCalledWith({where:{id:"t",version:1}});expect(tx.auditLog.create).toHaveBeenCalledWith({data:{actorId:"admin",action:"DELETE",entity:"SurveyTemplate",entityId:"t"}});
});
