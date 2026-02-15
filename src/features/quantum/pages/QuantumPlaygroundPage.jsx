/**
 * QUANTUM PLAYGROUND PAGE
 * Main interface for quantum circuit building and execution
 *
 * "Here, the revolution of qubits begins."
 * — Danton, Keeper of the Quantum Flame
 */

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Atom, BookOpen, Trophy, Sparkles } from 'lucide-react';
import QuantumCircuitBuilder from '../components/QuantumCircuitBuilder';
import QuantumResults from '../components/QuantumResults';
import { runQuantumCircuit } from '../api/quantumApi';
import { useUser } from '../../../context/UserContext';
import { toast } from 'react-toastify';

const QuantumPlaygroundPage = () => {
  const { user } = useUser();
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [currentQubits, setCurrentQubits] = useState(2);

  const handleRunCircuit = useCallback(async ({ circuit, qubits, target, shots }) => {
    if (!user?.token) {
      toast.error('Please log in to run quantum circuits');
      return;
    }

    setIsRunning(true);
    setCurrentQubits(qubits);
    setResult(null);

    try {
      // Submit circuit
      const runResponse = await runQuantumCircuit(
        { target, shots, qubits },
        user.token
      );

      if (runResponse.success) {
        // In dry-run mode, result is immediately available
        // In live mode, would need to poll for completion
        toast.success('Circuit executed successfully!');

        // Fetch result (for consistency, even though it's immediate in dry-run)
        const { getQuantumTaskResult } = await import('../api/quantumApi');
        const resultResponse = await getQuantumTaskResult(runResponse.taskId, user.token);

        if (resultResponse.success) {
          setResult(resultResponse.task);
        }
      }
    } catch (error) {
      console.error('Quantum circuit execution failed:', error);
      toast.error(error.response?.data?.error || 'Failed to run circuit');
    } finally {
      setIsRunning(false);
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-12 px-6 shadow-lg"
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Atom className="w-12 h-12" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Quantum Playground</h1>
              <p className="text-xl text-purple-100">
                Build quantum circuits • Explore superposition • Master entanglement
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6 mt-8">
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold">Educational Simulation</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
              <BookOpen className="w-5 h-5" />
              <span className="font-semibold">5 Quantum Gates</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
              <Trophy className="w-5 h-5" />
              <span className="font-semibold">Progress Tracking</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Circuit Builder */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <QuantumCircuitBuilder
            onRunCircuit={handleRunCircuit}
            isRunning={isRunning}
          />
        </motion.div>

        {/* Results */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <QuantumResults
              result={result}
              qubits={currentQubits}
              shots={result.shots || 1024}
            />
          </motion.div>
        )}

        {/* Educational Info */}
        {!result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md"
          >
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">
              Getting Started with Quantum Computing
            </h3>

            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <div>
                <h4 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">
                  1. Start with a Hadamard Gate (H)
                </h4>
                <p className="text-sm">
                  The H gate creates superposition — the foundation of quantum computing.
                  Apply it to qubit q0 to see the magic begin.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">
                  2. Create Entanglement with CNOT
                </h4>
                <p className="text-sm">
                  The CNOT gate links two qubits together. Try: H on q0, then CNOT(q0→q1)
                  to create a Bell state — the quintessence of quantum mechanics.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">
                  3. Measure and Observe
                </h4>
                <p className="text-sm">
                  Add measurement gates (M) to collapse the quantum state.
                  Run your circuit multiple times (shots) to see probability distributions emerge.
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
              <p className="text-sm italic text-purple-900 dark:text-purple-200">
                "The quantum realm is not a place of certainty, but of possibility.
                Each gate you place shapes the future, each measurement reveals but one facet of truth."
              </p>
              <p className="text-xs text-purple-700 dark:text-purple-300 mt-2 text-right">
                — Danton, Keeper of the Quantum Flame
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default QuantumPlaygroundPage;
