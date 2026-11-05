import type { Student } from "@/features/students/types";

export function signupTrend(students: Student[]) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const dayCounts = new Array(now.getDate()).fill(0);

  for (const student of students) {
    const createdAt = new Date(student.user.createdAt);
    if (createdAt >= startOfMonth && createdAt <= now) {
      dayCounts[createdAt.getDate() - 1] += 1;
    }
  }

  let cumulative = 0;
  return dayCounts.map((count, index) => {
    cumulative += count;
    return { day: String(index + 1).padStart(2, "0"), value: cumulative };
  });
}

export interface MembershipBreakdown {
  active: number;
  pending: number;
  overdue: number;
  cancelled: number;
  noPlan: number;
  total: number;
}

export function membershipBreakdown(students: Student[]): MembershipBreakdown {
  const result: MembershipBreakdown = {
    active: 0,
    pending: 0,
    overdue: 0,
    cancelled: 0,
    noPlan: 0,
    total: students.length,
  };
  for (const student of students) {
    const membership = student.memberships[0];
    if (!membership) {
      result.noPlan += 1;
      continue;
    }
    if (membership.status === "ACTIVE") result.active += 1;
    else if (membership.status === "PENDING") result.pending += 1;
    else if (membership.status === "OVERDUE") result.overdue += 1;
    else if (membership.status === "CANCELLED") result.cancelled += 1;
  }
  return result;
}

export function expiringMemberships(students: Student[], withinDays = 7) {
  const now = new Date();
  const limit = new Date(now);
  limit.setDate(limit.getDate() + withinDays);
  return students.filter((student) => {
    const endDate = student.memberships[0]?.endDate;
    if (!endDate) return false;
    const date = new Date(endDate);
    return date >= now && date <= limit;
  });
}

export interface UpcomingBirthday {
  student: Student;
  daysUntil: number;
}

export function upcomingBirthdays(
  students: Student[],
  withinDays = 7,
): UpcomingBirthday[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const result: UpcomingBirthday[] = [];
  for (const student of students) {
    if (!student.birthDate) continue;
    const birth = new Date(student.birthDate);
    const next = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
    if (next < now) next.setFullYear(now.getFullYear() + 1);
    const daysUntil = Math.round((next.getTime() - now.getTime()) / 86_400_000);
    if (daysUntil <= withinDays) result.push({ student, daysUntil });
  }
  return result.sort((a, b) => a.daysUntil - b.daysUntil);
}
