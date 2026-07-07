import { useEffect, useMemo, useState } from 'react';

export const TOUR_STORAGE_KEY = 'pdf-po-extractor-tour-complete';

export interface TourStep {
  target: string;
  title: string;
  body: string;
}

interface OnboardingTourProps {
  isOpen: boolean;
  steps: TourStep[];
  onClose: (completed: boolean) => void;
}

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function hasCompletedTour(): boolean {
  return window.localStorage.getItem(TOUR_STORAGE_KEY) === 'true';
}

export function markTourComplete(): void {
  window.localStorage.setItem(TOUR_STORAGE_KEY, 'true');
}

export function OnboardingTour({ isOpen, steps, onClose }: OnboardingTourProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);

  const availableSteps = useMemo(
    () => steps.filter((step) => document.querySelector(`[data-tour="${step.target}"]`)),
    [steps, isOpen]
  );
  const currentStep = availableSteps[stepIndex];

  useEffect(() => {
    if (isOpen) {
      setStepIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !currentStep) {
      setSpotlight(null);
      return;
    }

    function updateSpotlight() {
      const target = document.querySelector(`[data-tour="${currentStep.target}"]`);
      if (!target) {
        setSpotlight(null);
        return;
      }

      const rect = target.getBoundingClientRect();
      const padding = 10;
      setSpotlight({
        top: Math.max(8, rect.top - padding),
        left: Math.max(8, rect.left - padding),
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      });
    }

    const target = document.querySelector(`[data-tour="${currentStep.target}"]`);
    target?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    window.setTimeout(updateSpotlight, 240);
    updateSpotlight();

    window.addEventListener('resize', updateSpotlight);
    window.addEventListener('scroll', updateSpotlight, true);

    return () => {
      window.removeEventListener('resize', updateSpotlight);
      window.removeEventListener('scroll', updateSpotlight, true);
    };
  }, [currentStep, isOpen]);

  useEffect(() => {
    if (isOpen && availableSteps.length && stepIndex >= availableSteps.length) {
      setStepIndex(availableSteps.length - 1);
    }
  }, [availableSteps.length, isOpen, stepIndex]);

  if (!isOpen || !currentStep || !spotlight) {
    return null;
  }

  const isFirst = stepIndex === 0;
  const isLast = stepIndex === availableSteps.length - 1;
  const bubbleOnRight = spotlight.left + spotlight.width / 2 < window.innerWidth / 2;
  const bubbleTop = Math.min(Math.max(24, spotlight.top), window.innerHeight - 280);

  function close(completed: boolean) {
    if (completed) {
      markTourComplete();
    }
    onClose(completed);
  }

  return (
    <div className="tour-layer" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      <div className="tour-scrim" />
      <div
        className="tour-spotlight"
        style={{
          top: spotlight.top,
          left: spotlight.left,
          width: spotlight.width,
          height: spotlight.height,
        }}
      />
      <aside
        className={`tour-card ${bubbleOnRight ? 'right' : 'left'}`}
        style={{
          top: bubbleTop,
          left: bubbleOnRight ? spotlight.left + spotlight.width + 18 : 'auto',
          right: bubbleOnRight ? 'auto' : window.innerWidth - spotlight.left + 18,
        }}
      >
        <p className="tour-progress">{stepIndex + 1} / {availableSteps.length}</p>
        <h2 id="tour-title">{currentStep.title}</h2>
        <p>{currentStep.body}</p>
        <div className="tour-actions">
          <button className="secondary" type="button" onClick={() => close(true)}>跳过</button>
          <div>
            <button className="secondary" type="button" disabled={isFirst} onClick={() => setStepIndex((index) => index - 1)}>
              上一步
            </button>
            <button type="button" onClick={() => (isLast ? close(true) : setStepIndex((index) => index + 1))}>
              {isLast ? '完成' : '下一步'}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
