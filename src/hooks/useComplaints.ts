import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Complaint, Status, Level, Severity } from '@/types/complaint';

// ============================================================
// DATABASE SHAPE INTERFACE
// ============================================================
// This interface describes how data looks in the Supabase database.
// Notice how database columns use snake_case (room_number)
// while our TypeScript uses camelCase (roomNumber).
// ============================================================
interface DbComplaint {
  id: string;                      // Unique database ID (UUID)
  complaint_id: string;            // Human-readable complaint ID like "HC-ABC123"
  hostel: string;                  // Name of the hostel
  room_number: string;             // Room number
  student_name: string;            // Student's full name
  roll_number: string;             // Student's roll number
  issue_type: string;              // Type of complaint (Electrical, Plumbing, etc.)
  severity: string;                // How urgent: Normal, Urgent, Critical
  description: string;             // Detailed description of the issue
  images: string[];                // Array of image URLs stored in Supabase Storage
  video: string | null;            // Optional video URL
  status: string;                  // Current status: Pending, In Progress, Resolved, etc.
  level: string;                   // Escalation level: Level 1, Level 2, Level 3, Level 4
  feedback_rating: number | null;  // User's rating after resolution (1-5)
  feedback_comment: string | null; // User's feedback comment
  feedback_submitted_at: string | null; // When feedback was submitted
  created_at: string;              // When complaint was created
  updated_at: string;              // When complaint was last updated
}

// ============================================================
// DATA MAPPER FUNCTION
// ============================================================
// This function converts database format (snake_case) to our app format (camelCase).
// Why? Database conventions use snake_case, but JavaScript/TypeScript
// conventions use camelCase. This keeps both sides happy!
// ============================================================
const mapDbToComplaint = (db: DbComplaint): Complaint => ({
  id: db.complaint_id,           // We use complaint_id as the main ID in our app
  hostel: db.hostel,
  roomNumber: db.room_number,    // snake_case → camelCase conversion
  studentName: db.student_name,
  rollNumber: db.roll_number,
  issueType: db.issue_type,
  severity: db.severity as Severity,  // Type casting to our Severity type
  description: db.description,
  images: db.images || [],       // Default to empty array if null
  video: db.video || undefined,  // Convert null to undefined for TypeScript
  status: db.status as Status,
  level: db.level as Level,
  createdAt: db.created_at,
  updatedAt: db.updated_at,
  // Only include feedback if a rating exists
  feedback: db.feedback_rating
    ? {
        rating: db.feedback_rating,
        comment: db.feedback_comment || '',
        submittedAt: db.feedback_submitted_at || '',
      }
    : undefined,
});

// ============================================================
// MAIN HOOK: useComplaints
// ============================================================
// This is a custom React Hook that handles all complaint operations.
// Hooks let you reuse logic across components. This hook provides:
// - complaints: Array of all complaints
// - isLoading: Boolean to show loading state
// - addComplaint, updateComplaint, etc.: Functions to modify data
// ============================================================
export const useComplaints = () => {
  // ============================================================
  // STATE MANAGEMENT
  // ============================================================
  // useState creates reactive variables that trigger re-renders when changed.
  // complaints: stores the array of all complaints from the database
  // isLoading: tracks if we're currently fetching data
  // ============================================================
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ============================================================
  // FETCH ALL COMPLAINTS FROM DATABASE
  // ============================================================
  // This function queries the Supabase 'complaints' table.
  // .select('*') means "get all columns"
  // .order() sorts results by created_at in descending order (newest first)
  // ============================================================
  const fetchComplaints = async () => {
    setIsLoading(true);  // Show loading spinner
    
    // Supabase query - similar to SQL: SELECT * FROM complaints ORDER BY created_at DESC
    const { data, error } = await supabase
      .from('complaints')        // The table name in Supabase
      .select('*')               // Select all columns
      .order('created_at', { ascending: false }); // Sort by date, newest first

    if (error) {
      // Always log errors for debugging
      console.error('Error fetching complaints:', error);
    } else if (data) {
      // Convert database format to app format using our mapper
      setComplaints(data.map(mapDbToComplaint));
    }
    
    setIsLoading(false);  // Hide loading spinner
  };

  // ============================================================
  // useEffect - RUNS ON COMPONENT MOUNT
  // ============================================================
  // useEffect with empty dependency array [] runs once when component mounts.
  // This is where we load initial data from the database.
  // ============================================================
  useEffect(() => {
    fetchComplaints();
  }, []);  // Empty array = run only once on mount

  // ============================================================
  // ADD NEW COMPLAINT
  // ============================================================
  // This function:
  // 1. Uploads images to Supabase Storage
  // 2. Uploads video to Supabase Storage (if provided)
  // 3. Inserts complaint record with file URLs into database
  // ============================================================
  const addComplaint = async (complaint: Complaint, imageFiles: File[], videoFile?: File) => {
    const imageUrls: string[] = [];

    // STEP 1: Upload each image to Supabase Storage
    for (const file of imageFiles) {
      // Create unique filename: complaint-id/timestamp-originalname
      const fileName = `${complaint.id}/${Date.now()}-${file.name}`;
      
      // Upload file to 'complaint-attachments' bucket
      const { error: uploadError } = await supabase.storage
        .from('complaint-attachments')  // Storage bucket name
        .upload(fileName, file);        // Upload the file

      if (!uploadError) {
        // Get the public URL for the uploaded file
        const { data: { publicUrl } } = supabase.storage
          .from('complaint-attachments')
          .getPublicUrl(fileName);
        imageUrls.push(publicUrl);
      }
    }

    // STEP 2: Upload video if provided (same process as images)
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

    // STEP 3: Insert complaint record into database
    // Similar to SQL: INSERT INTO complaints (columns...) VALUES (values...)
    const { error } = await supabase.from('complaints').insert({
      complaint_id: complaint.id,     // Convert camelCase to snake_case
      hostel: complaint.hostel,
      room_number: complaint.roomNumber,
      student_name: complaint.studentName,
      roll_number: complaint.rollNumber,
      issue_type: complaint.issueType,
      severity: complaint.severity,
      description: complaint.description,
      images: imageUrls,              // Array of uploaded image URLs
      video: videoUrl,                // Video URL (or null)
      status: complaint.status,
      level: complaint.level,
    });

    if (error) {
      console.error('Error adding complaint:', error);
      throw error;  // Throw so calling code can handle the error
    }

    // Refresh the complaints list to include the new one
    await fetchComplaints();
    return complaint;
  };

  // ============================================================
  // UPDATE EXISTING COMPLAINT
  // ============================================================
  // Updates specific fields of a complaint.
  // .eq('complaint_id', id) is like SQL: WHERE complaint_id = 'id'
  // ============================================================
  const updateComplaint = async (id: string, updates: Partial<Complaint>) => {
    // Build the update object with only the fields we want to change
    const dbUpdates: Record<string, unknown> = {};

    if (updates.status) dbUpdates.status = updates.status;
    if (updates.level) dbUpdates.level = updates.level;
    if (updates.feedback) {
      dbUpdates.feedback_rating = updates.feedback.rating;
      dbUpdates.feedback_comment = updates.feedback.comment;
      dbUpdates.feedback_submitted_at = updates.feedback.submittedAt;
    }

    // SQL equivalent: UPDATE complaints SET ... WHERE complaint_id = 'id'
    const { error } = await supabase
      .from('complaints')
      .update(dbUpdates)
      .eq('complaint_id', id);  // .eq() is the WHERE clause

    if (error) {
      console.error('Error updating complaint:', error);
      throw error;
    }

    // Refresh data to show updated complaint
    await fetchComplaints();
  };

  // ============================================================
  // ESCALATE COMPLAINT TO NEXT LEVEL
  // ============================================================
  // Moves complaint from Level 1 → 2 → 3 → 4
  // This is used when an issue needs higher authority attention.
  // ============================================================
  const escalateComplaint = async (id: string) => {
    // Find the complaint in our local state
    const complaint = complaints.find((c) => c.id === id);
    if (!complaint) return;

    // Define the escalation path
    const levelMap: Record<Level, Level | null> = {
      'Level 1': 'Level 2',
      'Level 2': 'Level 3',
      'Level 3': 'Level 4',
      'Level 4': null,  // Can't escalate beyond Level 4
    };

    const nextLevel = levelMap[complaint.level];
    if (nextLevel) {
      // Update both the level and status
      await updateComplaint(id, { level: nextLevel, status: 'Escalated' });
    }
  };

  // ============================================================
  // RESOLVE COMPLAINT
  // ============================================================
  // Marks a complaint as resolved.
  // Simple wrapper around updateComplaint for cleaner API.
  // ============================================================
  const resolveComplaint = async (id: string) => {
    await updateComplaint(id, { status: 'Resolved' });
  };

  // ============================================================
  // SUBMIT FEEDBACK
  // ============================================================
  // Allows users to rate and comment on resolved complaints.
  // ============================================================
  const submitFeedback = async (id: string, rating: number, comment: string) => {
    await updateComplaint(id, {
      feedback: {
        rating,
        comment,
        submittedAt: new Date().toISOString(),  // Current timestamp in ISO format
      },
    });
  };

  // ============================================================
  // GET SINGLE COMPLAINT BY ID
  // ============================================================
  // Finds a complaint from our local state (no database call needed).
  // Returns undefined if not found.
  // ============================================================
  const getComplaintById = (id: string) => {
    return complaints.find((c) => c.id === id);
  };

  // ============================================================
  // RETURN HOOK VALUES
  // ============================================================
  // Everything returned here is available to components using this hook.
  // Example usage: const { complaints, addComplaint } = useComplaints();
  // ============================================================
  return {
    complaints,           // Array of all complaints
    isLoading,           // Loading state boolean
    addComplaint,        // Function to create new complaint
    updateComplaint,     // Function to update any complaint fields
    escalateComplaint,   // Function to escalate to next level
    resolveComplaint,    // Function to mark as resolved
    submitFeedback,      // Function to submit user feedback
    getComplaintById,    // Function to find complaint by ID
    refetch: fetchComplaints,  // Function to manually refresh data
  };
};
