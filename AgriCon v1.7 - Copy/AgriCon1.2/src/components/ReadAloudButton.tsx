import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Square } from 'lucide-react';

interface ReadAloudButtonProps {
  text: string;
  label?: string;
  className?: string;
  variant?: 'pill' | 'outline' | 'compact';
  lang?: string;
}

export const ReadAloudButton: React.FC<ReadAloudButtonProps> = ({
  text,
  label = 'Read Aloud',
  className = '',
  variant = 'pill',
  lang = 'en-US',
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Clean text from Markdown markers (stars, hashes, emojis) for natural voice cadence
  const sanitizeTextForSpeech = (rawText: string) => {
    return rawText
      .replace(/[#*_`~>-]/g, ' ')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // strip emojis for clearer speech
      .replace(/\s+/g, ' ')
      .trim();
  };

  const stopSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const handleToggleSpeak = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      stopSpeech();
      return;
    }

    // Stop any ongoing speech
    window.speechSynthesis.cancel();

    const cleanText = sanitizeTextForSpeech(text);
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utteranceRef.current = utterance;
    utterance.lang = lang;
    utterance.rate = 0.95; // Slightly slower for crisp agronomic clarity
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = (event) => {
      // 'canceled' or 'interrupted' errors are expected when user stops manually
      console.warn('SpeechSynthesis event:', event.error);
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={handleToggleSpeak}
        title={isSpeaking ? 'Stop Read Aloud' : 'Read Aloud'}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold transition-all active:scale-95 cursor-pointer ${
          isSpeaking
            ? 'bg-amber-100 text-amber-900 border border-amber-300'
            : 'bg-[#e8f5ed] hover:bg-[#d8f3dc] text-[#1b4332] border border-[#a7e3b8]'
        } ${className}`}
      >
        {isSpeaking ? (
          <>
            <Square className="w-3 h-3 fill-amber-800 text-amber-800" />
            <span>Stop</span>
          </>
        ) : (
          <>
            <Volume2 className="w-3 h-3 text-[#2d6a4f]" />
            <span>{label}</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggleSpeak}
      title={isSpeaking ? 'Stop speaking' : 'Read aloud this recommendation'}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold shadow-2xs transition-all active:scale-95 cursor-pointer ${
        isSpeaking
          ? 'bg-amber-100 text-amber-900 border border-amber-300 ring-2 ring-amber-300/60'
          : 'bg-[#e8f5ed] hover:bg-[#d8f3dc] text-[#1b4332] border border-[#a7e3b8] hover:border-[#2d6a4f]'
      } ${className}`}
    >
      {isSpeaking ? (
        <>
          <div className="flex items-center gap-0.5 mr-0.5">
            <span className="w-1 h-3 bg-amber-700 rounded-full animate-pulse" />
            <span className="w-1 h-4 bg-amber-700 rounded-full animate-pulse [animation-delay:0.15s]" />
            <span className="w-1 h-2 bg-amber-700 rounded-full animate-pulse [animation-delay:0.3s]" />
          </div>
          <Square className="w-3 h-3 fill-amber-900 text-amber-900" />
          <span>Stop Reading</span>
        </>
      ) : (
        <>
          <Volume2 className="w-3.5 h-3.5 text-[#2d6a4f]" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
};
