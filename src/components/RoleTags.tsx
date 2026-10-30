import {roleLabels} from "@/modules/profile/rules";

export function RoleTags({roles}:{roles:string[]}) {
  return <span className="role-tags">{[...new Set(roles)].map(role=>{
    const entry=Object.entries(roleLabels).find(([key,label])=>key===role||label===role);
    return <span className={`role-tag role-tag--${entry?.[0].toLowerCase()??"other"}`} key={role}>{entry?.[1]??role}</span>;
  })}</span>;
}
