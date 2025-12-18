
import React from 'react';

interface DiceProps {
  value: number | null;
  isRolling: boolean;
  onClick: () => void;
  disabled: boolean;
}

const Dice: React.FC<DiceProps> = ({ value, isRolling, onClick, disabled }) => {
  const dots = (val: number) => {
    switch (val) {
      case 1: return <div className="w-4 h-4 rounded-full bg-slate-800" />;
      case 2: return (
        <div className="w-full h-full flex flex-col justify-between items-center p-2">
           <div className="w-3 h-3 rounded-full bg-slate-800 self-start" />
           <div className="w-3 h-3 rounded-full bg-slate-800 self-end" />
        </div>
      );
      case 3: return (
        <div className="w-full h-full flex flex-col justify-between items-center p-2">
           <div className="w-3 h-3 rounded-full bg-slate-800 self-start" />
           <div className="w-3 h-3 rounded-full bg-slate-800" />
           <div className="w-3 h-3 rounded-full bg-slate-800 self-end" />
        </div>
      );
      case 4: return (
        <div className="grid grid-cols-2 gap-2 p-2">
           <div className="w-3 h-3 rounded-full bg-slate-800" />
           <div className="w-3 h-3 rounded-full bg-slate-800" />
           <div className="w-3 h-3 rounded-full bg-slate-800" />
           <div className="w-3 h-3 rounded-full bg-slate-800" />
        </div>
      );
      case 5: return (
        <div className="relative w-full h-full flex items-center justify-center p-2">
           <div className="grid grid-cols-2 gap-4">
              <div className="w-3 h-3 rounded-full bg-slate-800" />
              <div className="w-3 h-3 rounded-full bg-slate-800" />
              <div className="w-3 h-3 rounded-full bg-slate-800" />
              <div className="w-3 h-3 rounded-full bg-slate-800" />
           </div>
           <div className="absolute w-3 h-3 rounded-full bg-slate-800" />
        </div>
      );
      case 6: return (
        <div className="grid grid-cols-2 gap-2 p-2">
           <div className="w-3 h-3 rounded-full bg-slate-800" />
           <div className="w-3 h-3 rounded-full bg-slate-800" />
           <div className="w-3 h-3 rounded-full bg-slate-800" />
           <div className="w-3 h-3 rounded-full bg-slate-800" />
           <div className="w-3 h-3 rounded-full bg-slate-800" />
           <div className="w-3 h-3 rounded-full bg-slate-800" />
        </div>
      );
      default: return null;
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative w-24 h-24 rounded-3xl bg-white shadow-2xl flex items-center justify-center transition-all border border-slate-100 ring-8 ring-slate-50
        ${isRolling ? 'animate-bounce' : 'hover:scale-105 active:scale-95'}
        ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer'}
      `}
    >
      <div className={`w-full h-full flex items-center justify-center transition-transform ${isRolling ? 'rotate-[360deg] duration-500' : ''}`}>
        {value ? dots(value) : (
          <div className="text-slate-200 font-black text-4xl">?</div>
        )}
      </div>
      
      {/* Decorative inner edge */}
      <div className="absolute inset-2 border-2 border-slate-50 rounded-2xl pointer-events-none" />
    </button>
  );
};

export default Dice;
