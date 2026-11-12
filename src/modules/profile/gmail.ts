import nodemailer from "nodemailer";
import { z } from "zod";
export function gmailConfig() {
  const user=z.email().parse(process.env.GMAIL_USER);
  const pass=z.string().length(16).parse((process.env.GMAIL_APP_PASSWORD??"").replace(/\s/g,""));
  const base=new URL(process.env.APP_URL??"");
  if(!["http:","https:"].includes(base.protocol)||base.username||base.password||base.search||base.hash)throw new Error("APP_URL không hợp lệ.");
  if(base.protocol!=="https:"&&!["localhost","127.0.0.1","[::1]"].includes(base.hostname))throw new Error("Dùng HTTPS khi gửi link ngoài localhost.");
  return {user,pass,base:base.origin};
}
export function gmailTransport() {
  const {user,pass}=gmailConfig();
  return nodemailer.createTransport({host:"smtp.gmail.com",port:465,secure:true,auth:{user,pass},connectionTimeout:10000,greetingTimeout:10000,socketTimeout:15000,disableFileAccess:true,disableUrlAccess:true});
}
export async function sendResetEmail(to:string,link:string) {
  const {user}=gmailConfig();
  await gmailTransport().sendMail({from:{name:"Cổng khảo sát sinh viên",address:user},to:{address:to,name:""},subject:"Đặt lại mật khẩu tài khoản khảo sát",text:`Bạn vừa yêu cầu đặt lại mật khẩu tài khoản khảo sát.\n\nMở liên kết sau để chọn mật khẩu mới:\n${link}\n\nLiên kết có hiệu lực 15 phút và chỉ dùng một lần. Nếu không yêu cầu, hãy bỏ qua email này. Không gửi liên kết hoặc mật khẩu cho người khác.`});
}
