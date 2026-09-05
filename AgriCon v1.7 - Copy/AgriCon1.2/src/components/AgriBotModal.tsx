import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Mic,
  MicOff,
  Sparkles,
  RefreshCw,
  CheckCheck,
  Bot,
  CornerDownLeft,
} from 'lucide-react';
import { EveRobotIcon } from './EveRobotIcon';
import { ReadAloudButton } from './ReadAloudButton';

interface AgriBotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  isVoice?: boolean;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'msg-1',
    sender: 'bot',
    text: "Hello Alex! I'm your Agricon AI Agronomist. I'm connected to your Sector 7G drone telemetry, live weather sensors, and soil moisture probes. How can I assist your farm today?",
    timestamp: '10:14 AM',
  },
];

const SUGGESTED_QUERIES = [
  '🌽 Best NPK ratio for maize V4 stage?',
  '🌤️ Is current wind safe for foliar spray?',
  '🐛 How to control Fall Armyworm larvae?',
  '💧 Water requirement for soybeans (22d)?',
  '🛰️ What does the 0.78 NDVI score mean?',
];

export const AgriBotModal: React.FC<AgriBotModalProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [listeningStatus, setListeningStatus] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        scrollToBottom();
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, messages, isTyping]);

  // Clean up speech recognition on unmount or close
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
    };
  }, []);

  if (!isOpen) return null;

  // Toggle Voice Dictation using Web Speech API with seamless fallback
  const toggleVoiceDictation = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      setIsListening(false);
      setListeningStatus('');
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
          setListeningStatus('Listening to your voice...');
        };

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setInputText(transcript);
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition notice:', event.error);
          setIsListening(false);
          setListeningStatus('');
        };

        recognition.onend = () => {
          setIsListening(false);
          setListeningStatus('');
        };

        recognition.start();
      } catch (err) {
        console.warn('Speech recognition start failed, using demo fallback:', err);
        fallbackSimulatedVoice();
      }
    } else {
      fallbackSimulatedVoice();
    }
  };

  const fallbackSimulatedVoice = () => {
    setIsListening(true);
    setListeningStatus('Dictating voice input...');
    const samples = [
      "What is the recommended pesticide dosage for corn armyworm?",
      "Check current spray window suitability for Sector 7G.",
      "Calculate top-dress fertilizer for 5 acres of wheat.",
      "Show NDVI health status for my active crop plots."
    ];
    const picked = samples[Math.floor(Math.random() * samples.length)];
    
    let currentIdx = 0;
    const interval = setInterval(() => {
      currentIdx += 4;
      setInputText(picked.slice(0, currentIdx));
      if (currentIdx >= picked.length) {
        clearInterval(interval);
        setTimeout(() => {
          setIsListening(false);
          setListeningStatus('');
        }, 500);
      }
    }, 45);
  };

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      setIsListening(false);
      setListeningStatus('');
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: timeStr,
      isVoice: !textToSend && isListening,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    // Contextual Agronomy AI Response generator
    setTimeout(() => {
      const qLower = query.toLowerCase();
      let response =
        "Based on your Sector 7G multispectral telemetry, your crop health index is 88% (Healthy vegetative growth). Soil moisture is stable at 45% and canopy temperature is 24°C. Let me know if you'd like a specific dosage plan or spray timing.";

      if (qLower.includes('armyworm') || qLower.includes('pest') || qLower.includes('bug')) {
        response =
          "🐛 **Fall Armyworm Management Protocol (Corn/Maize):**\n- **Threshold:** >5% plants with fresh whorl damage.\n- **Recommended Control:** Apply Chlorantraniliprole 18.5% SC @ 0.4 ml/L or Emamectin Benzoate 5% SG @ 0.5 g/L.\n- **Timing:** Early morning (06:30 - 09:30 AM) when larvae feed inside the leaf whorl.\n- **Drone Spray:** Target 25-30 L/acre with fine droplet setting.";
      } else if (
        qLower.includes('npk') ||
        qLower.includes('fertilizer') ||
        qLower.includes('urea') ||
        qLower.includes('dap')
      ) {
        response =
          "🌱 **NPK Fertilizer Recommendation:**\n- **Maize (Corn) at V4 Stage:** 120 kg N : 60 kg P₂O₅ : 40 kg K₂O per acre.\n- **Commercial Bag Ratio (50kg bags for 5 Acres):**\n  • DAP: 7 Bags (Basal application)\n  • Urea: 11 Bags (Split: 50% basal, 50% top-dress at 30 days)\n  • MOP: 3 Bags (At sowing/transplanting)";
      } else if (
        qLower.includes('spray') ||
        qLower.includes('wind') ||
        qLower.includes('weather') ||
        qLower.includes('window')
      ) {
        response =
          "🌤️ **Live Spray Index: 92% Optimal**\n- **Wind Speed:** 4.2 km/h NW (Well within safe limit < 12 km/h).\n- **Relative Humidity:** 45% (Optimal droplet drying curve).\n- **Optimal Window:** 06:00 AM – 11:30 AM today.\n- **Drift Risk:** Minimal. No rain forecast in Sector 7G for the next 48 hours.";
      } else if (qLower.includes('water') || qLower.includes('soybean') || qLower.includes('moisture')) {
        response =
          "💧 **Soybean Water Advisory (Day 22 / V2 Stage):**\n- **Current Root Moisture:** 24% (Moderate deficit on East Slope).\n- **Recommendation:** Provide 25–30 mm supplemental drip irrigation over the next 36 hours to promote secondary root nodulation.";
      } else if (qLower.includes('ndvi') || qLower.includes('drone') || qLower.includes('orthomosaic')) {
        response =
          "🛰️ **Multispectral Orthomosaic Analysis:**\n- **Sector 7G Mean NDVI:** 0.78 (Strong near-infrared reflectance).\n- **Canopy Density:** Uniform across 84% of the plot.\n- **Anomaly Note:** A minor 0.62 NDVI patch detected on the northeast boundary (likely slight nitrogen leaching due to slope drainage).";
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: response,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setIsTyping(false);
    }, 900);
  };

  const handleResetChat = () => {
    setMessages(INITIAL_MESSAGES);
    setInputText('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#f4f7f5] w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl border border-[#d8e8de] flex flex-col h-[90vh] sm:h-[680px] max-h-[720px] animate-in slide-in-from-bottom duration-300"
      >
        {/* ========================================================================= */}
        {/* CHAT HEADER WITH SPHERICAL ROBOT AVATAR */}
        {/* ========================================================================= */}
        <div className="p-4 bg-gradient-to-r from-[#012d1d] via-[#1b4332] to-[#012d1d] text-white flex items-center justify-between border-b border-[#2d6a4f] shrink-0">
          <div className="flex items-center gap-3">
            {/* Spherical Robot Avatar from screen.png */}
            <div className="w-12 h-12 rounded-full bg-[#081f15] p-1 flex items-center justify-center shadow-md relative border border-[#38bdf8]/50 overflow-hidden">
              <EveRobotIcon className="w-full h-full object-contain" />
              {/* Online indicator dot */}
              <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-[#38bdf8] rounded-full ring-2 ring-[#012d1d] flex items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white tracking-tight">
                  AgriBot AI Agronomist
                </h3>
                <span className="bg-[#a7e3b8]/20 text-[#a7e3b8] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#a7e3b8]/30">
                  Online
                </span>
              </div>
              <p className="text-xs text-[#a7e3b8] font-medium flex items-center gap-1 mt-0.5">
                <Sparkles className="w-3 h-3 text-[#38bdf8]" />
                <span>Sector 7G Intelligence • Multilingual Agronomy</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Dedicated 🔊 Read Aloud speaker button in chat header */}
            <ReadAloudButton
              text={
                messages.filter((m) => m.sender === 'bot').slice(-1)[0]?.text ||
                'AgriBot AI Agronomist is online and ready to assist your farm.'
              }
              label="Read Aloud"
              className="bg-[#0b3824] hover:bg-[#144930] text-[#a7e3b8] border-[#a7e3b8]/40 hover:border-[#a7e3b8] py-1 px-2.5 text-[11px]"
            />
            <button
              onClick={handleResetChat}
              title="Clear conversation"
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SCROLLABLE MESSAGE HISTORY AREA */}
        {/* User = Light Green (#d8f3dc) | AI = Crisp White (#ffffff) */}
        {/* ========================================================================= */}
        <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 bg-[#f2f7f4] no-scrollbar">
          {/* Intro Badge */}
          <div className="flex justify-center my-1">
            <span className="text-[11px] font-bold text-[#52796f] bg-white/80 px-3 py-1 rounded-full border border-[#d8e8de] shadow-2xs">
              Today • Real-time Agronomy Advisory
            </span>
          </div>

          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${
                m.sender === 'user' ? 'items-end' : 'items-start'
              } animate-in fade-in slide-in-from-bottom-1 duration-200`}
            >
              <div
                className={`flex items-end gap-2.5 max-w-[88%] sm:max-w-[82%] ${
                  m.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* AI Avatar next to AI Responses */}
                {m.sender === 'bot' && (
                  <div className="w-8 h-8 rounded-full bg-[#081f15] p-0.5 shrink-0 shadow-sm border border-[#38bdf8]/40 overflow-hidden mb-1 flex items-center justify-center">
                    <EveRobotIcon className="w-full h-full object-contain" />
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`p-3.5 rounded-3xl text-xs sm:text-[13px] leading-relaxed shadow-[0_2px_8px_rgba(45,106,79,0.04)] ${
                    m.sender === 'user'
                      ? 'bg-[#d8f3dc] text-[#012d1d] font-semibold rounded-br-xs border border-[#a7e3b8]'
                      : 'bg-white text-[#012d1d] rounded-bl-xs border border-[#d8e8de]'
                  }`}
                >
                  <div className="whitespace-pre-line break-words">{m.text}</div>
                </div>
              </div>

              {/* Timestamp & metadata with Read Aloud trigger */}
              <div
                className={`flex items-center gap-2 text-[10px] text-[#717973] font-medium mt-1 px-1.5 ${
                  m.sender === 'user' ? 'pr-1' : 'pl-11'
                }`}
              >
                <span>{m.timestamp}</span>
                {m.sender === 'user' && (
                  <CheckCheck className="w-3 h-3 text-[#2d6a4f]" />
                )}
                {m.sender === 'bot' && (
                  <ReadAloudButton
                    text={m.text}
                    variant="compact"
                    label="Read Aloud"
                    className="py-0.5 px-2 text-[10px]"
                  />
                )}
              </div>
            </div>
          ))}

          {/* Typing Indicator with AI Spherical Avatar */}
          {isTyping && (
            <div className="flex items-end gap-2.5 animate-in fade-in duration-200">
              <div className="w-8 h-8 rounded-full bg-[#081f15] p-0.5 shrink-0 shadow-sm border border-[#38bdf8]/40 overflow-hidden flex items-center justify-center">
                <EveRobotIcon className="w-full h-full object-contain" />
              </div>
              <div className="p-3 bg-white rounded-2xl rounded-bl-xs border border-[#d8e8de] flex items-center gap-2 shadow-xs">
                <span className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#2d6a4f] animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 rounded-full bg-[#2d6a4f] animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 rounded-full bg-[#2d6a4f] animate-bounce" />
                </span>
                <span className="text-xs font-bold text-[#52796f]">
                  AgriBot is analyzing crop telemetry...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ========================================================================= */}
        {/* PRESET PROMPT PILLS CAROUSEL */}
        {/* ========================================================================= */}
        <div className="px-3.5 py-2 bg-white/90 border-t border-[#d8e8de] flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#52796f] shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#2d6a4f]" />
            <span>Quick:</span>
          </span>
          {SUGGESTED_QUERIES.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(prompt)}
              className="shrink-0 text-[11px] bg-[#eef7f2] hover:bg-[#d8f3dc] text-[#1b4332] font-bold px-3 py-1.5 rounded-full border border-[#a7e3b8] transition-all active:scale-95 whitespace-nowrap cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Voice Listening Active Status Banner */}
        {isListening && (
          <div className="px-4 py-2 bg-[#d8f3dc] border-t border-[#a7e3b8] flex items-center justify-between animate-in fade-in duration-200 shrink-0">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
              </span>
              <span className="text-xs font-extrabold text-[#012d1d]">
                {listeningStatus || 'Listening... speak clearly'}
              </span>
            </div>
            <button
              type="button"
              onClick={toggleVoiceDictation}
              className="text-xs font-bold text-red-700 hover:text-red-900 underline cursor-pointer"
            >
              Stop
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CHAT INPUT FOOTER: INPUT FIELD + PROMINENT MIC BUTTON + SEND BUTTON */}
        {/* ========================================================================= */}
        <div className="p-3.5 bg-white border-t border-[#d8e8de] flex items-center gap-2 shrink-0 shadow-lg">
          {/* Prominent Microphone Voice Dictation Button */}
          <button
            type="button"
            onClick={toggleVoiceDictation}
            title={isListening ? 'Stop voice recording' : 'Dictate with Microphone'}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0 border ${
              isListening
                ? 'bg-red-500 text-white border-red-600 shadow-md animate-pulse'
                : 'bg-[#e8f5ed] hover:bg-[#d8f3dc] text-[#1b4332] border-[#a7e3b8] hover:border-[#2d6a4f]'
            }`}
          >
            {isListening ? (
              <MicOff className="w-5 h-5 text-white" />
            ) : (
              <Mic className="w-5 h-5 text-[#2d6a4f]" />
            )}
          </button>

          {/* Text Input Field */}
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              placeholder={isListening ? 'Listening to voice...' : 'Ask AgriBot about crops, pests, soil, fertilizers...'}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="w-full text-xs sm:text-sm bg-[#f3f9f5] border-2 border-[#d8e8de] focus:border-[#2d6a4f] rounded-2xl pl-3.5 pr-8 py-3 text-[#012d1d] placeholder:text-[#52796f] focus:outline-none transition-colors font-medium"
            />
            {inputText && (
              <button
                type="button"
                onClick={() => setInputText('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#52796f] hover:text-[#012d1d] p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Prominent Send Button */}
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!inputText.trim()}
            title="Send message"
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all active:scale-95 shrink-0 shadow-sm cursor-pointer ${
              inputText.trim()
                ? 'bg-[#2d6a4f] hover:bg-[#1b4332] text-white shadow-md'
                : 'bg-[#e2e8e4] text-[#8fa89b] cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};
