/**
 * QUANTUM RESULTS VISUALIZATION
 * Displays measurement outcomes as probability histogram
 *
 * "The universe speaks in probabilities, not certainties."
 * — Danton
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Info, Sparkles } from 'lucide-react';

const QuantumResults = ({ result, qubits, shots }) => {
  if (!result) return null;

  // Parse results into histogram data
  const histogramData = useMemo(() => {
    const samples = result.result?.samples || result.samples || {};

    // Handle dry-run format: { zeros: 1024 }
    if (samples.zeros !== undefined) {
      const numStates = Math.pow(2, qubits);
      return Array.from({ length: numStates }, (_, i) => ({
        state: i.toString(2).padStart(qubits, '0'),
        count: i === 0 ? samples.zeros : 0,
        probability: i === 0 ? 1.0 : 0,
      }));
    }

    // Handle standard format: { "00": 512, "11": 512 }
    const entries = Object.entries(samples);
    const totalShots = shots || entries.reduce((sum, [, count]) => sum + count, 0);

    return entries
      .map(([state, count]) => ({
        state,
        count,
        probability: count / totalShots,
      }))
      .sort((a, b) => b.count - a.count);
  }, [result, qubits, shots]);

  const maxCount = Math.max(...histogramData.map(d => d.count));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
          <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
            Measurement Results
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {shots || result.shots || 1024} shots • {qubits} qubits
          </p>
        </div>
      </div>

      {/* Dry-run notice */}
      {result.result?.message && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700"
        >
          <div className="flex items-start gap-2">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">
                Educational Simulation Mode
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-300">
                {result.result.message}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Histogram */}
      <div className="space-y-3">
        {histogramData.map((item, index) => (
          <motion.div
            key={item.state}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-4"
          >
            {/* State label */}
            <div className="w-20 text-right">
              <span className="font-mono font-bold text-gray-700 dark:text-gray-300">
                |{item.state}⟩
              </span>
            </div>

            {/* Bar */}
            <div className="flex-1 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(item.count / maxCount) * 100}%` }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-end pr-3"
              >
                {item.count > 0 && (
                  <span className="text-xs font-semibold text-white">
                    {item.count}
                  </span>
                )}
              </motion.div>
            </div>

            {/* Probability */}
            <div className="w-20">
              <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                {(item.probability * 100).toFixed(1)}%
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Interpretation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-700"
      >
        <div className="flex items-start gap-2">
          <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-purple-900 dark:text-purple-200 mb-1">
              Quantum Interpretation
            </p>
            <p className="text-sm text-purple-800 dark:text-purple-300">
              {getInterpretation(histogramData, qubits)}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Task metadata */}
      {result._id && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
            Task ID: {result._id} • Target: {result.target}
          </p>
        </div>
      )}
    </motion.div>
  );
};

/**
 * Generate human-readable interpretation of quantum results
 */
function getInterpretation(data, qubits) {
  const nonZeroStates = data.filter(d => d.count > 0);

  if (nonZeroStates.length === 1) {
    return `The system collapsed to a definite state |${nonZeroStates[0].state}⟩. This indicates no superposition at measurement time.`;
  }

  if (nonZeroStates.length === 2 && Math.abs(nonZeroStates[0].probability - 0.5) < 0.1) {
    return `The system shows equal superposition between |${nonZeroStates[0].state}⟩ and |${nonZeroStates[1].state}⟩. This is characteristic of a Hadamard gate or Bell state.`;
  }

  if (nonZeroStates.length === Math.pow(2, qubits)) {
    return `The system exhibits full superposition across all ${nonZeroStates.length} possible states. This is characteristic of applying Hadamard gates to all qubits.`;
  }

  return `The system collapsed to ${nonZeroStates.length} distinct states out of ${Math.pow(2, qubits)} possible outcomes. The distribution reveals the quantum circuit's probability amplitudes.`;
}

export default QuantumResults;
