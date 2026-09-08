import { UserRole } from '@prisma/client';

export type Permission =
  | 'student:read'
  | 'student:write'
  | 'student:delete'
  | 'teacher:read'
  | 'teacher:write'
  | 'teacher:verify'
  | 'teacher:delete'
  | 'class:read'
  | 'class:write'
  | 'class:delete'
  | 'assignment:read'
  | 'assignment:write'
  | 'assignment:delete'
  | 'payment:read'
  | 'payment:write'
  | 'payment:refund'
  | 'payout:read'
  | 'payout:write'
  | 'admin:read'
  | 'admin:write'
  | 'analytics:read'
  | 'settings:read'
  | 'settings:write';

const rolePermissions: Record<UserRole, Permission[]> = {
  STUDENT: [
    'student:read', // own profile
    'student:write', // own profile
    'teacher:read', // browse teachers
    'class:read', // own classes
    'class:write', // book demo, reschedule own
    'assignment:read', // own assignments
    'assignment:write', // submit assignments
    'payment:read', // own payments
    'payment:write', // make payments
  ],
  PARENT: [
    'student:read', // children's profiles
    'teacher:read',
    'class:read', // children's classes
    'assignment:read', // children's assignments
    'payment:read', // children's payments
    'payment:write', // make payments for children
  ],
  TEACHER: [
    'teacher:read', // own profile
    'teacher:write', // own profile
    'student:read', // assigned students
    'class:read', // own classes
    'class:write', // manage own classes, mark attendance
    'assignment:read', // own assignments
    'assignment:write', // create, grade assignments
    'assignment:delete', // delete own assignments
    'payout:read', // own earnings
    'payout:write', // request payouts
  ],
  ADMIN: [
    'student:read',
    'student:write',
    'student:delete',
    'teacher:read',
    'teacher:write',
    'teacher:verify',
    'teacher:delete',
    'class:read',
    'class:write',
    'class:delete',
    'assignment:read',
    'assignment:write',
    'assignment:delete',
    'payment:read',
    'payment:write',
    'payment:refund',
    'payout:read',
    'payout:write',
    'admin:read',
    'admin:write',
    'analytics:read',
    'settings:read',
    'settings:write',
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

// Resource ownership checks
export function canAccessStudent(requesterRole: UserRole, requesterId: string, studentId: string, requesterStudentId?: string): boolean {
  if (requesterRole === 'ADMIN') return true;
  if (requesterRole === 'STUDENT' && requesterStudentId === studentId) return true;
  if (requesterRole === 'PARENT') {
    // Check if parent owns this student - would need DB check
    return true; // Simplified for now
  }
  if (requesterRole === 'TEACHER') {
    // Check if teacher is assigned to this student - would need DB check
    return true; // Simplified for now
  }
  return false;
}

export function canAccessTeacher(requesterRole: UserRole, requesterId: string, teacherId: string, requesterTeacherId?: string): boolean {
  if (requesterRole === 'ADMIN') return true;
  if (requesterRole === 'TEACHER' && requesterTeacherId === teacherId) return true;
  if (requesterRole === 'STUDENT' || requesterRole === 'PARENT') {
    // Students/parents can view verified teachers
    return true; // Verified check would be in query
  }
  return false;
}

export function canAccessClass(requesterRole: UserRole, requesterId: string, classTeacherId: string, classStudentId: string, requesterTeacherId?: string, requesterStudentId?: string): boolean {
  if (requesterRole === 'ADMIN') return true;
  if (requesterRole === 'TEACHER' && requesterTeacherId === classTeacherId) return true;
  if (requesterRole === 'STUDENT' && requesterStudentId === classStudentId) return true;
  if (requesterRole === 'PARENT') {
    // Check if parent owns the student
    return true; // Simplified
  }
  return false;
}

export function canAccessAssignment(requesterRole: UserRole, requesterId: string, assignmentTeacherId: string, assignmentStudentId: string, requesterTeacherId?: string, requesterStudentId?: string): boolean {
  if (requesterRole === 'ADMIN') return true;
  if (requesterRole === 'TEACHER' && requesterTeacherId === assignmentTeacherId) return true;
  if (requesterRole === 'STUDENT' && requesterStudentId === assignmentStudentId) return true;
  return false;
}