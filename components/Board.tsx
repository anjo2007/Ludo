
import React from 'react';
import { Color, Player, Token } from '../types';
import { 
  PATH_COORDINATES, 
  HOME_STRETCH, 
  CENTER_COORDS, 
  BASE_COORDS, 
  BOARD_COLORS,
  START_POSITIONS,
  SAFE_SPOTS
} from '../constants';

interface BoardProps {
  players: Player[];
  onTokenClick: (tokenId: number) => void;
  canMove: boolean;
  currentPlayerColor: Color;
}

const Board: React.FC<BoardProps> = ({ players, onTokenClick, canMove, currentPlayerColor }) => {
  const getAbsPos = (newPos: number, pColor: Color) => {
    if (newPos < 0 || newPos >= 52) return -1;
    return (newPos + START_POSITIONS[pColor]) % 52;
  };

  const renderSquare = (r: number, c: number, type: string, color?: string, isSafe?: boolean) => {
    const tokensAtCoord: Token[] = [];
    players.forEach(p => {
      p.tokens.forEach(t => {
        let coord: { r: number; c: number } | undefined;
        if (t.position === -1) coord = BASE_COORDS[p.color][t.id];
        else if (t.position >= 0 && t.position < 52) coord = PATH_COORDINATES[getAbsPos(t.position, p.color)];
        else if (t.position >= 52 && t.position < 57) coord = HOME_STRETCH[p.color][t.position - 52];
        else if (t.position === 100) coord = CENTER_COORDS;

        if (coord && coord.r === r && coord.c === c) tokensAtCoord.push(t);
      });
    });

    const isInteractable = canMove && tokensAtCoord.some(t => t.color === currentPlayerColor);

    return (
      <div 
        key={`${r}-${c}`}
        style={{ 
          gridRow: r + 1, 
          gridColumn: c + 1,
          backgroundColor: color || 'transparent',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        className={`relative flex items-center justify-center border-[0.1px] border-slate-100/50
          ${type === 'CENTER' ? 'bg-gradient-to-br from-slate-50 to-white border-none' : ''}
          ${type === 'BASE' ? 'bg-white/90 rounded-[10%] lg:rounded-2xl' : ''}
          ${isSafe ? 'ring-1 ring-inset ring-slate-200' : ''}
        `}
      >
        {isSafe && (
           <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
             <div className="w-1/2 h-1/2 border-2 border-slate-900 rounded-full rotate-45" />
             <div className="w-1/2 h-1/2 border-2 border-slate-900 rounded-full -rotate-45" />
           </div>
        )}

        {tokensAtCoord.length > 0 && (
          <div className="relative w-full h-full flex items-center justify-center">
            {tokensAtCoord.map((t, i) => {
              const isPlayerToken = t.color === currentPlayerColor;
              return (
                <button
                  key={`${t.color}-${t.id}`}
                  onClick={() => isInteractable && onTokenClick(t.id)}
                  disabled={!isInteractable}
                  style={{ 
                    backgroundColor: BOARD_COLORS[t.color],
                    transform: tokensAtCoord.length > 1 ? `translate(${i * 2}px, ${i * 2}px)` : 'none',
                    zIndex: isPlayerToken ? 10 : 1,
                  }}
                  className={`w-4/5 h-4/5 rounded-full border border-white/60 shadow-md transition-all
                    ${isInteractable ? 'cursor-pointer hover:scale-110 ring-2 ring-white animate-pulse' : 'cursor-default'}
                  `}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const grid = [];
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      let type = 'PATH', color = undefined, isSafe = false;
      if (r < 6 && c < 6) { color = BOARD_COLORS.RED + '15'; type = 'BASE'; }
      else if (r < 6 && c > 8) { color = BOARD_COLORS.GREEN + '15'; type = 'BASE'; }
      else if (r > 8 && c < 6) { color = BOARD_COLORS.BLUE + '15'; type = 'BASE'; }
      else if (r > 8 && c > 8) { color = BOARD_COLORS.YELLOW + '15'; type = 'BASE'; }
      else if (r >= 6 && r <= 8 && c >= 6 && c <= 8) type = 'CENTER';

      if (r === 7 && c >= 1 && c <= 5) color = BOARD_COLORS.RED + '30';
      if (c === 7 && r >= 1 && r <= 5) color = BOARD_COLORS.GREEN + '30';
      if (r === 7 && c >= 9 && c <= 13) color = BOARD_COLORS.YELLOW + '30';
      if (c === 7 && r >= 9 && r <= 13) color = BOARD_COLORS.BLUE + '30';

      if (r === 6 && c === 1) color = BOARD_COLORS.RED;
      if (r === 1 && c === 8) color = BOARD_COLORS.GREEN;
      if (r === 8 && c === 13) color = BOARD_COLORS.YELLOW;
      if (r === 13 && c === 6) color = BOARD_COLORS.BLUE;

      const pathIdx = PATH_COORDINATES.findIndex(coord => coord.r === r && coord.c === c);
      if (pathIdx !== -1 && SAFE_SPOTS.includes(pathIdx)) isSafe = true;

      grid.push(renderSquare(r, c, type, color, isSafe));
    }
  }

  return (
    <div className="ludo-grid w-full h-full p-1 lg:p-2 bg-white rounded-3xl lg:rounded-[3rem] overflow-hidden shadow-inner ring-1 ring-slate-100">
      {grid}
    </div>
  );
};

export default Board;
