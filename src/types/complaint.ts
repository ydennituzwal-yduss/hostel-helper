export type Status = 'Pending' | 'Assigned' | 'Escalated' | 'Resolved';
export type Level = 'Level 1' | 'Level 2' | 'Level 3' | 'Level 4';
export type Severity = 'Normal' | 'Needs Quick Attention' | 'Extreme';

export interface Complaint {
  id: string;
  hostel: string;
  roomNumber: string;
  studentName: string;
  rollNumber: string;
  issueType: string;
  severity: Severity;
  description: string;
  images: string[];
  video?: string;
  status: Status;
  level: Level;
  createdAt: string;
  updatedAt: string;
  // ============================================================
  // WORKER ASSIGNMENT FIELDS
  // ============================================================
  // These fields store the assigned worker's contact information.
  // When a complaint is assigned or escalated, we automatically
  // assign a worker based on the escalation level.
  // ============================================================
  assignedWorkerName?: string;   // Name of the worker assigned to handle this complaint
  assignedWorkerPhone?: string;  // Phone number to contact the assigned worker
  feedback?: {
    rating: number;
    comment: string;
    submittedAt: string;
  };
}

export const HOSTELS = [
  'Boys Hostel A',
  'Boys Hostel B',
  'Boys Hostel C',
  'Girls Hostel A',
  'Girls Hostel B',
  'International Hostel',
];

export const ISSUE_TYPES = [
  'Plumbing',
  'Electrical',
  'Furniture',
  'Cleanliness',
  'Internet/WiFi',
  'Air Conditioning',
  'Security',
  'Pest Control',
  'Water Supply',
  'Other',
];

export const LEVEL_ROLES: Record<Level, string> = {
  'Level 1': 'Assigned Staff',
  'Level 2': 'Supervisor',
  'Level 3': 'Warden + Contractor',
  'Level 4': 'Direct Warden Interaction',
};

// ============================================================
// WORKER ASSIGNMENT MAPPING
// ============================================================
// This object maps each escalation level to a specific worker.
// When a complaint reaches a certain level, we assign the
// corresponding worker to handle it.
// 
// Why hardcoded? In a real app, this would come from a database
// of workers. For now, we use fixed values for simplicity.
// ============================================================
export const LEVEL_WORKERS: Record<Level, { name: string; phone: string }> = {
  'Level 1': { name: 'Carpenter Krishna', phone: '9876543210' },
  'Level 2': { name: 'Maintenance Supervisor', phone: '9876500000' },
  'Level 3': { name: 'External Contractor', phone: '9876511111' },
  'Level 4': { name: 'Hostel Warden', phone: '9876522222' },
};

export const generateComplaintId = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `HC-${timestamp}-${random}`;
};
