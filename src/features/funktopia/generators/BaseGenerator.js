/**
 * Base Generator Class
 * Abstract base class for all Funktopia geometry generators
 */

export class BaseGenerator {
  constructor(name, description) {
    this.name = name;
    this.description = description;
    this.parameters = {};
  }

  /**
   * Generate Three.js geometry from current parameters
   * Must be implemented by subclasses
   * @returns {THREE.BufferGeometry}
   */
  generate() {
    throw new Error('generate() must be implemented by subclass');
  }

  /**
   * Get parameter configuration for UI
   * @returns {Array<{key, label, type, min, max, step, default}>}
   */
  getParameterConfig() {
    throw new Error('getParameterConfig() must be implemented by subclass');
  }

  /**
   * Get preset configurations
   * @returns {Array<{id, name, params, note}>}
   */
  getPresets() {
    return [];
  }

  /**
   * Update a parameter value
   * @param {string} key - Parameter key
   * @param {*} value - New value
   */
  setParameter(key, value) {
    this.parameters[key] = value;
  }

  /**
   * Get all current parameters
   * @returns {Object}
   */
  getParameters() {
    return { ...this.parameters };
  }

  /**
   * Set all parameters at once
   * @param {Object} params - Parameter object
   */
  setParameters(params) {
    this.parameters = { ...params };
  }

  /**
   * Generate filename for export
   * @returns {string}
   */
  generateFilename() {
    const timestamp = new Date().toISOString().split('T')[0];
    return `${this.name.toLowerCase().replace(/\s+/g, '-')}-${timestamp}`;
  }
}
