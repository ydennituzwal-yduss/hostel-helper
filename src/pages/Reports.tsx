import { Header } from '@/components/Header';
import { ReportGenerator } from '@/components/ReportGenerator';

const Reports = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-display font-bold">Reports</h2>
          <p className="text-muted-foreground text-sm">
            Generate and download complaint reports
          </p>
        </div>
        <ReportGenerator />
      </main>
    </div>
  );
};

export default Reports;
