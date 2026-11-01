export function readDemoPasswords(markdown:string,accounts:{email:string}[]){
 const passwords=new Map<string,string>();
 for(const line of markdown.split("\n")){
  const cells=line.split("|").map(s=>s.trim());
  if(cells.length===8&&cells[4].startsWith("demo."))passwords.set(cells[4],cells[5]);
 }
 if(!accounts.every(a=>(passwords.get(a.email)?.length??0)>=8))throw new Error("File tài khoản thiếu mật khẩu hợp lệ (tối thiểu 8 ký tự); giữ nguyên dữ liệu, không đặt lại mật khẩu.");
 return passwords;
}
