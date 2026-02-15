import { useState, useEffect, useRef } from 'react';
import { getCurrentBrand } from '../../config/brands';
import io from 'socket.io-client';

export default function SignGame() {
  const brand = getCurrentBrand();
  const [socket, setSocket] = useState(null);
  const [signs, setSigns] = useState([]);
  const [currentSign, setCurrentSign] = useState(null);
  const [score, setScore] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [stats, setStats] = useState(null);
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);

  // Connect to backend
  useEffect(() => {
    const newSocket = io(brand.wsUrl || 'http://localhost:5000', {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Connected to Sign Symposium backend');
    });

    newSocket.on('score_result', (data) => {
      setScore(data.score);
      setIsRecording(false);
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, [brand.wsUrl]);

  // Load signs
  useEffect(() => {
    fetch(`${brand.apiUrl}/api/signs`)
      .then(res => res.json())
      .then(data => {
        setSigns(data.signs || []);
        if (data.signs && data.signs.length > 0) {
          setCurrentSign(data.signs[0]);
        }
      })
      .catch(err => console.error('Failed to load signs:', err));
  }, [brand.apiUrl]);

  // Initialize webcam
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(mediaStream => {
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      })
      .catch(err => console.error('Webcam access denied:', err));

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = () => {
    if (!socket || !currentSign) return;
    setIsRecording(true);
    setScore(null);
    socket.emit('start_attempt', {
      sign_id: currentSign.id,
      user_id: 'demo_user'
    });
  };

  const stopRecording = () => {
    if (!socket) return;
    socket.emit('end_attempt');
  };

  const nextSign = () => {
    const currentIndex = signs.findIndex(s => s.id === currentSign?.id);
    const nextIndex = (currentIndex + 1) % signs.length;
    setCurrentSign(signs[nextIndex]);
    setScore(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: brand.primaryColor }}>
                {brand.name}
              </h1>
              <p className="text-gray-600 mt-1">AI-Powered Sign Language Learning</p>
            </div>
            {stats && (
              <div className="text-right">
                <div className="text-2xl font-bold" style={{ color: brand.primaryColor }}>
                  {stats.total_attempts}
                </div>
                <div className="text-sm text-gray-600">Total Attempts</div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Reference Video Panel */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4" style={{ color: brand.primaryColor }}>
              Learn: {currentSign?.word || 'Loading...'}
            </h2>

            {currentSign?.video_path ? (
              <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden mb-4">
                <video
                  src={`${brand.apiUrl}${currentSign.video_path}`}
                  controls
                  loop
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                <p className="text-gray-500">No reference video available</p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={nextSign}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Next Sign
              </button>
              <select
                value={currentSign?.id || ''}
                onChange={(e) => {
                  const sign = signs.find(s => s.id === parseInt(e.target.value));
                  setCurrentSign(sign);
                  setScore(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                {signs.map(sign => (
                  <option key={sign.id} value={sign.id}>
                    {sign.word}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* User Practice Panel */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4" style={{ color: brand.secondaryColor }}>
              Your Turn
            </h2>

            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden mb-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
            </div>

            {score !== null && (
              <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2" style={{
                    color: score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444'
                  }}>
                    {Math.round(score)}%
                  </div>
                  <div className="text-sm text-gray-600">
                    {score >= 80 ? '🎉 Excellent!' : score >= 60 ? '👍 Good job!' : '💪 Keep practicing!'}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  disabled={!currentSign}
                  className="flex-1 px-6 py-3 text-white rounded-lg font-semibold text-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: brand.primaryColor }}
                >
                  Start Recording
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg font-semibold text-lg hover:bg-red-600 transition-colors"
                >
                  Stop & Analyze
                </button>
              )}
            </div>

            {isRecording && (
              <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-full">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-red-700 font-medium">Recording...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sign Library */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4" style={{ color: brand.primaryColor }}>
            Sign Library ({signs.length} signs)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {signs.slice(0, 24).map(sign => (
              <button
                key={sign.id}
                onClick={() => {
                  setCurrentSign(sign);
                  setScore(null);
                }}
                className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                  currentSign?.id === sign.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <div className="text-sm font-medium text-gray-900">{sign.word}</div>
                <div className="text-xs text-gray-500 mt-1">{sign.category}</div>
              </button>
            ))}
          </div>
          {signs.length > 24 && (
            <div className="mt-4 text-center text-gray-600">
              + {signs.length - 24} more signs available
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
