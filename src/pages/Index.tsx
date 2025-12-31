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

import { useState, useCallback } from 'react';
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
  // 
  // FIX: Using a key to force re-mount views when role changes.
  // This ensures clean state when switching roles (e.g., student -> manager -> student).
  // Without this, React may reuse component instances incorrectly.
  // ============================================================
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [rollNumber, setRollNumber] = useState<string>('');
  // Key increments on each login to force component re-mount
  const [sessionKey, setSessionKey] = useState(0);

  // ============================================================
  // NIT WARANGAL BRANDING HEADER
  // ============================================================
  // Displayed at the top of all views for institutional branding
  // ============================================================
  const BrandingHeader = () => (
    <div className="bg-primary text-primary-foreground py-2 px-4 text-center">
      <h1 className="text-sm md:text-base font-bold">
        NIT Warangal – Hostel Complaint Management System
      </h1>
    </div>
  );

  // ============================================================
  // LOGIN HANDLER
  // ============================================================
  // Called when user successfully logs in from LoginScreen
  // FIX: Increment sessionKey to force fresh component mount.
  // This prevents stale state issues when switching roles.
  // ============================================================
  const handleLogin = useCallback((role: UserRole, studentRollNumber?: string) => {
    setCurrentRole(role);
    setRollNumber(studentRollNumber || '');
    // Increment key to force re-mount of view components
    setSessionKey(prev => prev + 1);
  }, []);

  // ============================================================
  // LOGOUT HANDLER
  // ============================================================
  // Clears the role and rollNumber, showing login screen again
  // ============================================================
  const handleLogout = useCallback(() => {
    setCurrentRole(null);
    setRollNumber('');
  }, []);

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
  // 
  // BRANDING: NIT Warangal header is shown on all logged-in views
  // ============================================================
  // ============================================================
  // ROLE-BASED VIEW RENDERING
  // ============================================================
  // FIX: Added key={sessionKey} to force React to create a fresh
  // component instance on each login. This fixes the issue where
  // switching back to Student role wouldn't render the Student UI.
  // Without this key, React might reuse old component state.
  // ============================================================
  return (
    <>
      {/* NIT Warangal branding header - shown on all views */}
      <BrandingHeader />
      
      {/* FIX: key={sessionKey} forces fresh component mount on role switch */}
      {currentRole === 'student' && (
        <StudentView key={`student-${sessionKey}`} rollNumber={rollNumber} onLogout={handleLogout} />
      )}
      {currentRole === 'manager' && (
        <ManagerView key={`manager-${sessionKey}`} onLogout={handleLogout} />
      )}
      {currentRole === 'warden' && (
        <WardenView key={`warden-${sessionKey}`} onLogout={handleLogout} />
      )}
    </>
  );
};

export default Index;
