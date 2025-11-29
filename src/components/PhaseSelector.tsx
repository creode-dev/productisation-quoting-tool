import { Phase } from '../types/quote';

interface PhaseSelectorProps {
  phases: Phase[];
  selectedPhases: string[];
  onTogglePhase: (phaseId: string) => void;
}

export function PhaseSelector({ phases, selectedPhases, onTogglePhase }: PhaseSelectorProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">Select Phases</h3>
      <div className="space-y-4">
        {phases.map((phase) => (
          <div key={phase.id} className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              id={phase.id}
              checked={selectedPhases.includes(phase.id)}
              onChange={() => onTogglePhase(phase.id)}
              className="mt-1 w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
            />
            <label
              htmlFor={phase.id}
              className="flex-1 text-base font-medium text-gray-900 cursor-pointer"
            >
              {phase.name}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

