type CourseScope={lecturers?:{id:string}[];classes:{lecturerId:string|null;semesterId:string;teachingConfigured?:boolean;teachings?:{lecturerId:string}[]}[]};

// Course results are shared across the subject, not individual teacher scores.
export function canViewCourseResult(course:CourseScope,lecturerId:string,semesterId:string|null){
 return !!course.lecturers?.some(l=>l.id===lecturerId)||course.classes.some(c=>c.semesterId===semesterId&&(c.teachings?.some(t=>t.lecturerId===lecturerId)||!c.teachingConfigured&&c.lecturerId===lecturerId));
}
