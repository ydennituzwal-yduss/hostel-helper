// ============================================================
// MAIN APP PAGE - SINGLE PAGE APPLICATION (SPA)
// ============================================================
// This is the main entry point for the app.
// 
// WHY SINGLE PAGE APP?
// - Mobile-friendly: No page reloads
// - APK-ready: Works well with WebView/Capacitor
// - Simple: Uses conditional rendering instead of routing
// 
// HOW IT WORKS:
// 1. User sees login screen first
// 2. After login, we store the role and rollNumber in state
// 3. Based on role, we show different views:
//    - student → StudentView
//    - manager → ManagerView
//    - warden → WardenView
// ============================================================

import { useState } from 'react';
import { UserRole } from '@/types/auth';
import { LoginScreen } from '@/components/LoginScreen';
import { StudentView } from '@/components/StudentView';
import { ManagerView } from '@/components/ManagerView';
import { WardenView } from '@/components/WardenView';

const Index = () => {
  // ============================================================
  // STATE MANAGEMENT
  // ============================================================
  // currentRole: null means not logged in, otherwise stores the user's role
  // rollNumber: only used for students to filter their complaints
  // This is stored in memory only (not localStorage for security)
  // ============================================================
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [rollNumber, setRollNumber] = useState<string>('');

  // ============================================================
  // LOGIN HANDLER
  // ============================================================
  // Called when user successfully logs in from LoginScreen
  // Stores role and optional rollNumber for students
  // ============================================================
  const handleLogin = (role: UserRole, studentRollNumber?: string) => {
    setCurrentRole(role);
    if (studentRollNumber) {
      setRollNumber(studentRollNumber);
    }
  };

  // ============================================================
  // LOGOUT HANDLER
  // ============================================================
  // Clears the role and rollNumber, showing login screen again
  // ============================================================
  const handleLogout = () => {
    setCurrentRole(null);
    setRollNumber('');
  };

  // ============================================================
  // CONDITIONAL RENDERING
  // ============================================================
  // If not logged in, show LoginScreen
  // Otherwise, show the appropriate view based on role
  // ============================================================
  if (!currentRole) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // ============================================================
  // ROLE-BASED VIEW RENDERING
  // ============================================================
  // Based on the user's role, render the appropriate component:
  // - student: Can submit and view their own complaints
  // - manager: Can manage all complaints, escalate, resolve
  // - warden: Full access with analytics and reports
  // ============================================================
  return (
    <>
      {currentRole === 'student' && (
        <StudentView rollNumber={rollNumber} onLogout={handleLogout} />
      )}
      {currentRole === 'manager' && (
        <ManagerView onLogout={handleLogout} />
      )}
      {currentRole === 'warden' && (
        <WardenView onLogout={handleLogout} />
      )}
    </>
  );
};

export default Index;
