-- Add worker assignment columns to complaints table
-- These columns store the assigned worker's details when a complaint is escalated
ALTER TABLE public.complaints 
ADD COLUMN assigned_worker_name text,
ADD COLUMN assigned_worker_phone text;

-- Create a policy to allow anyone to delete resolved complaints
CREATE POLICY "Anyone can delete resolved complaints" 
ON public.complaints 
FOR DELETE 
USING (status = 'Resolved');