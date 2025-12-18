
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Trophy, Users, Globe, RotateCcw, MessageSquare, Loader2, Signal, Share2, ArrowLeft, Send, Bot, UserPlus, Info, Play } from 'lucide-react';
import { Color, Player, GameState, Token } from './types';
import { COLORS, START_POSITIONS, SAFE_SPOTS } from './constants';
import Board from './components/Board';
import Dice from './components/Dice';
import { getGeminiAIMove, generateOpponents } from './geminiService';

type AppPhase = 'MODE_SELECT' | 'LOCAL_SETUP' | 'ONLINE_LOBBY' | 'HOSTING' | 'JOINING' | 'PLAYING' | 'MATCHMAKING';

const App: React.FC = () => {
  const [phase, setPhase] = useState<AppPhase>('MODE_SELECT');
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [canMove, setCanMove] = useState(false);
  const [messages, setMessages] = useState<{sender: string, text: string, color?: Color}[]>([]);
  const [winner, setWinner] = useState<Player | null>(null);
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [matchmakingProgress, setMatchmakingProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Responsive check
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const addMessage = useCallback((sender: string, text: string, color?: Color) => {
    setMessages(prev => [...prev.slice(-15), { sender, text, color }]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Robust AI turn handler: Auto-triggers AI moves if it's their turn
  useEffect(() => {
    if (phase === 'PLAYING' && !winner && !isRolling && !canMove && !diceValue) {
      const currentPlayer = players[currentPlayerIdx];
      if (currentPlayer?.isAI) {
        const timer = setTimeout(() => {
          // Double check conditions before executing
          if (!isRolling && !canMove && !diceValue) {
             handleRoll();
          }
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [phase, currentPlayerIdx, players, isRolling, canMove, diceValue, winner]);

  const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

  const handleShare = async () => {
    const text = `Join my Lumina Ludo match! Room Code: ${roomCode}`;
    const shareData = {
      title: 'Lumina Ludo Invitation',
      text: text,
      url: window.location.href
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(text);
        addMessage("System", "Invite text copied to clipboard!", "BLUE");
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Share failed', err);
        // Fallback for desktop/non-supporting browsers
        navigator.clipboard.writeText(text);
        addMessage("System", "Invitation copied to clipboard!", "BLUE");
      }
    }
  };

  const startVsAI = async () => {
    setPhase('MATCHMAKING');
    setMatchmakingProgress(20);
    const opponents = await generateOpponents(3);
    setMatchmakingProgress(100);
    initGame(opponents, true);
  };

  const startLocalMatch = (playerCount: number) => {
    const localPlayers: Player[] = COLORS.slice(0, playerCount).map((color, idx) => ({
      color,
      name: `Player ${idx + 1}`,
      isAI: false,
      isHuman: true,
      tokens: [0, 1, 2, 3].map(id => ({ id, color, position: -1 }))
    }));
    setPlayers(localPlayers);
    setPhase('PLAYING');
    setCurrentPlayerIdx(0);
    setDiceValue(null);
    setCanMove(false);
    setWinner(null);
    addMessage("System", "Local PvP Match Started!", "BLUE");
  };

  const handleHost = () => {
    const code = generateCode();
    setRoomCode(code);
    setPhase('HOSTING');
    // Simulated matchmaking for online mode
    setTimeout(async () => {
      const opponents = await generateOpponents(3);
      addMessage("System", "External players connected!", "GREEN");
      setTimeout(() => initGame(opponents, false), 2000);
    }, 4000);
  };

  const handleJoin = () => {
    if (joinCode.length !== 6) return;
    setPhase('MATCHMAKING');
    setMatchmakingProgress(40);
    setTimeout(async () => {
      const opponents = await generateOpponents(3);
      initGame(opponents, false);
    }, 2000);
  };

  const startQuickMatch = async () => {
    setPhase('MATCHMAKING');
    setMatchmakingProgress(0);
    const interval = setInterval(() => setMatchmakingProgress(p => Math.min(p + 15, 99)), 400);
    const opponents = await generateOpponents(3);
    clearInterval(interval);
    setMatchmakingProgress(100);
    initGame(opponents, false);
  };

  // Added handleModeSelect to fix the "Cannot find name 'handleModeSelect'" error
  const handleModeSelect = (mode: 'LOCAL' | 'AI' | 'ONLINE') => {
    if (mode === 'LOCAL') {
      setPhase('LOCAL_SETUP');
    } else if (mode === 'AI') {
      startVsAI();
    } else if (mode === 'ONLINE') {
      setPhase('ONLINE_LOBBY');
    }
  };

  const initGame = (aiProfiles: any[], isFullAI: boolean) => {
    const initialPlayers: Player[] = COLORS.map((color, idx) => {
      const profile = aiProfiles[idx - 1];
      return {
        color,
        name: idx === 0 ? "You" : (profile?.name || `Bot_${color}`),
        isAI: idx > 0,
        isHuman: idx === 0,
        tokens: [0, 1, 2, 3].map(id => ({ id, color, position: -1 }))
      };
    });
    setPlayers(initialPlayers);
    setPhase('PLAYING');
    setCurrentPlayerIdx(0);
    setDiceValue(null);
    setCanMove(false);
    setWinner(null);
    setMessages([{ sender: "System", text: isFullAI ? "Vs AI Mode Activated" : "Online Server Connected", color: "BLUE" }]);
  };

  const nextTurn = useCallback(() => {
    setDiceValue(null);
    setCanMove(false);
    setCurrentPlayerIdx(prev => (prev + 1) % players.length);
  }, [players.length]);

  const handleMove = async (tokenId: number) => {
    if (!canMove || diceValue === null) return;
    const currentPlayer = players[currentPlayerIdx];
    const token = currentPlayer.tokens.find(t => t.id === tokenId);
    
    // Validate move
    if (!token || token.position === 100) return;
    if (token.position === -1 && diceValue !== 6) return;
    if (token.position >= 52 && token.position + diceValue > 57) return;

    let newPos = token.position === -1 ? 0 : token.position + diceValue;
    if (newPos === 57) newPos = 100;

    const getAbs = (pos: number, col: Color) => (pos < 0 || pos >= 52) ? -1 : (pos + START_POSITIONS[col]) % 52;
    const targetAbs = getAbs(newPos, currentPlayer.color);

    setPlayers(prev => {
      const next = [...prev];
      const p = next[currentPlayerIdx];
      let captured = false;
      
      if (targetAbs !== -1 && !SAFE_SPOTS.includes(targetAbs)) {
        next.forEach((opp, oIdx) => {
          if (oIdx !== currentPlayerIdx) {
            opp.tokens.forEach(t => {
              if (getAbs(t.position, opp.color) === targetAbs) {
                t.position = -1;
                captured = true;
                addMessage("Combat", `${p.name} sent ${opp.name} home!`, p.color);
              }
            });
          }
        });
      }

      const t = p.tokens.find(tk => tk.id === tokenId)!;
      t.position = newPos;
      if (p.tokens.every(tk => tk.position === 100)) setWinner(p);
      return next;
    });

    if (diceValue === 6) {
      setDiceValue(null);
      setCanMove(false);
      addMessage("Bonus", "Six rolled! Roll again.", currentPlayer.color);
    } else {
      nextTurn();
    }
  };

  const handleRoll = async () => {
    if (isRolling || canMove || winner) return;
    setIsRolling(true);
    const val = Math.floor(Math.random() * 6) + 1;
    
    setTimeout(async () => {
      setDiceValue(val);
      setIsRolling(false);
      const cur = players[currentPlayerIdx];
      const valid = cur.tokens.filter(t => t.position !== 100 && (t.position === -1 ? val === 6 : t.position < 52 || t.position + val <= 57));

      if (valid.length === 0) {
        addMessage(cur.name, "No valid moves.", cur.color);
        setTimeout(nextTurn, 1000);
      } else {
        setCanMove(true);
        if (cur.isAI) {
          try {
            const aiMove = await getGeminiAIMove(cur, val, players);
            if (aiMove.commentary) addMessage(cur.name, aiMove.commentary, cur.color);
            
            // Check if AI tokenId is valid, if not fallback to first valid move
            const selectedToken = valid.find(v => v.id === aiMove.tokenId) || valid[0];
            setTimeout(() => handleMove(selectedToken.id), 1200);
          } catch (e) {
            // Fallback for AI if service fails
            setTimeout(() => handleMove(valid[0].id), 800);
          }
        }
      }
    }, 800);
  };

  const getInstructionText = () => {
    if (winner) return `${winner.name} won the match!`;
    if (isRolling) return "Dice is rolling...";
    if (canMove) return "Choose a piece to move";
    const cur = players[currentPlayerIdx];
    if (cur?.isAI) return `${cur.name} (AI) is calculating...`;
    return `Your turn, ${cur?.name}! Tap the dice.`;
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start lg:justify-center p-4 lg:p-10 bg-[#F4F7FA] overflow-x-hidden">
      <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-6 h-full items-stretch">
        
        {/* Play Sidebar */}
        {(phase === 'PLAYING' || phase === 'MATCHMAKING') && (
          <div className="w-full lg:w-72 flex flex-col gap-4 shrink-0 order-2 lg:order-1 animate-in slide-in-from-left duration-500">
            <div className="glass rounded-[2rem] p-6 shadow-xl border-white/60">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-blue-500 rounded-2xl text-white shadow-lg shadow-blue-100"><Globe size={20} /></div>
                <div>
                  <h1 className="text-xl font-black text-slate-800 tracking-tight">Lumina</h1>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Live Match</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {players.map((p, idx) => (
                  <div key={p.color} className={`p-3 rounded-2xl border transition-all duration-300 ${currentPlayerIdx === idx ? 'bg-white shadow-lg border-blue-100 ring-4 ring-blue-50 scale-105' : 'bg-slate-50/50 border-transparent opacity-40'}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: p.color.toLowerCase() }} />
                      <span className="text-[10px] font-bold truncate text-slate-700">{p.name}</span>
                    </div>
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-tight">{p.tokens.filter(t => t.position === 100).length}/4 HOME</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-[2rem] p-6 shadow-xl border-white/60 flex-1 flex flex-col min-h-[350px] lg:min-h-0">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <MessageSquare size={14} className="text-blue-500" /> Server Logs
              </h2>
              <div className="flex-1 overflow-y-auto space-y-3 scrollbar-hide mb-4 pr-1">
                {messages.length === 0 && <p className="text-[10px] text-slate-300 italic text-center py-4">Waiting for match data...</p>}
                {messages.map((m, i) => (
                  <div key={i} className="animate-in fade-in slide-in-from-bottom-1 duration-300">
                    <span className="text-[8px] font-black uppercase tracking-wider opacity-60" style={{ color: m.color ? m.color.toLowerCase() : '#64748b' }}>{m.sender}</span>
                    <p className="text-xs text-slate-600 bg-white/40 p-3 rounded-2xl border border-white/20 mt-1 shadow-sm leading-relaxed">{m.text}</p>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="flex gap-2">
                <input type="text" placeholder="Send emoji..." className="flex-1 bg-white/50 border border-white/30 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:ring-4 ring-blue-50 transition-all" />
                <button className="p-3 bg-blue-500 text-white rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-600 transition-all"><Send size={16} /></button>
              </div>
            </div>
          </div>
        )}

        {/* Main Interactive Zone */}
        <div className="flex-1 flex flex-col items-center justify-center order-1 lg:order-2">
          
          {phase === 'MODE_SELECT' && (
            <div className="w-full max-w-lg animate-in fade-in zoom-in duration-700">
              <div className="glass rounded-[3.5rem] p-10 lg:p-16 text-center shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] border-white/80 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500 opacity-40" />
                <h2 className="text-4xl lg:text-5xl font-black text-slate-800 mb-4 tracking-tighter">Lumina Ludo</h2>
                <p className="text-slate-400 text-sm font-medium mb-12 uppercase tracking-[0.2em]">Select Game Mode</p>
                
                <div className="space-y-4 lg:space-y-6">
                  {[
                    { id: 'LOCAL' as const, label: 'Offline PvP', icon: Users, color: 'bg-blue-50', iconColor: 'text-blue-600', sub: 'Person to Person' },
                    { id: 'AI' as const, label: 'Complete with AI', icon: Bot, color: 'bg-indigo-50', iconColor: 'text-indigo-600', sub: 'vs Smart Bots' },
                    { id: 'ONLINE' as const, label: 'Online PvP', icon: Globe, color: 'bg-slate-50', iconColor: 'text-slate-700', sub: 'Private or Global' }
                  ].map((mode) => (
                    <button 
                      key={mode.id}
                      onClick={() => handleModeSelect(mode.id)}
                      className="group w-full flex items-center gap-6 p-6 lg:p-8 rounded-[2.5rem] bg-white border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-all shadow-sm active:scale-[0.98] text-left"
                    >
                      <div className={`p-4 lg:p-5 rounded-3xl ${mode.color} transition-transform group-hover:scale-110 shadow-inner`}>
                        <mode.icon className={mode.iconColor} size={28} />
                      </div>
                      <div>
                        <span className="text-xl font-black text-slate-800 tracking-tight block">{mode.label}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{mode.sub}</span>
                      </div>
                      <div className="ml-auto p-3 rounded-full bg-slate-50 group-hover:bg-blue-100 transition-colors">
                        <Play size={16} className="text-slate-300 group-hover:text-blue-500" />
                      </div>
                    </button>
                  ))}
                </div>
                
                <div className="mt-12 flex items-center justify-center gap-3">
                   <div className="flex -space-x-2">
                      {[1, 2, 3].map(i => <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200" />)}
                   </div>
                   <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">1.2k players active</span>
                </div>
              </div>
            </div>
          )}

          {phase === 'LOCAL_SETUP' && (
            <div className="w-full max-w-md animate-in fade-in duration-300">
              <div className="glass rounded-[3.5rem] p-12 text-center shadow-2xl border-white/80">
                <button onClick={() => setPhase('MODE_SELECT')} className="absolute top-8 left-8 p-3 text-slate-400 hover:text-slate-800 bg-white rounded-2xl shadow-sm transition-all"><ArrowLeft size={20} /></button>
                <h2 className="text-3xl font-black text-slate-800 mb-2 mt-4">Offline Play</h2>
                <p className="text-slate-400 text-xs mb-10 font-medium">How many people are playing?</p>
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {[2, 3, 4].map(num => (
                    <button 
                      key={num} 
                      onClick={() => startLocalMatch(num)}
                      className="group aspect-square flex flex-col items-center justify-center gap-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:bg-blue-50 hover:border-blue-100 transition-all active:scale-95"
                    >
                      <span className="text-4xl font-black text-slate-800 group-hover:text-blue-600 transition-colors">{num}</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Players</span>
                    </button>
                  ))}
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl text-[10px] text-slate-400 font-bold uppercase tracking-widest">Pass the device to take turns</div>
              </div>
            </div>
          )}

          {phase === 'ONLINE_LOBBY' && (
            <div className="w-full max-w-md animate-in fade-in duration-300">
              <div className="glass rounded-[3.5rem] p-12 text-center shadow-2xl border-white/80">
                <button onClick={() => setPhase('MODE_SELECT')} className="absolute top-8 left-8 p-3 text-slate-400 hover:text-slate-800 bg-white rounded-2xl shadow-sm transition-all"><ArrowLeft size={20} /></button>
                <h2 className="text-3xl font-black text-slate-800 mb-10 mt-4">Online Hub</h2>
                <div className="space-y-5">
                  <button onClick={handleHost} className="w-full py-6 bg-blue-600 text-white rounded-[2.5rem] font-black shadow-2xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-4 active:scale-95">
                    <UserPlus size={22} /> Host Private Match
                  </button>
                  <div className="flex gap-3">
                    <input 
                      value={joinCode} 
                      onChange={e => setJoinCode(e.target.value.slice(0, 6))}
                      placeholder="Room Code" 
                      className="flex-1 bg-white border border-slate-100 rounded-[1.5rem] px-6 py-5 text-center font-mono font-black tracking-[0.3em] text-2xl focus:outline-none focus:ring-4 ring-blue-50 transition-all shadow-inner" 
                    />
                    <button onClick={handleJoin} className="px-10 bg-slate-800 text-white rounded-[1.5rem] font-black hover:bg-slate-900 transition-all shadow-xl shadow-slate-200">Join</button>
                  </div>
                  <div className="relative py-8">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100 opacity-50"></div></div>
                    <span className="relative bg-white/50 px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Global Proxy</span>
                  </div>
                  <button onClick={startQuickMatch} className="w-full py-5 bg-white text-slate-700 border border-slate-100 rounded-[2rem] font-black shadow-sm hover:bg-slate-50 transition-all active:scale-95">Random Matchmaking</button>
                </div>
              </div>
            </div>
          )}

          {phase === 'HOSTING' && (
            <div className="w-full max-w-md animate-in zoom-in duration-500">
              <div className="glass rounded-[4rem] p-12 lg:p-16 text-center shadow-2xl border-white/80">
                <h2 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mb-6">Server Active</h2>
                <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-inner mb-10 group relative">
                  <div className="absolute -inset-1 bg-blue-500/5 blur-xl rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 block">Match Invite Code</span>
                  <div className="text-7xl font-mono font-black text-slate-800 tracking-tighter select-all">{roomCode}</div>
                </div>
                <div className="flex flex-col gap-6">
                  <div className="flex items-center justify-center gap-3 text-slate-500 font-black animate-pulse text-xs tracking-widest uppercase">
                    <Loader2 size={20} className="animate-spin text-blue-500" />
                    <span>Awaiting Players...</span>
                  </div>
                  <button 
                    onClick={handleShare}
                    className="w-full py-5 bg-slate-800 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-900 transition-all shadow-2xl shadow-slate-200 active:scale-95"
                  >
                    <Share2 size={20} /> Share Invite
                  </button>
                </div>
              </div>
            </div>
          )}

          {phase === 'MATCHMAKING' && (
            <div className="w-full max-w-md text-center p-16 glass rounded-[4rem] shadow-2xl border-white/80">
              <div className="relative w-28 h-28 mx-auto mb-10">
                 <Loader2 size={112} className="text-blue-500 animate-spin absolute inset-0 opacity-10" />
                 <Globe size={56} className="text-blue-600 absolute inset-0 m-auto animate-bounce" />
              </div>
              <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">Handshaking...</h2>
              <p className="text-slate-400 text-xs mb-8">Establishing low-latency peer connection</p>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner">
                <div className="bg-blue-500 h-full transition-all duration-700 ease-out" style={{ width: `${matchmakingProgress}%` }} />
              </div>
              <p className="text-[10px] text-slate-400 mt-6 font-black uppercase tracking-[0.4em]">Protocol: Lumina-X8</p>
            </div>
          )}

          {phase === 'PLAYING' && (
            <div className="w-full max-w-[min(100%,_720px)] flex flex-col items-center gap-4 animate-in fade-in duration-500">
              
              {/* Mobile Enhanced Instructions Banner */}
              {isMobile && (
                <div className="w-[95%] bg-white/80 backdrop-blur-md text-slate-800 p-4 rounded-[1.5rem] shadow-xl border border-white flex items-center gap-4 animate-in slide-in-from-top-6 duration-500">
                  <div className="p-2 bg-blue-500 rounded-xl text-white shadow-lg shadow-blue-100">
                    <Info size={18} />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-black uppercase tracking-tight text-slate-400 block leading-none mb-1">Status Report</span>
                    <span className="text-sm font-bold tracking-tight text-slate-700">{getInstructionText()}</span>
                  </div>
                </div>
              )}

              <div className="w-full aspect-square glass p-2 lg:p-8 rounded-[3rem] lg:rounded-[5rem] shadow-[0_48px_96px_-24px_rgba(0,0,0,0.12)] relative border-white/60">
                <Board 
                  players={players} 
                  onTokenClick={handleMove} 
                  canMove={canMove} 
                  currentPlayerColor={players[currentPlayerIdx].color}
                />
                
                {/* Fixed Mobile Floating Dice (bottom right) */}
                {isMobile && !winner && (
                  <div className="absolute -bottom-8 right-6 z-50">
                    <div className="transform scale-110 drop-shadow-2xl">
                      <Dice 
                        value={diceValue} 
                        isRolling={isRolling} 
                        onClick={handleRoll} 
                        disabled={players[currentPlayerIdx].isAI || canMove} 
                      />
                    </div>
                  </div>
                )}

                {winner && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-2xl rounded-[3rem] lg:rounded-[5rem] animate-in zoom-in duration-1000">
                    <div className="text-center p-14 lg:p-20 glass rounded-[4rem] shadow-2xl border-white ring-[20px] ring-blue-50/50">
                      <Trophy size={112} className="mx-auto text-yellow-500 mb-6 animate-bounce drop-shadow-2xl" />
                      <h2 className="text-5xl font-black text-slate-800 mb-2 tracking-tighter">{winner.name}</h2>
                      <p className="text-xs text-blue-500 font-black uppercase tracking-[0.5em] mb-12">Match Champion</p>
                      <button onClick={() => setPhase('MODE_SELECT')} className="px-14 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all">Back to Lobby</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Control Sidebar */}
        {(phase === 'PLAYING' || phase === 'MATCHMAKING') && (
          <div className="w-full lg:w-72 flex flex-col gap-4 order-3 animate-in slide-in-from-right duration-500">
            <div className="glass rounded-[2.5rem] p-8 shadow-xl border-white/60 flex flex-col items-center justify-between h-full min-h-[450px]">
              {phase === 'PLAYING' ? (
                <div className="w-full flex flex-col items-center justify-between h-full py-2">
                  <div className="text-center w-full">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] block mb-6">Current Sequence</span>
                    <div className="flex items-center gap-4 bg-white rounded-[2.5rem] p-6 border border-slate-50 shadow-sm transition-all duration-700">
                      <div className="w-16 h-16 rounded-3xl shadow-2xl border-[6px] border-white transition-all transform hover:rotate-12" style={{ backgroundColor: players[currentPlayerIdx].color.toLowerCase() }} />
                      <div className="text-left flex-1 min-w-0">
                        <div className="text-xl font-black text-slate-800 leading-tight truncate">{players[currentPlayerIdx].name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className={`w-2 h-2 rounded-full ${players[currentPlayerIdx].isAI ? 'bg-indigo-400' : 'bg-green-500'} animate-pulse`} />
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{players[currentPlayerIdx].isAI ? 'AI Mind' : 'Verified Human'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Only Dice Section */}
                  {!isMobile && (
                    <div className="flex flex-col items-center gap-6 py-10">
                      <Dice 
                        value={diceValue} 
                        isRolling={isRolling} 
                        onClick={handleRoll} 
                        disabled={players[currentPlayerIdx].isAI || canMove} 
                      />
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] bg-slate-50 px-6 py-2 rounded-full border border-slate-100 shadow-inner">
                        {isRolling ? "Computing..." : canMove ? "Select Piece" : "Roll Dice"}
                      </div>
                    </div>
                  )}

                  <div className="w-full space-y-4">
                    <div className="bg-gradient-to-br from-blue-50/50 to-white p-6 rounded-[2.5rem] border border-white shadow-inner">
                      <div className="flex items-center gap-2 mb-3">
                        <Signal size={12} className="text-blue-500" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Match Integrity</span>
                      </div>
                      <p className="text-[11px] text-slate-500 italic font-medium leading-relaxed">
                        {players[currentPlayerIdx].isAI ? `${players[currentPlayerIdx].name} is evaluating move hierarchies...` : `Match synchronized. Waiting for user ${players[currentPlayerIdx].name}.`}
                      </p>
                    </div>
                    <button onClick={() => setPhase('MODE_SELECT')} className="w-full py-4 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-red-500 transition-colors flex items-center justify-center gap-2 group">
                      <RotateCcw size={14} className="group-hover:rotate-180 transition-transform duration-500" /> 
                      Reset Connection
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-6 text-center opacity-30 h-full py-20">
                  <div className="w-24 h-24 rounded-full border-4 border-dashed border-slate-300 animate-spin-slow flex items-center justify-center">
                    <RotateCcw size={40} className="text-slate-300" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Standby...</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
