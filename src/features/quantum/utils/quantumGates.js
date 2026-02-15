/**
 * QUANTUM GATES LIBRARY
 * Defines available quantum gates for the circuit builder
 *
 * "A gate transforms possibility into actuality."
 * — Danton
 */

export const QUANTUM_GATES = {
  H: {
    name: 'Hadamard',
    symbol: 'H',
    description: 'Creates superposition — qubit exists in both |0⟩ and |1⟩ simultaneously',
    color: '#3b82f6', // blue
    educational: 'The Hadamard gate is the foundation of quantum computing. It transforms a definite state into an equal superposition of both possibilities.',
    example: 'Apply H to |0⟩ to get (|0⟩ + |1⟩)/√2',
  },
  X: {
    name: 'Pauli-X',
    symbol: 'X',
    description: 'Quantum NOT gate — flips |0⟩ to |1⟩ and vice versa',
    color: '#ef4444', // red
    educational: 'The X gate is the quantum equivalent of a classical NOT gate. It performs a bit flip.',
    example: 'Apply X to |0⟩ to get |1⟩',
  },
  Y: {
    name: 'Pauli-Y',
    symbol: 'Y',
    description: 'Rotation around Y-axis of Bloch sphere',
    color: '#10b981', // green
    educational: 'The Y gate combines a bit flip with a phase flip. It rotates the qubit state around the Y-axis of the Bloch sphere.',
    example: 'Apply Y to |0⟩ to get i|1⟩',
  },
  Z: {
    name: 'Pauli-Z',
    symbol: 'Z',
    description: 'Phase flip — changes sign of |1⟩ component',
    color: '#8b5cf6', // purple
    educational: 'The Z gate applies a phase flip, changing the sign of the |1⟩ amplitude while leaving |0⟩ unchanged.',
    example: 'Apply Z to (|0⟩ + |1⟩)/√2 to get (|0⟩ - |1⟩)/√2',
  },
  CNOT: {
    name: 'Controlled-NOT',
    symbol: 'CNOT',
    description: 'Two-qubit gate — flips target if control is |1⟩',
    color: '#f59e0b', // amber
    educational: 'The CNOT gate creates entanglement between qubits. It flips the target qubit only if the control qubit is |1⟩.',
    example: 'The foundation of quantum entanglement and the Bell state',
    isTwoQubit: true,
  },
  MEASURE: {
    name: 'Measurement',
    symbol: 'M',
    description: 'Collapses superposition into definite |0⟩ or |1⟩',
    color: '#64748b', // slate
    educational: 'Measurement collapses the quantum superposition into a classical bit. The probability of each outcome is determined by the quantum state amplitudes.',
    example: 'Measuring (|0⟩ + |1⟩)/√2 gives 50% chance of 0, 50% chance of 1',
  },
};

export const GATE_CATEGORIES = {
  SINGLE_QUBIT: ['H', 'X', 'Y', 'Z'],
  TWO_QUBIT: ['CNOT'],
  MEASUREMENT: ['MEASURE'],
};

/**
 * Get visual representation color for a gate
 */
export const getGateColor = (gateType) => {
  return QUANTUM_GATES[gateType]?.color || '#6b7280';
};

/**
 * Check if gate requires two qubits
 */
export const isTwoQubitGate = (gateType) => {
  return QUANTUM_GATES[gateType]?.isTwoQubit || false;
};

/**
 * Generate educational tooltip content for a gate
 */
export const getGateTooltip = (gateType) => {
  const gate = QUANTUM_GATES[gateType];
  if (!gate) return '';

  return `${gate.name}: ${gate.description}\n\n${gate.educational}\n\nExample: ${gate.example}`;
};
