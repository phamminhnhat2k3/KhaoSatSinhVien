"use client";
import {showActionToast} from "@/lib/action-feedback";
import { useEffect, useRef, useState } from "react";
import { avatarCrop } from "@/modules/profile/crop";
import { useUnsavedForm } from "@/lib/unsaved";
export function Avatar({ id, name, className="" }: { id?:string; name?:string|null; className?:string }) {
  const [revision,setRevision]=useState(0),[failed,setFailed]=useState(false),[loaded,setLoaded]=useState(false);
  const photo=useRef<HTMLImageElement>(null);
  useEffect(()=>{setLoaded(!!photo.current?.complete&&photo.current.naturalWidth>0);},[id,revision]);
  useEffect(()=>{const refresh=()=>{setFailed(false);setLoaded(false);setRevision(Date.now());};window.addEventListener("avatar-updated",refresh);return()=>window.removeEventListener("avatar-updated",refresh);},[]);
  return <span className={`avatar photo-avatar ${className}`}><span className="avatar-initial" style={{visibility:loaded&&!failed?"hidden":"visible"}}>{name?.trim().slice(0,1)||"?"}</span>{!failed && <img ref={photo} src={`/api/avatars?${id ? `id=${encodeURIComponent(id)}&` : ""}v=${revision}`} alt={`Ảnh đại diện ${name??""}`} style={{opacity:loaded?1:0}} onLoad={()=>setLoaded(true)} onError={()=>{setLoaded(false);setFailed(true);}}/>}</span>;
}
export function AvatarUpload() {
  const [message,setMessage]=useState(""),[pending,setPending]=useState(false);
  const [image,setImage]=useState<ImageBitmap|null>(null);
  const formRef=useRef<HTMLFormElement>(null);
  useUnsavedForm(formRef,!!image,{label:"Ảnh đại diện đang căn chỉnh"});
  const [zoom,setZoom]=useState(1),[x,setX]=useState(0),[y,setY]=useState(0);
  const canvas=useRef<HTMLCanvasElement>(null);
  const selection=useRef(0);
  const drag=useRef<{x:number;y:number;startX:number;startY:number}|null>(null);
  useEffect(()=>()=>{image?.close();},[image]);
  useEffect(()=>{
    if(!image||!canvas.current)return;
    const ctx=canvas.current.getContext("2d");if(!ctx)return;
    const crop=avatarCrop(image.width,image.height,zoom,x,y);
    ctx.clearRect(0,0,512,512);
    ctx.drawImage(image,crop.sx,crop.sy,crop.size,crop.size,0,0,512,512);
  },[image,zoom,x,y]);
  const reset=()=>{setZoom(1);setX(0);setY(0);};
  return <form ref={formRef} data-leave-managed method="post" className="stack" onSubmit={async e=>{
    e.preventDefault();const form=e.currentTarget;if(!canvas.current||!image)return;
    setPending(true);setMessage("");
    try {
      const blob=await new Promise<Blob|null>(resolve=>canvas.current!.toBlob(resolve,"image/webp",.85));
      if(!blob)throw new Error("Không đọc được ảnh.");
      const data=new FormData();data.set("avatar",blob,"avatar.webp");
      const response=await fetch("/api/avatars",{method:"POST",body:data});const result=await response.json();
      if(!response.ok)throw new Error(result.message);
      setMessage(result.message);showActionToast(result.message);window.dispatchEvent(new Event("avatar-updated"));form.reset();setImage(null);reset();
    }catch(error){const message=error instanceof Error?error.message:"Không tải được ảnh.";setMessage(message);showActionToast(message,"error");}finally{setPending(false);}
  }}>
    <label className="field">Ảnh đại diện<input className="input" type="file" name="image" accept="image/png,image/jpeg,image/webp" required disabled={pending} onChange={async e=>{
      const version=++selection.current;const file=e.target.files?.[0];setImage(null);setMessage("");reset();if(!file)return;
      try {
        if(!["image/png","image/jpeg","image/webp"].includes(file.type)||file.size>2*1024*1024)throw new Error("Chọn ảnh PNG, JPG hoặc WebP tối đa 2 MB.");
        const bitmap=await createImageBitmap(file);
        if(version!==selection.current){bitmap.close();return;}setImage(bitmap);
      }catch(error){if(version===selection.current)setMessage(error instanceof Error?error.message:"Không đọc được ảnh.");}
    }}/></label>
    <p className="muted">PNG, JPG hoặc WebP tối đa 2 MB. Kéo ảnh trong khung tròn hoặc dùng thanh căn chỉnh trước khi lưu.</p>
    {image&&<div className="avatar-editor stack">
      <canvas ref={canvas} width={512} height={512} className="avatar-crop" role="img" aria-label="Xem trước ảnh đại diện" onPointerDown={e=>{
        if(pending)return;e.currentTarget.setPointerCapture(e.pointerId);drag.current={x:e.clientX,y:e.clientY,startX:x,startY:y};
      }} onPointerMove={e=>{
        if(!drag.current)return;const crop=avatarCrop(image.width,image.height,zoom,x,y);const pixels=e.currentTarget.getBoundingClientRect().width;
        const offset=(delta:number,length:number)=>length!==crop.size?delta*crop.size/pixels*2/(length-crop.size):0;
        setX(Math.max(-1,Math.min(1,drag.current.startX-offset(e.clientX-drag.current.x,image.width))));
        setY(Math.max(-1,Math.min(1,drag.current.startY-offset(e.clientY-drag.current.y,image.height))));
      }} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}/>
      <label className="field">Phóng to ảnh<input type="range" min="0.1" max="3" step="0.01" value={zoom} disabled={pending} onChange={e=>setZoom(Number(e.target.value))}/></label>
      <label className="field">Vị trí ngang<input type="range" min="-1" max="1" step="0.01" value={x} disabled={pending} onChange={e=>setX(Number(e.target.value))}/></label>
      <label className="field">Vị trí dọc<input type="range" min="-1" max="1" step="0.01" value={y} disabled={pending} onChange={e=>setY(Number(e.target.value))}/></label>
      <button className="button secondary" type="button" disabled={pending} onClick={reset}>Căn giữa lại</button>
    </div>}
    {message&&<p role="status">{message}</p>}<button className="button secondary" disabled={pending||!image}>{pending?"Đang lưu ảnh…":"Lưu ảnh đại diện"}</button>
  </form>;
}
