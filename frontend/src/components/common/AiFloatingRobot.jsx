import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AiFloatingRobot() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0, hasDragged: false });
  const [isMinimized, setIsMinimized] = useState(false);

  // Handle Dragging
  const handleMouseDown = (e) => {
    // Only drag with left mouse button
    if (e.button !== 0) return;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
      hasDragged: false,
    };
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        dragRef.current.hasDragged = true;
      }
      setPosition({
        x: dragRef.current.initialX + dx,
        y: dragRef.current.initialY + dy,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleClick = (e) => {
    if (dragRef.current.hasDragged) {
      e.preventDefault();
      return;
    }
    setIsOpen((prev) => !prev);
  };

  return (
    <div
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end select-none transition-transform duration-75"
    >
      {/* Speech Bubble / Mini AI Quick Menu */}
      {isOpen && (
        <div className="mb-3 w-72 rounded-2xl border border-violet-100/80 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 p-4 shadow-2xl backdrop-blur-xl animate-fadeIn origin-bottom-right">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-neutral-800">
            <div className="flex items-center gap-1.5">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-black text-stone-800 dark:text-stone-200 tracking-tight">STE AI Companion</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="h-5 w-5 rounded-full hover:bg-stone-100 dark:hover:bg-neutral-800 flex items-center justify-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 text-xs"
            >
              ✕
            </button>
          </div>

          <p className="text-xs text-stone-600 dark:text-stone-300 mt-2.5 font-medium leading-relaxed">
            Xin chào <strong>{user?.name?.split(' ').slice(-1)[0] || 'bạn'}</strong>! 👋 Mình là trợ lý AI. Hôm nay bạn có mục tiêu nào cần hoàn thành không?
          </p>

          <div className="mt-3 space-y-1.5">
            <Link
              to="/app/teams/discover"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between rounded-xl bg-gradient-to-r from-violet-50/80 to-purple-50/80 dark:from-violet-950/60 dark:to-purple-950/40 p-2 text-xs font-bold text-violet-700 dark:text-violet-300 hover:from-violet-100 hover:to-purple-100 transition"
            >
              <span className="flex items-center gap-1.5">
                <span>👥</span> Khám phá nhóm ghép đội
              </span>
              <span className="text-[10px] bg-violet-600 text-white px-1.5 py-0.5 rounded-full font-bold">AI</span>
            </Link>

            <Link
              to="/app/skill-intelligence/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between rounded-xl bg-stone-50 dark:bg-neutral-800/80 p-2 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-neutral-800 transition"
            >
              <span className="flex items-center gap-1.5">
                <span>📊</span> Cập nhật hồ sơ kỹ năng
              </span>
              <span>→</span>
            </Link>

            <Link
              to="/app/quizzes"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between rounded-xl bg-stone-50 dark:bg-neutral-800/80 p-2 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-neutral-800 transition"
            >
              <span className="flex items-center gap-1.5">
                <span>⚡</span> Ôn tập Quiz nhanh
              </span>
              <span>→</span>
            </Link>
          </div>

          <div className="mt-2.5 pt-2 border-t border-stone-100 dark:border-neutral-800 flex justify-between items-center text-[10px] text-stone-400 dark:text-stone-500">
            <span>Kéo để di chuyển vị trí</span>
            <span className="text-violet-600 dark:text-violet-400 font-bold">STE 2.0</span>
          </div>
        </div>
      )}

      {/* Floating Robot Mascot Container with Bobbing / Floating Animation */}
      <div
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        className="group relative flex flex-col items-center cursor-pointer"
        title="Trợ lý AI STE (Bấm để trò chuyện, Kéo để di chuyển)"
      >
        {/* Animated Robot Body */}
        <div className="relative flex flex-col items-center animate-bounce duration-1000">
          {/* Head / Helmet */}
          <div className="relative flex h-14 w-16 items-center justify-center rounded-2xl bg-gradient-to-b from-white via-stone-50 to-stone-200 shadow-xl p-1.5 border-2 border-white group-hover:scale-105 transition-transform duration-200">
            {/* Screen Visor */}
            <div className="flex h-10 w-13 items-center justify-center rounded-xl bg-neutral-950 shadow-inner px-1.5">
              {/* Glowing Cyan Eyes */}
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
              </div>
            </div>
            {/* Ears / Antennas */}
            <div className="absolute -left-1.5 top-4.5 h-4 w-1.5 rounded-l-full bg-violet-600 shadow-sm" />
            <div className="absolute -right-1.5 top-4.5 h-4 w-1.5 rounded-r-full bg-violet-600 shadow-sm" />
          </div>

          {/* Torso & Floating Hands */}
          <div className="relative -mt-1.5 flex h-7 w-11 items-center justify-center rounded-xl bg-gradient-to-b from-white to-stone-200 shadow-md border border-white">
            <span className="rounded-full bg-gradient-to-r from-violet-600 to-purple-600 px-1.5 py-0.5 text-[8px] font-black text-white shadow-sm">
              AI
            </span>
            {/* Floating Hands */}
            <div className="absolute -left-1.5 top-1 h-3.5 w-2 rounded-full bg-white shadow-sm border border-stone-100 group-hover:-rotate-12 transition-transform" />
            <div className="absolute -right-1.5 top-1 h-3.5 w-2 rounded-full bg-white shadow-sm border border-stone-100 group-hover:rotate-12 transition-transform" />
          </div>
        </div>

        {/* Dynamic Cast Shadow beneath robot */}
        <div className="mt-1 h-2 w-10 rounded-full bg-violet-900/15 dark:bg-black/50 blur-sm transition-all duration-300 group-hover:w-8 group-hover:opacity-70" />

        {/* Notification indicator dot */}
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500 border-2 border-white items-center justify-center text-[8px] font-black text-white">
            ✨
          </span>
        </span>
      </div>
    </div>
  );
}

