import React, { useState } from 'react';
import { ArrowLeft, Check, ChevronRight, AlertCircle } from 'lucide-react';
import { Button, Card, SectionHeader } from '../components/UI';
import { storageService } from '../services/storage';
import { GaitProfile } from '../types';

interface FinderProps {
  onComplete: () => void;
}

const STEPS = [
  {
    id: 'terrain',
    question: "Where do you run most?",
    options: [
      { label: 'Road / Pavement', value: 'Road', desc: 'Consistent, hard surfaces.' },
      { label: 'Trail / Technical', value: 'Trail', desc: 'Roots, rocks, and mud.' },
      { label: 'Hybrid / Gravel', value: 'Hybrid', desc: 'A mix of everything.' }
    ]
  },
  {
    id: 'strike',
    question: "How do you land?",
    options: [
      { label: 'Heel Strike', value: 'Heel', desc: 'Most common, impact on heel.' },
      { label: 'Midfoot', value: 'Midfoot', desc: 'Landing flat footed.' },
      { label: 'Forefoot', value: 'Forefoot', desc: 'On your toes (sprinting).' }
    ]
  },
  {
    id: 'arch',
    question: "What is your arch profile?",
    options: [
      { label: 'Medium / Normal', value: 'Medium', desc: 'Standard arch height.' },
      { label: 'Flat / Low', value: 'Low', desc: 'Collapsed arch, wide footprint.' },
      { label: 'High Arch', value: 'High', desc: 'Rigid foot, less surface area.' }
    ]
  },
  {
    id: 'pronation',
    question: "Pronation check",
    options: [
      { label: 'Neutral', value: 'Neutral', desc: 'Even landing.' },
      { label: 'Overpronation', value: 'Over', desc: 'Ankles roll inward.' },
      { label: 'Supination', value: 'Under', desc: 'Ankles roll outward.' }
    ]
  },
  {
    id: 'distanceGoals',
    question: "Weekly Volume & Goals",
    options: [
      { label: '5K / Fitness', value: 'Low', desc: '0-15 miles/week.' },
      { label: 'Half Marathon', value: 'Medium', desc: '15-30 miles/week.' },
      { label: 'Ultra / Marathon', value: 'High', desc: '30+ miles/week.' }
    ]
  },
  {
    id: 'cushionPref',
    question: "Preferred Feel",
    options: [
      { label: 'Firm & Responsive', value: 'Firm', desc: 'Feel the ground, go fast.' },
      { label: 'Balanced', value: 'Balanced', desc: 'Good for daily training.' },
      { label: 'Max Cushion', value: 'Plush', desc: 'Soft, protective, cloud-like.' }
    ]
  },
  {
    id: 'footShape',
    question: "Foot Shape Preference",
    options: [
      { label: 'Standard', value: 'Standard', desc: 'Snug, performance fit.' },
      { label: 'Wide Toe Box', value: 'Wide', desc: 'Splay toes naturally (Altra style).' }
    ]
  },
  {
    id: 'injuryHistory',
    question: "Any recurring issues?",
    multi: true,
    options: [
      { label: 'None', value: 'None', desc: 'Healthy runner.' },
      { label: 'Plantar Fasciitis', value: 'Plantar', desc: 'Heel pain.' },
      { label: 'Shin Splints', value: 'Shin', desc: 'Lower leg pain.' },
      { label: 'Knee Pain', value: 'Knee', desc: 'Runner\'s knee.' }
    ]
  }
];

export const Finder: React.FC<FinderProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const profile = storageService.getProfile();

  if (profile.isGuest) {
      return (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <AlertCircle size={48} className="text-[#A0AEC0] mb-4" />
              <h2 className="text-xl font-bold mb-2">Account Required</h2>
              <p className="text-[#A0AEC0] mb-6">The Deep Gait Analysis requires a local profile to save your biomechanics data.</p>
              <Button onClick={() => storageService.wipeData()}>Create Profile</Button>
          </div>
      )
  }

  const handleSelect = (value: any, isMulti: boolean) => {
    const stepId = STEPS[currentStep].id;
    if (isMulti) {
        const current = answers[stepId] || [];
        if (value === 'None') {
             setAnswers(prev => ({ ...prev, [stepId]: ['None'] }));
        } else {
             let newValues = current.includes('None') ? [] : [...current];
             if (newValues.includes(value)) {
                 newValues = newValues.filter((v: any) => v !== value);
             } else {
                 newValues.push(value);
             }
             setAnswers(prev => ({ ...prev, [stepId]: newValues }));
        }
    } else {
        setAnswers(prev => ({ ...prev, [stepId]: value }));
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Save full gait profile
      storageService.updateGaitProfile(answers as GaitProfile);
      onComplete(); 
    }
  };

  const stepData = STEPS[currentStep];

  return (
    <div className="h-full flex flex-col overflow-x-hidden">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-6">
             <div className="h-1 flex-1 bg-[#111111] rounded-full overflow-hidden">
                <div 
                    className="h-full bg-gradient-to-r from-[#ffffff] to-[#e43928] transition-all duration-300"
                    style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
                />
             </div>
             <span className="text-xs text-[#A0AEC0] font-mono">0{currentStep + 1}/0{STEPS.length}</span>
        </div>
        
        <h2 className="text-3xl font-bold mb-2">Deep Gait Analysis</h2>
        <p className="text-[#A0AEC0]">Clinical grade fitting.</p>
      </div>

      <div className="flex-1 overflow-y-auto pb-4 custom-scrollbar w-full">
        <h3 className="text-xl text-white font-medium mb-6">{stepData.question}</h3>
        
        <div className="space-y-4">
            {stepData.options.map((opt) => {
                const stepId = STEPS[currentStep].id;
                const isSelected = stepData.multi 
                    ? (answers[stepId] || []).includes(opt.value)
                    : answers[stepId] === opt.value;
                
                return (
                    <Card 
                        key={opt.value}
                        onClick={() => handleSelect(opt.value, !!stepData.multi)}
                        className={`transition-all duration-200 ${isSelected ? 'border-[#e43928] ring-1 ring-[#e43928] bg-[#111111]' : 'border-transparent opacity-80 hover:opacity-100'}`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-bold text-lg mb-1">{opt.label}</div>
                                <div className="text-xs text-[#A0AEC0]">{opt.desc}</div>
                            </div>
                            {isSelected && <div className="bg-[#e43928] rounded-full p-1"><Check size={14} className="text-white" /></div>}
                        </div>
                    </Card>
                );
            })}
        </div>
      </div>

      <div className="pt-4 mt-auto">
        <Button 
            fullWidth 
            size="lg" 
            onClick={handleNext} 
            disabled={!answers[stepData.id] || (Array.isArray(answers[stepData.id]) && answers[stepData.id].length === 0)}
        >
            {currentStep === STEPS.length - 1 ? 'Analyze & Find Matches' : 'Next Step'} 
            <ChevronRight size={18} className="ml-2" />
        </Button>
      </div>
    </div>
  );
};