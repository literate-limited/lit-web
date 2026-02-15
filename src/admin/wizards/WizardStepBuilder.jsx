import { useState } from 'react';

const STEP_COMPONENT_TYPES = [
  { value: 'text-input', label: '📝 Text Input' },
  { value: 'select', label: '📋 Select Dropdown' },
  { value: 'checkbox-group', label: '☑️ Checkbox Group' },
  { value: 'date-picker', label: '📅 Date Picker' },
  { value: 'info-card', label: 'ℹ️ Info Card' },
  { value: 'custom:booking-availability', label: '📅 Booking Availability' },
];

export default function WizardStepBuilder({ steps, onStepsChange }) {
  const [editingStepId, setEditingStepId] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);

  const addStep = () => {
    const newStep = {
      id: `step-${Date.now()}`,
      title: 'New Step',
      description: '',
      component: 'text-input',
      fields: {},
      validation: { required: false },
      nextStep: null,
    };
    onStepsChange([...steps, newStep]);
    setEditingStepId(newStep.id);
  };

  const updateStep = (stepId, updates) => {
    onStepsChange(
      steps.map((s) => (s.id === stepId ? { ...s, ...updates } : s))
    );
  };

  const removeStep = (stepId) => {
    onStepsChange(steps.filter((s) => s.id !== stepId));
    setEditingStepId(null);
  };

  const moveStep = (fromIndex, toIndex) => {
    const newSteps = [...steps];
    const [movedStep] = newSteps.splice(fromIndex, 1);
    newSteps.splice(toIndex, 0, movedStep);
    onStepsChange(newSteps);
  };

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (index) => {
    if (draggedIndex === null || draggedIndex === index) return;
    moveStep(draggedIndex, index);
    setDraggedIndex(index);
  };

  const getComponentLabel = (componentType) => {
    return (
      STEP_COMPONENT_TYPES.find((c) => c.value === componentType)?.label ||
      componentType
    );
  };

  const editingStep = steps.find((s) => s.id === editingStepId);

  return (
    <div className="space-y-4">
      {/* Step List */}
      <div className="bg-slate-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Steps</h3>
          <button
            onClick={addStep}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded text-sm transition-colors"
          >
            + Add Step
          </button>
        </div>

        {steps.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p>No steps yet. Add one to get started!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={() => handleDragOver(index)}
                onClick={() => setEditingStepId(step.id)}
                className={`p-3 rounded cursor-move border transition-all ${
                  editingStepId === step.id
                    ? 'bg-blue-600 border-blue-500'
                    : 'bg-slate-600 border-slate-500 hover:border-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-white">
                      {index + 1}.
                    </span>
                    <div>
                      <p className="font-semibold text-white">{step.title}</p>
                      <p className="text-xs text-slate-300">
                        {getComponentLabel(step.component)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeStep(step.id);
                    }}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Step Editor */}
      {editingStep && (
        <div className="bg-slate-700 rounded-lg p-4 space-y-4">
          <h4 className="text-lg font-semibold text-white">Edit Step</h4>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Step ID
            </label>
            <input
              type="text"
              value={editingStep.id}
              onChange={(e) => updateStep(editingStep.id, { id: e.target.value })}
              className="w-full bg-slate-600 border border-slate-500 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Title
            </label>
            <input
              type="text"
              value={editingStep.title}
              onChange={(e) => updateStep(editingStep.id, { title: e.target.value })}
              className="w-full bg-slate-600 border border-slate-500 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Description
            </label>
            <textarea
              value={editingStep.description || ''}
              onChange={(e) =>
                updateStep(editingStep.id, { description: e.target.value })
              }
              rows="2"
              className="w-full bg-slate-600 border border-slate-500 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Component Type
            </label>
            <select
              value={editingStep.component}
              onChange={(e) =>
                updateStep(editingStep.id, {
                  component: e.target.value,
                  fields: {},
                })
              }
              className="w-full bg-slate-600 border border-slate-500 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              {STEP_COMPONENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Component-specific fields */}
          {['select', 'checkbox-group'].includes(editingStep.component) && (
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Options (one per line)
              </label>
              <textarea
                value={(editingStep.fields?.options || []).join('\n')}
                onChange={(e) =>
                  updateStep(editingStep.id, {
                    fields: {
                      ...editingStep.fields,
                      options: e.target.value
                        .split('\n')
                        .map((o) => o.trim())
                        .filter(Boolean),
                    },
                  })
                }
                rows="3"
                className="w-full bg-slate-600 border border-slate-500 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500 text-sm"
                placeholder="Option 1&#10;Option 2&#10;Option 3"
              />
            </div>
          )}

          {editingStep.component === 'text-input' && (
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Placeholder
              </label>
              <input
                type="text"
                value={editingStep.fields?.placeholder || ''}
                onChange={(e) =>
                  updateStep(editingStep.id, {
                    fields: {
                      ...editingStep.fields,
                      placeholder: e.target.value,
                    },
                  })
                }
                className="w-full bg-slate-600 border border-slate-500 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          {editingStep.component === 'info-card' && (
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Content
              </label>
              <textarea
                value={editingStep.fields?.content || ''}
                onChange={(e) =>
                  updateStep(editingStep.id, {
                    fields: {
                      ...editingStep.fields,
                      content: e.target.value,
                    },
                  })
                }
                rows="3"
                className="w-full bg-slate-600 border border-slate-500 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Next Step ID (leave blank for next sequential)
            </label>
            <input
              type="text"
              value={editingStep.nextStep || ''}
              onChange={(e) =>
                updateStep(editingStep.id, { nextStep: e.target.value || null })
              }
              placeholder="e.g., step-123 (optional)"
              className="w-full bg-slate-600 border border-slate-500 text-white rounded px-3 py-2 focus:outline-none focus:border-blue-500 text-sm"
            />
            <p className="text-xs text-slate-400 mt-1">
              Point to another step ID for branching logic
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`required-${editingStep.id}`}
              checked={editingStep.validation?.required || false}
              onChange={(e) =>
                updateStep(editingStep.id, {
                  validation: {
                    ...editingStep.validation,
                    required: e.target.checked,
                  },
                })
              }
            />
            <label
              htmlFor={`required-${editingStep.id}`}
              className="text-sm text-white cursor-pointer"
            >
              This step is required
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
