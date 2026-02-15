import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { api, SOCKET_URL } from '../../api';
import MessageSegment from './MessageSegment';

export default function ChatUI({ roomId, user, onUnitAssigned }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [typing, setTyping] = useState(null);
  const [loading, setLoading] = useState(false);
  const [assessment, setAssessment] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadMessages();
    connectSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await api.getRoomMessages(roomId);
      setMessages(data || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const connectSocket = () => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      newSocket.emit('join_room', {
        roomId,
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`
      });
    });

    // Student sent message
    newSocket.on('student_message', (message) => {
      setMessages((prev) => {
        // Check if message already exists to prevent duplicates
        if (prev.some(m => m.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });
      setAssessment(message.analysis);
    });

    // AI responded
    newSocket.on('ai_message', (message) => {
      setMessages((prev) => {
        // Check if message already exists to prevent duplicates
        if (prev.some(m => m.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });
    });

    // Unit was assigned to student
    newSocket.on('unit_assignment', (data) => {
      console.log('Unit assigned:', data);
      if (onUnitAssigned) {
        onUnitAssigned(data);
      }
    });

    // Message processing complete
    newSocket.on('message_processed', (data) => {
      console.log('Message processed:', data);
    });

    newSocket.on('user_typing', (data) => {
      // Don't show typing indicator for yourself
      if (data.userName !== `${user.firstName} ${user.lastName}`) {
        setTyping(data.userName);
        setTimeout(() => setTyping(null), 3000);
      }
    });

    newSocket.on('user_stopped_typing', () => {
      setTyping(null);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      alert('Error: ' + (error.message || error.details || 'Unknown error'));
    });

    setSocket(newSocket);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();

    if (!inputMessage.trim() || !socket) return;

    socket.emit('send_message', {
      roomId,
      content: inputMessage,
      targetLanguage: 'fr' // Default to French, could be made dynamic
    });

    setInputMessage('');
  };

  const handleTyping = () => {
    if (socket) {
      socket.emit('typing', {
        roomId,
        userName: `${user.firstName} ${user.lastName}`
      });
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderMessageContent = (message) => {
    // If message has segments, render with flip-able segments
    if (message.segments && message.segments.length > 0) {
      return (
        <div style={styles.segmentedContent}>
          {message.segments.map((segment, idx) => (
            <MessageSegment key={idx} segment={segment} />
          ))}
        </div>
      );
    }
    // Otherwise render plain text
    return <div style={styles.plainContent}>{message.raw_text}</div>;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2>Language Practice Chat</h2>
          {assessment && (
            <div style={styles.assessmentBar}>
              <div style={styles.metric}>
                Target Language: <strong>{(assessment.language_distribution?.target_language_pct * 100).toFixed(0)}%</strong>
              </div>
              <div style={styles.metric}>
                Error Rate: <strong>{assessment.error_rate?.toFixed(1) || 0}%</strong>
              </div>
              {assessment.identified_gaps?.length > 0 && (
                <div style={styles.gapsDisplay}>
                  Areas to improve: {assessment.identified_gaps.join(', ')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={styles.messagesContainer}>
        {loading ? (
          <div style={styles.loading}>Loading conversation...</div>
        ) : messages.length === 0 ? (
          <div style={styles.emptyState}>
            <p>Start your conversation with the AI</p>
            <p style={{ fontSize: '14px', color: '#666' }}>Type in French as much as possible!</p>
          </div>
        ) : (
          <div style={styles.messages}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  ...styles.message,
                  ...(msg.sender_role === 'student' ? styles.studentMessage : styles.aiMessage)
                }}
              >
                <div style={styles.messageHeader}>
                  <strong>
                    {msg.sender_role === 'ai' ? '🤖 AI Assistant' : `👤 ${user.firstName}`}
                  </strong>
                  <span style={styles.time}>{formatTime(msg.created_at)}</span>
                </div>

                {renderMessageContent(msg)}

                {msg.sender_role === 'student' && msg.analysis && (
                  msg.analysis.error_count > 0 ||
                  msg.analysis.language_distribution?.l1_pct > 0 ||
                  msg.analysis.identified_gaps?.length > 0
                ) && (
                  <div style={styles.analysisPanel}>
                    {msg.analysis.error_count > 0 && (
                      <span style={styles.errorBadge}>
                        {msg.analysis.error_count} error{msg.analysis.error_count !== 1 ? 's' : ''}
                      </span>
                    )}
                    {msg.analysis.language_distribution?.l1_pct > 0 && (
                      <span style={styles.englishBadge}>
                        {(msg.analysis.language_distribution.l1_pct * 100).toFixed(0)}% English
                      </span>
                    )}
                    {msg.analysis.identified_gaps?.length > 0 && (
                      <span style={styles.gapBadge}>
                        Gap: {msg.analysis.identified_gaps[0]}
                      </span>
                    )}
                  </div>
                )}

                {msg.sender_role === 'ai' && msg.pedagogical_intent && (
                  <div style={styles.intentLabel}>
                    ({msg.pedagogical_intent.replace(/_/g, ' ')})
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        {typing && (
          <div style={styles.typingIndicator}>
            {typing} is typing...
          </div>
        )}
      </div>

      <form onSubmit={handleSendMessage} style={styles.inputContainer}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleTyping}
          placeholder="Type in French... (or English if needed)"
          style={styles.input}
          autoFocus
        />
        <button type="submit" style={styles.sendButton} disabled={!inputMessage.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
    background: '#f5f5f5',
    boxShadow: '0 0 20px rgba(0,0,0,0.1)'
  },
  header: {
    background: 'white',
    padding: '20px 30px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    borderBottom: '1px solid #eee'
  },
  assessmentBar: {
    display: 'flex',
    gap: '20px',
    marginTop: '12px',
    fontSize: '13px',
    flexWrap: 'wrap'
  },
  metric: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center'
  },
  gapsDisplay: {
    padding: '6px 12px',
    background: '#fff3cd',
    borderRadius: '4px',
    color: '#856404',
    fontSize: '12px'
  },
  messagesContainer: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column'
  },
  messages: {
    height: '100%',
    overflowY: 'auto',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  message: {
    maxWidth: '75%',
    padding: '14px 16px',
    borderRadius: '12px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
  },
  studentMessage: {
    alignSelf: 'flex-end',
    background: '#007bff',
    color: '#333'
  },
  aiMessage: {
    alignSelf: 'flex-start',
    background: 'white',
    borderLeft: '4px solid #28a745'
  },
  messageHeader: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    marginBottom: '8px',
    fontSize: '13px',
    fontWeight: '600'
  },
  time: {
    fontSize: '11px',
    opacity: 0.7,
    marginLeft: 'auto'
  },
  segmentedContent: {
    fontSize: '15px',
    lineHeight: '1.5',
    wordWrap: 'break-word'
  },
  plainContent: {
    fontSize: '15px',
    lineHeight: '1.5',
    wordWrap: 'break-word'
  },
  analysisPanel: {
    display: 'flex',
    gap: '8px',
    marginTop: '10px',
    flexWrap: 'wrap'
  },
  errorBadge: {
    display: 'inline-block',
    background: '#dc3545',
    color: 'white',
    padding: '3px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600'
  },
  englishBadge: {
    display: 'inline-block',
    background: '#0066cc',
    color: 'white',
    padding: '3px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600'
  },
  gapBadge: {
    display: 'inline-block',
    background: '#ffc107',
    color: '#333',
    padding: '3px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600'
  },
  intentLabel: {
    marginTop: '8px',
    fontSize: '11px',
    color: '#666',
    fontStyle: 'italic'
  },
  typingIndicator: {
    padding: '10px 20px',
    fontSize: '13px',
    color: '#666',
    fontStyle: 'italic'
  },
  inputContainer: {
    background: 'white',
    padding: '16px 20px',
    boxShadow: '0 -2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    gap: '12px',
    borderTop: '1px solid #eee'
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    border: '1px solid #ddd',
    borderRadius: '24px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s ease',
    '&:focus': {
      borderColor: '#007bff'
    }
  },
  sendButton: {
    padding: '12px 28px',
    background: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '24px',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'background-color 0.2s ease',
    '&:hover:not(:disabled)': {
      background: '#0056b3'
    },
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed'
    }
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    fontSize: '16px',
    color: '#666'
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    color: '#666',
    textAlign: 'center'
  }
};
