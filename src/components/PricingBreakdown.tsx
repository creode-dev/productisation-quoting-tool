import { PhasePricing, PricingItem, OngoingCosts } from '../types/quote';

interface PricingBreakdownProps {
  phases: PhasePricing[];
  addOns: PricingItem[];
  ongoingCosts: OngoingCosts;
  total: number;
}

export function PricingBreakdown({
  phases,
  addOns,
  ongoingCosts,
  total
}: PricingBreakdownProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Pricing Breakdown</h2>

      {/* Phase Pricing */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Project Phases</h3>
        <div className="space-y-4">
          {phases.map((phase) => (
            <div key={phase.phaseId} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-medium text-gray-900">{phase.phaseName}</h4>
                <span className="text-lg font-semibold text-gray-900">
                  {formatCurrency(phase.subtotal)}
                </span>
              </div>
              
              {phase.items.length > 0 && (
                <div className="ml-4 space-y-2 text-sm text-gray-600">
                  {phase.items.map((item) => (
                    <div key={item.questionId} className="flex justify-between">
                      <span>{item.label}</span>
                      <span>
                        {item.quantity > 1 && `${item.quantity} × `}
                        {formatCurrency(item.unitPrice)}
                        {item.quantity > 1 && ` = ${formatCurrency(item.total)}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add-ons */}
      {addOns.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Add-ons</h3>
          <div className="space-y-2">
            {addOns.map((item) => (
              <div key={item.questionId} className="flex justify-between text-sm">
                <span className="text-gray-600">{item.label}</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(item.total)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Project Total */}
      <div className="border-t-2 border-gray-300 pt-4 mb-8">
        <div className="flex justify-between items-center">
          <span className="text-xl font-semibold text-gray-900">Project Total</span>
          <span className="text-2xl font-bold text-gray-900">{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Ongoing Costs */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Ongoing Costs (Separate)</h3>
        
        <div className="space-y-3 mb-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Hosting ({ongoingCosts.hosting.package})</span>
            <span className="text-gray-900">{formatCurrency(ongoingCosts.hosting.monthly)}/mo</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Maintenance ({ongoingCosts.maintenance.package})</span>
            <span className="text-gray-900">{formatCurrency(ongoingCosts.maintenance.monthly)}/mo</span>
          </div>
          
          {ongoingCosts.staging && (
            <div className="flex justify-between">
              <span className="text-gray-600">Staging Server</span>
              <span className="text-gray-900">{formatCurrency(ongoingCosts.staging.monthly)}/mo</span>
            </div>
          )}
        </div>
        
        <div className="border-t border-gray-200 pt-3">
          <div className="flex justify-between">
            <span className="font-medium text-gray-900">Total Monthly</span>
            <span className="font-semibold text-gray-900">
              {formatCurrency(ongoingCosts.totalMonthly)}/mo
            </span>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-1">
            <span>Total Annual</span>
            <span>{formatCurrency(ongoingCosts.totalAnnual)}/year</span>
          </div>
        </div>
      </div>
    </div>
  );
}

