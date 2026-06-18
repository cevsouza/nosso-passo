"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useLanguage, Locale } from '../lib/LanguageContext';
import { playBubble, playMarimba } from '../lib/audio-synth';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Check, ChevronDown } from 'lucide-react';

interface LanguageSelectorProps {
  floating?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ floating = false }) => {
  const { locale, setLocale } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages: { key: Locale; label: string; flag: string }[] = [
    { key: 'pt', label: 'Português (BR)', flag: '🇧🇷' },
    { key: 'es', label: 'Español', flag: '🇪🇸' },
    { key: 'en', label: 'English (US)', flag: '🇺🇸' }
  ];

  const handleToggle = () => {
    playBubble();
    setIsOpen(!isOpen);
  };

  const handleSelect = (lang: Locale) => {
    playMarimba(330, 0.4);
    setLocale(lang);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeLang = languages.find(l => l.key === locale) || languages[0];

  const triggerButton = (
    <motion.button
      type="button"
      onClick={handleToggle}
      onMouseEnter={playBubble}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`flex items-center gap-2 px-3.5 py-2 rounded-full border border-slate-250 bg-white/90 backdrop-blur-md text-slate-800 text-xs font-black shadow-premium transition-all hover:bg-slate-50 cursor-pointer select-none font-Outfit ${
        floating ? 'shadow-glow-indigo' : ''
      }`}
    >
      <Globe className="w-4 h-4 text-indigo-600 animate-spin-slow" />
      <span className="text-sm shrink-0">{activeLang.flag}</span>
      <span className="hidden sm:inline font-extrabold">{activeLang.label.split(' ')[0]}</span>
      <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
    </motion.button>
  );

  return (
    <div 
      ref={dropdownRef} 
      className={floating ? "fixed bottom-5 right-5 z-50" : "relative z-40"}
    >
      {triggerButton}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: floating ? 10 : -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: floating ? 10 : -10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className={`absolute ${
              floating ? 'bottom-14 right-0' : 'top-11 right-0'
            } w-44 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 flex flex-col gap-1 z-50`}
          >
            {languages.map(lang => (
              <button
                key={lang.key}
                type="button"
                onClick={() => handleSelect(lang.key)}
                onMouseEnter={playBubble}
                className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-left text-xs font-bold transition-all cursor-pointer border-none font-Outfit ${
                  locale === lang.key
                    ? 'bg-indigo-50 text-indigo-950 font-black'
                    : 'bg-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base select-none">{lang.flag}</span>
                  <span>{lang.label}</span>
                </div>
                {locale === lang.key && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default LanguageSelector;
