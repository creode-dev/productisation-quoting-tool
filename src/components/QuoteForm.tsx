import { useEffect, useState } from 'react';
import { useQuoteStore } from '../store/quoteStore';
import { QuestionRenderer } from './QuestionRenderer';
import { PhaseSelector } from './PhaseSelector';
import { PhaseNavigation } from './PhaseNavigation';
import { TierSelector } from './TierSelector';
import { ProjectType, PricingTier } from '../types/quote';
import { getPricingConfig, onPricingConfigUpdate } from '../utils/pricingConfig';
import { buildPhasesFromPricingConfig } from '../utils/phasesFromPricingConfig';
import { calculatePricing } from '../utils/pricingCalculator';

interface QuoteFormProps {
  showPrices?: boolean;
}

export function QuoteForm({ showPrices: showPricesProp = false }: QuoteFormProps) {
  const {
    projectType,
    selectedPhases,
    answers,
    currentPhase,
    currentStep,
    phases,
    selectedTier,
    setPhases,
    setProjectType,
    setSelectedPhases,
    setAnswer,
    removeAnswer,
    setCurrentPhase,
    setCurrentStep,
    setSelectedTier,
    populateFromTier
  } = useQuoteStore();

  const [loading, setLoading] = useState(true);
  const [, forceUpdate] = useState(0); // Force re-render when pricing config updates
  const showPrices = showPricesProp;

  // Load phases from pricing config (Google Sheet)
  useEffect(() => {
    const loadPhasesFromConfig = () => {
      const pricingConfig = getPricingConfig();
      if (pricingConfig && pricingConfig.items.length > 0) {
        const parsedPhases = buildPhasesFromPricingConfig(pricingConfig);
        setPhases(parsedPhases);
        if (parsedPhases.length > 0 && !currentPhase) {
          // Select all phases by default
          const allPhaseIds = parsedPhases.map(p => p.id);
          setSelectedPhases(allPhaseIds);
          setCurrentPhase(parsedPhases[0].id);
        }
        setLoading(false);
      } else {
        // Config not loaded yet, wait for it
        setLoading(true);
      }
    };
    
    // Try loading immediately
    loadPhasesFromConfig();
    
    // Also listen for config updates
    const unsubscribe = onPricingConfigUpdate(() => {
      loadPhasesFromConfig();
      forceUpdate(prev => prev + 1);
    });
    
    return unsubscribe;
  }, [setPhases, setCurrentPhase, setSelectedPhases, currentPhase]);

  // Listen for pricing config updates to rebuild phases and clean up answers
  useEffect(() => {
    const unsubscribe = onPricingConfigUpdate(() => {
      const pricingConfig = getPricingConfig();
      if (pricingConfig) {
        // Rebuild phases from updated config
        const newPhases = buildPhasesFromPricingConfig(pricingConfig);
        setPhases(newPhases);
        
        // If no phases are selected, select all by default
        const { selectedPhases: currentSelected } = useQuoteStore.getState();
        if (currentSelected.length === 0 && newPhases.length > 0) {
          const allPhaseIds = newPhases.map(p => p.id);
          setSelectedPhases(allPhaseIds);
        }
        
        // Clean up answers for questions that no longer exist
        const { answers: currentAnswers, removeAnswer } = useQuoteStore.getState();
        const answersToRemove: string[] = [];
        
        // Get all question IDs from new phases
        const validQuestionIds = new Set(
          newPhases.flatMap(phase => phase.questions.map(q => q.id))
        );
        
        // Find answers for questions that no longer exist
        for (const questionId in currentAnswers) {
          if (!validQuestionIds.has(questionId)) {
            answersToRemove.push(questionId);
          }
        }
        
        // Remove answers for questions not in pricing config
        answersToRemove.forEach(questionId => {
          removeAnswer(questionId);
        });
        
        forceUpdate(prev => prev + 1);
      }
    });
    return unsubscribe;
  }, [setPhases, removeAnswer]);

  const handleProjectTypeSelect = (type: ProjectType) => {
    setProjectType(type);
    setCurrentStep(1);
    // Reset phases and answers when project type changes (will reload from new tab)
    setPhases([]);
    setSelectedPhases([]);
    useQuoteStore.getState().reset();
    // Clear current phase to trigger reload
    setCurrentPhase(null);
  };

  const handleStartOver = () => {
    if (window.confirm('Are you sure you want to start over? All your progress will be lost.')) {
      useQuoteStore.getState().reset();
      window.location.reload();
    }
  };

  const handleTierSelect = (tier: PricingTier | null) => {
    setSelectedTier(tier);
  };

  const handleTierPopulate = (tier: PricingTier) => {
    populateFromTier(tier);
  };

  const handlePhaseToggle = (phaseId: string) => {
    const newSelected = selectedPhases.includes(phaseId)
      ? selectedPhases.filter(id => id !== phaseId)
      : [...selectedPhases, phaseId];
    
    setSelectedPhases(newSelected);
    
    // If current phase was deselected, move to first selected phase
    if (!newSelected.includes(currentPhase || '')) {
      setCurrentPhase(newSelected[0] || null);
    }
  };

  const handleAnswerChange = (questionId: string, value: string | number | boolean) => {
    setAnswer(questionId, value);
  };

  const visiblePhases = phases.filter(p => selectedPhases.includes(p.id));
  const currentPhaseData = phases.find(p => p.id === currentPhase);
  const currentIndex = visiblePhases.findIndex(p => p.id === currentPhase);
  
  // Calculate phase total for current phase
  const phasePricing = calculatePricing(answers, phases, selectedPhases);
  const currentPhaseTotal = currentPhaseData 
    ? phasePricing.find(p => p.phaseId === currentPhaseData.id)?.subtotal || 0
    : 0;

  const handleNext = () => {
    if (currentIndex < visiblePhases.length - 1) {
      setCurrentPhase(visiblePhases[currentIndex + 1].id);
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentPhase(visiblePhases[currentIndex - 1].id);
      setCurrentStep(currentStep - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading questionnaire...</div>
      </div>
    );
  }

  // Step 0: Project Type Selection
  if (!projectType) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-end mb-4">
            <button
              onClick={handleStartOver}
              className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Start Over</span>
            </button>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Create Your Quote</h1>
            <p className="text-lg text-gray-600 mb-10">Select the type of project to get started</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button
                onClick={() => handleProjectTypeSelect('web-dev')}
                className="p-8 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600">Web Development</h3>
                <p className="text-base text-gray-600">Website design and development services</p>
              </button>
              
              <button
                onClick={() => handleProjectTypeSelect('brand')}
                className="p-8 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600">Brand</h3>
                <p className="text-base text-gray-600">Brand identity and guidelines</p>
              </button>
              
              <button
                onClick={() => handleProjectTypeSelect('campaign')}
                className="p-8 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600">Campaign</h3>
                <p className="text-base text-gray-600">Marketing campaigns and strategies</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 1: Phase Selection (after project type)
  if (currentStep === 1) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-end mb-4">
            <button
              onClick={handleStartOver}
              className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Start Over</span>
            </button>
          </div>
          
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Select Phases</h1>
            <p className="text-lg text-gray-600">
              Choose which phases to include in your quote. Discovery is always included.
            </p>
          </div>
          
          <TierSelector
            selectedTier={selectedTier}
            onTierSelect={handleTierSelect}
            onPopulate={handleTierPopulate}
          />
          
          <div className="mt-6">
            <PhaseSelector
              phases={phases}
              selectedPhases={selectedPhases}
              onTogglePhase={handlePhaseToggle}
            />
          </div>
          
          <div className="mt-8 flex justify-end">
            <button
              onClick={() => {
                setCurrentStep(2);
                setCurrentPhase(selectedPhases[0] || null);
              }}
              className="px-8 py-3 text-lg font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              Continue to Questions →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2+: Phase Questions
  return (
    <div className="min-h-screen bg-gray-50">
      <TierSelector
        selectedTier={selectedTier}
        onTierSelect={handleTierSelect}
        onPopulate={handleTierPopulate}
      />
      <PhaseNavigation
        phases={phases}
        selectedPhases={selectedPhases}
        currentPhaseId={currentPhase}
        onPhaseSelect={(phaseId) => {
          setCurrentPhase(phaseId);
          setCurrentStep(visiblePhases.findIndex(p => p.id === phaseId) + 2);
        }}
        onNext={handleNext}
        onPrevious={handlePrevious}
        canGoNext={currentIndex < visiblePhases.length - 1}
        canGoPrevious={currentIndex > 0}
        onStartOver={handleStartOver}
        showPrices={showPrices}
        phaseTotal={currentPhaseTotal}
      />
      
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          {currentPhaseData && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                {currentPhaseData.name}
              </h2>
              
              <div className="space-y-8">
                {currentPhaseData && currentPhaseData.questions.length > 0 ? (
                  currentPhaseData.questions.map((question) => (
                    <div key={question.id} className="border-b-2 border-gray-100 pb-8 last:border-0 last:pb-0">
                    <QuestionRenderer
                      question={question}
                      answer={answers[question.id]}
                      onChange={(value) => handleAnswerChange(question.id, value)}
                      phaseName={currentPhaseData.name}
                      showPrices={showPrices}
                    />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {getPricingConfig() ? (
                      <p>No items available for this phase. Please add items to the pricing configuration.</p>
                    ) : (
                      <p>Loading pricing configuration...</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

