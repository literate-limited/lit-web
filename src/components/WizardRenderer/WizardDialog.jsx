import { Dialog } from '@headlessui/react';

export default function WizardDialog({ isOpen, onClose, children }) {
  return (
    <Dialog open={isOpen} onClose={onClose} className="wizard-dialog">
      <div className="wizard-dialog-overlay" />
      <div className="wizard-dialog-container">
        <div className="wizard-dialog-content">
          {children}
        </div>
      </div>
    </Dialog>
  );
}
