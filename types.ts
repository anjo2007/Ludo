
export type Color = 'RED' | 'BLUE' | 'GREEN' | 'YELLOW';

export interface Token {
  id: number;
  color: Color;
  position: number; // -1 = home base, 0-51 = common path, 52-57 = home stretch, 100 = finished
}

export interface Player {
  color: Color;
  name: string;
  isAI: boolean;
  tokens: Token[];
  isHuman: boolean;
}

export type GameState = 'START' | 'PLAYING' | 'FINISHED';

export interface Move {
  playerId: number;
  tokenId: number;
  diceValue: number;
}
