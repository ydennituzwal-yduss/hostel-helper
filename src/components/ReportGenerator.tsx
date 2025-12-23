import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useComplaints } from '@/hooks/useComplaints';
import { useToast } from '@/hooks/use-toast';
import { FileDown, FileText, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export const ReportGenerator = () => {
  const { complaints } = useComplaints();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const groupBySeverity = () => {
    return {
      Extreme: complaints.filter((c) => c.severity === 'Extreme'),
      'Needs Quick Attention': complaints.filter((c) => c.severity === 'Needs Quick Attention'),
      Normal: complaints.filter((c) => c.severity === 'Normal'),
    };
  };

  const grouped = groupBySeverity();

  const stats = {
    total: complaints.length,
    pending: complaints.filter((c) => c.status === 'Pending').length,
    assigned: complaints.filter((c) => c.status === 'Assigned').length,
    escalated: complaints.filter((c) => c.status === 'Escalated').length,
    resolved: complaints.filter((c) => c.status === 'Resolved').length,
  };

  const generatePDF = () => {
    setIsGenerating(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Title
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Hostel Complaint Report', pageWidth / 2, 20, { align: 'center' });

      // Date
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${format(new Date(), 'PPpp')}`, pageWidth / 2, 28, { align: 'center' });

      // Summary Stats
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary', 14, 42);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Complaints: ${stats.total}`, 14, 50);
      doc.text(`Pending: ${stats.pending}`, 14, 56);
      doc.text(`Assigned: ${stats.assigned}`, 14, 62);
      doc.text(`Escalated: ${stats.escalated}`, 14, 68);
      doc.text(`Resolved: ${stats.resolved}`, 14, 74);

      let yOffset = 90;

      // Extreme Severity Section
      if (grouped.Extreme.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(220, 53, 69);
        doc.text('🔴 EXTREME SEVERITY', 14, yOffset);
        doc.setTextColor(0, 0, 0);

        autoTable(doc, {
          startY: yOffset + 5,
          head: [['ID', 'Hostel', 'Room', 'Issue', 'Status', 'Level', 'Date']],
          body: grouped.Extreme.map((c) => [
            c.id,
            c.hostel,
            c.roomNumber,
            c.issueType,
            c.status,
            c.level,
            format(new Date(c.createdAt), 'PP'),
          ]),
          theme: 'striped',
          headStyles: { fillColor: [220, 53, 69] },
          styles: { fontSize: 8 },
        });

        yOffset = (doc as any).lastAutoTable.finalY + 15;
      }

      // Needs Quick Attention Section
      if (grouped['Needs Quick Attention'].length > 0) {
        if (yOffset > 250) {
          doc.addPage();
          yOffset = 20;
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 193, 7);
        doc.text('🟡 NEEDS QUICK ATTENTION', 14, yOffset);
        doc.setTextColor(0, 0, 0);

        autoTable(doc, {
          startY: yOffset + 5,
          head: [['ID', 'Hostel', 'Room', 'Issue', 'Status', 'Level', 'Date']],
          body: grouped['Needs Quick Attention'].map((c) => [
            c.id,
            c.hostel,
            c.roomNumber,
            c.issueType,
            c.status,
            c.level,
            format(new Date(c.createdAt), 'PP'),
          ]),
          theme: 'striped',
          headStyles: { fillColor: [255, 193, 7], textColor: [0, 0, 0] },
          styles: { fontSize: 8 },
        });

        yOffset = (doc as any).lastAutoTable.finalY + 15;
      }

      // Normal Severity Section
      if (grouped.Normal.length > 0) {
        if (yOffset > 250) {
          doc.addPage();
          yOffset = 20;
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(13, 110, 253);
        doc.text('🔵 NORMAL SEVERITY', 14, yOffset);
        doc.setTextColor(0, 0, 0);

        autoTable(doc, {
          startY: yOffset + 5,
          head: [['ID', 'Hostel', 'Room', 'Issue', 'Status', 'Level', 'Date']],
          body: grouped.Normal.map((c) => [
            c.id,
            c.hostel,
            c.roomNumber,
            c.issueType,
            c.status,
            c.level,
            format(new Date(c.createdAt), 'PP'),
          ]),
          theme: 'striped',
          headStyles: { fillColor: [13, 110, 253] },
          styles: { fontSize: 8 },
        });
      }

      // Save the PDF
      doc.save(`hostel-complaints-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);

      toast({
        title: 'Report Generated!',
        description: 'Your PDF report has been downloaded.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Generate Report
          </CardTitle>
          <CardDescription>
            Download a PDF report of all complaints grouped by severity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={generatePDF}
            disabled={complaints.length === 0 || isGenerating}
            size="lg"
            className="w-full"
          >
            <FileDown className="h-4 w-4 mr-2" />
            {isGenerating ? 'Generating...' : 'Download PDF Report'}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="font-display font-semibold">Report Preview</h3>

        <Card className="border-severity-extreme/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-severity-extreme">
              <AlertCircle className="h-4 w-4" />
              Extreme ({grouped.Extreme.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {grouped.Extreme.length === 0 ? (
              <p className="text-sm text-muted-foreground">No extreme complaints</p>
            ) : (
              <ul className="text-sm space-y-1">
                {grouped.Extreme.slice(0, 3).map((c) => (
                  <li key={c.id} className="text-muted-foreground">
                    {c.id} - {c.issueType}
                  </li>
                ))}
                {grouped.Extreme.length > 3 && (
                  <li className="text-muted-foreground">
                    +{grouped.Extreme.length - 3} more...
                  </li>
                )}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-severity-urgent/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-severity-urgent">
              <AlertTriangle className="h-4 w-4" />
              Needs Quick Attention ({grouped['Needs Quick Attention'].length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {grouped['Needs Quick Attention'].length === 0 ? (
              <p className="text-sm text-muted-foreground">No urgent complaints</p>
            ) : (
              <ul className="text-sm space-y-1">
                {grouped['Needs Quick Attention'].slice(0, 3).map((c) => (
                  <li key={c.id} className="text-muted-foreground">
                    {c.id} - {c.issueType}
                  </li>
                ))}
                {grouped['Needs Quick Attention'].length > 3 && (
                  <li className="text-muted-foreground">
                    +{grouped['Needs Quick Attention'].length - 3} more...
                  </li>
                )}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-severity-normal/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-severity-normal">
              <CheckCircle2 className="h-4 w-4" />
              Normal ({grouped.Normal.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {grouped.Normal.length === 0 ? (
              <p className="text-sm text-muted-foreground">No normal complaints</p>
            ) : (
              <ul className="text-sm space-y-1">
                {grouped.Normal.slice(0, 3).map((c) => (
                  <li key={c.id} className="text-muted-foreground">
                    {c.id} - {c.issueType}
                  </li>
                ))}
                {grouped.Normal.length > 3 && (
                  <li className="text-muted-foreground">
                    +{grouped.Normal.length - 3} more...
                  </li>
                )}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
