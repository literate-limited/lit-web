import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { api } from '../api';
import MessageSegment from '../components/ChatUI/MessageSegment';

export default function TeacherDashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentChat, setStudentChat] = useState([]);
  const [showChatViewer, setShowChatViewer] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [yearLevel, setYearLevel] = useState('');
  const [classIdentifier, setClassIdentifier] = useState('');
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [showProgramConfig, setShowProgramConfig] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful French language teacher. Guide students in practicing conversational French.');
  const [chatUnits, setChatUnits] = useState([]);
  const [showAddUnit, setShowAddUnit] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadClassStudents(selectedClass.id);
    }
  }, [selectedClass]);

  useEffect(() => {
    scrollToBottom();
  }, [studentChat]);

  const loadClasses = async () => {
    try {
      const data = await api.getTeacherClasses(user.id);
      setClasses(data);
    } catch (err) {
      console.error('Failed to load classes:', err);
    }
  };

  const loadClassStudents = async (classId) => {
    try {
      setLoading(true);
      const data = await api.getClassStudents(classId);
      setStudents(data);
    } catch (err) {
      console.error('Failed to load students:', err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentChat = async (student) => {
    try {
      setLoading(true);
      setSelectedStudent(student);
      // In real app, would call API to get this student's chat from their room
      // const data = await api.getStudentChat(student.id);
      // For now, mock data
      const mockChat = [
        {
          id: 'msg-1',
          sender_role: 'student',
          raw_text: 'Je want aller au cinema',
          created_at: new Date(Date.now() - 300000).toISOString(),
          segments: [
            { text: 'Je', language: 'fr', is_error: false },
            { text: 'want', language: 'en', is_error: true, correction: 'veux', error_type: 'vocabulary' },
            { text: 'aller au cinema', language: 'fr', is_error: false }
          ],
          analysis: {
            error_count: 1,
            language_distribution: { target_language_pct: 0.83, l1_pct: 0.17 }
          }
        },
        {
          id: 'msg-2',
          sender_role: 'ai',
          raw_text: 'Oh, tu veux aller au cinéma? Bonne idée! Quel film veux-tu voir?',
          created_at: new Date(Date.now() - 290000).toISOString(),
          segments: [],
          pedagogical_intent: 'correct_implicitly'
        }
      ];
      setStudentChat(mockChat);
      setShowChatViewer(true);
    } catch (err) {
      console.error('Failed to load student chat:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      const newClass = await api.createClass({
        teacherId: user.id,
        year_level: parseInt(yearLevel),
        class_identifier: classIdentifier,
        subject: subject
      });
      setClasses([newClass, ...classes]);
      setYearLevel('');
      setClassIdentifier('');
      setSubject('');
      setShowCreateModal(false);
    } catch (err) {
      alert('Failed to create class');
    }
  };

  const copyJoinLink = (code) => {
    const link = `${window.location.origin}/join/${code}`;
    navigator.clipboard.writeText(link);
    alert('Join link copied to clipboard!');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteClass = async (classToDelete) => {
    try {
      await api.deleteClass(classToDelete.id);
      setClasses(classes.filter(c => c.id !== classToDelete.id));
      if (selectedClass?.id === classToDelete.id) {
        setSelectedClass(null);
        setStudents([]);
      }
      setDeleteConfirmation(null);
    } catch (err) {
      alert('Failed to delete class: ' + err.message);
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
    if (message.segments && message.segments.length > 0) {
      return (
        <div style={styles.segmentedContent}>
          {message.segments.map((segment, idx) => (
            <MessageSegment key={idx} segment={segment} />
          ))}
        </div>
      );
    }
    return <div>{message.raw_text}</div>;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>👨‍🏫 Teacher Dashboard</h1>
        <div style={styles.userInfo}>
          <span>{user.firstName} {user.lastName}</span>
          <button onClick={onLogout} style={styles.logoutBtn}>Logout</button>
        </div>
      </div>

      <div style={styles.content}>
        {/* Classes List / Selected Class View */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <h2>My Classes</h2>
            <button onClick={() => setShowCreateModal(true)} style={styles.createBtn}>
              + New
            </button>
          </div>

          <div style={styles.classList}>
            {classes.map((cls) => (
              <div
                key={cls.id}
                style={{
                  ...styles.classItem,
                  ...(selectedClass?.id === cls.id ? styles.classItemActive : {}),
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div
                  onClick={() => setSelectedClass(cls)}
                  style={{ flex: 1, cursor: 'pointer' }}
                >
                  <div style={styles.classItemTitle}>{cls.name}</div>
                  <div style={styles.classItemCode}>{cls.code}</div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirmation(cls);
                  }}
                  style={styles.deleteBtn}
                  title="Delete class"
                >
                  🗑️
                </button>
              </div>
            ))}

            {classes.length === 0 && (
              <div style={styles.emptyMessage}>
                <p>No classes yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div style={styles.main}>
          {!selectedClass ? (
            <div style={styles.noSelection}>
              <p>Select a class to view students and their progress</p>
            </div>
          ) : (
            <div style={styles.classView}>
              <div style={styles.classHeader}>
                <div>
                  <h2>{selectedClass.name}</h2>
                  <p style={styles.classCode}>Code: {selectedClass.code}</p>
                </div>
                <button
                  onClick={() => copyJoinLink(selectedClass.code)}
                  style={styles.copyLinkBtn}
                >
                  Copy Join Link
                </button>
              </div>

              {/* Program Configuration Rail */}
              <div style={styles.programRail}>
                <div
                  style={styles.programRailHeader}
                  onClick={() => setShowProgramConfig(!showProgramConfig)}
                >
                  <h3>⚙️ Program Configuration</h3>
                  <span style={styles.toggleIcon}>
                    {showProgramConfig ? '▼' : '▶'}
                  </span>
                </div>

                {showProgramConfig && (
                  <div style={styles.programRailContent}>
                    {/* System Prompt */}
                    <div style={styles.configSection}>
                      <label style={styles.configLabel}>AI System Prompt</label>
                      <textarea
                        style={styles.promptTextarea}
                        value={systemPrompt}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        placeholder="Define how the AI should interact with students..."
                        rows={3}
                      />
                      <button style={styles.saveBtn} onClick={() => alert('Prompt saved!')}>
                        Save Prompt
                      </button>
                    </div>

                    {/* Chat Units */}
                    <div style={styles.configSection}>
                      <div style={styles.sectionHeader}>
                        <label style={styles.configLabel}>Chat Units</label>
                        <button
                          style={styles.addUnitBtn}
                          onClick={() => setShowAddUnit(!showAddUnit)}
                        >
                          + Add Chat Unit
                        </button>
                      </div>

                      {showAddUnit && (
                        <div style={styles.addUnitForm}>
                          <input
                            type="text"
                            placeholder="Unit Title (e.g., 'Greetings & Introductions')"
                            style={styles.unitInput}
                          />
                          <textarea
                            placeholder="Unit Description & Goals"
                            style={styles.unitTextarea}
                            rows={2}
                          />
                          <input
                            type="text"
                            placeholder="Topic Tags (comma-separated)"
                            style={styles.unitInput}
                          />
                          <div style={styles.unitFormActions}>
                            <button style={styles.saveBtn} onClick={() => setShowAddUnit(false)}>
                              Add Unit
                            </button>
                            <button style={styles.cancelBtn} onClick={() => setShowAddUnit(false)}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      <div style={styles.unitsList}>
                        {chatUnits.length === 0 ? (
                          <p style={styles.emptyUnits}>No chat units defined yet. Click "Add Chat Unit" to create one.</p>
                        ) : (
                          chatUnits.map((unit, idx) => (
                            <div key={idx} style={styles.unitCard}>
                              <div style={styles.unitInfo}>
                                <h4>{unit.title}</h4>
                                <p>{unit.description}</p>
                                <div style={styles.unitTags}>
                                  {unit.tags.map((tag, i) => (
                                    <span key={i} style={styles.tag}>{tag}</span>
                                  ))}
                                </div>
                              </div>
                              <button style={styles.deleteBtn}>🗑️</button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div style={styles.studentsContainer}>
                <div style={styles.studentsHeader}>
                  <h3>Students ({students.length})</h3>
                </div>

                {loading ? (
                  <div style={styles.loading}>Loading students...</div>
                ) : (
                  <div style={styles.studentsList}>
                    {students.map((student) => (
                      <div key={student.id} style={styles.studentCard}>
                        <div style={styles.studentInfo}>
                          <h4>{student.firstName} {student.lastName}</h4>
                          <p style={styles.enrollmentDate}>
                            Joined: {new Date(student.enrollment_date).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => loadStudentChat(student)}
                          style={styles.viewChatBtn}
                        >
                          View Chat
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div style={styles.modal}>
          <div style={styles.confirmationModal}>
            <h3>Delete Class?</h3>
            <p>Are you sure you want to delete <strong>{deleteConfirmation.name}</strong>?</p>
            <p style={styles.confirmationWarning}>This action cannot be undone. All enrollments and chat data will be removed.</p>
            <div style={styles.confirmationActions}>
              <button
                onClick={() => handleDeleteClass(deleteConfirmation)}
                style={styles.confirmDeleteBtn}
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirmation(null)}
                style={styles.cancelDeleteBtn}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Chat Viewer Modal */}
      {showChatViewer && selectedStudent && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.chatViewerHeader}>
              <h3>
                Chat with {selectedStudent.firstName} {selectedStudent.lastName}
              </h3>
              <button
                onClick={() => {
                  setShowChatViewer(false);
                  setSelectedStudent(null);
                  setStudentChat([]);
                }}
                style={styles.closeBtn}
              >
                ✕
              </button>
            </div>

            <div style={styles.chatMessages}>
              {studentChat.length === 0 ? (
                <div style={styles.noMessages}>No messages yet</div>
              ) : (
                studentChat.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      ...styles.message,
                      ...(msg.sender_role === 'student' ? styles.studentMsg : styles.aiMsg)
                    }}
                  >
                    <div style={styles.msgMeta}>
                      <strong>{msg.sender_role === 'ai' ? 'AI' : selectedStudent.firstName}</strong>
                      <span style={styles.msgTime}>{formatTime(msg.created_at)}</span>
                    </div>
                    {renderMessageContent(msg)}

                    {msg.sender_role === 'student' && msg.analysis && (
                      <div style={styles.msgAnalysis}>
                        {msg.analysis.error_count > 0 && (
                          <span style={styles.errorBadge}>
                            {msg.analysis.error_count} error(s)
                          </span>
                        )}
                        <span style={styles.langBadge}>
                          {(msg.analysis.language_distribution?.target_language_pct * 100).toFixed(0)}% French
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      )}

      {/* Create Class Modal */}
      {showCreateModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h2>Create New Class</h2>
            <form onSubmit={handleCreateClass}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Year Level</label>
                <input
                  type="number"
                  placeholder="e.g., 7"
                  min="1"
                  max="12"
                  value={yearLevel}
                  onChange={(e) => setYearLevel(e.target.value)}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Class Identifier</label>
                <input
                  type="text"
                  placeholder="e.g., Red or A or 1"
                  value={classIdentifier}
                  onChange={(e) => setClassIdentifier(e.target.value)}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Subject</label>
                <input
                  type="text"
                  placeholder="e.g., Spanish or French"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.modalActions}>
                <button type="submit" style={styles.submitBtn}>Create</button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: '#f0f2f5'
  },
  header: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '20px 40px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  userInfo: {
    display: 'flex',
    gap: '15px',
    alignItems: 'center'
  },
  logoutBtn: {
    padding: '8px 16px',
    background: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600'
  },
  content: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden'
  },
  sidebar: {
    width: '280px',
    background: 'white',
    borderRight: '1px solid #e0e0e0',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  sidebarHeader: {
    padding: '20px',
    borderBottom: '1px solid #e0e0e0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  createBtn: {
    padding: '6px 12px',
    background: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
    fontWeight: '600'
  },
  classList: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px'
  },
  classItem: {
    padding: '12px 16px',
    margin: '4px 0',
    background: '#f5f5f5',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    borderLeft: '3px solid transparent'
  },
  classItemActive: {
    background: '#e7f3ff',
    borderLeftColor: '#007bff'
  },
  classItemTitle: {
    fontWeight: '600',
    fontSize: '14px',
    marginBottom: '4px'
  },
  classItemCode: {
    fontSize: '12px',
    color: '#666',
    fontFamily: 'monospace'
  },
  deleteBtn: {
    padding: '4px 8px',
    background: 'transparent',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    opacity: 0.6,
    transition: 'opacity 0.2s ease',
    marginLeft: '8px'
  },
  emptyMessage: {
    padding: '30px 20px',
    textAlign: 'center',
    color: '#999'
  },
  main: {
    flex: 1,
    overflow: 'auto',
    padding: '20px 40px'
  },
  noSelection: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    color: '#999',
    fontSize: '18px'
  },
  classView: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  classHeader: {
    background: 'white',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  classCode: {
    fontSize: '13px',
    color: '#666',
    margin: '6px 0 0 0',
    fontFamily: 'monospace'
  },
  copyLinkBtn: {
    padding: '10px 16px',
    background: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600'
  },
  studentsContainer: {
    background: 'white',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  studentsHeader: {
    marginBottom: '20px'
  },
  studentsList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '16px'
  },
  studentCard: {
    background: '#f8f9fa',
    padding: '16px',
    borderRadius: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    border: '1px solid #e9ecef'
  },
  studentInfo: {
    flex: 1
  },
  enrollmentDate: {
    fontSize: '12px',
    color: '#999',
    margin: '4px 0 0 0'
  },
  viewChatBtn: {
    padding: '8px 16px',
    background: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600'
  },
  loading: {
    padding: '40px',
    textAlign: 'center',
    color: '#999'
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  modalContent: {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
    width: '90%',
    maxWidth: '800px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  chatViewerHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid #e0e0e0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#999'
  },
  chatMessages: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  noMessages: {
    textAlign: 'center',
    color: '#999',
    padding: '40px 20px'
  },
  message: {
    maxWidth: '70%',
    padding: '12px 16px',
    borderRadius: '8px'
  },
  studentMsg: {
    alignSelf: 'flex-end',
    background: '#e7f3ff',
    borderLeft: '3px solid #007bff'
  },
  aiMsg: {
    alignSelf: 'flex-start',
    background: '#f0f0f0',
    borderLeft: '3px solid #666'
  },
  msgMeta: {
    fontSize: '12px',
    fontWeight: '600',
    marginBottom: '6px',
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
  },
  msgTime: {
    fontSize: '11px',
    opacity: 0.7,
    marginLeft: 'auto'
  },
  segmentedContent: {
    fontSize: '14px',
    lineHeight: '1.5'
  },
  msgAnalysis: {
    marginTop: '8px',
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap'
  },
  errorBadge: {
    fontSize: '11px',
    background: '#dc3545',
    color: 'white',
    padding: '2px 6px',
    borderRadius: '3px',
    fontWeight: '600'
  },
  langBadge: {
    fontSize: '11px',
    background: '#007bff',
    color: 'white',
    padding: '2px 6px',
    borderRadius: '3px',
    fontWeight: '600'
  },
  formGroup: {
    marginBottom: '16px'
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '6px',
    color: '#333'
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  modalActions: {
    display: 'flex',
    gap: '10px'
  },
  submitBtn: {
    flex: 1,
    padding: '10px',
    background: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600'
  },
  cancelBtn: {
    flex: 1,
    padding: '10px',
    background: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600'
  },
  confirmationModal: {
    background: 'white',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
    width: '90%',
    maxWidth: '400px',
    textAlign: 'center'
  },
  confirmationWarning: {
    fontSize: '13px',
    color: '#666',
    margin: '12px 0 20px 0',
    lineHeight: '1.5'
  },
  confirmationActions: {
    display: 'flex',
    gap: '10px'
  },
  confirmDeleteBtn: {
    flex: 1,
    padding: '10px',
    background: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600'
  },
  cancelDeleteBtn: {
    flex: 1,
    padding: '10px',
    background: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600'
  },
  programRail: {
    background: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: '8px',
    marginBottom: '20px',
    overflow: 'hidden'
  },
  programRailHeader: {
    padding: '16px 20px',
    background: '#e9ecef',
    cursor: 'pointer',
    userSelect: 'none',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #dee2e6'
  },
  programRailContent: {
    padding: '20px'
  },
  configSection: {
    marginBottom: '24px'
  },
  configLabel: {
    display: 'block',
    fontWeight: '600',
    marginBottom: '8px',
    fontSize: '14px',
    color: '#333'
  },
  promptTextarea: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ced4da',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical',
    marginBottom: '10px'
  },
  saveBtn: {
    padding: '8px 16px',
    background: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  addUnitBtn: {
    padding: '6px 12px',
    background: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600'
  },
  addUnitForm: {
    background: 'white',
    padding: '16px',
    border: '1px solid #dee2e6',
    borderRadius: '6px',
    marginBottom: '16px'
  },
  unitInput: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ced4da',
    borderRadius: '6px',
    fontSize: '14px',
    marginBottom: '10px'
  },
  unitTextarea: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ced4da',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical',
    marginBottom: '10px'
  },
  unitFormActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '12px'
  },
  // Note: leave only one definition of cancelBtn to avoid duplicate keys in esbuild
  unitsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  emptyUnits: {
    padding: '20px',
    textAlign: 'center',
    color: '#999',
    fontSize: '14px',
    fontStyle: 'italic'
  },
  unitCard: {
    background: 'white',
    padding: '16px',
    border: '1px solid #dee2e6',
    borderRadius: '6px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  unitInfo: {
    flex: 1
  },
  unitTags: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    marginTop: '8px'
  },
  tag: {
    padding: '4px 8px',
    background: '#e7f3ff',
    color: '#0066cc',
    fontSize: '11px',
    borderRadius: '4px',
    fontWeight: '600'
  },
  toggleIcon: {
    fontSize: '12px',
    color: '#666'
  }
};
