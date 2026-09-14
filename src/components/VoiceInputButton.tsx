import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Check, Sparkles, Volume2, Globe } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import {
  parseSpokenNumber,
  parseSpokenPhone,
  parseSpokenEmail,
  cleanSpokenText,
} from '../utils/bengaliSpeechUtils';

export interface VoiceInputButtonProps {
  onTranscript: (parsedValue: string) => void;
  inputType?: 'text' | 'number' | 'currency' | 'phone' | 'email' | 'search';
  contextLabel?: string;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  title?: string;
  currentValue?: string;
  appendMode?: boolean;
}

// Subtle audio chime helper
const playBeep = (freq = 600, duration = 0.08) => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Ignore browser autoplay limitations
  }
};

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscript,
  inputType = 'text',
  contextLabel,
  size = 'sm',
  className = '',
  title,
  currentValue = '',
  appendMode = false,
}) => {
  const [lang, setLang] = useState<'bn-BD' | 'en-US'>('bn-BD');
  const [showListeningPopover, setShowListeningPopover] = useState(false);
  const [detectedPreview, setDetectedPreview] = useState<string>('');
  const timeoutRef = useRef<any>(null);

  const handleSpeechResult = useCallback(
    (rawText: string, isFinal: boolean) => {
      if (!rawText.trim()) return;

      let processed = rawText.trim();

      if (inputType === 'number' || inputType === 'currency') {
        const num = parseSpokenNumber(processed);
        if (num !== null) {
          processed = String(num);
        }
      } else if (inputType === 'phone') {
        processed = parseSpokenPhone(processed);
      } else if (inputType === 'email') {
        processed = parseSpokenEmail(processed);
      } else {
        processed = cleanSpokenText(processed);
      }

      setDetectedPreview(processed);

      if (isFinal) {
        playBeep(880, 0.1);
        if (appendMode && currentValue) {
          onTranscript(`${currentValue} ${processed}`.trim());
        } else {
          onTranscript(processed);
        }

        // Auto close listening popover shortly after final result
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          setShowListeningPopover(false);
          setDetectedPreview('');
        }, 1200);
      }
    },
    [inputType, appendMode, currentValue, onTranscript]
  );

  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({
    lang,
    continuous: false,
    interimResults: true,
    onResult: handleSpeechResult,
  });

  const toggleListen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isListening) {
      playBeep(440, 0.08);
      stopListening();
      setShowListeningPopover(false);
    } else {
      playBeep(700, 0.08);
      resetTranscript();
      setDetectedPreview('');
      setShowListeningPopover(true);
      startListening(lang);
    }
  };

  const toggleLanguage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nextLang = lang === 'bn-BD' ? 'en-US' : 'bn-BD';
    setLang(nextLang);
    if (isListening) {
      stopListening();
      setTimeout(() => startListening(nextLang), 150);
    }
  };

  useEffect(() => {
    if (!isListening && !detectedPreview) {
      setShowListeningPopover(false);
    }
  }, [isListening, detectedPreview]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!isSupported) {
    return null; // Gracefully hide if browser has no speech API
  }

  const sizeClasses = {
    xs: 'w-6 h-6 p-1 text-[10px]',
    sm: 'w-7 h-7 p-1.5 text-xs',
    md: 'w-8 h-8 p-1.5 text-sm',
  }[size];

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
  }[size];

  const currentSpoken = interimTranscript || transcript || detectedPreview;

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={toggleListen}
        title={title || (isListening ? 'কথা বলা বন্ধ করুন' : `${contextLabel || 'ইনপুট'} ভয়েস দিয়ে পূরণ করুন`)}
        className={`relative rounded-xl flex items-center justify-center transition-all ${sizeClasses} ${
          isListening
            ? 'bg-rose-600 text-white shadow-md shadow-rose-500/30 scale-105 animate-pulse'
            : 'bg-indigo-50/90 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 hover:border-indigo-300'
        } ${className}`}
      >
        {isListening ? (
          <>
            <MicOff className={`${iconSizes} animate-bounce`} />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-ping" />
          </>
        ) : (
          <Mic className={iconSizes} />
        )}
      </button>

      {/* Floating Active Voice Indicator Popover */}
      {showListeningPopover && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute z-50 bottom-full mb-2 right-0 min-w-[200px] max-w-[280px] p-2.5 bg-slate-900/95 text-white rounded-2xl shadow-xl border border-slate-700/80 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          <div className="flex items-center justify-between gap-1.5 mb-1.5 border-b border-slate-800 pb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span className="text-[11px] font-bold text-rose-300">
                {lang === 'bn-BD' ? 'ভয়েস শুনছি...' : 'Listening...'}
              </span>
            </div>
            <button
              type="button"
              onClick={toggleLanguage}
              className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="ভাষা পরিবর্তন করুন"
            >
              <Globe className="w-2.5 h-2.5" />
              {lang === 'bn-BD' ? 'বাংলা' : 'EN'}
            </button>
          </div>

          <div className="text-[11px] text-slate-300 bg-slate-800/80 p-1.5 rounded-lg min-h-[28px] break-words">
            {currentSpoken ? (
              <span className="text-white font-medium">{currentSpoken}</span>
            ) : (
              <span className="text-slate-400 italic">
                {contextLabel
                  ? `${contextLabel} মুখে বলুন...`
                  : lang === 'bn-BD'
                  ? 'মুখে বলুন...'
                  : 'Speak now...'}
              </span>
            )}
          </div>

          {detectedPreview && (
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-emerald-400 font-medium">
              <span className="flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-400" />
                শনাক্ত: <span className="text-white font-bold">{detectedPreview}</span>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
