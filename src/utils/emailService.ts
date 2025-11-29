import { Quote } from '../types/quote';

/**
 * Send quote via email
 * Note: This is a placeholder implementation. In production, you would:
 * 1. Set up an email service (SendGrid, AWS SES, etc.)
 * 2. Create an API endpoint to handle email sending
 * 3. Implement proper error handling and validation
 */
export async function sendQuoteEmail(quote: Quote, recipientEmail: string): Promise<void> {
  // This is a mock implementation
  // In production, you would call your backend API
  
  const emailBody = generateEmailBody(quote);
  
  // For now, we'll use mailto: as a fallback
  // In production, replace this with actual API call
  const mailtoLink = `mailto:${recipientEmail}?subject=Quote for ${quote.projectType} Project&body=${encodeURIComponent(emailBody)}`;
  
  // Open mailto link (or in production, make API call)
  window.location.href = mailtoLink;
  
  // Simulate async operation
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('Email would be sent to:', recipientEmail);
      resolve();
    }, 1000);
  });
}

function generateEmailBody(quote: Quote): string {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const projectTypeLabels: Record<string, string> = {
    'web-dev': 'Web Development',
    'brand': 'Brand',
    'campaign': 'Campaign'
  };

  let body = `Quote for ${projectTypeLabels[quote.projectType]} Project\n\n`;
  body += `Created: ${quote.createdAt.toLocaleDateString('en-GB')}\n\n`;
  body += `Project Total: ${formatCurrency(quote.total)}\n`;
  body += `Timeline: ${quote.timeline}\n\n`;
  
  body += `Phases:\n`;
  quote.phases.forEach((phase) => {
    body += `- ${phase.phaseName}: ${formatCurrency(phase.subtotal)}\n`;
  });
  
  if (quote.addOns.length > 0) {
    body += `\nAdd-ons:\n`;
    quote.addOns.forEach((item) => {
      body += `- ${item.label}: ${formatCurrency(item.total)}\n`;
    });
  }
  
  body += `\nOngoing Costs:\n`;
  body += `- Hosting: ${formatCurrency(quote.ongoingCosts.hosting.monthly)}/mo\n`;
  body += `- Maintenance: ${formatCurrency(quote.ongoingCosts.maintenance.monthly)}/mo\n`;
  body += `- Total Monthly: ${formatCurrency(quote.ongoingCosts.totalMonthly)}/mo\n`;
  
  body += `\nPlease see the attached PDF for full details.`;
  
  return body;
}

