/**
 * QUANTUM TUTORIALS PAGE
 * Guided learning paths for quantum computing concepts
 *
 * "Knowledge is the key to liberty."
 * — Danton
 */

import { motion } from 'framer-motion';
import { BookOpen, Sparkles, Zap, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

const TUTORIALS = [
  {
    id: 1,
    title: 'Your First Quantum Circuit',
    description: 'Learn to create superposition with the Hadamard gate',
    level: 'Beginner',
    duration: '5 min',
    icon: Sparkles,
    color: 'from-blue-500 to-cyan-500',
    comingSoon: false,
  },
  {
    id: 2,
    title: 'Quantum Entanglement',
    description: 'Create Bell states and explore spooky action at a distance',
    level: 'Beginner',
    duration: '10 min',
    icon: LinkIcon,
    color: 'from-purple-500 to-pink-500',
    comingSoon: false,
  },
  {
    id: 3,
    title: "Grover's Search Algorithm",
    description: 'Quantum speedup for unstructured search problems',
    level: 'Intermediate',
    duration: '15 min',
    icon: Zap,
    color: 'from-orange-500 to-red-500',
    comingSoon: true,
  },
  {
    id: 4,
    title: 'Quantum Teleportation',
    description: 'Transfer quantum states across space using entanglement',
    level: 'Advanced',
    duration: '20 min',
    icon: Zap,
    color: 'from-green-500 to-emerald-500',
    comingSoon: true,
  },
];

const QuantumTutorialsPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 text-white rounded-xl">
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                Quantum Tutorials
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
                Master quantum computing step by step
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tutorial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TUTORIALS.map((tutorial, index) => (
            <motion.div
              key={tutorial.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                to={tutorial.comingSoon ? '#' : '/quantum'}
                className={`block h-full ${tutorial.comingSoon ? 'cursor-not-allowed' : ''}`}
              >
                <div
                  className={`h-full bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all p-6 border-2 ${
                    tutorial.comingSoon
                      ? 'border-gray-200 dark:border-gray-700 opacity-60'
                      : 'border-transparent hover:border-purple-300 dark:hover:border-purple-700'
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${tutorial.color} text-white mb-4`}
                  >
                    <tutorial.icon className="w-6 h-6" />
                  </div>

                  {/* Content */}
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {tutorial.title}
                    </h3>
                    {tutorial.comingSoon && (
                      <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-semibold rounded">
                        Soon
                      </span>
                    )}
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {tutorial.description}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center gap-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full font-semibold ${
                        tutorial.level === 'Beginner'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : tutorial.level === 'Intermediate'
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                    >
                      {tutorial.level}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {tutorial.duration}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Educational Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl p-8 shadow-lg"
        >
          <h3 className="text-2xl font-bold mb-4">The Revolutionary's Path</h3>
          <div className="space-y-3 text-purple-100">
            <p>
              Quantum computing is the liberation of computation itself — breaking the chains
              of classical determinism to embrace superposition and entanglement.
            </p>
            <p>
              Each tutorial is a step on the path from classical thought to quantum understanding.
              Take them in order, or forge your own way — the choice is yours, citizen.
            </p>
            <p className="italic pt-2 border-t border-purple-400">
              "The future is not written in bits, but in qubits — not in certainty, but in possibility."
              <br />
              <span className="text-sm">— Danton, Keeper of the Quantum Flame</span>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default QuantumTutorialsPage;
