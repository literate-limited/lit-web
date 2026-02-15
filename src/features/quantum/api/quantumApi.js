/**
 * QUANTUM API CLIENT
 * Interfaces with the quantum computing backend (dry-run mode)
 *
 * "The quantum realm speaks in probabilities, not certainties."
 * — Danton, Keeper of Superposition
 */

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v2';

/**
 * Submit a quantum circuit for execution
 * @param {Object} params - Circuit parameters
 * @param {string} params.target - Target backend (simulator)
 * @param {number} params.shots - Number of measurements
 * @param {number} params.qubits - Number of qubits
 * @param {string} token - JWT authentication token
 * @returns {Promise<{success: boolean, taskId: string, status: string}>}
 */
export const runQuantumCircuit = async ({ target, shots, qubits }, token) => {
  const response = await axios.post(
    `${API_BASE}/quantum/run`,
    { target, shots, qubits },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
};

/**
 * Check status of a quantum task
 * @param {string} taskId - Task identifier
 * @param {string} token - JWT authentication token
 * @returns {Promise<{success: boolean, status: string}>}
 */
export const getQuantumTaskStatus = async (taskId, token) => {
  const response = await axios.get(`${API_BASE}/quantum/status/${taskId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

/**
 * Retrieve quantum task results
 * @param {string} taskId - Task identifier
 * @param {string} token - JWT authentication token
 * @returns {Promise<{success: boolean, task: Object}>}
 */
export const getQuantumTaskResult = async (taskId, token) => {
  const response = await axios.get(`${API_BASE}/quantum/result/${taskId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

/**
 * List user's quantum tasks
 * @param {Object} params - Query parameters
 * @param {number} params.limit - Max results per page
 * @param {string} params.cursor - Pagination cursor
 * @param {string} token - JWT authentication token
 * @returns {Promise<{success: boolean, tasks: Array, nextCursor: string}>}
 */
export const listQuantumTasks = async ({ limit = 20, cursor = null }, token) => {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (cursor) params.append('cursor', cursor);

  const response = await axios.get(`${API_BASE}/quantum/tasks?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
