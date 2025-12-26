// ============================================================
// ROLE-BASED ACCESS CONTROL TYPES
// ============================================================
// This file defines the user roles and authentication types.
// We use simple frontend-only validation for this prototype.
// In production, use proper backend authentication!
// ============================================================

// The three roles available in our app
export type UserRole = 'student' | 'manager' | 'warden';

// Store user session info
export interface UserSession {
  role: UserRole;           // Current logged-in role
  rollNumber?: string;      // Only for students - to filter their complaints
  isLoggedIn: boolean;      // Whether user is currently logged in
}

// ============================================================
// PASSWORD MAPPING (FRONTEND ONLY!)
// ============================================================
// ⚠️ WARNING: This is for prototype purposes only!
// Never store passwords in frontend code in production.
// This is only acceptable because this is a demo app.
// ============================================================
export const ROLE_PASSWORDS: Record<UserRole, string> = {
  student: 'student.nitw',
  manager: 'manager.nitw',
  warden: 'warden.nitw',
};

// Helper to validate password for a role
export const validatePassword = (role: UserRole, password: string): boolean => {
  return ROLE_PASSWORDS[role] === password;
};
