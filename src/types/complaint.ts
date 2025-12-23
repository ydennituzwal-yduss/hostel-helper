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

export const generateComplaintId = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `HC-${timestamp}-${random}`;
};
