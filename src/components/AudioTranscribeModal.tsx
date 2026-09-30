import React, { useState, useRef } from 'react';
import { Check, Copy, Mic, MicOff, RefreshCw, Send, Square, Volume2, X } from 'lucide-react';

interface AudioTranscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertToChat?: (text: string) => void;
}

export const AudioTranscribeModal: React.FC<AudioTranscribeModalProps> = ({
  isOpen,
  onClose,
  onInsertToChat,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribedText, setTranscribedText] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  if (!isOpen) return null;

  const startRecording = async () => {
    try {
      setErrorMessage(null);
      setTranscribedText('');
      setRecordedBlob(null);
      setAudioUrl(null);
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      setErrorMessage('Microphone access denied: ' + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleTranscribe = async () => {
    if (!recordedBlob) return;
    setIsTranscribing(true);
    setErrorMessage(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(recordedBlob);
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        const res = await fetch('/api/gemini/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: base64Data,
            mimeType: 'audio/webm',
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to transcribe audio.');
        setTranscribedText(data.text);
      };
    } catch (err: any) {
      setErrorMessage(err.message || 'Transcription failed.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(transcribedText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-xl border border-indigo-900/60 bg-[#0d1326] p-6 shadow-2xl text-left">
        <div className="flex items-center justify-between pb-3.5 border-b border-indigo-950">
          <div className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-indigo-400" />
            <div>
              <h3 className="text-base font-bold text-white">Audio Transcription</h3>
              <p className="text-[11px] text-indigo-300 font-mono">Model: gemini-3.5-transcribe</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-3.5 rounded-lg bg-rose-950/80 border border-rose-800 p-2.5 text-xs text-rose-300">
            {errorMessage}
          </div>
        )}

        {/* Recorder Box */}
        <div className="mt-5 flex flex-col items-center justify-center rounded-xl bg-[#080c18] p-6 border border-indigo-950">
          {isRecording ? (
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-600 animate-pulse text-white">
                <Square className="h-8 w-8" />
              </div>
              <span className="text-xs font-semibold text-rose-400 animate-pulse">
                Recording audio... Speak your message
              </span>
              <button
                onClick={stopRecording}
                className="mt-2 rounded-lg bg-rose-600 hover:bg-rose-500 px-4 py-1.5 text-xs font-bold text-white transition cursor-pointer"
              >
                Stop Recording
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={startRecording}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-lg transition cursor-pointer"
              >
                <Mic className="h-8 w-8" />
              </button>
              <span className="text-xs text-slate-300">
                Click microphone to record medical notes or emergency voice dispatch
              </span>
            </div>
          )}

          {audioUrl && !isRecording && (
            <div className="mt-4 w-full flex flex-col items-center gap-2">
              <audio src={audioUrl} controls className="w-full max-w-xs h-9" />
              <button
                onClick={handleTranscribe}
                disabled={isTranscribing}
                className="mt-2 flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isTranscribing ? 'animate-spin' : ''}`} />
                <span>{isTranscribing ? 'Transcribing with Gemini 3.5...' : 'Transcribe Recording'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Transcription Output */}
        {transcribedText && (
          <div className="mt-4 rounded-xl border border-indigo-950 bg-[#080c18] p-4">
            <div className="flex items-center justify-between pb-2 border-b border-indigo-950 text-xs">
              <span className="font-semibold text-indigo-400">Transcribed Text:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white"
                >
                  {isCopied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{isCopied ? 'Copied' : 'Copy'}</span>
                </button>
                {onInsertToChat && (
                  <button
                    onClick={() => {
                      onInsertToChat(transcribedText);
                      onClose();
                    }}
                    className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300"
                  >
                    <Send className="h-3 w-3" />
                    <span>Send to Chat</span>
                  </button>
                )}
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
              {transcribedText}
            </p>
          </div>
        )}

        <div className="mt-5 pt-3.5 border-t border-indigo-950 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border border-indigo-950 bg-[#080c18] px-4 py-1.5 text-xs font-medium text-slate-300 hover:bg-[#121832] cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
