import PDFDocument from 'pdfkit';

// Quote type definition (matching frontend)
interface Quote {
  projectType: string;
  phases: Array<{
    phaseName: string;
    items: Array<{
      label: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>;
    subtotal: number;
  }>;
  addOns: Array<{
    label: string;
    total: number;
  }>;
  ongoingCosts: {
    hosting: { package: string; monthly: number };
    maintenance: { package: string; monthly: number };
    staging?: { monthly: number };
    totalMonthly: number;
    totalAnnual: number;
  };
  total: number;
  timeline: string;
  createdAt: Date;
}

/**
 * Generate PDF buffer from quote data (server-side)
 */
export function generatePDFBuffer(quote: Quote, quoteInfo: {
  companyName: string;
  projectName: string;
  businessUnit?: string;
  targetCompletionDate?: string;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Helper function to format currency
      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-GB', {
          style: 'currency',
          currency: 'GBP'
        }).format(amount);
      };

      // Title
      doc.fontSize(20).font('Helvetica-Bold').text('Quote', 50, 50);
      
      let yPosition = 80;

      // Quote Information
      doc.fontSize(12).font('Helvetica');
      doc.text(`Company: ${quoteInfo.companyName}`, 50, yPosition);
      yPosition += 20;
      doc.text(`Project: ${quoteInfo.projectName}`, 50, yPosition);
      yPosition += 20;
      
      if (quoteInfo.businessUnit) {
        doc.text(`Business Unit: ${quoteInfo.businessUnit}`, 50, yPosition);
        yPosition += 20;
      }
      
      if (quoteInfo.targetCompletionDate) {
        const date = new Date(quoteInfo.targetCompletionDate);
        doc.text(`Target Completion: ${date.toLocaleDateString('en-GB')}`, 50, yPosition);
        yPosition += 20;
      }

      // Project Type and Date
      const projectTypeLabels: Record<string, string> = {
        'web-dev': 'Web Development',
        'brand': 'Brand',
        'campaign': 'Campaign'
      };
      doc.text(`Project Type: ${projectTypeLabels[quote.projectType] || quote.projectType}`, 50, yPosition);
      yPosition += 20;
      doc.text(`Created: ${quote.createdAt.toLocaleDateString('en-GB')}`, 50, yPosition);
      yPosition += 30;

      // Summary
      doc.fontSize(14).font('Helvetica-Bold').text('Summary', 50, yPosition);
      yPosition += 25;
      
      doc.fontSize(10).font('Helvetica');
      doc.text(`Project Total: ${formatCurrency(quote.total)}`, 50, yPosition);
      yPosition += 15;
      doc.text(`Timeline: ${quote.timeline}`, 50, yPosition);
      yPosition += 15;
      doc.text(`Phases Included: ${quote.phases.length}`, 50, yPosition);
      yPosition += 30;

      // Phase Pricing
      doc.fontSize(14).font('Helvetica-Bold').text('Project Phases', 50, yPosition);
      yPosition += 25;

      doc.fontSize(10).font('Helvetica');

      quote.phases.forEach((phase) => {
        // Check if we need a new page
        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }

        doc.font('Helvetica-Bold').text(phase.phaseName, 50, yPosition);
        doc.font('Helvetica').text(formatCurrency(phase.subtotal), 500, yPosition, { align: 'right' });
        yPosition += 20;

        if (phase.items.length > 0) {
          phase.items.forEach((item) => {
            if (yPosition > 700) {
              doc.addPage();
              yPosition = 50;
            }
            const itemText = `${item.label}${item.quantity > 1 ? ` (${item.quantity} × ${formatCurrency(item.unitPrice)})` : ''}`;
            doc.text(itemText, 60, yPosition);
            doc.text(formatCurrency(item.total), 500, yPosition, { align: 'right' });
            yPosition += 15;
          });
        }
        yPosition += 10;
      });

      // Add-ons
      if (quote.addOns.length > 0) {
        if (yPosition > 650) {
          doc.addPage();
          yPosition = 50;
        }
        yPosition += 10;
        doc.fontSize(14).font('Helvetica-Bold').text('Add-ons', 50, yPosition);
        yPosition += 25;

        doc.fontSize(10).font('Helvetica');
        quote.addOns.forEach((item) => {
          if (yPosition > 700) {
            doc.addPage();
            yPosition = 50;
          }
          doc.text(item.label, 50, yPosition);
          doc.text(formatCurrency(item.total), 500, yPosition, { align: 'right' });
          yPosition += 20;
        });
      }

      // Total
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }
      yPosition += 20;
      doc.fontSize(12).font('Helvetica-Bold').text('Project Total', 50, yPosition);
      doc.text(formatCurrency(quote.total), 500, yPosition, { align: 'right' });
      yPosition += 30;

      // Ongoing Costs
      if (yPosition > 650) {
        doc.addPage();
        yPosition = 50;
      }
      doc.fontSize(14).font('Helvetica-Bold').text('Ongoing Costs (Separate)', 50, yPosition);
      yPosition += 25;

      doc.fontSize(10).font('Helvetica');
      doc.text(`Hosting (${quote.ongoingCosts.hosting.package}): ${formatCurrency(quote.ongoingCosts.hosting.monthly)}/mo`, 50, yPosition);
      yPosition += 20;
      doc.text(`Maintenance (${quote.ongoingCosts.maintenance.package}): ${formatCurrency(quote.ongoingCosts.maintenance.monthly)}/mo`, 50, yPosition);
      yPosition += 20;
      
      if (quote.ongoingCosts.staging) {
        doc.text(`Staging Server: ${formatCurrency(quote.ongoingCosts.staging.monthly)}/mo`, 50, yPosition);
        yPosition += 20;
      }
      
      yPosition += 10;
      doc.font('Helvetica-Bold').text(`Total Monthly: ${formatCurrency(quote.ongoingCosts.totalMonthly)}/mo`, 50, yPosition);
      yPosition += 20;
      doc.font('Helvetica').text(`Total Annual: ${formatCurrency(quote.ongoingCosts.totalAnnual)}/year`, 50, yPosition);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

