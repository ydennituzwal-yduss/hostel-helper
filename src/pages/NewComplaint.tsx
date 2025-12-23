import { Header } from '@/components/Header';
import { ComplaintForm } from '@/components/ComplaintForm';

const NewComplaint = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-display font-bold">Submit Complaint</h2>
          <p className="text-muted-foreground text-sm">
            Fill out the form below to report a hostel issue
          </p>
        </div>
        <ComplaintForm />
      </main>
    </div>
  );
};

export default NewComplaint;
