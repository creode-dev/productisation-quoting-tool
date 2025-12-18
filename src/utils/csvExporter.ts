import { Quote, SavedQuote } from '../types/quote';

/**
 * Exports a quote to CSV format
 */
export function exportQuoteToCSV(quote: Quote, savedQuote?: SavedQuote): void {
  const rows: string[][] = [];

  // Header information
  rows.push(['Quote Export']);
  rows.push([]);
  
  if (savedQuote) {
    rows.push(['Company:', savedQuote.companyName || '']);
    rows.push(['Project Name:', savedQuote.projectName || '']);
    if (savedQuote.businessUnit) {
      rows.push(['Business Unit:', savedQuote.businessUnit]);
    }
    if (savedQuote.targetCompletionDate) {
      rows.push(['Target Completion Date:', savedQuote.targetCompletionDate]);
    }
    rows.push(['Status:', savedQuote.status || 'draft']);
    rows.push([]);
  }

  // Project information
  const projectTypeLabels: Record<string, string> = {
    'web-dev': 'Web Development',
    'brand': 'Brand',
    'campaign': 'Campaign'
  };
  rows.push(['Project Type:', projectTypeLabels[quote.projectType] || quote.projectType]);
  rows.push(['Created:', quote.createdAt.toLocaleDateString('en-GB')]);
  rows.push(['Timeline:', quote.timeline]);
  rows.push([]);

  // Phase breakdown
  rows.push(['PHASE BREAKDOWN']);
  rows.push(['Phase', 'Item', 'Quantity', 'Unit Price', 'Total']);
  
  for (const phase of quote.phases) {
    for (const item of phase.items) {
      rows.push([
        phase.phaseName,
        item.label,
        item.quantity.toString(),
        formatCurrency(item.unitPrice),
        formatCurrency(item.total)
      ]);
    }
    // Phase subtotal
    rows.push([
      phase.phaseName,
      'Subtotal',
      '',
      '',
      formatCurrency(phase.subtotal)
    ]);
    rows.push([]); // Empty row between phases
  }

  // Add-ons
  if (quote.addOns && quote.addOns.length > 0) {
    rows.push(['ADD-ONS']);
    rows.push(['Item', 'Quantity', 'Unit Price', 'Total']);
    for (const addOn of quote.addOns) {
      rows.push([
        addOn.label,
        addOn.quantity.toString(),
        formatCurrency(addOn.unitPrice),
        formatCurrency(addOn.total)
      ]);
    }
    rows.push([]);
  }

  // Ongoing costs
  if (quote.ongoingCosts) {
    rows.push(['ONGOING COSTS']);
    rows.push(['Service', 'Package', 'Monthly', 'Annual']);
    
    if (quote.ongoingCosts.hosting) {
      rows.push([
        'Hosting',
        quote.ongoingCosts.hosting.package,
        formatCurrency(quote.ongoingCosts.hosting.monthly),
        formatCurrency(quote.ongoingCosts.hosting.annual)
      ]);
    }
    
    if (quote.ongoingCosts.maintenance) {
      rows.push([
        'Maintenance',
        quote.ongoingCosts.maintenance.package,
        formatCurrency(quote.ongoingCosts.maintenance.monthly),
        formatCurrency(quote.ongoingCosts.maintenance.annual)
      ]);
    }
    
    if (quote.ongoingCosts.staging) {
      rows.push([
        'Staging',
        '',
        formatCurrency(quote.ongoingCosts.staging.monthly),
        formatCurrency(quote.ongoingCosts.staging.annual)
      ]);
    }
    
    rows.push([
      'Total',
      '',
      formatCurrency(quote.ongoingCosts.totalMonthly),
      formatCurrency(quote.ongoingCosts.totalAnnual)
    ]);
    rows.push([]);
  }

  // Grand total
  rows.push(['GRAND TOTAL', '', '', '', formatCurrency(quote.total)]);

  // Convert to CSV string
  const csvContent = rows
    .map(row => row.map(cell => escapeCSV(cell)).join(','))
    .join('\n');

  // Create download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  const filename = savedQuote
    ? `quote-${savedQuote.projectName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`
    : `quote-${new Date().toISOString().split('T')[0]}.csv`;
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Formats a number as currency
 */
function formatCurrency(amount: number): string {
  return `£${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Escapes a cell value for CSV format
 */
function escapeCSV(value: string | number): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  const stringValue = String(value);
  
  // If the value contains comma, newline, or quote, wrap it in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}

