import {expect,test} from "vitest";
import {newQuestion} from "./rules";
import {readTemplateDraft,templateDraftKey,writeTemplateDraft} from "./draft";

test("nháp giữ câu chưa hoàn chỉnh, các lựa chọn và thang điểm đang chỉnh",()=>{
  const input={title:"Bản đang soạn",questions:[{...newQuestion("SINGLE"),content:"",options:[{label:"",value:"a"},{label:"Đang nhập",value:"b"}]},{...newQuestion("SCALE"),scaleMin:100,scaleMax:1}]};
  const draft=readTemplateDraft(writeTemplateDraft(input,123));
  expect(draft).toEqual({...input,version:1,savedAt:123});
});
test("nháp tách theo tài khoản/mẫu và không khôi phục dữ liệu hỏng",()=>{
  expect(templateDraftKey("a")).not.toBe(templateDraftKey("b"));
  expect(templateDraftKey("a")).not.toBe(templateDraftKey("a","source"));
  expect(templateDraftKey("a","source")).not.toBe(templateDraftKey("a","other"));
  for(const raw of [null,"{",JSON.stringify({version:1,title:"x",savedAt:1,questions:[{type:"OTHER"}]}),JSON.stringify({version:2,title:"x",savedAt:1,questions:[]})])expect(readTemplateDraft(raw)).toBeNull();
});
