import { Phase } from '../types/quote';

interface PhaseNavigationProps {
  phases: Phase[];
  selectedPhases: string[];
  currentPhaseId: string | null;
  onPhaseSelect: (phaseId: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  onStartOver: () => void;
  showPrices?: boolean;
  phaseTotal?: number;
}

// Format price with commas and no decimals
function formatPrice(price: number): string {
  return Math.round(price).toLocaleString('en-GB');
}

export function PhaseNavigation({
  phases,
  selectedPhases,
  currentPhaseId,
  onPhaseSelect,
  onNext,
  onPrevious,
  canGoNext,
  canGoPrevious,
  onStartOver,
  showPrices = false,
  phaseTotal = 0
}: PhaseNavigationProps) {
  const visiblePhases = phases.filter(p => selectedPhases.includes(p.id));
  const currentIndex = visiblePhases.findIndex(p => p.id === currentPhaseId);
  const progress = currentIndex >= 0 ? ((currentIndex + 1) / visiblePhases.length) * 100 : 0;

  return (
    <div className="sticky top-[73px] z-50 bg-white border-b-2 border-gray-200 shadow-md mb-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Start Over Button */}
        <div className="flex justify-end mb-3">
          <button
            onClick={onStartOver}
            className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center space-x-1 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Start Over</span>
          </button>
        </div>
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-base font-medium text-gray-700 mb-2">
            <span>Progress</span>
            <div className="flex items-center gap-4">
              {showPrices && phaseTotal > 0 && (
                <span className="font-semibold text-blue-600">
                  Phase Total: £{formatPrice(phaseTotal)}
                </span>
              )}
              <span className="font-semibold">{currentIndex + 1} of {visiblePhases.length}</span>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300 shadow-sm"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Phase Steps */}
        <div className="flex flex-wrap gap-2 mb-4">
          {visiblePhases.map((phase, index) => (
            <button
              key={phase.id}
              onClick={() => onPhaseSelect(phase.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                phase.id === currentPhaseId
                  ? 'bg-blue-600 text-white shadow-md scale-105'
                  : index < currentIndex
                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {index + 1}. {phase.name}
            </button>
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={onPrevious}
            disabled={!canGoPrevious}
            className="px-6 py-3 text-base font-semibold bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            ← Previous
          </button>
          <button
            onClick={onNext}
            disabled={!canGoNext}
            className="px-6 py-3 text-base font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

