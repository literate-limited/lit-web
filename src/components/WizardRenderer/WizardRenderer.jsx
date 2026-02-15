import { useEffect, useState } from 'react';
import axios from 'axios';
import WizardDialog from './WizardDialog';
import StepRenderer from './StepRenderer';
import './WizardRenderer.css';

const API_URL = import.meta.env.VITE_API_URL;

export default function WizardRenderer({
  wizardKey,
  onComplete,
  onCancel,
  isOpen,
}) {
  const [wizard, setWizard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState({});
  const [sessionId] = useState(() => `wizard-${Date.now()}-${Math.random()}`);
  const [error, setError] = useState(null);

  // Load wizard config
  useEffect(() => {
    if (!isOpen) return;

    const loadWizard = async () => {
      try {
        const res = await axios.get(`${API_URL}/wizards/${wizardKey}`);
        setWizard(res.data.wizard);
        setLoading(false);

        // Track start
        await trackEvent('wizard_started');
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    loadWizard();
  }, [wizardKey, isOpen]);

  // Track wizard events
  const trackEvent = async (event, stepId = null) => {
    try {
      await axios.post(`${API_URL}/wizards/${wizardKey}/track`, {
        event,
        sessionId,
        stepId,
      });
    } catch (err) {
      console.error('Failed to track event:', err);
    }
  };

  if (!isOpen) return null;
  if (loading) return <div className="wizard-loading">Loading wizard...</div>;
  if (error) return <div className="wizard-error">Error: {error}</div>;
  if (!wizard) return null;

  const steps = wizard.config.steps;
  const currentStep = steps[currentStepIndex];

  // Evaluate conditional logic for next step
  const getNextStepIndex = () => {
    if (typeof currentStep.nextStep === 'string') {
      const nextStepId = currentStep.nextStep;
      return steps.findIndex(s => s.id === nextStepId);
    } else if (typeof currentStep.nextStep === 'function') {
      // Execute conditional logic
      const nextStepId = currentStep.nextStep(formData);
      return steps.findIndex(s => s.id === nextStepId);
    }
    return currentStepIndex + 1;
  };

  const handleNext = async () => {
    // Validate current step
    if (currentStep.validation?.required && !formData[currentStep.id]) {
      setError('This field is required');
      await trackEvent('step_failed', currentStep.id);
      return;
    }

    setError(null);
    await trackEvent('step_completed', currentStep.id);

    const nextIndex = getNextStepIndex();
    if (nextIndex < steps.length && nextIndex !== -1) {
      setCurrentStepIndex(nextIndex);
      await trackEvent('step_viewed', steps[nextIndex].id);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleFinish = async () => {
    await trackEvent('wizard_completed');
    onComplete?.(formData);
  };

  const handleClose = async () => {
    await trackEvent('wizard_closed');
    onCancel?.();
  };

  const isLastStep = currentStepIndex === steps.length - 1;
  const canGoBack = currentStepIndex > 0;

  return (
    <WizardDialog isOpen={isOpen} onClose={handleClose}>
      <div className="wizard-container">
        {/* Progress indicator */}
        <div className="wizard-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
            />
          </div>
          <div className="progress-text">
            Step {currentStepIndex + 1} of {steps.length}
          </div>
        </div>

        {/* Step content */}
        <div className="wizard-content">
          <h2>{currentStep.title}</h2>
          {currentStep.description && (
            <p className="wizard-description">{currentStep.description}</p>
          )}

          {error && <div className="wizard-error">{error}</div>}

          <StepRenderer
            step={currentStep}
            value={formData[currentStep.id]}
            onChange={(val) =>
              setFormData((prev) => ({ ...prev, [currentStep.id]: val }))
            }
          />
        </div>

        {/* Navigation */}
        <div className="wizard-footer">
          <button
            className="wizard-btn btn-secondary"
            onClick={handleClose}
          >
            Cancel
          </button>

          <div className="wizard-nav-buttons">
            <button
              className="wizard-btn btn-secondary"
              onClick={handleBack}
              disabled={!canGoBack}
            >
              ← Back
            </button>

            <button
              className="wizard-btn btn-primary"
              onClick={isLastStep ? handleFinish : handleNext}
            >
              {isLastStep ? 'Finish' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </WizardDialog>
  );
}
