import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Radio, Volume2, X, Zap } from 'lucide-react';

interface LiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LiveVoiceModal: React.FC<LiveVoiceModalProps> = ({ isOpen, onClose }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [isModelSpeaking, setIsModelSpeaking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      cleanup();
    }
  }, [isOpen]);

  const cleanup = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close().catch(() => {});
      outputAudioCtxRef.current = null;
    }
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    setIsConnected(false);
    setIsTalking(false);
    setIsModelSpeaking(false);
    setErrorMessage(null);
  };

  const startSession = async () => {
    try {
      setErrorMessage(null);
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
      });
      outputAudioCtxRef.current = outputCtx;

      ws.onopen = async () => {
        setIsConnected(true);
        // Start capturing microphone at 16kHz
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = stream;

          const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
            sampleRate: 16000,
          });
          audioContextRef.current = inputCtx;

          const source = inputCtx.createMediaStreamSource(stream);
          const processor = inputCtx.createScriptProcessor(4096, 1, 1);
          processorRef.current = processor;

          source.connect(processor);
          processor.connect(inputCtx.destination);

          processor.onaudioprocess = (e) => {
            if (ws.readyState === WebSocket.OPEN) {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcm16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                const s = Math.max(-1, Math.min(1, inputData[i]));
                pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
              }

              // Base64 encode PCM16
              let binary = '';
              const bytes = new Uint8Array(pcm16.buffer);
              for (let i = 0; i < bytes.length; i++) {
                binary += String.fromCharCode(bytes[i]);
              }
              const base64Audio = btoa(binary);

              ws.send(JSON.stringify({ audio: base64Audio }));
              setIsTalking(true);
            }
          };
        } catch (micErr: any) {
          setErrorMessage('Microphone access denied or unavailable: ' + micErr.message);
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.error) {
            setErrorMessage(msg.error);
            return;
          }
          if (msg.interrupted) {
            audioQueueRef.current = [];
            setIsModelSpeaking(false);
          }
          if (msg.audio) {
            playRawPCM(msg.audio);
          }
        } catch (e) {
          console.warn('[Live] Error parsing server message:', e);
        }
      };

      ws.onerror = () => {
        setErrorMessage('Unable to connect to Live API session.');
        setIsConnected(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
      };
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to start Live session');
      setIsConnected(false);
    }
  };

  const playRawPCM = (base64Audio: string) => {
    try {
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      audioQueueRef.current.push(float32Array);
      if (!isPlayingRef.current) {
        playNextQueueChunk();
      }
    } catch (err) {
      console.warn('[Live] Error decoding PCM audio chunk:', err);
    }
  };

  const playNextQueueChunk = () => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      setIsModelSpeaking(false);
      return;
    }

    const chunk = audioQueueRef.current.shift()!;
    isPlayingRef.current = true;
    setIsModelSpeaking(true);

    const ctx = outputAudioCtxRef.current;
    if (!ctx) return;

    const buffer = ctx.createBuffer(1, chunk.length, 24000);
    buffer.getChannelData(0).set(chunk);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.onended = () => {
      playNextQueueChunk();
    };
    source.start();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-xl border border-indigo-900/60 bg-[#0d1326] p-6 shadow-2xl text-left">
        <div className="flex items-center justify-between pb-3.5 border-b border-indigo-950">
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-indigo-400" />
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                Gemini 3.8 Live Voice Dispatcher
              </h3>
              <p className="text-[11px] text-indigo-300 mt-0.5">
                Bidirectional Low-Latency Real-Time Audio (Live API)
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              cleanup();
              onClose();
            }}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 rounded-lg bg-rose-950/80 border border-rose-800 p-3 text-xs text-rose-300">
            {errorMessage}
          </div>
        )}

        {/* Visualizer & Animation */}
        <div className="my-8 flex flex-col items-center justify-center">
          <div
            className={`relative flex h-32 w-32 items-center justify-center rounded-full transition-all duration-300 ${
              isModelSpeaking
                ? 'bg-indigo-500/20 ring-4 ring-indigo-400 shadow-xl shadow-indigo-500/40'
                : isTalking
                ? 'bg-emerald-500/20 ring-4 ring-emerald-400 shadow-xl shadow-emerald-500/40'
                : isConnected
                ? 'bg-[#080c18] ring-2 ring-indigo-950'
                : 'bg-[#080c18] ring-1 ring-slate-800'
            }`}
          >
            {isModelSpeaking ? (
              <Volume2 className="h-12 w-12 text-indigo-400 animate-bounce" />
            ) : isConnected ? (
              <Mic className="h-12 w-12 text-emerald-400 animate-pulse" />
            ) : (
              <MicOff className="h-12 w-12 text-slate-600" />
            )}

            {/* Aura */}
            {isConnected && (
              <span className="absolute -inset-2 rounded-full border border-indigo-500/30 animate-ping opacity-30" />
            )}
          </div>

          <div className="mt-4 text-center">
            <span
              className={`inline-block rounded-md px-3 py-1 text-xs font-semibold ${
                isModelSpeaking
                  ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                  : isConnected
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}
            >
              {isModelSpeaking
                ? 'Dispatcher is Speaking (24kHz PCM)...'
                : isConnected
                ? 'Listening to Microphone (16kHz PCM)...'
                : 'Disconnected'}
            </span>
            <p className="mt-2 text-xs text-slate-400 max-w-xs leading-relaxed">
              Speak naturally about hospital stockouts, transfer routes, or emergency medicine requirements.
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 pt-3 border-t border-indigo-950">
          {!isConnected ? (
            <button
              onClick={startSession}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 px-6 py-2.5 text-xs font-semibold text-white shadow-sm transition cursor-pointer"
            >
              <Zap className="h-4 w-4" />
              <span>Connect Live API Session</span>
            </button>
          ) : (
            <button
              onClick={cleanup}
              className="rounded-lg bg-rose-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-rose-500 transition cursor-pointer"
            >
              End Voice Session
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
