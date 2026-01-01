// ============================================================
// LOGIN SCREEN COMPONENT
// ============================================================
// This component handles user login with role selection.
// It validates the password on the frontend (prototype only).
// 
// BEGINNER NOTES:
// - useState manages form data and error messages
// - The form prevents default submission behavior
// - onLogin callback passes the role back to parent component
// ============================================================

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { UserRole, validatePassword } from '@/types/auth';
import { Building, Lock, User, UserCog, Shield } from 'lucide-react';

// Props interface - what this component receives from its parent
interface LoginScreenProps {
  onLogin: (role: UserRole, rollNumber?: string) => void;  // Callback when login succeeds
}

export const LoginScreen = ({ onLogin }: LoginScreenProps) => {
  // ============================================================
  // STATE MANAGEMENT
  // ============================================================
  // selectedRole: which role the user picked (student/manager/warden)
  // password: the password they entered
  // rollNumber: only needed for students to filter their complaints
  // error: any error message to display
  // ============================================================
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [password, setPassword] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [error, setError] = useState('');
  const { toast } = useToast();

  // ============================================================
  // ROLE PICK HANDLER (FIX)
  // ============================================================
  // WHY THIS IS NEEDED:
  // Some mobile/webview environments can be a bit inconsistent with
  // click handling on complex nested elements. By routing ALL role
  // changes through one handler and using a real <button type="button">
  // in the UI, we ensure the selection always updates React state.
  // ============================================================
  const handlePickRole = (role: UserRole) => {
    setSelectedRole(role);

    // Clear stale validation/password state when switching roles.
    // This avoids confusion where the user switches role but the old
    // password/error remains and it "looks like" the role didn't switch.
    setError('');
    setPassword('');
  };

  // ============================================================
  // HANDLE FORM SUBMISSION
  // ============================================================
  // This function runs when the user clicks the Login button.
  // It validates the password and calls onLogin if successful.
  // ============================================================
  const handleSubmit = (e: React.FormEvent) => {
    // Prevent the browser from reloading the page (default form behavior)
    e.preventDefault();
    
    // Clear any previous error messages
    setError('');

    // Students must provide their roll number
    if (selectedRole === 'student' && !rollNumber.trim()) {
      setError('Please enter your roll number');
      return;
    }

    // Check if the password matches the role's password
    if (validatePassword(selectedRole, password)) {
      // Success! Show a toast notification
      toast({
        title: 'Login Successful!',
        description: `Welcome, ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}!`,
      });
      
      // Call the parent's onLogin function with the role
      // For students, also pass the roll number
      onLogin(selectedRole, selectedRole === 'student' ? rollNumber : undefined);
    } else {
      // Wrong password - show error
      setError('Invalid password. Please try again.');
    }
  };

  // ============================================================
  // ROLE SELECTION OPTIONS
  // ============================================================
  // Each role has an icon and description for better UX
  // ============================================================
  const roleOptions = [
    { 
      value: 'student' as UserRole, 
      label: 'Student', 
      icon: User,
      description: 'Submit and track your complaints'
    },
    { 
      value: 'manager' as UserRole, 
      label: 'Manager', 
      icon: UserCog,
      description: 'Manage and escalate complaints'
    },
    { 
      value: 'warden' as UserRole, 
      label: 'Warden', 
      icon: Shield,
      description: 'Full access with analytics'
    },
  ];

  return (
    // ============================================================
    // LOGIN SCREEN LAYOUT
    // ============================================================
    // Full screen centered layout with a card containing the form.
    // Mobile-first design with touch-friendly buttons.
    // ============================================================
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md glass-card animate-fade-in">
        {/* Header with logo and title */}
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-xl bg-primary">
              <Building className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-display">Hostel CMS</CardTitle>
          <CardDescription>Complaint Management System</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Select Your Role</Label>
              <RadioGroup
                value={selectedRole}
                // FIX: Keep RadioGroup selection and our UI in sync.
                // Using the same handler avoids stale password/error state.
                onValueChange={(value) => handlePickRole(value as UserRole)}
                className="grid grid-cols-1 gap-3"
              >
                {roleOptions.map((option) => {
                  const isSelected = selectedRole === option.value;

                  return (
                    <div
                      key={option.value}
                      role="button"
                      tabIndex={0}
                      aria-pressed={isSelected}
                      className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer text-left transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-background hover:border-primary/50'
                      }`}
                      // FIX: Radix RadioGroupItem renders a <button>, so we must NOT wrap it in another <button>
                      // (nested buttons break click behavior in some browsers and causes DOM nesting warnings).
                      onClick={() => handlePickRole(option.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handlePickRole(option.value);
                        }
                      }}
                    >
                      <RadioGroupItem value={option.value} id={option.value} />
                      <div className="flex items-center gap-3 flex-1">
                        <option.icon
                          className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}
                        />
                        <div>
                          <Label htmlFor={option.value} className="cursor-pointer font-medium">
                            {option.label}
                          </Label>
                          <p className="text-xs text-muted-foreground">{option.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>

            {/* Roll Number (only for students) */}
            {selectedRole === 'student' && (
              <div className="space-y-2 animate-fade-in">
                <Label htmlFor="rollNumber">Roll Number</Label>
                <Input
                  id="rollNumber"
                  placeholder="e.g., 21CS1001"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  className="bg-background"
                />
              </div>
            )}

            {/* Password Input */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-background"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-sm text-destructive animate-fade-in">
                {error}
              </p>
            )}

            {/* Submit Button */}
            <Button type="submit" size="lg" className="w-full font-semibold">
              Login
            </Button>

            {/* Password Hint (for demo purposes) */}
            <p className="text-xs text-center text-muted-foreground">
              Hint: Password is {selectedRole}.nitw
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
