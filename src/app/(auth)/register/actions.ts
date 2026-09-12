'use server';

// Public self-registration is closed — every account is created by admin
// (see admin/students/actions.ts and admin/teachers/actions.ts). This
// action is kept only so its Server Action ID stays a dead end instead of
// disappearing outright; it must never create a User row.
export async function registerStudent() {
  return { error: 'Public registration is closed. Ask your admin to add you as a student.' };
}
