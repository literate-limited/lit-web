// Step component implementations
function TextInputStep({ step, value, onChange }) {
  return (
    <input
      type="text"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={step.fields?.placeholder}
      className="step-input"
    />
  );
}

function SelectStep({ step, value, onChange }) {
  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className="step-select"
    >
      <option value="">Select an option...</option>
      {step.fields?.options?.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

function CheckboxGroupStep({ step, value = [], onChange }) {
  const selected = Array.isArray(value) ? value : [];

  const handleChange = (option) => {
    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="checkbox-group">
      {step.fields?.options?.map((opt) => (
        <label key={opt} className="checkbox-item">
          <input
            type="checkbox"
            checked={selected.includes(opt)}
            onChange={() => handleChange(opt)}
          />
          {opt}
        </label>
      ))}
    </div>
  );
}

function InfoCardStep({ step }) {
  return (
    <div className="info-card">
      {step.fields?.content}
    </div>
  );
}

function BookingAvailabilityStep({ step, value, onChange }) {
  return <div>Custom Booking Component - implement as needed</div>;
}

function DatePickerStep({ step, value, onChange }) {
  return (
    <input
      type="date"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className="step-input"
    />
  );
}

// Renders different step types based on component type
const STEP_COMPONENTS = {
  'text-input': TextInputStep,
  'select': SelectStep,
  'date-picker': DatePickerStep,
  'checkbox-group': CheckboxGroupStep,
  'custom:booking-availability': BookingAvailabilityStep,
  'info-card': InfoCardStep,
  // Add more as needed
};

export default function StepRenderer({ step, value, onChange }) {
  const Component = STEP_COMPONENTS[step.component];

  if (!Component) {
    return <div className="error">Unknown step component: {step.component}</div>;
  }

  return <Component step={step} value={value} onChange={onChange} />;
}
