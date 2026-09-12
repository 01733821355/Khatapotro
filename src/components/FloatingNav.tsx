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
  RotateCcw,
  Flame,
  GripVertical,
  MessageSquare
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

const STORAGE_KEY = 'khatapotro_fab_position_v2';

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
  const [showDragHint, setShowDragHint] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartPosRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);
  const didDragRef = useRef(false);

  // Clamps position within screen viewport so it never goes off-screen,
  // while allowing it to be placed anywhere including the dead center of the screen.
  const clampPosition = useCallback((x: number, y: number): Position => {
    const width = containerRef.current?.offsetWidth || 160;
    const height = containerRef.current?.offsetHeight || 56;
    const padding = 8;

    const minX = padding;
    const maxX = Math.max(padding, window.innerWidth - width - padding);
    const minY = 56; // below the top header
    const maxY = Math.max(minY, window.innerHeight - height - padding);

    return {
      x: Math.min(Math.max(x, minX), maxX),
      y: Math.min(Math.max(y, minY), maxY),
    };
  }, []);

  // Update bounds on window resize
  useEffect(() => {
    const handleResize = () => {
      if (position) {
        setPosition((prev) => (prev ? clampPosition(prev.x, prev.y) : null));
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [position, clampPosition]);

  // Pointer down handler for both touch and mouse
  const handlePointerDown = (clientX: number, clientY: number) => {
    didDragRef.current = false;

    // Get current container coordinates
    const rect = containerRef.current?.getBoundingClientRect();
    const currentX = rect ? rect.left : window.innerWidth - 180;
    const currentY = rect ? rect.top : window.innerHeight - 80;

    dragStartPosRef.current = {
      startX: clientX,
      startY: clientY,
      initialX: currentX,
      initialY: currentY,
    };
  };

  // Pointer move handler with instant responsiveness (> 6px movement)
  const handlePointerMove = useCallback((clientX: number, clientY: number) => {
    if (!dragStartPosRef.current) return;

    const deltaX = clientX - dragStartPosRef.current.startX;
    const deltaY = clientY - dragStartPosRef.current.startY;
    const distance = Math.hypot(deltaX, deltaY);

    if (distance > 6) {
      if (!isDragging) {
        setIsDragging(true);
        setShowDragHint(true);
        // Subtle haptic feedback on mobile if supported
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try {
            navigator.vibrate(30);
          } catch {
            // ignore
          }
        }
      }
      didDragRef.current = true;
      const newX = dragStartPosRef.current.initialX + deltaX;
      const newY = dragStartPosRef.current.initialY + deltaY;
      const clamped = clampPosition(newX, newY);
      setPosition(clamped);
    }
  }, [isDragging, clampPosition]);

  // Pointer release handler
  const handlePointerUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setShowDragHint(false);
      if (position) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
        } catch {
          // ignore
        }
      }
      // Brief debounce so a release does not trigger a button click
      setTimeout(() => {
        didDragRef.current = false;
      }, 150);
    } else {
      setShowDragHint(false);
    }

    dragStartPosRef.current = null;
  }, [isDragging, position]);

  // Touch event handlers
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

  // Mouse event handlers
  const onMouseDown = (e: ReactMouseEvent) => {
    if (e.button !== 0) return; // Left-click only
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
  const handleResetPosition = (e?: ReactMouseEvent) => {
    if (e) e.stopPropagation();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setPosition(null);
    setIsDragging(false);
    setShowDragHint(false);
  };

  // Dynamic position-wise calculation for the menu:
  // 1. Vertical: if button is in lower 55% of screen -> open UPWARDS. Otherwise -> open DOWNWARDS.
  // 2. Horizontal:
  //    - Left 32% of screen -> align left
  //    - Right 68% of screen -> align right
  //    - Middle (32% to 68%) -> center aligned directly with the button (perfect for center of screen!)
  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
  const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 400;

  const currentY = position?.y ?? (windowHeight - 90);
  const currentX = position?.x ?? (windowWidth - 170);

  const openDirection: 'up' | 'down' = currentY > windowHeight * 0.45 ? 'up' : 'down';

  let horizontalAlign: 'left' | 'center' | 'right' = 'right';
  if (currentX < windowWidth * 0.32) {
    horizontalAlign = 'left';
  } else if (currentX > windowWidth * 0.68) {
    horizontalAlign = 'right';
  } else {
    horizontalAlign = 'center';
  }

  // Navigation Items
  const navItems = [
    {
      id: 'home' as ActivePage,
      labelBn: 'হোম ড্যাশবোর্ড',
      labelEn: 'Home Dashboard',
      icon: Home,
      badge: null,
      color: 'bg-slate-900 text-white hover:bg-slate-800',
    },
    {
      id: 'calorie' as ActivePage,
      labelBn: 'ক্যালরি মিটার ও স্বাস্থ্য',
      labelEn: 'Calorie Meter & Health',
      icon: Flame,
      badge: 'Live',
      color: 'bg-amber-600 text-white hover:bg-amber-700',
    },
    {
      id: 'report' as ActivePage,
      labelBn: 'সার্চ ও রিপোর্ট',
      labelEn: 'Search & Reports',
      icon: Search,
      badge: null,
      color: 'bg-indigo-600 text-white hover:bg-indigo-700',
    },
    {
      id: 'loans' as ActivePage,
      labelBn: 'ঋণ হিসাব (দেনা)',
      labelEn: 'Loans (Payable)',
      icon: CreditCard,
      badge: null,
      color: 'bg-amber-600 text-white hover:bg-amber-700',
    },
    {
      id: 'lending' as ActivePage,
      labelBn: 'ধার হিসাব (পাওনা)',
      labelEn: 'Lending (Receivable)',
      icon: HandCoins,
      badge: null,
      color: 'bg-blue-600 text-white hover:bg-blue-700',
    },
    {
      id: 'vault' as ActivePage,
      labelBn: 'রসিদ ও ডকুমেন্ট ভল্ট',
      labelEn: 'Receipt & Voucher Vault',
      icon: FolderOpen,
      badge: null,
      color: 'bg-purple-600 text-white hover:bg-purple-700',
    },
    {
      id: 'whatsapp' as ActivePage,
      labelBn: 'WA Sender+ (চেকলিস্ট ও টুলস)',
      labelEn: 'WA Sender+ (Checklist & Tools)',
      icon: MessageSquare,
      badge: 'Plus',
      color: 'bg-gradient-to-r from-purple-600 to-emerald-600 text-white hover:opacity-95',
    },
  ];

  return (
    <>
      {/* Backdrop overlay when menu is open */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-200"
          aria-hidden="true"
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
                right: '16px',
                bottom: '20px',
                position: 'fixed',
              }
        }
        className={`z-50 print:hidden select-none touch-none transition-transform duration-75 ${
          isDragging ? 'scale-105 cursor-grabbing' : 'cursor-default'
        }`}
      >
        {/* Dynamic Dragging Guide Tooltip */}
        {(showDragHint || isDragging) && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white text-[11px] font-bold shadow-xl border border-blue-400 pointer-events-none animate-pulse">
            <Move className="w-3.5 h-3.5 text-blue-400" />
            <span>
              {language === 'bn'
                ? 'স্ক্রিনের যেখানে ইচ্ছা টেনে রাখুন (মাঝখানেও রাখা যাবে)'
                : 'Drag anywhere on screen (even in the center)'}
            </span>
          </div>
        )}

        {/* Position-Aware Navigation Menu Popup */}
        {isOpen && !isDragging && (
          <div
            className={`absolute z-50 w-[285px] max-w-[calc(100vw-24px)] max-h-[min(75vh,480px)] overflow-y-auto ${
              openDirection === 'up' ? 'bottom-full mb-2.5' : 'top-full mt-2.5'
            } ${
              horizontalAlign === 'left'
                ? 'left-0'
                : horizontalAlign === 'center'
                ? 'left-1/2 -translate-x-1/2'
                : 'right-0'
            } bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl p-3 border border-slate-200/90 dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-2.5`}
          >
            {/* Header: Menu Title & Position Indicator / Reset */}
            <div className="flex items-center justify-between px-1 pb-1.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                  <Compass className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-800 dark:text-white leading-none">
                    {language === 'bn' ? 'ন্যাভিগেশন মেনু' : 'Navigation Menu'}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {horizontalAlign === 'center'
                      ? (language === 'bn' ? 'পজিশন: স্ক্রিনের মাঝখানে' : 'Position: Screen Center')
                      : horizontalAlign === 'left'
                      ? (language === 'bn' ? 'পজিশন: বামে' : 'Position: Left Edge')
                      : (language === 'bn' ? 'পজিশন: ডানে' : 'Position: Right Edge')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {position && (
                  <button
                    type="button"
                    onClick={() => handleResetPosition()}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                    title={language === 'bn' ? 'ডিফল্ট নিচে-ডানে ফেরান' : 'Reset to default position'}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Actions Grid (+জমা / -খরচ) */}
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenAddIncome();
                }}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? '+ নতুন জমা' : '+ Add Income'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenAddExpense();
                }}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-all"
              >
                <Minus className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? '- নতুন খরচ' : '- Add Expense'}</span>
              </button>
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-800 my-0.5" />

            {/* Main Navigation Items List */}
            <div className="space-y-1.5">
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
                    className={`w-full flex items-center justify-between p-2 rounded-2xl text-xs font-bold transition-all ${
                      isActive
                        ? `${item.color} shadow-sm ring-2 ring-blue-400 dark:ring-blue-500 scale-[1.01]`
                        : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/50 dark:border-slate-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 shadow-2xs'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="truncate">
                        {language === 'bn' ? item.labelBn : item.labelEn}
                      </span>
                    </div>

                    {item.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-400 text-amber-950 font-black shrink-0 shadow-2xs">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Floating Master Bar (Draggable anywhere, with grip & instant actions) */}
        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
          className={`flex items-center gap-1.5 p-1 rounded-full backdrop-blur-md transition-all shadow-xl ${
            isDragging
              ? 'bg-blue-600/90 ring-4 ring-blue-400/60 scale-110 shadow-2xl cursor-grabbing'
              : 'bg-slate-900/90 hover:bg-slate-900 border border-white/20 cursor-grab hover:scale-[1.02]'
          }`}
        >
          {/* Visual Drag Handle Pill */}
          <div
            className="flex items-center justify-center pl-2 pr-1 py-1 text-slate-400 hover:text-white cursor-grab active:cursor-grabbing shrink-0"
            title={language === 'bn' ? 'টেনে স্ক্রিনের যেকোনো জায়গায় বসান' : 'Drag anywhere to reposition'}
          >
            <GripVertical className="w-4 h-4" />
          </div>

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
                className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white px-2.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs shrink-0"
                title={language === 'bn' ? 'নতুন জমা যোগ' : 'Add Income'}
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{language === 'bn' ? 'জমা' : 'Income'}</span>
              </button>

              {/* Quick Expense Button */}
              <button
                type="button"
                onClick={(e) => {
                  if (didDragRef.current) return;
                  e.stopPropagation();
                  onOpenAddExpense();
                }}
                className="flex items-center gap-1 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white px-2.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs shrink-0"
                title={language === 'bn' ? 'নতুন খরচ যোগ' : 'Add Expense'}
              >
                <Minus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{language === 'bn' ? 'খরচ' : 'Expense'}</span>
              </button>
            </>
          )}

          {/* Master Speed-Dial FAB Toggle Button */}
          <button
            type="button"
            onClick={(e) => {
              if (didDragRef.current) return;
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 shrink-0 ${
              isOpen
                ? 'bg-rose-500 text-white rotate-90 shadow-md'
                : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md'
            }`}
            aria-label="Toggle Navigation Menu"
            title={language === 'bn' ? 'মেনু খুলুন / টগল করুন' : 'Toggle Menu'}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Compass className="w-5 h-5" />}

            {!isOpen && (
              <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900" />
            )}
          </button>
        </div>
      </div>
    </>
  );
};
