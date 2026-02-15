import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from '../styles/lawlore.module.css';

/**
 * NewConsultation Component
 *
 * Case intake form for creating encrypted legal consultations
 * Collects:
 * - Case title (encrypted)
 * - Jurisdiction (mandatory)
 * - Case type (mandatory)
 * - Facts of the case (encrypted)
 * - Legal questions (encrypted)
 * - Confidentiality level
 *
 * All sensitive data encrypted with AES-256 on the server
 */

const JURISDICTIONS = [
  { code: 'cth', name: 'Commonwealth' },
  { code: 'nsw', name: 'New South Wales' },
  { code: 'vic', name: 'Victoria' },
  { code: 'qld', name: 'Queensland' },
  { code: 'sa', name: 'South Australia' },
  { code: 'wa', name: 'Western Australia' },
  { code: 'tas', name: 'Tasmania' },
  { code: 'nt', name: 'Northern Territory' },
  { code: 'act', name: 'Australian Capital Territory' }
];

const CASE_TYPES = [
  { code: 'criminal', name: 'Criminal' },
  { code: 'civil', name: 'Civil' },
  { code: 'family', name: 'Family' },
  { code: 'employment', name: 'Employment' },
  { code: 'commercial', name: 'Commercial' },
  { code: 'property', name: 'Property' },
  { code: 'administrative', name: 'Administrative' },
  { code: 'constitutional', name: 'Constitutional' },
  { code: 'other', name: 'Other' }
];

export default function NewConsultation() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [formData, setFormData] = useState({
    caseTitle: '',
    jurisdiction: 'cth',
    caseType: 'civil',
    facts: '',
    legalQuestions: '',
    confidentialityLevel: 'high'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.caseTitle.trim()) {
      setError('Case title is required');
      return;
    }
    if (!formData.facts.trim()) {
      setError('Please describe the facts of your case');
      return;
    }
    if (!formData.legalQuestions.trim()) {
      setError('Please provide your legal questions');
      return;
    }
    if (!agreedToTerms) {
      setError('You must agree to the legal disclaimer');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('/api/law/consultations', {
        caseTitle: formData.caseTitle.trim(),
        jurisdiction: formData.jurisdiction,
        caseType: formData.caseType,
        facts: formData.facts.trim(),
        legalQuestions: formData.legalQuestions.trim(),
        confidentialityLevel: formData.confidentialityLevel
      });

      // Redirect to consultation chat
      navigate(`/law/consultations/${response.data.id}/chat`);
    } catch (err) {
      console.error('Consultation creation error:', err);
      setError(
        err.response?.data?.message ||
        'Failed to create consultation. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.consultationContainer}>
      <div className={styles.consultationHeader}>
        <h1>Create Legal Consultation</h1>
        <p className={styles.subtitle}>
          Encrypted case intake form. All information is protected with attorney-client privilege.
        </p>
      </div>

      {error && (
        <div className={styles.errorBanner}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.consultationForm}>
        {/* Security Notice */}
        <div className={styles.securityNotice}>
          <h3>🔒 Security & Privacy</h3>
          <ul>
            <li>All information is encrypted with AES-256 encryption</li>
            <li>Protected by attorney-client privilege</li>
            <li>Only you and authorized legal professionals can view this</li>
            <li>Comprehensive audit logging for compliance</li>
          </ul>
        </div>

        {/* Case Title */}
        <div className={styles.formGroup}>
          <label htmlFor="caseTitle">Case Title *</label>
          <input
            id="caseTitle"
            type="text"
            name="caseTitle"
            value={formData.caseTitle}
            onChange={handleInputChange}
            placeholder="E.g., Smith v Jones Employment Dispute"
            required
            disabled={loading}
          />
          <small>A brief description of the case for your reference</small>
        </div>

        {/* Jurisdiction */}
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="jurisdiction">Jurisdiction *</label>
            <select
              id="jurisdiction"
              name="jurisdiction"
              value={formData.jurisdiction}
              onChange={handleInputChange}
              required
              disabled={loading}
            >
              {JURISDICTIONS.map(j => (
                <option key={j.code} value={j.code}>
                  {j.name}
                </option>
              ))}
            </select>
            <small>Which jurisdiction does this matter relate to?</small>
          </div>

          {/* Case Type */}
          <div className={styles.formGroup}>
            <label htmlFor="caseType">Case Type *</label>
            <select
              id="caseType"
              name="caseType"
              value={formData.caseType}
              onChange={handleInputChange}
              required
              disabled={loading}
            >
              {CASE_TYPES.map(t => (
                <option key={t.code} value={t.code}>
                  {t.name}
                </option>
              ))}
            </select>
            <small>What type of legal matter is this?</small>
          </div>
        </div>

        {/* Facts of the Case */}
        <div className={styles.formGroup}>
          <label htmlFor="facts">Facts of the Case *</label>
          <textarea
            id="facts"
            name="facts"
            value={formData.facts}
            onChange={handleInputChange}
            placeholder="Describe the facts of your case in detail. What happened? When? Who was involved? What are the relevant events?"
            rows={8}
            required
            disabled={loading}
          />
          <small>Be as detailed as possible. This helps the AI understand your situation.</small>
        </div>

        {/* Legal Questions */}
        <div className={styles.formGroup}>
          <label htmlFor="legalQuestions">Your Legal Questions *</label>
          <textarea
            id="legalQuestions"
            name="legalQuestions"
            value={formData.legalQuestions}
            onChange={handleInputChange}
            placeholder="What legal questions do you have? E.g., 'What is my legal entitlement?' or 'Am I liable for...?'"
            rows={6}
            required
            disabled={loading}
          />
          <small>Ask specific questions about your legal situation</small>
        </div>

        {/* Confidentiality Level */}
        <div className={styles.formGroup}>
          <label htmlFor="confidentialityLevel">Confidentiality Level</label>
          <select
            id="confidentialityLevel"
            name="confidentialityLevel"
            value={formData.confidentialityLevel}
            onChange={handleInputChange}
            disabled={loading}
          >
            <option value="high">High (Recommended)</option>
            <option value="extreme">Extreme</option>
          </select>
          <small>Higher confidentiality adds additional security restrictions</small>
        </div>

        {/* Legal Disclaimer & Agreement */}
        <div className={styles.disclaimerBox}>
          <h3>⚠️ Important Legal Disclaimer</h3>
          <p>
            <strong>This is NOT legal advice.</strong> The information provided by this AI system
            is for educational and informational purposes only. It does not constitute:
          </p>
          <ul>
            <li>Legal advice</li>
            <li>An attorney-client relationship</li>
            <li>A substitute for consulting a qualified lawyer</li>
            <li>Professional legal guidance</li>
          </ul>
          <p>
            <strong>You should consult with a qualified lawyer</strong> in your jurisdiction
            before making any legal decisions or taking action based on information provided here.
          </p>
          <p>
            By using this service, you acknowledge that you understand this is NOT legal advice
            and that you will seek proper legal counsel for your specific situation.
          </p>

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              disabled={loading}
              required
            />
            I understand this is not legal advice and will seek a qualified lawyer
          </label>
        </div>

        {/* Privacy Notice */}
        <div className={styles.privacyNotice}>
          <h4>Privacy & Data Protection</h4>
          <p>
            Your case information is encrypted with AES-256 and protected under Australian privacy
            laws. We maintain audit logs for compliance with the Privacy Act 1988 (Cth) and relevant
            state legislation. Your data will be retained for 7 years unless a legal hold is applied.
          </p>
        </div>

        {/* Submit Button */}
        <div className={styles.formActions}>
          <button
            type="submit"
            disabled={loading || !agreedToTerms}
            className={styles.primaryButton}
          >
            {loading ? 'Creating Consultation...' : 'Create Consultation'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            disabled={loading}
            className={styles.secondaryButton}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
