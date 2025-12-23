import { useState, useEffect } from 'react';
import { Complaint, Status, Level } from '@/types/complaint';

const STORAGE_KEY = 'hostel_complaints';

export const useComplaints = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setComplaints(JSON.parse(stored));
    }
    setIsLoading(false);
  }, []);

  const saveComplaints = (updated: Complaint[]) => {
    setComplaints(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const addComplaint = (complaint: Complaint) => {
    const updated = [complaint, ...complaints];
    saveComplaints(updated);
    return complaint;
  };

  const updateComplaint = (id: string, updates: Partial<Complaint>) => {
    const updated = complaints.map((c) =>
      c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
    );
    saveComplaints(updated);
  };

  const escalateComplaint = (id: string) => {
    const complaint = complaints.find((c) => c.id === id);
    if (!complaint) return;

    const levelMap: Record<Level, Level | null> = {
      'Level 1': 'Level 2',
      'Level 2': 'Level 3',
      'Level 3': 'Level 4',
      'Level 4': null,
    };

    const nextLevel = levelMap[complaint.level];
    if (nextLevel) {
      updateComplaint(id, { level: nextLevel, status: 'Escalated' });
    }
  };

  const resolveComplaint = (id: string) => {
    updateComplaint(id, { status: 'Resolved' });
  };

  const submitFeedback = (id: string, rating: number, comment: string) => {
    updateComplaint(id, {
      feedback: {
        rating,
        comment,
        submittedAt: new Date().toISOString(),
      },
    });
  };

  const getComplaintById = (id: string) => {
    return complaints.find((c) => c.id === id);
  };

  return {
    complaints,
    isLoading,
    addComplaint,
    updateComplaint,
    escalateComplaint,
    resolveComplaint,
    submitFeedback,
    getComplaintById,
  };
};
