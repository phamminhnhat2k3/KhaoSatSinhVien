"use client";
import {useActionState} from "react";
import {deleteTemplate} from "@/app/admin/templates/actions";
export function DeleteTemplateForm({id,title,version,used}:{id:string;title:string;version:number;used:boolean}){
  const [error,action,pending]=useActionState(deleteTemplate,undefined);
  return <form action={action} className="template-delete" onSubmit={e=>{if(!window.confirm(`Xóa mẫu “${title}”? Mẫu và câu hỏi sẽ bị xóa; thao tác không thể hoàn tác.`))e.preventDefault();}}>
    <input type="hidden" name="id" value={id}/><input type="hidden" name="version" value={version}/><input type="hidden" name="confirm" value="yes"/>
    <button className="button danger" disabled={used||pending} title={used?"Mẫu đã dùng trong đợt khảo sát không thể xóa":"Xóa mẫu chưa sử dụng"} aria-label={`Xóa mẫu ${title}`}>{pending?"Đang xóa…":"Xóa"}</button>
    {error&&<p role="alert" className="error">{error}</p>}
  </form>;
}
