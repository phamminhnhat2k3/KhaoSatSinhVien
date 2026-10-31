import {expect,test,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import {EntityDetails} from "./EntityDetails";
vi.mock("./ManagementForms",()=>({UserStateForm:()=>null}));
test("HTML ban đầu chỉ chứa nút khi đặt thông tin trong đoạn văn, tiêu đề hoặc summary",()=>{
  for(const Tag of ["p","h1","h3","summary"] as const){
    const html=renderToStaticMarkup(<Tag><EntityDetails type="course" id="course" name="Vẽ kỹ thuật"/></Tag>);
    expect(html).toContain('class="entity-name"');
    expect(html).not.toContain("<dialog");
    expect(html).not.toContain("<form");
  }
});
