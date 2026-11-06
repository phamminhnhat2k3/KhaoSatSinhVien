export type StudyGroup = {
  id: string; code: string; semesterId: string; facultyId: string | null; educationSystem: string;
  courseId: string; courseCode: string; courseName: string; teacherName: string; eligible: boolean;
};
type Teacher = { facultyId: string | null; user: { name: string; active: boolean } };
export function studyGroupOption(group: { id: string; code: string; semesterId: string; educationSystem: string; courseId: string; course: { code: string; name: string; facultyId: string | null }; teachingConfigured: boolean; lecturer: Teacher | null; teachings: { lecturer: Teacher }[] }): StudyGroup {
  const teachers = group.teachings.length ? group.teachings.map(t => t.lecturer) : !group.teachingConfigured && group.lecturer ? [group.lecturer] : [];
  const eligible = teachers.length === 1 && teachers[0].user.active && !!group.course.facultyId && teachers[0].facultyId === group.course.facultyId;
  return { id: group.id, code: group.code, semesterId: group.semesterId, educationSystem: group.educationSystem, facultyId: group.course.facultyId, courseId: group.courseId, courseCode: group.course.code, courseName: group.course.name,
    teacherName: teachers.length > 1 ? "Nhiều giảng viên — cần sửa phân công" : teachers[0]?.user.name ?? "Chưa phân công giảng viên", eligible };
}
export function groupStudyCourses(groups: StudyGroup[]) {
  const courses = new Map<string, { id: string; code: string; name: string; groups: StudyGroup[] }>();
  for (const group of groups) {
    if (!courses.has(group.courseId)) courses.set(group.courseId, { id: group.courseId, code: group.courseCode, name: group.courseName, groups: [] });
    courses.get(group.courseId)!.groups.push(group);
  }
  return [...courses.values()].sort((a, b) => a.code.localeCompare(b.code, "vi"));
}
