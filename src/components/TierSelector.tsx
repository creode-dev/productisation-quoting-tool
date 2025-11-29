import { PricingTier } from '../types/quote';

interface TierSelectorProps {
  selectedTier: PricingTier | null;
  onTierSelect: (tier: PricingTier | null) => void;
  onPopulate: (tier: PricingTier) => void;
}

export function TierSelector({ selectedTier, onTierSelect, onPopulate }: TierSelectorProps) {
  const tiers: { value: PricingTier; label: string; price: string }[] = [
    { value: 'essential', label: 'Essential', price: '£8k+' },
    { value: 'refresh', label: 'Refresh', price: '£20k+' },
    { value: 'transformation', label: 'Transformation', price: '£60k+' }
  ];

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-40">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-4 flex-wrap">
            <span className="text-base font-semibold text-gray-900">Pre-populate with tier:</span>
            <div className="flex space-x-2">
              {tiers.map((tier) => (
                <button
                  key={tier.value}
                  onClick={() => {
                    onTierSelect(tier.value);
                    onPopulate(tier.value);
                  }}
                  className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    selectedTier === tier.value
                      ? 'bg-blue-600 text-white shadow-md scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tier.label}
                  <span className="ml-1 text-xs opacity-90">({tier.price})</span>
                </button>
              ))}
            </div>
          </div>
          {selectedTier && (
            <button
              onClick={() => onTierSelect(null)}
              className="text-sm text-gray-600 hover:text-gray-900 font-medium underline"
            >
              Clear tier
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

