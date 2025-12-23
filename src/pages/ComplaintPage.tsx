import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { ComplaintDetail } from '@/components/ComplaintDetail';
import { useComplaints } from '@/hooks/useComplaints';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileX } from 'lucide-react';

const ComplaintPage = () => {
  const { id } = useParams<{ id: string }>();
  const { getComplaintById, isLoading } = useComplaints();

  const complaint = id ? getComplaintById(id) : undefined;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container px-4 py-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container px-4 py-6">
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <FileX className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h2 className="text-xl font-display font-bold mb-2">Complaint Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The complaint you're looking for doesn't exist or has been removed.
            </p>
            <Link to="/">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container px-4 py-6">
        <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>
        <ComplaintDetail complaint={complaint} />
      </main>
    </div>
  );
};

export default ComplaintPage;
