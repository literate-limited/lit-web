import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from '../styles/lawlore.module.css';

/**
 * ConsultationChat Component
 *
 * Chat interface for legal consultations
 * Features:
 * - Conversation history with encrypted messages
 * - AI responses with AGLC citations
 * - Citation links to statutes/cases
 * - Usage and cost tracking
 * - Legal disclaimer on every response
 */

export default function ConsultationChat() {
  const navigate = useNavigate();
  const { consultationId } = useParams();

  const [consultation, setConsultation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [userMessage, setUserMessage] = useState('');
  const [stats, setStats] = useState(null);

  const messagesEndRef = useRef(null);

  // Load consultation and messages
  useEffect(() => {
    const loadConsultation = async () => {
      try {
        const [consultationRes, messagesRes, statsRes] = await Promise.all([
          axios.get(`/api/law/consultations/${consultationId}`),
          axios.get(`/api/law/consultations/${consultationId}/messages`),
          axios.get(`/api/law/consultations/${consultationId}/stats`)
        ]);

        setConsultation(consultationRes.data);
        setMessages(messagesRes.data.messages || []);
        setStats(statsRes.data);
        setError(null);
      } catch (err) {
        console.error('Load consultation error:', err);
        setError(
          err.response?.data?.message ||
          'Failed to load consultation. You may not have access.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadConsultation();
  }, [consultationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!userMessage.trim()) {
      return;
    }

    setSending(true);
    setError(null);

    try {
      const response = await axios.post(
        `/api/law/consultations/${consultationId}/chat`,
        { message: userMessage.trim() }
      );

      // Add user and AI messages to conversation
      setMessages(prev => [
        ...prev,
        {
          id: response.data.userMessage.id,
          senderType: 'user',
          sequence: response.data.userMessage.sequence,
          content: response.data.userMessage.content,
          createdAt: response.data.userMessage.createdAt
        },
        {
          id: response.data.aiResponse.id,
          senderType: 'ai',
          sequence: response.data.aiResponse.sequence,
          content: response.data.aiResponse.content,
          model: response.data.aiResponse.model,
          citations: response.data.aiResponse.citations,
          costUsd: response.data.aiResponse.costUsd,
          tokens: response.data.aiResponse.tokens,
          createdAt: response.data.aiResponse.createdAt
        }
      ]);

      // Update stats
      const newStatsRes = await axios.get(
        `/api/law/consultations/${consultationId}/stats`
      );
      setStats(newStatsRes.data);

      setUserMessage('');
    } catch (err) {
      console.error('Send message error:', err);
      setError(
        err.response?.data?.message ||
        'Failed to send message. Please try again.'
      );
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.consultationContainer}>
        <div className={styles.loadingSpinner}>Loading consultation...</div>
      </div>
    );
  }

  if (error && !consultation) {
    return (
      <div className={styles.consultationContainer}>
        <div className={styles.errorBanner}>
          <strong>Error:</strong> {error}
        </div>
        <button onClick={() => navigate('/law/consultations')}>
          Back to Consultations
        </button>
      </div>
    );
  }

  return (
    <div className={styles.chatContainer}>
      {/* Header */}
      <div className={styles.chatHeader}>
        <div className={styles.headerLeft}>
          <h2>{consultation?.caseTitle || 'Consultation'}</h2>
          <p className={styles.headerSubtitle}>
            {consultation?.jurisdiction?.toUpperCase()} • {consultation?.caseType}
          </p>
        </div>
        <div className={styles.headerRight}>
          {stats && (
            <div className={styles.statsPanel}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Messages</span>
                <span className={styles.statValue}>{stats.messages.total}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Citations</span>
                <span className={styles.statValue}>{stats.citations.total}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Cost</span>
                <span className={styles.statValue}>${stats.cost.totalUsd.toFixed(3)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className={styles.messagesArea}>
        {messages.length === 0 && (
          <div className={styles.emptyState}>
            <p>Start your legal research by asking a question about your case.</p>
            <p className={styles.disclaimer}>
              Remember: This is not legal advice. Consult a qualified lawyer for your situation.
            </p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={msg.id || idx}
            className={`${styles.messageItem} ${styles[msg.senderType]}`}
          >
            <div className={styles.messageContent}>
              {msg.senderType === 'user' ? (
                <p>{msg.content}</p>
              ) : (
                <>
                  <p>{msg.content}</p>

                  {/* Citations */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className={styles.citationsPanel}>
                      <h4>Sources Cited</h4>
                      <ul>
                        {msg.citations.map((citation, cidx) => (
                          <li key={cidx} className={styles.citation}>
                            <span className={styles.citationType}>
                              {citation.type === 'statute' ? '📜' : '⚖️'}
                            </span>
                            <span className={styles.citationText}>
                              {citation.text}
                            </span>
                            {citation.warning && (
                              <span className={styles.warning}>{citation.warning}</span>
                            )}
                            {citation.sourceId && (
                              <a
                                href={`/law/${citation.type}s/${citation.sourceId}`}
                                className={styles.citationLink}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                View
                              </a>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* AI Metadata */}
                  {msg.tokens && (
                    <div className={styles.aiMetadata}>
                      <small>
                        Model: {msg.model} • Tokens: {msg.tokens.prompt + msg.tokens.completion} •
                        Cost: ${msg.costUsd.toFixed(4)}
                      </small>
                    </div>
                  )}
                </>
              )}

              <span className={styles.timestamp}>
                {new Date(msg.createdAt).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Disclaimer Bar */}
      {messages.length > 0 && messages[messages.length - 1]?.senderType === 'ai' && (
        <div className={styles.disclaimerBar}>
          ⚠️ <strong>Reminder:</strong> This is not legal advice. Please consult a qualified
          lawyer before making decisions about your legal matter.
        </div>
      )}

      {/* Input Area */}
      <div className={styles.inputArea}>
        {error && (
          <div className={styles.errorMessage}>
            <strong>Error:</strong> {error}
          </div>
        )}

        <form onSubmit={handleSendMessage} className={styles.messageForm}>
          <textarea
            value={userMessage}
            onChange={(e) => setUserMessage(e.target.value)}
            placeholder="Ask a question about your legal situation..."
            disabled={sending}
            rows={3}
          />
          <div className={styles.formControls}>
            <button
              type="submit"
              disabled={sending || !userMessage.trim()}
              className={styles.sendButton}
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/law/consultations')}
              className={styles.backButton}
            >
              Consultations
            </button>
          </div>
        </form>
      </div>

      {/* Help Text */}
      <div className={styles.helpText}>
        <p>
          💡 <strong>Tips for better responses:</strong> Be specific about your question, provide
          relevant dates and details, and explain what outcome you're seeking.
        </p>
      </div>
    </div>
  );
}
