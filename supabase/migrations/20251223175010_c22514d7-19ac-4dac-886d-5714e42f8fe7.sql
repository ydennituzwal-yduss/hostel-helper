-- Create enum types for complaint fields
CREATE TYPE public.complaint_status AS ENUM ('Pending', 'Assigned', 'Escalated', 'Resolved');
CREATE TYPE public.complaint_level AS ENUM ('Level 1', 'Level 2', 'Level 3', 'Level 4');
CREATE TYPE public.complaint_severity AS ENUM ('Normal', 'Needs Quick Attention', 'Extreme');

-- Create complaints table
CREATE TABLE public.complaints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_id TEXT NOT NULL UNIQUE,
  hostel TEXT NOT NULL,
  room_number TEXT NOT NULL,
  student_name TEXT NOT NULL,
  roll_number TEXT NOT NULL,
  issue_type TEXT NOT NULL,
  severity complaint_severity NOT NULL DEFAULT 'Normal',
  description TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  video TEXT,
  status complaint_status NOT NULL DEFAULT 'Pending',
  level complaint_level NOT NULL DEFAULT 'Level 1',
  feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
  feedback_comment TEXT,
  feedback_submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (public access for demo)
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since no auth required for demo)
CREATE POLICY "Anyone can view complaints" 
ON public.complaints 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create complaints" 
ON public.complaints 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update complaints" 
ON public.complaints 
FOR UPDATE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_complaints_updated_at
BEFORE UPDATE ON public.complaints
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for complaint attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('complaint-attachments', 'complaint-attachments', true);

-- Create storage policies for public access
CREATE POLICY "Anyone can view attachments" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'complaint-attachments');

CREATE POLICY "Anyone can upload attachments" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'complaint-attachments');

CREATE POLICY "Anyone can update attachments" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'complaint-attachments');

CREATE POLICY "Anyone can delete attachments" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'complaint-attachments');