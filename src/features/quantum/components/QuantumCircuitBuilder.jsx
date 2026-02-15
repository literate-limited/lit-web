/**
 * QUANTUM CIRCUIT BUILDER
 * Drag-and-drop interface for building quantum circuits
 *
 * "Build reality gate by gate, qubit by qubit."
 * — Danton
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QUANTUM_GATES, GATE_CATEGORIES, getGateColor } from '../utils/quantumGates';
import { Plus, Trash2, Play, RotateCcw, Info } from 'lucide-react';

const QuantumCircuitBuilder = ({ onRunCircuit, isRunning = false }) => {
  const [numQubits, setNumQubits] = useState(2);
  const [circuit, setCircuit] = useState([[], []]); // Array of gate arrays, one per qubit
  const [selectedGate, setSelectedGate] = useState(null);
  const [showInfo, setShowInfo] = useState(null);

  // Add qubit
  const addQubit = useCallback(() => {
    if (numQubits < 5) {
      setNumQubits(prev => prev + 1);
      setCircuit(prev => [...prev, []]);
    }
  }, [numQubits]);

  // Remove qubit
  const removeQubit = useCallback(() => {
    if (numQubits > 1) {
      setNumQubits(prev => prev - 1);
      setCircuit(prev => prev.slice(0, -1));
    }
  }, [numQubits]);

  // Add gate to circuit
  const addGate = useCallback((qubitIndex, gateType) => {
    setCircuit(prev => {
      const newCircuit = [...prev];
      newCircuit[qubitIndex] = [...newCircuit[qubitIndex], gateType];
      return newCircuit;
    });
    setSelectedGate(null);
  }, []);

  // Clear circuit
  const clearCircuit = useCallback(() => {
    setCircuit(Array(numQubits).fill([]).map(() => []));
  }, [numQubits]);

  // Handle run circuit
  const handleRun = useCallback(() => {
    if (onRunCircuit) {
      onRunCircuit({
        circuit,
        qubits: numQubits,
        target: 'ibmq_qasm_simulator',
        shots: 1024,
      });
    }
  }, [circuit, numQubits, onRunCircuit]);

  // Render gate palette
  const renderGatePalette = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
      <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
        Quantum Gates
      </h3>

      {/* Single-qubit gates */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Single-Qubit Gates</p>
        <div className="flex flex-wrap gap-2">
          {GATE_CATEGORIES.SINGLE_QUBIT.map(gateType => (
            <motion.button
              key={gateType}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedGate(gateType)}
              onMouseEnter={() => setShowInfo(gateType)}
              onMouseLeave={() => setShowInfo(null)}
              className="relative px-4 py-2 rounded-md font-mono font-bold text-white transition-all"
              style={{ backgroundColor: getGateColor(gateType) }}
            >
              {QUANTUM_GATES[gateType].symbol}
              {selectedGate === gateType && (
                <motion.div
                  layoutId="selected"
                  className="absolute inset-0 border-2 border-yellow-400 rounded-md"
                />
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Two-qubit gates */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Two-Qubit Gates</p>
        <div className="flex flex-wrap gap-2">
          {GATE_CATEGORIES.TWO_QUBIT.map(gateType => (
            <motion.button
              key={gateType}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedGate(gateType)}
              onMouseEnter={() => setShowInfo(gateType)}
              onMouseLeave={() => setShowInfo(null)}
              className="relative px-4 py-2 rounded-md font-mono font-bold text-white"
              style={{ backgroundColor: getGateColor(gateType) }}
            >
              {QUANTUM_GATES[gateType].symbol}
              {selectedGate === gateType && (
                <motion.div
                  layoutId="selected"
                  className="absolute inset-0 border-2 border-yellow-400 rounded-md"
                />
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Measurement */}
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Measurement</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setSelectedGate('MEASURE')}
          onMouseEnter={() => setShowInfo('MEASURE')}
          onMouseLeave={() => setShowInfo(null)}
          className="relative px-4 py-2 rounded-md font-mono font-bold text-white"
          style={{ backgroundColor: getGateColor('MEASURE') }}
        >
          {QUANTUM_GATES.MEASURE.symbol}
          {selectedGate === 'MEASURE' && (
            <motion.div
              layoutId="selected"
              className="absolute inset-0 border-2 border-yellow-400 rounded-md"
            />
          )}
        </motion.button>
      </div>

      {/* Info tooltip */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-700"
          >
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-blue-900 dark:text-blue-200">
                  {QUANTUM_GATES[showInfo].name}
                </p>
                <p className="text-blue-800 dark:text-blue-300 mt-1">
                  {QUANTUM_GATES[showInfo].description}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // Render circuit visualization
  const renderCircuit = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Circuit ({numQubits} qubit{numQubits > 1 ? 's' : ''})
        </h3>
        <div className="flex gap-2">
          <button
            onClick={removeQubit}
            disabled={numQubits <= 1}
            className="p-2 rounded-md bg-red-500 text-white disabled:opacity-30 hover:bg-red-600 transition-colors"
            title="Remove qubit"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={addQubit}
            disabled={numQubits >= 5}
            className="p-2 rounded-md bg-green-500 text-white disabled:opacity-30 hover:bg-green-600 transition-colors"
            title="Add qubit"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={clearCircuit}
            className="p-2 rounded-md bg-gray-500 text-white hover:bg-gray-600 transition-colors"
            title="Clear circuit"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Circuit wires and gates */}
      <div className="space-y-4">
        {circuit.map((qubitGates, qubitIndex) => (
          <div key={qubitIndex} className="relative">
            {/* Qubit label */}
            <div className="absolute -left-12 top-1/2 -translate-y-1/2 text-sm font-mono font-semibold text-gray-600 dark:text-gray-400">
              q{qubitIndex}
            </div>

            {/* Wire */}
            <div className="relative h-12 border-t-2 border-gray-300 dark:border-gray-600">
              {/* Gates on this qubit */}
              <div className="absolute inset-0 flex items-center gap-2 pl-2">
                {qubitGates.map((gate, gateIndex) => (
                  <motion.div
                    key={gateIndex}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="px-3 py-1 rounded font-mono font-bold text-white text-sm"
                    style={{ backgroundColor: getGateColor(gate) }}
                  >
                    {QUANTUM_GATES[gate].symbol}
                  </motion.div>
                ))}

                {/* Add gate button (if gate selected) */}
                {selectedGate && (
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    onClick={() => addGate(qubitIndex, selectedGate)}
                    className="px-3 py-1 rounded border-2 border-dashed border-gray-400 dark:border-gray-500 text-gray-400 dark:text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors"
                  >
                    + {QUANTUM_GATES[selectedGate].symbol}
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Run button */}
      <div className="mt-6 flex justify-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRun}
          disabled={isRunning || circuit.every(q => q.length === 0)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
        >
          <Play className="w-5 h-5" />
          {isRunning ? 'Running...' : 'Run Circuit'}
        </motion.button>
      </div>

      {/* Hint */}
      {circuit.every(q => q.length === 0) && (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
          Select a gate from the palette, then click on a qubit wire to add it
        </p>
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        {renderGatePalette()}
      </div>
      <div className="lg:col-span-2">
        {renderCircuit()}
      </div>
    </div>
  );
};

export default QuantumCircuitBuilder;
