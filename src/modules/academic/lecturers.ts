import type {Prisma} from "@prisma/client";
import {userWhere} from "./user-management";
export function lecturerWhere(params:{q?:string;facultyId?:string;role?:string;active?:string}):Prisma.LecturerProfileWhereInput{
 return {...(params.facultyId?{facultyId:params.facultyId}:{}),user:{AND:[userWhere({q:params.q,active:params.active}),...(params.role==="DEAN"?[{roles:{some:{role:"DEAN" as const}}}]:params.role==="LECTURER"?[{roles:{some:{role:"LECTURER" as const},none:{role:"DEAN" as const}}}]:[])]}};
}
