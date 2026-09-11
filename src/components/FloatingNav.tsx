import { useState, useRef, useEffect, useCallback, type TouchEvent, type MouseEvent as ReactMouseEvent } from 'react';
import type { ActivePage, Language } from '../types';
import { 
  Plus, 
  Minus, 
  Compass, 
  Home, 
  CreditCard, 
  HandCoins, 
  X,
  Search,
  FolderOpen,
  Move,
  RotateCcw
} from 'lucide-react';

interface FloatingNavProps {
  activePage: ActivePage;
  onNavigate: (page: ActivePage) => void;
  onOpenAddIncome: () => void;
  onOpenAddExpense: () => void;
  language: Language;
}

interface Position {
  x: number;
  y: number;
}

const STORAGE_KEY = 'khatapotro_fab_position_v1';

export const FloatingNav = ({
  activePage,
  onNavigate,
  onOpenAddIncome,
  onOpenAddExpense,
  language,
}: FloatingNavProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<Position | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isLongPressed, setIsLongPressed] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dragStartPosRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);
  const didDragRef = useRef(false);

  // Keep inside screen boundaries on window resize
  const clampPosition = useCallback((x: number, y: number): Position => {
    const width = containerRef.current?.offsetWidth || 180;
    const height = containerRef.current?.offsetHeight || 60;
    const padding = 12;

    const minX = padding;
    const maxX = Math.max(padding, window.innerWidth - width - padding);
    const minY = 64; // below navbar
    const maxY = Math.max(64, window.innerHeight - height - padding);

    return {
      x: Math.min(Math.max(x, minX), maxX),
      y: Math.min(Math.max(y, minY), maxY),
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (position) {
        setPosition((prev) => (prev ? clampPosition(prev.x, prev.y) : null));
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [position, clampPosition]);

  // Handle pointer down (both touch and mouse)
  const handlePointerDown = (clientX: number, clientY: number) => {
    didDragRef.current = false;

    // Get current container position
    const rect = containerRef.current?.getBoundingClientRect();
    const currentX = rect ? rect.left : window.innerWidth - 200;
    const currentY = rect ? rect.top : window.innerHeight - 80;

    dragStartPosRef.current = {
      startX: clientX,
      startY: clientY,
      initialX: currentX,
      initialY: currentY,
    };

    // Trigger long press after 380ms
    longPressTimerRef.current = setTimeout(() => {
      setIsLongPressed(true);
      setIsDragging(true);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(60);
        } catch {
          // ignore
        }
      }
    }, 380);
  };

  const handlePointerMove = useCallback((clientX: number, clientY: number) => {
    if (!dragStartPosRef.current) return;

    const deltaX = clientX - dragStartPosRef.current.startX;
    const deltaY = clientY - dragStartPosRef.current.startY;
    const distance = Math.hypot(deltaX, deltaY);

    // If moved significantly before timer, cancel long press unless already dragging
    if (distance > 10 && !isLongPressed) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }

    if (isDragging) {
      didDragRef.current = true;
      const newX = dragStartPosRef.current.initialX + deltaX;
      const newY = dragStartPosRef.current.initialY + deltaY;
      const clamped = clampPosition(newX, newY);
      setPosition(clamped);
    }
  }, [isDragging, isLongPressed, clampPosition]);

  const handlePointerUp = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (isDragging) {
      setIsDragging(false);
      setIsLongPressed(false);
      if (position) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
      }
      // Brief timeout to prevent firing onClick after dragging
      setTimeout(() => {
        didDragRef.current = false;
      }, 100);
    } else {
      setIsLongPressed(false);
    }

    dragStartPosRef.current = null;
  }, [isDragging, position]);

  // Touch event listeners
  const onTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    handlePointerDown(touch.clientX, touch.clientY);
  };

  const onTouchMove = (e: TouchEvent) => {
    const touch = e.touches[0];
    handlePointerMove(touch.clientX, touch.clientY);
  };

  const onTouchEnd = () => {
    handlePointerUp();
  };

  // Mouse event listeners
  const onMouseDown = (e: ReactMouseEvent) => {
    if (e.button !== 0) return; // only left click
    handlePointerDown(e.clientX, e.clientY);

    const onMouseMove = (moveEvent: MouseEvent) => {
      handlePointerMove(moveEvent.clientX, moveEvent.clientY);
    };

    const onMouseUp = () => {
      handlePointerUp();
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Reset to default bottom-right position
  const handleResetPosition = (e: ReactMouseEvent) => {
    e.stopPropagation();
    localStorage.removeItem(STORAGE_KEY);
    setPosition(null);
    setIsLongPressed(false);
    setIsDragging(false);
  };

  const navItems = [
    {
      id: 'home' as ActivePage,
      labelBn: 'হোম ড্যাশবোর্ড',
      labelEn: 'Home',
      icon: Home,
      color: 'bg-slate-800 text-white hover:bg-slate-900',
    },
    {
      id: 'report' as ActivePage,
      labelBn: 'সার্চ ও রিপোর্ট',
      labelEn: 'Report',
      icon: Search,
      color: 'bg-indigo-600 text-white hover:bg-indigo-700',
    },
    {
      id: 'loans' as ActivePage,
      labelBn: 'ঋণ হিসাব (দেনা)',
      labelEn: 'Loans (Debt)',
      icon: CreditCard,
      color: 'bg-amber-600 text-white hover:bg-amber-700',
    },
    {
      id: 'lending' as ActivePage,
      labelBn: 'ধার হিসাব (পাওনা)',
      labelEn: 'Lending (Receivable)',
      icon: HandCoins,
      color: 'bg-blue-600 text-white hover:bg-blue-700',
    },
    {
      id: 'vault' as ActivePage,
      labelBn: 'রসিদ ও ভল্ট',
      labelEn: 'Receipt Vault',
      icon: FolderOpen,
      color: 'bg-purple-600 text-white hover:bg-purple-700',
    },
  ];

  // Calculate dynamic layout direction based on current screen position
  const isTopHalf = position ? position.y < window.innerHeight / 2 : false;
  const isLeftHalf = position ? position.x < window.innerWidth / 2 : false;

  return (
    <>
      {/* Backdrop when menu is expanded */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs transition-opacity duration-200"
        />
      )}

      {/* Floating Speed Dial Container */}
      <div
        ref={containerRef}
        style={
          position
            ? {
                left: `${position.x}px`,
                top: `${position.y}px`,
                position: 'fixed',
              }
            : {
                right: '20px',
                bottom: '20px',
                position: 'fixed',
              }
        }
        className={`z-50 flex ${
          isTopHalf ? 'flex-col-reverse' : 'flex-col'
        } ${isLeftHalf ? 'items-start' : 'items-end'} gap-2.5 print:hidden select-none touch-none ${
          isDragging ? 'cursor-grabbing scale-105 transition-none' : 'transition-transform'
        }`}
      >
        {/* Visual feedback tooltip while Long Pressing / Dragging */}
        {(isLongPressed || isDragging) && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 text-white text-[11px] font-bold shadow-2xl border border-blue-400 animate-bounce">
            <Move className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span>
              {language === 'bn' 
                ? 'টেনে যেকোনো স্থানে বসান' 
                : 'Drag anywhere to reposition'}
            </span>
            {position && (
              <button
                type="button"
                onClick={handleResetPosition}
                className="ml-1 p-1 rounded-full hover:bg-slate-800 text-slate-300 hover:text-white"
                title="Reset Position"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Expanded Navigation & Action Menu */}
        {isOpen && !isDragging && (
          <div
            className={`flex flex-col ${
              isLeftHalf ? 'items-start' : 'items-end'
            } gap-2 ${isTopHalf ? 'mt-1' : 'mb-1'} animate-in slide-in-from-bottom-5 fade-in duration-200`}
          >
            {/* Quick Action: Add Income */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenAddIncome();
              }}
              className="flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-2xl shadow-lg font-bold text-xs transition-transform hover:scale-105"
            >
              <span>+ নতুন জমা যোগ</span>
              <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center">
                <Plus className="w-4 h-4 text-white" />
              </div>
            </button>

            {/* Quick Action: Add Expense */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenAddExpense();
              }}
              className="flex items-center gap-2.5 bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 rounded-2xl shadow-lg font-bold text-xs transition-transform hover:scale-105"
            >
              <span>- নতুন খরচ যোগ</span>
              <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center">
                <Minus className="w-4 h-4 text-white" />
              </div>
            </button>

            <div className="w-full h-px bg-slate-200 my-1" />

            {/* Page Navigation Links */}
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;

              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => {
                    setIsOpen(false);
                    onNavigate(item.id);
                  }}
                  className={`flex items-center gap-2.5 px-3.5 py-2 rounded-2xl shadow-md font-semibold text-xs transition-all ${
                    isActive
                      ? `${item.color} ring-2 ring-offset-2 ring-blue-500 font-bold scale-105`
                      : 'bg-white text-slate-800 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  <span>{language === 'bn' ? item.labelBn : item.labelEn}</span>
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Floating Action Cluster: Quick +জমা, -খরচ & Primary FAB Toggle */}
        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
          className={`flex items-center gap-2 p-1 rounded-3xl transition-all ${
            isDragging
              ? 'ring-4 ring-blue-500/50 bg-blue-50/50 shadow-2xl scale-110'
              : 'hover:shadow-lg'
          }`}
        >
          {!isOpen && (
            <>
              {/* Quick Income Button */}
              <button
                type="button"
                onClick={(e) => {
                  if (didDragRef.current) return;
                  e.stopPropagation();
                  onOpenAddIncome();
                }}
                className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-3 py-2.5 rounded-2xl shadow-lg text-xs font-bold transition-transform"
                title="নতুন জমা"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">জমা</span>
              </button>

              {/* Quick Expense Button */}
              <button
                type="button"
                onClick={(e) => {
                  if (didDragRef.current) return;
                  e.stopPropagation();
                  onOpenAddExpense();
                }}
                className="flex items-center gap-1 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white px-3 py-2.5 rounded-2xl shadow-lg text-xs font-bold transition-transform"
                title="নতুন খরচ"
              >
                <Minus className="w-4 h-4" />
                <span className="hidden sm:inline">খরচ</span>
              </button>
            </>
          )}

          {/* Master Floating Navigation Button */}
          <button
            type="button"
            onClick={(e) => {
              if (didDragRef.current) return;
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className={`relative w-12 h-12 rounded-2xl shadow-xl flex items-center justify-center transition-all duration-200 active:scale-95 cursor-grab active:cursor-grabbing ${
              isOpen
                ? 'bg-slate-900 text-white rotate-90'
                : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white hover:shadow-blue-500/25'
            } ${isDragging ? 'ring-2 ring-white scale-105' : ''}`}
            aria-label="Toggle Navigation Menu (Long tap to move)"
            title={language === 'bn' ? 'লং ট্যাপ করে পজিশন পরিবর্তন করুন' : 'Long tap & drag to reposition'}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Compass className="w-6 h-6 animate-pulse" />}
            
            {/* Small subtle drag hint indicator */}
            {!isOpen && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-blue-400 border-2 border-white flex items-center justify-center">
                <span className="w-1 h-1 rounded-full bg-white animate-ping" />
              </span>
            )}
          </button>
        </div>
      </div>
    </>
  );
};
