
import { Color } from './types';

export const COLORS: Color[] = ['RED', 'GREEN', 'YELLOW', 'BLUE'];

export const BOARD_COLORS: Record<Color, string> = {
  RED: '#ef4444',
  GREEN: '#22c55e',
  YELLOW: '#eab308',
  BLUE: '#3b82f6',
};

export const LIGHT_COLORS: Record<Color, string> = {
  RED: '#fee2e2',
  GREEN: '#dcfce7',
  YELLOW: '#fef9c3',
  BLUE: '#dbeafe',
};

// Start indices for each player on the 52-square global path
export const START_POSITIONS: Record<Color, number> = {
  RED: 0,
  GREEN: 13,
  YELLOW: 26,
  BLUE: 39,
};

// Safe spots on the common path
export const SAFE_SPOTS = [0, 8, 13, 21, 26, 34, 39, 47];

// Coordinates for the 15x15 grid
// Index 0-51 are the circular common path
export const PATH_COORDINATES: Array<{ r: number; c: number }> = [
  // Red start path
  { r: 6, c: 1 }, { r: 6, c: 2 }, { r: 6, c: 3 }, { r: 6, c: 4 }, { r: 6, c: 5 },
  { r: 5, c: 6 }, { r: 4, c: 6 }, { r: 3, c: 6 }, { r: 2, c: 6 }, { r: 1, c: 6 }, { r: 0, c: 6 },
  { r: 0, c: 7 }, { r: 0, c: 8 }, // 12
  // Green side
  { r: 1, c: 8 }, { r: 2, c: 8 }, { r: 3, c: 8 }, { r: 4, c: 8 }, { r: 5, c: 8 },
  { r: 6, c: 9 }, { r: 6, c: 10 }, { r: 6, c: 11 }, { r: 6, c: 12 }, { r: 6, c: 13 }, { r: 6, c: 14 },
  { r: 7, c: 14 }, { r: 8, c: 14 }, // 25
  // Yellow side
  { r: 8, c: 13 }, { r: 8, c: 12 }, { r: 8, c: 11 }, { r: 8, c: 10 }, { r: 8, c: 9 },
  { r: 9, c: 8 }, { r: 10, c: 8 }, { r: 11, c: 8 }, { r: 12, c: 8 }, { r: 13, c: 8 }, { r: 14, c: 8 },
  { r: 14, c: 7 }, { r: 14, c: 6 }, // 38
  // Blue side
  { r: 13, c: 6 }, { r: 12, c: 6 }, { r: 11, c: 6 }, { r: 10, c: 6 }, { r: 9, c: 6 },
  { r: 8, c: 5 }, { r: 8, c: 4 }, { r: 8, c: 3 }, { r: 8, c: 2 }, { r: 8, c: 1 }, { r: 8, c: 0 },
  { r: 7, c: 0 }, { r: 6, c: 0 }, // 51
];

// Home paths for each color (5 squares each + the center)
export const HOME_STRETCH: Record<Color, Array<{ r: number; c: number }>> = {
  RED: [{r:7,c:1}, {r:7,c:2}, {r:7,c:3}, {r:7,c:4}, {r:7,c:5}],
  GREEN: [{r:1,c:7}, {r:2,c:7}, {r:3,c:7}, {r:4,c:7}, {r:5,c:7}],
  YELLOW: [{r:7,c:13}, {r:7,c:12}, {r:7,c:11}, {r:7,c:10}, {r:7,c:9}],
  BLUE: [{r:13,c:7}, {r:12,c:7}, {r:11,c:7}, {r:10,c:7}, {r:9,c:7}],
};

export const CENTER_COORDS = { r: 7, c: 7 };

export const BASE_COORDS: Record<Color, Array<{ r: number; c: number }>> = {
  RED: [{r:2,c:2}, {r:2,c:3}, {r:3,c:2}, {r:3,c:3}],
  GREEN: [{r:2,c:11}, {r:2,c:12}, {r:3,c:11}, {r:3,c:12}],
  YELLOW: [{r:11,c:11}, {r:11,c:12}, {r:12,c:11}, {r:12,c:12}],
  BLUE: [{r:11,c:2}, {r:11,c:3}, {r:12,c:2}, {r:12,c:3}],
};
