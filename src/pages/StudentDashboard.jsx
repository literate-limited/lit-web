import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import ChatUI from '../components/ChatUI/ChatUI';
import UnitPlayer from '../components/UnitPlayer/UnitPlayer';

export default function StudentDashboard({ user, onLogout }) {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [activeView, setActiveView] = useState('chat'); // 'chat' or 'unit'
  const [assignedUnit, setAssignedUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tipsExpanded, setTipsExpanded] = useState(true);

  useEffect(() => {
    loadRoom();
  }, [roomId]);

  const loadRoom = async () => {
    try {
      setLoading(true);
      const data = await api.getRoomDetails(roomId);
      setRoom(data);
    } catch (err) {
      console.error('Failed to load room:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnitAssigned = (unitData) => {
    // Unit was assigned by AI during chat
    setAssignedUnit(unitData);
    setActiveView('unit');
  };

  const handleUnitComplete = (completionData) => {
    // Student completed the unit
    console.log('Unit completed:', completionData);
    setAssignedUnit(null);
    setActiveView('chat');
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (!room) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          <p>Room not found</p>
          <button onClick={() => navigate('/join')} style={styles.btn}>
            Back
          </button>
        </div>
      </div>
    );
  }

  // Get target language from room/class data
  const targetLanguage = room?.language_code || 'fr';
  const languageName = targetLanguage === 'fr' ? 'French' : targetLanguage === 'es' ? 'Spanish' : 'the target language';

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.titleRow}>
            <h1 style={styles.title}>
              {activeView === 'chat' ? '💬 Practice Chat' : '📚 Lesson'}
            </h1>
            {assignedUnit && (
              <span style={styles.badge}>In Lesson</span>
            )}
          </div>
          {room && (
            <div style={styles.classInfo}>
              <span style={styles.className}>{room.className}</span>
              <span style={styles.separator}>•</span>
              <span style={styles.language}>Learning {languageName}</span>
            </div>
          )}
        </div>

        <div style={styles.userSection}>
          <span style={styles.userName}>
            👤 {user.firstName} {user.lastName}
          </span>
          <button onClick={onLogout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {activeView === 'chat' && !assignedUnit ? (
          <ChatUI
            roomId={roomId}
            user={user}
            onUnitAssigned={handleUnitAssigned}
          />
        ) : activeView === 'unit' && assignedUnit ? (
          <div style={styles.unitContainer}>
            <div style={styles.unitHeader}>
              <h2>{assignedUnit.unit_name}</h2>
              <button
                onClick={() => handleUnitComplete()}
                style={styles.exitUnitBtn}
              >
                Exit to Chat
              </button>
            </div>
            <UnitPlayer
              unitId={assignedUnit.unit_id}
              user={user}
              onUnitComplete={handleUnitComplete}
            />
          </div>
        ) : (
          <ChatUI
            roomId={roomId}
            user={user}
            onUnitAssigned={handleUnitAssigned}
          />
        )}
      </div>

      {/* Footer with tips */}
      {activeView === 'chat' && (
        <div style={styles.footer}>
          <div style={styles.tips}>
            <div
              style={styles.tipsHeader}
              onClick={() => setTipsExpanded(!tipsExpanded)}
            >
              <p style={styles.tipsTitle}>
                💡 Quick Tips
                <span style={styles.toggleIcon}>
                  {tipsExpanded ? '▼' : '▲'}
                </span>
              </p>
            </div>
            {tipsExpanded && (
              <ul style={styles.tipsList}>
                <li>Try to write in {languageName} as much as possible</li>
                <li>Click on words in your message to see translations</li>
                <li>The AI will correct your errors and help you improve</li>
                <li>Complete assigned lessons to unlock new skills</li>
              </ul>
            )}
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
    padding: '20px 30px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerContent: {
    flex: 1
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '8px'
  },
  title: {
    margin: '0',
    fontSize: '28px',
    fontWeight: '700'
  },
  badge: {
    padding: '4px 12px',
    background: 'rgba(255,255,255,0.25)',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    border: '1px solid rgba(255,255,255,0.3)'
  },
  classInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    opacity: 0.95
  },
  className: {
    fontWeight: '600'
  },
  separator: {
    opacity: 0.6
  },
  language: {
    opacity: 0.9
  },
  userSection: {
    display: 'flex',
    gap: '15px',
    alignItems: 'center'
  },
  userName: {
    fontSize: '14px',
    fontWeight: '500'
  },
  logoutBtn: {
    padding: '8px 16px',
    background: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    '&:hover': {
      background: 'rgba(255,255,255,0.3)'
    }
  },
  mainContent: {
    flex: 1,
    overflow: 'hidden',
    display: 'flex'
  },
  unitContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  unitHeader: {
    background: 'white',
    padding: '20px 30px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #eee'
  },
  exitUnitBtn: {
    padding: '8px 16px',
    background: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600'
  },
  footer: {
    background: 'white',
    padding: '16px 30px',
    borderTop: '1px solid #e0e0e0',
    boxShadow: '0 -2px 4px rgba(0,0,0,0.05)'
  },
  tips: {
    maxWidth: '1200px',
    margin: '0 auto'
  },
  tipsHeader: {
    cursor: 'pointer',
    userSelect: 'none'
  },
  tipsTitle: {
    margin: '0 0 8px 0',
    fontSize: '13px',
    fontWeight: '700',
    color: '#333',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  toggleIcon: {
    fontSize: '10px',
    marginLeft: '8px',
    color: '#666'
  },
  tipsList: {
    margin: '0',
    padding: '0 0 0 20px',
    fontSize: '12px',
    color: '#666',
    lineHeight: '1.6'
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    fontSize: '18px',
    color: '#666'
  },
  error: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    textAlign: 'center',
    color: '#dc3545'
  },
  btn: {
    marginTop: '20px',
    padding: '10px 20px',
    background: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  }
};
