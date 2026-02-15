/**
 * WebSocket Hook for Signphony
 * Manages SocketIO connection for real-time pose detection and scoring
 */

import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_SIGNPHONY_API_URL || 'http://localhost:8000';

export function useWebSocket() {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    // Initialize socket connection
    const socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('WebSocket connected');
      setConnected(true);
    });

    socket.on('connected', (data) => {
      setSessionId(data.session_id);
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  // API methods
  const setReferencePoses = (poses, signId) => {
    if (socketRef.current) {
      socketRef.current.emit('set_reference_poses', { poses, sign_id: signId });
    }
  };

  const sendUserFrame = (frame) => {
    if (socketRef.current) {
      socketRef.current.emit('user_frame', { frame });
    }
  };

  const processSign = (frames, signId) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current) {
        reject(new Error('Socket not connected'));
        return;
      }

      // Listen for score result
      const scoreHandler = (data) => {
        socketRef.current.off('score_calculated', scoreHandler);
        resolve(data);
      };

      const errorHandler = (error) => {
        socketRef.current.off('error', errorHandler);
        reject(error);
      };

      socketRef.current.on('score_calculated', scoreHandler);
      socketRef.current.on('error', errorHandler);

      // Send request
      socketRef.current.emit('process_sign', { frames, sign_id: signId });
    });
  };

  const resetSession = () => {
    if (socketRef.current) {
      socketRef.current.emit('reset_session');
    }
  };

  const on = (event, handler) => {
    if (socketRef.current) {
      socketRef.current.on(event, handler);
    }
  };

  const off = (event, handler) => {
    if (socketRef.current) {
      socketRef.current.off(event, handler);
    }
  };

  return {
    connected,
    sessionId,
    setReferencePoses,
    sendUserFrame,
    processSign,
    resetSession,
    on,
    off,
  };
}

export default useWebSocket;
