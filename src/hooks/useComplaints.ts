import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Complaint, Status, Level, Severity } from '@/types/complaint';

interface DbComplaint {
  id: string;
  complaint_id: string;
  hostel: string;
  room_number: string;
  student_name: string;
  roll_number: string;
  issue_type: string;
  severity: string;
  description: string;
  images: string[];
  video: string | null;
  status: string;
  level: string;
  feedback_rating: number | null;
  feedback_comment: string | null;
  feedback_submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

const mapDbToComplaint = (db: DbComplaint): Complaint => ({
  id: db.complaint_id,
  hostel: db.hostel,
  roomNumber: db.room_number,
  studentName: db.student_name,
  rollNumber: db.roll_number,
  issueType: db.issue_type,
  severity: db.severity as Severity,
  description: db.description,
  images: db.images || [],
  video: db.video || undefined,
  status: db.status as Status,
  level: db.level as Level,
  createdAt: db.created_at,
  updatedAt: db.updated_at,
  feedback: db.feedback_rating
    ? {
        rating: db.feedback_rating,
        comment: db.feedback_comment || '',
        submittedAt: db.feedback_submitted_at || '',
      }
    : undefined,
});

export const useComplaints = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchComplaints = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching complaints:', error);
    } else if (data) {
      setComplaints(data.map(mapDbToComplaint));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const addComplaint = async (complaint: Complaint, imageFiles: File[], videoFile?: File) => {
    const imageUrls: string[] = [];

    // Upload images to storage
    for (const file of imageFiles) {
      const fileName = `${complaint.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('complaint-attachments')
        .upload(fileName, file);

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('complaint-attachments')
          .getPublicUrl(fileName);
        imageUrls.push(publicUrl);
      }
    }

    // Upload video if provided
    let videoUrl: string | null = null;
    if (videoFile) {
      const fileName = `${complaint.id}/${Date.now()}-${videoFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('complaint-attachments')
        .upload(fileName, videoFile);

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('complaint-attachments')
          .getPublicUrl(fileName);
        videoUrl = publicUrl;
      }
    }

    const { error } = await supabase.from('complaints').insert({
      complaint_id: complaint.id,
      hostel: complaint.hostel,
      room_number: complaint.roomNumber,
      student_name: complaint.studentName,
      roll_number: complaint.rollNumber,
      issue_type: complaint.issueType,
      severity: complaint.severity,
      description: complaint.description,
      images: imageUrls,
      video: videoUrl,
      status: complaint.status,
      level: complaint.level,
    });

    if (error) {
      console.error('Error adding complaint:', error);
      throw error;
    }

    await fetchComplaints();
    return complaint;
  };

  const updateComplaint = async (id: string, updates: Partial<Complaint>) => {
    const dbUpdates: Record<string, unknown> = {};

    if (updates.status) dbUpdates.status = updates.status;
    if (updates.level) dbUpdates.level = updates.level;
    if (updates.feedback) {
      dbUpdates.feedback_rating = updates.feedback.rating;
      dbUpdates.feedback_comment = updates.feedback.comment;
      dbUpdates.feedback_submitted_at = updates.feedback.submittedAt;
    }

    const { error } = await supabase
      .from('complaints')
      .update(dbUpdates)
      .eq('complaint_id', id);

    if (error) {
      console.error('Error updating complaint:', error);
      throw error;
    }

    await fetchComplaints();
  };

  const escalateComplaint = async (id: string) => {
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
      await updateComplaint(id, { level: nextLevel, status: 'Escalated' });
    }
  };

  const resolveComplaint = async (id: string) => {
    await updateComplaint(id, { status: 'Resolved' });
  };

  const submitFeedback = async (id: string, rating: number, comment: string) => {
    await updateComplaint(id, {
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
    refetch: fetchComplaints,
  };
};
