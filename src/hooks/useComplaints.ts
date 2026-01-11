import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Complaint, Status, Level, Severity, LEVEL_WORKERS, getLevel1Worker } from '@/types/complaint';

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
  assigned_worker_name: string | null;  // Worker assigned to handle this complaint
  assigned_worker_phone: string | null; // Worker's phone number
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
  // Map worker assignment fields (convert null to undefined)
  assignedWorkerName: db.assigned_worker_name || undefined,
  assignedWorkerPhone: db.assigned_worker_phone || undefined,
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
  // ============================================================
  // AUTO-ESCALATION LOGIC
  // ============================================================
  // This function checks if a complaint should be auto-escalated.
  // Auto-escalation happens when:
  // - Complaint is NOT resolved
  // - Complaint is NOT at Level 4 (max level)
  // - More than 3 days have passed since creation
  // 
  // WHY NO TIMERS OR BACKGROUND JOBS?
  // - This is a simple approach that checks on every data fetch
  // - No need for complex server-side cron jobs
  // - Works perfectly for a prototype/demo
  // ============================================================
  const checkAutoEscalation = async (complaint: DbComplaint) => {
    // Skip if already resolved - no need to escalate
    if (complaint.status === 'Resolved') return false;
    
    // Skip if already at max level (Level 4)
    if (complaint.level === 'Level 4') return false;
    
    // Calculate days since complaint was created
    const createdDate = new Date(complaint.created_at);
    const now = new Date();
    const daysSinceCreated = Math.floor(
      (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Auto-escalate if more than 3 days have passed
    if (daysSinceCreated >= 3) {
      // Get next level using type-safe mapping
      const levelMap: Record<string, Level> = {
        'Level 1': 'Level 2',
        'Level 2': 'Level 3',
        'Level 3': 'Level 4',
      };
      const nextLevel = levelMap[complaint.level];
      
      if (nextLevel) {
        // Get worker for next level
        const worker = LEVEL_WORKERS[nextLevel];
        
        // Update in database
        await supabase
          .from('complaints')
          .update({
            level: nextLevel,
            status: 'Escalated',
            assigned_worker_name: worker.name,
            assigned_worker_phone: worker.phone,
          })
          .eq('complaint_id', complaint.complaint_id);
        
        return true; // Complaint was escalated
      }
    }
    
    return false; // No escalation needed
  };

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
      setIsLoading(false);
      return;
    }
    
    if (data) {
      // ============================================================
      // CHECK FOR AUTO-ESCALATION ON EACH COMPLAINT
      // ============================================================
      // This runs every time we fetch complaints.
      // It checks each complaint and escalates if 3+ days old.
      // ============================================================
      let needsRefresh = false;
      for (const complaint of data) {
        const wasEscalated = await checkAutoEscalation(complaint);
        if (wasEscalated) needsRefresh = true;
      }
      
      // If any complaints were auto-escalated, fetch fresh data
      if (needsRefresh) {
        const { data: freshData } = await supabase
          .from('complaints')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (freshData) {
          setComplaints(freshData.map(mapDbToComplaint));
        }
      } else {
        // No escalations, use the data we already fetched
        setComplaints(data.map(mapDbToComplaint));
      }
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
  // 4. Assigns initial worker based on Level 1
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

    // ============================================================
    // GET WORKER FOR LEVEL 1 BASED ON ISSUE TYPE
    // ============================================================
    // For Level 1, we assign a worker based on the issue type.
    // This ensures the right specialist handles each type of problem.
    // ============================================================
    const initialWorker = getLevel1Worker(complaint.issueType);

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
      // Assign worker based on issue type for Level 1
      assigned_worker_name: initialWorker.name,
      assigned_worker_phone: initialWorker.phone,
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
    // Map worker assignment fields to snake_case for database
    if (updates.assignedWorkerName) dbUpdates.assigned_worker_name = updates.assignedWorkerName;
    if (updates.assignedWorkerPhone) dbUpdates.assigned_worker_phone = updates.assignedWorkerPhone;
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
  // ⚠️ IMPORTANT: This function ONLY updates data in Supabase.
  // It does NOT navigate to a new page or call any API routes.
  // 
  // WHY THIS FIXES THE 404 ERROR ON VERCEL:
  // - The 404 error happens when your app tries to navigate to a 
  //   route that doesn't exist (like /api/escalate or /escalate).
  // - By using supabase.update() directly, we stay on the same page
  //   and just update the database. No navigation = no 404!
  // 
  // This function:
  // 1. Finds the complaint in local state
  // 2. Calculates the next level (Level 1 → 2 → 3 → 4)
  // 3. Gets the worker assigned to that level
  // 4. Updates the database with new level, status, and worker
  // 5. Refreshes the complaint list to show changes
  // ============================================================
  const escalateComplaint = async (id: string) => {
    // Find the complaint in our local state
    const complaint = complaints.find((c) => c.id === id);
    
    // If complaint not found, exit early
    if (!complaint) {
      console.error('Complaint not found:', id);
      return;
    }

    // Define the escalation path - each level maps to the next one
    // Level 4 maps to null because it's the highest level
    const levelMap: Record<Level, Level | null> = {
      'Level 1': 'Level 2',
      'Level 2': 'Level 3',
      'Level 3': 'Level 4',
      'Level 4': null,  // Can't escalate beyond Level 4
    };

    // Get the next level from the map
    const nextLevel = levelMap[complaint.level];
    
    // If there's no next level (already at Level 4), do nothing
    if (!nextLevel) {
      console.log('Already at maximum level');
      return;
    }

    // Get the worker details for the next level
    // This uses the LEVEL_WORKERS mapping from complaint.ts
    const worker = LEVEL_WORKERS[nextLevel];

    // ============================================================
    // DIRECT SUPABASE UPDATE - NO PAGE NAVIGATION!
    // ============================================================
    // This is the key fix for the 404 error.
    // We're calling supabase.from('complaints').update() directly,
    // which sends a request to Supabase (not to your Vercel app).
    // This means no routing is involved, so no 404 can happen.
    // ============================================================
    const { error } = await supabase
      .from('complaints')
      .update({
        level: nextLevel,                    // Update to new level
        status: 'Escalated',                 // Set status to Escalated
        assigned_worker_name: worker.name,   // Assign new worker
        assigned_worker_phone: worker.phone, // Include worker's phone
      })
      .eq('complaint_id', id);  // Only update this specific complaint

    if (error) {
      console.error('Error escalating complaint:', error);
      throw error;
    }

    // Refresh the complaint list to show the updated data
    // This re-fetches from database and updates our local state
    await fetchComplaints();
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
  // DELETE COMPLAINT
  // ============================================================
  // ⚠️ IMPORTANT: This function ONLY deletes RESOLVED complaints!
  // 
  // WHY RESTRICT TO RESOLVED ONLY?
  // - Prevents accidental deletion of active complaints
  // - Ensures complaint history is preserved until resolution
  // - Matches the RLS policy we created in the database
  // 
  // HOW SUPABASE DELETE WORKS:
  // - supabase.from('table').delete() removes rows from the table
  // - .eq() filters which rows to delete (like SQL WHERE clause)
  // - The RLS policy on the server ALSO checks if status = 'Resolved'
  //   This means even if someone bypasses the frontend check,
  //   the database will reject the delete for non-resolved complaints.
  // ============================================================
  const deleteComplaint = async (id: string) => {
    // First, find the complaint to verify it exists and is resolved
    const complaint = complaints.find((c) => c.id === id);
    
    if (!complaint) {
      console.error('Complaint not found:', id);
      throw new Error('Complaint not found');
    }

    // Frontend check: Only allow deletion of resolved complaints
    // This provides a good user experience with clear error messages
    if (complaint.status !== 'Resolved') {
      console.error('Cannot delete non-resolved complaint');
      throw new Error('Only resolved complaints can be deleted');
    }

    // ============================================================
    // SUPABASE DELETE QUERY
    // ============================================================
    // SQL equivalent: DELETE FROM complaints WHERE complaint_id = 'id'
    // The RLS policy also enforces that status must be 'Resolved'
    // ============================================================
    const { error } = await supabase
      .from('complaints')
      .delete()
      .eq('complaint_id', id);

    if (error) {
      console.error('Error deleting complaint:', error);
      throw error;
    }

    // Refresh the list to remove the deleted complaint
    await fetchComplaints();
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
    escalateComplaint,   // Function to escalate to next level (FIXES 404!)
    resolveComplaint,    // Function to mark as resolved
    deleteComplaint,     // Function to delete resolved complaints
    submitFeedback,      // Function to submit user feedback
    getComplaintById,    // Function to find complaint by ID
    refetch: fetchComplaints,  // Function to manually refresh data
  };
};
