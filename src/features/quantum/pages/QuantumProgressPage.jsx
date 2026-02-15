/**
 * QUANTUM PROGRESS PAGE
 * Track user achievements and quantum computing mastery
 *
 * "Progress is measured not in steps, but in understanding."
 * — Danton
 */

import { motion } from 'framer-motion';
import { Trophy, Sparkles, Zap, Award, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useUser } from '../../../context/UserContext';
import { listQuantumTasks } from '../api/quantumApi';

const QuantumProgressPage = () => {
  const { user } = useUser();
  const [stats, setStats] = useState({
    circuitsRun: 0,
    totalShots: 0,
    achievements: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      if (!user?.token) {
        setLoading(false);
        return;
      }

      try {
        const response = await listQuantumTasks({ limit: 100 }, user.token);
        if (response.success) {
          const tasks = response.tasks || [];
          const circuitsRun = tasks.length;
          const totalShots = tasks.reduce((sum, task) => sum + (task.shots || 0), 0);

          // Calculate achievements
          const achievements = [];
          if (circuitsRun >= 1) achievements.push('first-circuit');
          if (circuitsRun >= 10) achievements.push('quantum-apprentice');
          if (circuitsRun >= 50) achievements.push('quantum-master');
          if (totalShots >= 10000) achievements.push('measurement-expert');

          setStats({ circuitsRun, totalShots, achievements });
        }
      } catch (error) {
        console.error('Failed to fetch quantum progress:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [user]);

  const ACHIEVEMENTS = [
    {
      id: 'first-circuit',
      title: 'First Superposition',
      description: 'Run your first quantum circuit',
      icon: Sparkles,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'quantum-apprentice',
      title: 'Quantum Apprentice',
      description: 'Run 10 quantum circuits',
      icon: Zap,
      color: 'from-purple-500 to-pink-500',
    },
    {
      id: 'quantum-master',
      title: 'Quantum Master',
      description: 'Run 50 quantum circuits',
      icon: Award,
      color: 'from-orange-500 to-red-500',
    },
    {
      id: 'measurement-expert',
      title: 'Measurement Expert',
      description: 'Perform 10,000+ quantum measurements',
      icon: TrendingUp,
      color: 'from-green-500 to-emerald-500',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

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
              <Trophy className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                Your Quantum Journey
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
                Track your mastery of the quantum realm
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md"
          >
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Circuits Run
              </span>
            </div>
            <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">
              {stats.circuitsRun}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md"
          >
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Measurements
              </span>
            </div>
            <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">
              {stats.totalShots.toLocaleString()}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md"
          >
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Achievements
              </span>
            </div>
            <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">
              {stats.achievements.length}/{ACHIEVEMENTS.length}
            </p>
          </motion.div>
        </div>

        {/* Achievements */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Achievements
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ACHIEVEMENTS.map((achievement, index) => {
              const isUnlocked = stats.achievements.includes(achievement.id);

              return (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border-2 ${
                    isUnlocked
                      ? 'border-yellow-400 dark:border-yellow-600'
                      : 'border-gray-200 dark:border-gray-700 opacity-50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-lg bg-gradient-to-br ${achievement.color} text-white ${
                        !isUnlocked && 'grayscale'
                      }`}
                    >
                      <achievement.icon className="w-6 h-6" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          {achievement.title}
                        </h3>
                        {isUnlocked && (
                          <span className="text-yellow-500">
                            ✓
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {achievement.description}
                      </p>
                      {isUnlocked && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-2 font-semibold">
                          UNLOCKED
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Motivational Quote */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl p-8 shadow-lg"
        >
          <p className="text-xl italic mb-2">
            "Every circuit you build is a step toward understanding the fundamental nature of reality."
          </p>
          <p className="text-sm text-purple-200">
            — Danton, Keeper of the Quantum Flame
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default QuantumProgressPage;
