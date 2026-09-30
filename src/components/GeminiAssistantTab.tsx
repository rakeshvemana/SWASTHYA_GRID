import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  CheckCircle,
  Compass,
  Copy,
  Globe,
  Languages,
  Mic,
  MicOff,
  Radio,
  RefreshCw,
  Send,
  Sparkles,
  Terminal,
  User,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { LanguageCode } from '../types';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  modelUsed?: string;
  toolLogs?: Array<{
    toolName: string;
    arguments: any;
    outputSummary: any;
  }>;
}

interface GeminiAssistantTabProps {
  currentLanguage: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  onOpenLiveVoice?: () => void;
  onOpenSearchGrounding?: () => void;
  onOpenMapsGrounding?: () => void;
  onOpenAudioTranscribe?: () => void;
  externalInputText?: string;
  onClearExternalInput?: () => void;
}

export const GeminiAssistantTab: React.FC<GeminiAssistantTabProps> = ({
  currentLanguage,
  onLanguageChange,
  onOpenLiveVoice,
  onOpenSearchGrounding,
  onOpenMapsGrounding,
  onOpenAudioTranscribe,
  externalInputText,
  onClearExternalInput,
}) => {
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.5-flash');
  const [selectedRole, setSelectedRole] = useState<string>('LOGISTICS_COORDINATOR');

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-welcome',
      sender: 'assistant',
      text: 'Namaste! I am your SwasthyaGrid AI Operations Assistant. I monitor real-time stock-out risks across all primary health centres, taluk hospitals, and district hospitals in Karnataka. I execute operational tools directly against verified databases and optimize safe resource transfers. How can I assist your health administration today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'gemini-3.5-flash',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (externalInputText) {
      setInputValue(externalInputText);
      onClearExternalInput?.();
    }
  }, [externalInputText]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Voice speech-to-text setup
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      if (currentLanguage === 'kn') recognition.lang = 'kn-IN';
      else if (currentLanguage === 'hi') recognition.lang = 'hi-IN';
      else recognition.lang = 'en-IN';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
    }
  }, [currentLanguage]);

  const toggleVoiceListening = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported by your browser. Please type your query.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputValue;
    if (!query.trim() || isLoading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const historyPayload = messages.slice(-8).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        text: m.text,
      }));
      historyPayload.push({ role: 'user', text: query });

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          language: currentLanguage,
          model: selectedModel,
          role: selectedRole,
          conversationHistory: historyPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to retrieve response from assistant.');
      }

      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolLogs: data.toolLogs,
        modelUsed: selectedModel,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `Error processing request: ${err.message || 'System temporarily unavailable. Please retry.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayAudio = async (text: string) => {
    if (isPlayingAudio) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      window.speechSynthesis?.cancel();
      setIsPlayingAudio(false);
      return;
    }

    try {
      setIsPlayingAudio(true);
      const res = await fetch('/api/gemini/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language: currentLanguage }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          const audio = new Audio(`data:${data.mimeType};base64,${data.audioBase64}`);
          audioRef.current = audio;
          audio.onended = () => setIsPlayingAudio(false);
          audio.onerror = () => setIsPlayingAudio(false);
          await audio.play();
          return;
        }
      }

      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text.slice(0, 300));
        if (currentLanguage === 'hi') utterance.lang = 'hi-IN';
        else if (currentLanguage === 'kn') utterance.lang = 'kn-IN';
        else utterance.lang = 'en-IN';

        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(utterance);
      } else {
        setIsPlayingAudio(false);
      }
    } catch {
      setIsPlayingAudio(false);
    }
  };

  const samplePrompts = [
    'Which facilities may run out of essential medicines in the next 7 days?',
    'Why is Hoskote CHC marked as Critical risk for Snake Venom Antiserum?',
    'Find nearby facilities that can safely donate Insulin to Vijayapura PHC.',
    'Summarize the healthcare capacity and shortages in Ramanagara district.',
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner with Model Switcher & Tool Shortcuts */}
      <div className="rounded-xl border border-indigo-950/70 bg-[#0d1326]/90 p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Gemini Multi-Turn Operations Assistant
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-400 max-w-2xl leading-relaxed">
              Maintains full conversational thread context with 5 backend operational function declarations
              and grounded Google Gemini models.
            </p>
          </div>

          {/* Model Switcher and Role Controls */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 rounded-lg border border-indigo-950/80 bg-[#090d1a] px-2.5 py-1.5">
              <span className="text-slate-400 text-[11px]">Model:</span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-transparent font-medium text-indigo-300 focus:outline-none cursor-pointer"
                title="Select Gemini Model Tier"
              >
                <option value="gemini-3.5-flash" className="bg-[#0b1020] text-white">
                  gemini-3.5-flash (Standard)
                </option>
                <option value="gemini-3.1-flash-lite" className="bg-[#0b1020] text-white">
                  gemini-3.1-flash-lite (Fast)
                </option>
                <option value="gemini-3.8-flash" className="bg-[#0b1020] text-white">
                  gemini-3.8-flash (Complex)
                </option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 rounded-lg border border-indigo-950/80 bg-[#090d1a] px-2.5 py-1.5">
              <span className="text-slate-400 text-[11px]">Role:</span>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="bg-transparent font-medium text-emerald-300 focus:outline-none cursor-pointer"
              >
                <option value="LOGISTICS_COORDINATOR" className="bg-[#0b1020] text-white">
                  Logistics Coordinator
                </option>
                <option value="OUTBREAK_SPECIALIST" className="bg-[#0b1020] text-white">
                  Epidemic Specialist
                </option>
                <option value="EMERGENCY_DISPATCHER" className="bg-[#0b1020] text-white">
                  Emergency Dispatcher
                </option>
              </select>
            </div>

            {onOpenLiveVoice && (
              <button
                onClick={onOpenLiveVoice}
                className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 px-3 py-1.5 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
                title="Open Live Voice Conversation (gemini-3.8-live)"
              >
                <Radio className="h-3 w-3" />
                <span>Live Audio</span>
              </button>
            )}
          </div>
        </div>

        {/* Feature quick links */}
        <div className="mt-3.5 flex flex-wrap items-center gap-2 pt-3 border-t border-indigo-950 text-[11px]">
          <span className="text-slate-400">Integrated Grounding:</span>
          {onOpenSearchGrounding && (
            <button
              onClick={onOpenSearchGrounding}
              className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
            >
              <Globe className="h-3 w-3" />
              <span>Google Search Grounding</span>
            </button>
          )}
          <span aria-hidden="true" className="text-slate-600">&middot;</span>
          {onOpenMapsGrounding && (
            <button
              onClick={onOpenMapsGrounding}
              className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
            >
              <Compass className="h-3 w-3" />
              <span>Google Maps Routing</span>
            </button>
          )}
          <span aria-hidden="true" className="text-slate-600">&middot;</span>
          {onOpenAudioTranscribe && (
            <button
              onClick={onOpenAudioTranscribe}
              className="flex items-center gap-1 text-teal-400 hover:text-teal-300 transition cursor-pointer"
            >
              <Mic className="h-3 w-3" />
              <span>Audio Transcription</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex flex-col h-[600px] rounded-xl border border-indigo-950/70 bg-[#0d1326]/90 shadow-sm overflow-hidden">
        {/* Chat History Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    isUser
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white'
                      : 'bg-[#090d1a] border border-indigo-950 text-indigo-400'
                  }`}
                >
                  {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>

                {/* Message Body */}
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-xl p-4 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-tr-none shadow-xs'
                      : 'bg-[#090d1a] border border-indigo-950/80 text-slate-200 rounded-tl-none shadow-xs'
                  }`}
                >
                  {/* Model Tag */}
                  {!isUser && msg.modelUsed && (
                    <div className="mb-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>Model: {msg.modelUsed}</span>
                    </div>
                  )}

                  {/* Tool Call Log Badges */}
                  {msg.toolLogs && msg.toolLogs.length > 0 && (
                    <div className="mb-3 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-bold">
                        <Terminal className="h-3 w-3" />
                        <span>Backend Operational Tool Execution:</span>
                      </div>
                      {msg.toolLogs.map((log, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg bg-[#070a13] border border-indigo-900/50 p-2 font-mono text-[11px] text-indigo-200"
                        >
                          <div className="flex items-center justify-between text-indigo-300 font-bold">
                            <span>⚡ {log.toolName}()</span>
                            <span className="text-[10px] text-emerald-400 font-semibold">&check; VERIFIED</span>
                          </div>
                          <div className="mt-1 text-[10px] text-slate-400 truncate">
                            Args: {JSON.stringify(log.arguments)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Text Content */}
                  <div className="whitespace-pre-wrap">{msg.text}</div>

                  {/* Message Footer: Timestamp & Audio Readout */}
                  <div
                    className={`mt-2 flex items-center justify-between text-[10px] ${
                      isUser ? 'text-indigo-200' : 'text-slate-400'
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    {!isUser && (
                      <button
                        onClick={() => handlePlayAudio(msg.text)}
                        className="flex items-center gap-1 hover:text-white transition cursor-pointer"
                        title="Read aloud using voice synthesis"
                      >
                        {isPlayingAudio ? (
                          <>
                            <VolumeX className="h-3.5 w-3.5 text-rose-400" />
                            <span>Stop</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="h-3.5 w-3.5 text-indigo-400" />
                            <span>Listen</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#090d1a] border border-indigo-950 text-indigo-400">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-xl rounded-tl-none bg-[#090d1a] border border-indigo-950/80 p-4 text-xs text-slate-400 flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-indigo-400" />
                <span>Evaluating inventory models & checking facility constraints...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Buttons */}
        <div className="border-t border-indigo-950 bg-[#0a0e1c] px-4 py-2.5 overflow-x-auto whitespace-nowrap">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Suggested:
            </span>
            {samplePrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                disabled={isLoading}
                className="shrink-0 rounded-lg border border-indigo-950 bg-[#090d1a] px-3 py-1 text-[11px] text-slate-300 hover:border-indigo-800/60 hover:text-white transition cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="border-t border-indigo-950 bg-[#070a13] p-3 sm:p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            {/* Voice Input Button */}
            <button
              type="button"
              onClick={toggleVoiceListening}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition cursor-pointer ${
                isListening
                  ? 'border-rose-500 bg-rose-600 text-white animate-pulse'
                  : 'border-indigo-950 bg-[#090d1a] text-slate-400 hover:border-indigo-800 hover:text-white'
              }`}
              title={isListening ? 'Stop listening' : 'Speak your query (Speech to Text)'}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>

            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                isListening
                  ? 'Listening to speech... speak now...'
                  : currentLanguage === 'kn'
                  ? 'ಕನ್ನಡದಲ್ಲಿ ಪ್ರಶ್ನೆಯನ್ನು ಬರೆಯಿರಿ ಅಥವಾ ಕೇಳಿ...'
                  : currentLanguage === 'hi'
                  ? 'हिंदी में प्रश्न पूछें...'
                  : 'Ask about medicine shortages, donor facilities, bed availability...'
              }
              disabled={isLoading}
              className="flex-1 rounded-lg border border-indigo-950 bg-[#090d1a] px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />

            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 text-white hover:from-indigo-500 hover:to-indigo-400 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
