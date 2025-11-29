import jsPDF from 'jspdf';
import { Quote } from '../types/quote';

export function generatePDF(quote: Quote): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPosition = margin;

  // Helper function to add a new page if needed
  const checkPageBreak = (requiredHeight: number) => {
    if (yPosition + requiredHeight > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      yPosition = margin;
    }
  };

  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Quote', margin, yPosition);
  yPosition += 10;

  // Project Type and Date
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const projectTypeLabels: Record<string, string> = {
    'web-dev': 'Web Development',
    'brand': 'Brand',
    'campaign': 'Campaign'
  };
  doc.text(`Project Type: ${projectTypeLabels[quote.projectType]}`, margin, yPosition);
  yPosition += 6;
  doc.text(`Created: ${quote.createdAt.toLocaleDateString('en-GB')}`, margin, yPosition);
  yPosition += 10;

  // Summary
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Summary', margin, yPosition);
  yPosition += 8;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Project Total: ${formatCurrency(quote.total)}`, margin, yPosition);
  yPosition += 6;
  doc.text(`Timeline: ${quote.timeline}`, margin, yPosition);
  yPosition += 6;
  doc.text(`Phases Included: ${quote.phases.length}`, margin, yPosition);
  yPosition += 12;

  // Phase Pricing
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Project Phases', margin, yPosition);
  yPosition += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  quote.phases.forEach((phase) => {
    checkPageBreak(15);
    
    doc.setFont('helvetica', 'bold');
    doc.text(phase.phaseName, margin, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(formatCurrency(phase.subtotal), pageWidth - margin - 30, yPosition, { align: 'right' });
    yPosition += 6;

    if (phase.items.length > 0) {
      phase.items.forEach((item) => {
        checkPageBreak(6);
        const itemText = `${item.label}${item.quantity > 1 ? ` (${item.quantity} × ${formatCurrency(item.unitPrice)})` : ''}`;
        doc.text(itemText, margin + 5, yPosition);
        doc.text(formatCurrency(item.total), pageWidth - margin - 30, yPosition, { align: 'right' });
        yPosition += 5;
      });
    }
    yPosition += 5;
  });

  // Add-ons
  if (quote.addOns.length > 0) {
    checkPageBreak(15);
    yPosition += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Add-ons', margin, yPosition);
    yPosition += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    quote.addOns.forEach((item) => {
      checkPageBreak(6);
      doc.text(item.label, margin, yPosition);
      doc.text(formatCurrency(item.total), pageWidth - margin - 30, yPosition, { align: 'right' });
      yPosition += 6;
    });
  }

  // Total
  checkPageBreak(15);
  yPosition += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Project Total', margin, yPosition);
  doc.text(formatCurrency(quote.total), pageWidth - margin - 30, yPosition, { align: 'right' });
  yPosition += 12;

  // Ongoing Costs
  checkPageBreak(20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Ongoing Costs (Separate)', margin, yPosition);
  yPosition += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Hosting (${quote.ongoingCosts.hosting.package}): ${formatCurrency(quote.ongoingCosts.hosting.monthly)}/mo`, margin, yPosition);
  yPosition += 6;
  doc.text(`Maintenance (${quote.ongoingCosts.maintenance.package}): ${formatCurrency(quote.ongoingCosts.maintenance.monthly)}/mo`, margin, yPosition);
  yPosition += 6;
  
  if (quote.ongoingCosts.staging) {
    doc.text(`Staging Server: ${formatCurrency(quote.ongoingCosts.staging.monthly)}/mo`, margin, yPosition);
    yPosition += 6;
  }
  
  yPosition += 3;
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Monthly: ${formatCurrency(quote.ongoingCosts.totalMonthly)}/mo`, margin, yPosition);
  yPosition += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Annual: ${formatCurrency(quote.ongoingCosts.totalAnnual)}/year`, margin, yPosition);

  // Save PDF
  doc.save(`quote-${quote.projectType}-${Date.now()}.pdf`);
}

