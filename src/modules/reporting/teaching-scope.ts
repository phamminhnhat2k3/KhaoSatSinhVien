type CourseScope={lecturers?:{id:string}[];classes:{lecturerId:string|null;semesterId:string;teachingConfigured?:boolean;teachings?:{lecturerId:string}[]}[]};

// Course-level links have no semester, so report access follows the actual section assignment for that semester.
export function canViewCourseResult(course:CourseScope,lecturerId:string,semesterId:string|null){
 return !!semesterId&&course.classes.some(c=>c.semesterId===semesterId&&(c.teachings?.some(t=>t.lecturerId===lecturerId)||!c.teachingConfigured&&c.lecturerId===lecturerId));
}
