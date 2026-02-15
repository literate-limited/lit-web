import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { api, SOCKET_URL } from '../api';

export default function Room({ user }) {
  const { roomId } = useParams();
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [typing, setTyping] = useState(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      // Check localStorage for student
      const savedUser = localStorage.getItem('user');
      if (!savedUser) {
        navigate('/login');
        return;
      }
    }

    loadRoom();
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

  const loadRoom = async () => {
    try {
      const data = await api.getRoomDetails(roomId);
      setRoom(data);
    } catch (err) {
      console.error('Failed to load room:', err);
    }
  };

  const loadMessages = async () => {
    try {
      const data = await api.getRoomMessages(roomId);
      setMessages(data);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const connectSocket = () => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      const currentUser = user || JSON.parse(localStorage.getItem('user'));
      newSocket.emit('join_room', {
        roomId,
        userId: currentUser.id,
        userName: `${currentUser.firstName} ${currentUser.lastName}`
      });
    });

    newSocket.on('new_message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    newSocket.on('user_joined', (data) => {
      console.log(`${data.userName} joined`);
    });

    newSocket.on('user_typing', (data) => {
      setTyping(data.userName);
      setTimeout(() => setTyping(null), 3000);
    });

    newSocket.on('user_stopped_typing', () => {
      setTyping(null);
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
      content: inputMessage
    });

    setInputMessage('');
  };

  const handleTyping = () => {
    const currentUser = user || JSON.parse(localStorage.getItem('user'));
    if (socket) {
      socket.emit('typing', {
        roomId,
        userName: `${currentUser.firstName} ${currentUser.lastName}`
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

  if (!room) {
    return <div style={styles.loading}>Loading room...</div>;
  }

  const currentUser = user || JSON.parse(localStorage.getItem('user'));

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2>{room.className}</h2>
          <p style={styles.subtitle}>Class Code: {room.classCode}</p>
        </div>
        <div style={styles.participants}>
          {room.participants?.map((p) => (
            <span key={p.id} style={styles.participant}>
              {p.firstName} {p.lastName}
              {p.role === 'teacher' && ' 👨‍🏫'}
            </span>
          ))}
        </div>
      </div>

      <div style={styles.messagesContainer}>
        <div style={styles.messages}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                ...styles.message,
                ...(msg.senderId === currentUser?.id ? styles.myMessage : styles.otherMessage)
              }}
            >
              <div style={styles.messageHeader}>
                <strong>{msg.firstName} {msg.lastName}</strong>
                {msg.role === 'teacher' && <span style={styles.badge}>Teacher</span>}
                <span style={styles.time}>{formatTime(msg.createdAt)}</span>
              </div>
              <div style={styles.messageContent}>{msg.content}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

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
          placeholder="Type a message..."
          style={styles.input}
        />
        <button type="submit" style={styles.sendButton}>Send</button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: '#f5f5f5'
  },
  header: {
    background: 'white',
    padding: '20px 30px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    margin: '5px 0 0 0'
  },
  participants: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
  },
  participant: {
    background: '#e9ecef',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '14px'
  },
  messagesContainer: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative'
  },
  messages: {
    height: '100%',
    overflowY: 'auto',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  message: {
    maxWidth: '70%',
    padding: '12px 16px',
    borderRadius: '12px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
  },
  myMessage: {
    alignSelf: 'flex-end',
    background: '#007bff',
    color: 'white'
  },
  otherMessage: {
    alignSelf: 'flex-start',
    background: 'white'
  },
  messageHeader: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    marginBottom: '6px',
    fontSize: '13px',
    opacity: 0.9
  },
  badge: {
    background: 'rgba(0,0,0,0.1)',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '11px'
  },
  time: {
    fontSize: '11px',
    marginLeft: 'auto'
  },
  messageContent: {
    fontSize: '15px',
    lineHeight: '1.4'
  },
  typingIndicator: {
    position: 'absolute',
    bottom: '10px',
    left: '20px',
    fontSize: '13px',
    color: '#666',
    fontStyle: 'italic'
  },
  inputContainer: {
    background: 'white',
    padding: '20px',
    boxShadow: '0 -2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    gap: '10px'
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    border: '1px solid #ddd',
    borderRadius: '24px',
    fontSize: '15px',
    outline: 'none'
  },
  sendButton: {
    padding: '12px 30px',
    background: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '24px',
    fontSize: '15px',
    cursor: 'pointer',
    fontWeight: '600'
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '20px'
  }
};
