// /hooks/useVoiceRecorder.js
import { useState, useRef } from "react";

export default function useVoiceRecorder({ silenceDuration = 4000, onStop }) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const silenceTimeoutRef = useRef(null);

  const handleSilence = () => {
    if (isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    const processor = audioContext.createScriptProcessor(2048, 1, 1);

    source.connect(analyser);
    analyser.connect(processor);
    processor.connect(audioContext.destination);

    mediaRecorderRef.current = new MediaRecorder(stream);
    chunksRef.current = [];

    mediaRecorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      onStop && onStop(blob);
    };

    processor.onaudioprocess = () => {
      const buffer = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(buffer);
      const volume = buffer.reduce((a, b) => a + b, 0) / buffer.length;

      if (volume < 10) {
        if (!silenceTimeoutRef.current) {
          silenceTimeoutRef.current = setTimeout(handleSilence, silenceDuration);
        }
      } else {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
    };

    mediaRecorderRef.current.start();
    setIsRecording(true);
  };

  return { start, isRecording };
}
