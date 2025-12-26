// ============================================================
// STUDENT COMPLAINT FORM
// ============================================================
// A simplified form for students to submit complaints.
// Pre-fills the roll number since we know who's logged in.
// 
// BEGINNER NOTES:
// - Form state is managed with useState
// - onSuccess callback is called after successful submission
// - Images and videos can be uploaded to Supabase Storage
// ============================================================

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useComplaints } from '@/hooks/useComplaints';
import {
  Complaint,
  Severity,
  HOSTELS,
  ISSUE_TYPES,
  generateComplaintId,
} from '@/types/complaint';
import { Upload, X, ImageIcon, Video, Send, AlertCircle } from 'lucide-react';

interface StudentComplaintFormProps {
  rollNumber: string;        // Pre-filled from login
  onSuccess: () => void;     // Called after successful submission
}

export const StudentComplaintForm = ({ rollNumber, onSuccess }: StudentComplaintFormProps) => {
  const { toast } = useToast();
  const { addComplaint } = useComplaints();

  // Form data state
  const [formData, setFormData] = useState({
    hostel: '',
    roomNumber: '',
    studentName: '',
    issueType: '',
    customIssue: '',
    severity: 'Normal' as Severity,
    description: '',
  });

  // File upload states
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videoFile, setVideoFile] = useState<File | undefined>();
  const [videoPreview, setVideoPreview] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (imageFiles.length + files.length > 3) {
      toast({
        title: 'Too many images',
        description: 'You can upload up to 3 images only.',
        variant: 'destructive',
      });
      return;
    }

    Array.from(files).forEach((file) => {
      setImageFiles((prev) => [...prev, file]);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle video upload
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVideoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setVideoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Remove an image from the list
  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const complaintId = generateComplaintId();
      const now = new Date().toISOString();

      // Build the complaint object
      const complaint: Complaint = {
        id: complaintId,
        hostel: formData.hostel,
        roomNumber: formData.roomNumber,
        studentName: formData.studentName,
        rollNumber: rollNumber, // Use the logged-in roll number
        issueType: formData.issueType === 'Other' ? formData.customIssue : formData.issueType,
        severity: formData.severity,
        description: formData.description,
        images: [],
        status: 'Pending',
        level: 'Level 1',
        createdAt: now,
        updatedAt: now,
      };

      // Add complaint to database (includes file uploads)
      await addComplaint(complaint, imageFiles, videoFile);

      toast({
        title: 'Complaint Submitted!',
        description: `Your complaint ID is: ${complaintId}`,
      });

      // Call success callback to go back to list
      onSuccess();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit complaint. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if form is valid
  const isFormValid =
    formData.hostel &&
    formData.roomNumber &&
    formData.studentName &&
    formData.issueType &&
    (formData.issueType !== 'Other' || formData.customIssue) &&
    formData.description;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Student Information Card */}
      <Card className="glass-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            Student Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Roll Number (read-only, from login) */}
          <div className="space-y-2">
            <Label>Roll Number</Label>
            <Input value={rollNumber} disabled className="bg-muted" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hostel">Hostel *</Label>
              <Select
                value={formData.hostel}
                onValueChange={(value) => setFormData({ ...formData, hostel: value })}
              >
                <SelectTrigger id="hostel" className="bg-background">
                  <SelectValue placeholder="Select hostel" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {HOSTELS.map((hostel) => (
                    <SelectItem key={hostel} value={hostel}>
                      {hostel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="roomNumber">Room Number *</Label>
              <Input
                id="roomNumber"
                placeholder="e.g., 101"
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                className="bg-background"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="studentName">Your Name *</Label>
            <Input
              id="studentName"
              placeholder="Enter your full name"
              value={formData.studentName}
              onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
              className="bg-background"
            />
          </div>
        </CardContent>
      </Card>

      {/* Complaint Details Card */}
      <Card className="glass-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-display">Complaint Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="issueType">Issue Type *</Label>
            <Select
              value={formData.issueType}
              onValueChange={(value) => setFormData({ ...formData, issueType: value })}
            >
              <SelectTrigger id="issueType" className="bg-background">
                <SelectValue placeholder="Select issue type" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {ISSUE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.issueType === 'Other' && (
            <div className="space-y-2 animate-fade-in">
              <Label htmlFor="customIssue">Specify Issue *</Label>
              <Input
                id="customIssue"
                placeholder="Describe the issue type"
                value={formData.customIssue}
                onChange={(e) => setFormData({ ...formData, customIssue: e.target.value })}
                className="bg-background"
              />
            </div>
          )}

          {/* Severity Selection */}
          <div className="space-y-3">
            <Label>Severity *</Label>
            <RadioGroup
              value={formData.severity}
              onValueChange={(value) => setFormData({ ...formData, severity: value as Severity })}
              className="flex flex-col gap-3"
            >
              <div className="flex items-center space-x-2 p-3 rounded-lg border bg-background hover:border-primary/50 transition-colors cursor-pointer">
                <RadioGroupItem value="Normal" id="normal" />
                <Label htmlFor="normal" className="cursor-pointer flex items-center gap-2 flex-1">
                  <span className="w-2 h-2 rounded-full bg-severity-normal" />
                  Normal
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg border bg-background hover:border-primary/50 transition-colors cursor-pointer">
                <RadioGroupItem value="Needs Quick Attention" id="urgent" />
                <Label htmlFor="urgent" className="cursor-pointer flex items-center gap-2 flex-1">
                  <span className="w-2 h-2 rounded-full bg-severity-urgent" />
                  Needs Quick Attention
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg border bg-background hover:border-primary/50 transition-colors cursor-pointer">
                <RadioGroupItem value="Extreme" id="extreme" />
                <Label htmlFor="extreme" className="cursor-pointer flex items-center gap-2 flex-1">
                  <span className="w-2 h-2 rounded-full bg-severity-extreme" />
                  Extreme
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe your complaint in detail..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="min-h-[120px] bg-background resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Attachments Card */}
      <Card className="glass-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-display">Attachments (Optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Images (up to 3)
            </Label>
            <div className="flex flex-wrap gap-3">
              {imagePreviews.map((img, index) => (
                <div key={index} className="relative group">
                  <img
                    src={img}
                    alt={`Upload ${index + 1}`}
                    className="w-20 h-20 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {imagePreviews.length < 3 && (
                <label className="w-20 h-20 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors bg-muted/30">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Video Upload */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Video
            </Label>
            {videoPreview ? (
              <div className="relative inline-block">
                <video 
                  src={videoPreview} 
                  className="w-40 h-24 object-cover rounded-lg border" 
                  controls 
                />
                <button
                  type="button"
                  onClick={() => {
                    setVideoFile(undefined);
                    setVideoPreview(undefined);
                  }}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <label className="w-40 h-24 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors bg-muted/30">
                <div className="text-center">
                  <Upload className="h-6 w-6 text-muted-foreground mx-auto" />
                  <span className="text-xs text-muted-foreground mt-1">Upload video</span>
                </div>
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleVideoUpload}
                />
              </label>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Button
        type="submit"
        size="lg"
        disabled={!isFormValid || isSubmitting}
        className="w-full font-semibold"
      >
        <Send className="h-4 w-4 mr-2" />
        {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
      </Button>
    </form>
  );
};
