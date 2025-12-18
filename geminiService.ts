
import { GoogleGenAI, Type } from "@google/genai";
import { Player, Token, Color } from "./types";

// Always use a named parameter for apiKey and use process.env.API_KEY directly
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface AIMoveResponse {
  tokenId: number;
  commentary: string;
}

export interface OpponentProfile {
  name: string;
  bio: string;
  color: Color;
}

export const generateOpponents = async (count: number): Promise<OpponentProfile[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate ${count} unique, trendy usernames and short 1-sentence bios for players in an online Ludo game.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              bio: { type: Type.STRING }
            },
            required: ["name", "bio"]
          }
        }
      }
    });
    // Use response.text property directly and trim it to ensure valid JSON
    const profiles = JSON.parse(response.text.trim());
    return profiles;
  } catch (error) {
    return Array(count).fill(null).map((_, i) => ({
      name: `Player_${Math.floor(Math.random() * 9999)}`,
      bio: "Ready to win!",
      color: 'RED' // Placeholder
    }));
  }
};

export const getGeminiAIMove = async (
  player: Player,
  diceValue: number,
  allPlayers: Player[]
): Promise<AIMoveResponse> => {
  const validMoves = player.tokens.filter(t => {
    if (t.position === 100) return false;
    if (t.position === -1 && diceValue !== 6) return false;
    if (t.position >= 52 && t.position + diceValue > 57) return false;
    return true;
  });

  if (validMoves.length === 0) return { tokenId: -1, commentary: "Darn, no moves for me this time! 😅" };

  try {
    const prompt = `You are an online Ludo player named ${player.name} playing as ${player.color}. 
    Dice Roll: ${diceValue}.
    Your Tokens: ${JSON.stringify(player.tokens)}
    Other Players: ${JSON.stringify(allPlayers.filter(p => p.color !== player.color).map(p => ({ name: p.name, color: p.color, tokens: p.tokens })))}
    
    Task: Choose the best tokenId (0-3) to move. 
    Strategy priorities:
    1. Capture an opponent's token if possible.
    2. Move a token into the home stretch/finish.
    3. If roll is 6 and you have tokens in base (-1), bring one out.
    4. Move the token furthest along the board to get it home.

    Also, provide a short, human-like chat message about this move (can use emojis, slang, or be competitive).`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tokenId: { type: Type.INTEGER },
            commentary: { type: Type.STRING }
          },
          required: ["tokenId", "commentary"]
        }
      }
    });

    // Use response.text property directly and trim it to ensure valid JSON
    const result = JSON.parse(response.text.trim());
    if (validMoves.some(m => m.id === result.tokenId)) {
      return result;
    }
  } catch (error) {
    console.error("Gemini AI Move error:", error);
  }

  const fallbackToken = validMoves[Math.floor(Math.random() * validMoves.length)];
  return { tokenId: fallbackToken.id, commentary: "Let's go! 🎲" };
};
