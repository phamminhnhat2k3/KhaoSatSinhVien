"use client";
import { Avatar } from "./Avatar";
import Link from "next/link";
import { UserStateForm } from "./ManagementForms";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
export function EntityDetails({ id, type, name }: { id: string; type: "user" | "faculty" | "course"; name: string }) {
  const dialog=useRef<HTMLDialogElement>(null);
  const [visible,setVisible]=useState(false);
  useEffect(()=>{if(visible)dialog.current?.showModal();},[visible]);
  const [data,setData]=useState<{name:string;fields:[string,string][]; account?: { id:string; active:boolean; email:string; manageable:boolean }; links?: { label:string; href:string }[]}|null>(null), [error,setError]=useState("");
  const [copied,setCopied]=useState(false);
  async function load() { setError(""); try { const r=await fetch(`/api/admin/details?type=${type}&id=${encodeURIComponent(id)}`,{cache:"no-store"}); if(!r.ok) throw new Error(); setData(await r.json()); } catch { setError("Không tải được thông tin. Vui lòng đóng và thử lại."); } }
  async function open() { setData(null); setCopied(false); setVisible(true); await load(); }
  return <><button type="button" className="entity-name" onClick={()=>void open()}>{name}</button>{visible&&createPortal(<dialog ref={dialog} onClose={()=>setVisible(false)} className="management-dialog entity-dialog" aria-label={`Thông tin ${name}`} onClick={e=>{const d=dialog.current;if(d && e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}}><button className="icon-button entity-close" aria-label="Đóng thông tin" onClick={()=>dialog.current?.close()}>✕</button><div className="entity-hero">{type === "user" ? <Avatar id={id} name={data?.name ?? name} className="entity-avatar"/> : <span className="avatar entity-avatar">{name.trim().slice(0,1)}</span>}<p className="eyebrow">{{user:"Hồ sơ người dùng",faculty:"Thông tin khoa",course:"Thông tin môn học"}[type]}</p><h2>{data?.name ?? name}</h2></div>{error ? <p role="alert">{error}</p> : !data ? <p role="status">Đang tải thông tin…</p> : <dl className="profile-facts entity-facts">{data.fields.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}{data && <div className="entity-actions">{data.account && <><button className="button secondary" type="button" onClick={async()=>{ try { await navigator.clipboard.writeText(data.account!.email); setCopied(true); } catch { setError("Không sao chép được. Bạn có thể chọn email để sao chép thủ công."); } }}>{copied ? "Đã sao chép email" : "Sao chép email"}</button>{data.account.manageable && <UserStateForm key={String(data.account.active)} id={data.account.id} operation={data.account.active ? "lock" : "unlock"} onSuccess={()=>void load()}/>}</>}{data.links?.map(link=><Link className="button secondary" key={link.href} href={link.href} onClick={()=>dialog.current?.close()}>{link.label}</Link>)}<button className="button secondary" onClick={()=>void load()}>Cập nhật thông tin</button></div>}</dialog>,document.body)}</>;
}
