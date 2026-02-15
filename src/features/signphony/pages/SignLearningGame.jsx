/**
 * Sign Learning Game Page
 * TODO: Import GameApp.jsx from signphony/static/components/
 */

import React from 'react';
import { useSignphony } from '../hooks/useSignphony';
import { useWebSocket } from '../hooks/useWebSocket';

const SignLearningGame = () => {
  const { api } = useSignphony();
  const socket = useWebSocket();

  return (
    <div className="sign-learning-game">
      <h1>Sign Learning Game</h1>
      <p>TODO: Copy GameApp.jsx component from signphony/static/</p>
      <p>WebSocket: {socket.connected ? '✅ Connected' : '❌ Disconnected'}</p>

      {/* TODO: Replace with actual GameApp component */}
      {/* <GameApp api={api} socket={socket} /> */}
    </div>
  );
};

export default SignLearningGame;
