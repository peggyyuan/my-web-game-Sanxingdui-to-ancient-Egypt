import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Navigation, 
  Package, 
  Shield, 
  TrendingUp, 
  Map as MapIcon, 
  History, 
  ChevronRight,
  Sun,
  Coins,
  Backpack,
  AlertCircle,
  Trophy,
  ArrowRight,
  HelpCircle,
  RotateCcw,
  Target
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { LOCATIONS, ITEMS, EVENTS, CURRENCIES, INITIAL_TASKS } from './constants';
import { GameState, Location, GameEvent, Task } from './types';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const INITIAL_STATE: GameState = {
  currentLocationId: 'sanxingdui',
  inventory: [
    { itemId: 'gold_mask', quantity: 2 },
    { itemId: 'bronze_tree', quantity: 1 },
    { itemId: 'silk_bolt', quantity: 5 },
  ],
  wallet: {
    cowrie: 500,
    jade_token: 0,
    dirham: 0,
    drachma: 0,
  },
  supplies: 150,
  day: 1,
  maxWeight: 100,
  history: ['从古老的三星堆故城出发。'],
  isGameOver: false,
  isVictory: false,
  tasks: INITIAL_TASKS,
  stats: {
    exchangeLoss: 0,
    tradeProfit: 0,
  },
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [activeEvent, setActiveEvent] = useState<GameEvent | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [inspectCurrency, setInspectCurrency] = useState<string | null>(null);
  const [isSetup, setIsSetup] = useState(true);

  const inspectedCurrencyData = useMemo(() => 
    CURRENCIES.find(c => c.id === inspectCurrency),
    [inspectCurrency]
  );

  const currentLocation = useMemo(() => 
    LOCATIONS.find(l => l.id === gameState.currentLocationId)!,
    [gameState.currentLocationId]
  );

  const connectedLocations = useMemo(() => 
    LOCATIONS.filter(l => currentLocation.connections.includes(l.id)),
    [currentLocation]
  );

  const currentWeight = useMemo(() => 
    gameState.inventory.reduce((total, inv) => {
      const item = ITEMS.find(i => i.id === inv.itemId);
      return total + (item ? item.weight * inv.quantity : 0);
    }, 0),
    [gameState.inventory]
  );

  // Auto-check for resources
  useEffect(() => {
    if (gameState.supplies <= 0 && !gameState.isGameOver) {
      setGameState(prev => ({
        ...prev,
        isGameOver: true,
        history: [...prev.history, '商队在荒无人烟的废墟中耗尽了补给。'],
      }));
    }
  }, [gameState.supplies, gameState.isGameOver]);

  // Task check
  useEffect(() => {
    // Only check if we are not already in a game over state
    if (gameState.isGameOver) return;

    const activeTask = gameState.tasks.find(t => t.status === 'active');
    if (activeTask && activeTask.targetLocationId === gameState.currentLocationId) {
      if (activeTask.requiredItem) {
        const itemInInv = gameState.inventory.find(i => i.itemId === activeTask.requiredItem);
        const hasEnough = itemInInv && itemInInv.quantity >= (activeTask.requiredQuantity || 1);
        
        if (hasEnough) {
           // Task completed automatically if user reaches destination with items
           setGameState(prev => {
             const currentActiveIdx = prev.tasks.findIndex(t => t.id === activeTask.id);
             const isFinalTask = activeTask.id === 3;
             
             const newTasks = prev.tasks.map((t, idx) => {
               if (t.id === activeTask.id) return { ...t, status: 'completed' as const };
               if (idx === currentActiveIdx + 1) return { ...t, status: 'active' as const };
               return t;
             });

             return {
               ...prev,
               tasks: newTasks,
               history: [...prev.history, isFinalTask ? "踏过故乡尘土，这一路行商终成传奇！" : `完成了里程碑：${activeTask.title}`],
               isVictory: isFinalTask ? true : prev.isVictory,
               isGameOver: isFinalTask ? true : prev.isGameOver
             };
           });
           
           if (activeTask.id === 3) {
             console.log("Victory triggered!");
             handleWinAnimation();
           }
        }
      }
    }
  }, [gameState.currentLocationId, gameState.inventory, gameState.tasks, gameState.isGameOver]);

  // Logic to determine achievements
  const getAchievements = () => {
    const list = [];
    if (gameState.isVictory) {
      list.push({ id: 'silk_road_legend', name: '丝路传奇', icon: '🏆', desc: '成功完成从三星堆到埃及的跨文明贸易航线。' });
      if (gameState.day <= 150) list.push({ id: 'speedrunner', name: '神速商队', icon: '⚡', desc: '在 150 天内完成了所有壮举。' });
      if (gameState.stats.tradeProfit >= 1000) list.push({ id: 'tycoon', name: '千金大贾', icon: '💰', desc: '贸易利润突破 1000 贝币结算额。' });
      if (gameState.supplies >= 50) list.push({ id: 'logistician', name: '后勤大师', icon: '🐫', desc: '补给充沛地完成了旅程。' });
      if (gameState.stats.exchangeLoss <= 50) list.push({ id: 'economist', name: '精算师', icon: '📊', desc: '成功将汇兑损失控制在极低水平。' });
    }
    return list;
  };

  const StatItem = ({ label, value }: { label: string; value: string }) => (
    <div className="space-y-1">
      <p className="text-[9px] uppercase tracking-widest text-text-secondary font-bold">{label}</p>
      <p className="text-lg font-ancient text-text-primary px-2">{value}</p>
    </div>
  );

  const handleWinAnimation = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#D4AF37', '#1034A6', '#CD7F32']
    });
  };

  const handleMove = (targetLocation: Location) => {
    if (gameState.isGameOver || activeEvent) return;

    // Time and cost calculation
    const travelDays = Math.floor(Math.random() * 3) + 2;
    const supplyCost = travelDays * 5;

    let newState: GameState = {
      ...gameState,
      currentLocationId: targetLocation.id,
      day: gameState.day + travelDays,
      supplies: Math.max(0, gameState.supplies - supplyCost),
      history: [...gameState.history, `抵达了 ${targetLocation.name} (途中耗时 ${travelDays} 天)。`],
    };

    // Random Event Check (40% chance)
    if (Math.random() < 0.4) {
      const randomEvent = EVENTS[Math.floor(Math.random() * EVENTS.length)];
      setActiveEvent(randomEvent);
      // We pass the new state to the event resolver or just set the state if event is dismissed
      setGameState(newState);
    } else {
      setGameState(newState);
    }
  };

  const resolveEvent = (impact: (state: GameState) => GameState) => {
    setGameState(prev => impact(prev));
    setActiveEvent(null);
  };

  const handleCurrencyExchange = (fromCurrencyId: string, toCurrencyId: string, fromAmount: number) => {
    const fromCurrency = CURRENCIES.find(c => c.id === fromCurrencyId)!;
    const toCurrency = CURRENCIES.find(c => c.id === toCurrencyId)!;

    // Convert fromCurrency amount to base (Cowrie), then to target
    const amountInBase = fromAmount / fromCurrency.rateToBase;
    const amountToReceive = amountInBase * toCurrency.rateToBase;
    const fee = amountToReceive * 0.1; // 10% fee
    const finalAmount = amountToReceive - fee;

    setGameState(prev => ({
      ...prev,
      wallet: {
        ...prev.wallet,
        [fromCurrencyId]: (prev.wallet[fromCurrencyId] || 0) - fromAmount,
        [toCurrencyId]: (prev.wallet[toCurrencyId] || 0) + finalAmount
      },
      stats: {
        ...prev.stats,
        exchangeLoss: prev.stats.exchangeLoss + (fee / toCurrency.rateToBase) // approximate in base
      },
      history: [...prev.history, `将 ${fromAmount} ${fromCurrency.name} 兑换为 ${finalAmount.toFixed(1)} ${toCurrency.name}。`]
    }));
  };

  if (isSetup) {
    return (
      <div className="min-h-screen grid place-items-center dark-gradient p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full text-center space-y-8 p-12 bg-panel-bg/90 backdrop-blur rounded-lg shadow-2xl border border-border-main"
        >
          <div className="space-y-4">
            <h1 className="text-6xl font-ancient text-accent-gold drop-shadow-sm tracking-widest uppercase">丝与金</h1>
            <p className="text-xl font-display italic text-accent-bronze">从三星堆到尼罗河</p>
          </div>
          
          <div className="text-left space-y-4 text-text-primary/80 text-lg leading-relaxed">
            <p>
              现在是公元前12世纪。一位来自遥远东方古蜀国的神秘商人，
              携带着令当地人无法想象的黄金与青铜器物。
            </p>
            <p>
              你的旅程跨越群山、沙漠与帝国。管理好你的补给，
              挺过风暴，在宏伟的埃及宫廷中出售你神圣的货物。
            </p>
          </div>

          <button 
            onClick={() => setIsSetup(false)}
            className="group relative px-12 py-4 bg-accent-bronze text-bg-dark font-ancient text-2xl rounded-sm overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-xl uppercase tracking-wider"
          >
            <span className="relative z-10 flex items-center gap-3">
              开启旅程 <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-bg-dark text-text-primary overflow-hidden">
      {/* Sidebar - Stats & Inventory */}
      <aside className="w-full md:w-80 bg-panel-bg border-r border-border-main p-6 flex flex-col gap-6 relative z-10 overflow-y-auto">
        <div className="space-y-4">
          <h2 className="text-[10px] uppercase tracking-widest text-accent-gold font-bold p-2 border-b border-border-main">商队状态</h2>
          <div className="flex items-center justify-between py-2 border-b border-border-main/50">
            <div className="flex items-center gap-2">
              <Backpack className="w-4 h-4 text-text-secondary" />
              <span className="text-[10px] uppercase tracking-tighter text-text-secondary">商队负重</span>
            </div>
            <div className="text-right">
              <span className={cn(
                "font-ancient text-lg",
                currentWeight > gameState.maxWeight ? "text-red-500 animate-pulse" : "text-accent-gold"
              )}>
                {currentWeight.toFixed(0)}
              </span>
              <span className="text-[10px] text-text-secondary"> / {gameState.maxWeight} 钧</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between py-2 border-b border-border-main/50">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-text-secondary" />
              <span className="text-xs uppercase tracking-tighter text-text-secondary">年份</span>
            </div>
            <span className="font-ancient text-lg text-accent-bronze">公元前 1200 年</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-accent-gold/70" />
              <span className="text-[10px] uppercase tracking-wider text-text-secondary font-bold">已行进天数</span>
            </div>
            <div className="text-right">
              <span className="font-ancient text-xl text-accent-gold">{gameState.day}</span>
              <span className="text-[10px] text-text-secondary ml-1">天</span>
            </div>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border-main/50">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-text-secondary" />
              <span className="text-[10px] uppercase tracking-tighter text-text-secondary">资产统计 (贝币)</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 pb-2">
            <div className="bg-white/5 p-2 rounded">
              <p className="text-[8px] text-text-secondary uppercase">兑换损失</p>
              <p className="text-sm font-ancient text-red-400">{gameState.stats.exchangeLoss.toFixed(1)}</p>
            </div>
            <div className="bg-white/5 p-2 rounded">
              <p className="text-[8px] text-text-secondary uppercase">贸易利润</p>
              <p className="text-sm font-ancient text-green-400">{gameState.stats.tradeProfit.toFixed(1)}</p>
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-[8px] uppercase tracking-widest text-accent-gold/50 font-bold mb-1 flex items-center justify-between">
              货币钱包
              <span className="text-[7px] lowercase opacity-60">点击查看百科</span>
            </h3>
            {CURRENCIES.map(curr => (
              <button 
                key={curr.id} 
                onClick={() => setInspectCurrency(curr.id)}
                className="w-full flex items-center justify-between text-[11px] py-1 border-b border-white/5 hover:bg-white/5 transition-colors text-left"
              >
                <span className="text-text-secondary">{curr.symbol} {curr.name}</span>
                <span className="font-ancient text-accent-gold">{(gameState.wallet[curr.id] || 0).toFixed(1)}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between py-2 border-b border-white/5 group relative">
            <div className="flex items-center gap-2">
              <Backpack className={clsx(
                "w-4 h-4 transition-colors",
                gameState.supplies < 30 ? "text-red-500" : "text-accent-egypt-blue"
              )} />
              <span className="text-[10px] uppercase tracking-wider text-text-secondary font-bold">商队补给存量</span>
            </div>
            <div className="text-right flex items-center gap-2">
              {gameState.supplies < 30 && (
                <motion.div
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <AlertCircle className="w-3 h-3 text-red-500" />
                </motion.div>
              )}
              <span className={clsx(
                "font-ancient text-xl",
                gameState.supplies < 30 ? "text-red-500 font-bold" : "text-accent-egypt-blue"
              )}>{gameState.supplies}</span>
              <span className={clsx(
                "text-[10px] ml-1",
                gameState.supplies < 30 ? "text-red-500" : "text-text-secondary"
              )}>份</span>
            </div>
            
            {gameState.supplies < 30 && (
              <div className="absolute -top-8 right-0 bg-red-900/90 text-white text-[9px] px-2 py-1 rounded border border-red-500 whitespace-nowrap z-10">
                补给即将耗尽！请尽快前往城市采购！
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-4 min-h-0 overflow-y-auto pr-2">
          <h2 className="text-[10px] uppercase tracking-widest text-accent-bronze font-bold sticky top-0 bg-panel-bg py-1 border-b border-border-main mb-2">商队货物</h2>
          {gameState.inventory.length === 0 ? (
            <p className="text-xs text-text-secondary/40 italic">货舱空空如也...</p>
          ) : (
            <div className="space-y-2">
              {gameState.inventory.map(slot => {
                const item = ITEMS.find(i => i.id === slot.itemId)!;
                const currCurrency = CURRENCIES.find(c => c.id === currentLocation.currencyId)!;
                
                // Price logic repeated for info (could refactor, but keeping it localized for now)
                let multiplier = 1.0;
                let bestMarket = "中东/波斯";
                
                if (item.type === 'artifact') {
                  if (currentLocation.culturalArea === 'Egypt') multiplier = 4.5;
                  bestMarket = "埃及 (4.5x)";
                } else if (item.type === 'commodity') {
                  if (currentLocation.culturalArea === 'Egypt') multiplier = 3.0;
                  bestMarket = "埃及 (3.0x)";
                } else if (item.type === 'egyptian_good') {
                  if (currentLocation.culturalArea === 'China') multiplier = 5.0;
                  bestMarket = "古蜀三星堆 (5.0x)";
                }
                
                const localPrice = Math.floor(item.baseValue * currCurrency.rateToBase * multiplier);

                return (
                  <motion.div 
                    layout
                    key={slot.itemId}
                    className="flex flex-col gap-2 p-3 bg-white/[0.04] border border-white/10 rounded-md group hover:bg-white/[0.08] transition-all relative overflow-hidden"
                  >
                    {/* Quantity Badge */}
                    <div className="absolute top-0 right-0 px-2 py-0.5 bg-accent-gold text-bg-dark text-[10px] font-bold rounded-bl-md shadow-sm">
                      {slot.quantity} 份
                    </div>

                    <div className="flex items-start gap-3 mt-1">
                      <span className="text-2xl drop-shadow-md">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-display text-text-primary truncate font-bold">{item.name}</p>
                        <p className="text-[9px] text-text-secondary uppercase tracking-widest mt-0.5">总重量: {item.weight * slot.quantity}d</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-1.5 pt-2 mt-1 border-t border-white/5">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-[9px] text-text-secondary uppercase">当前市场售价:</span>
                        <span className="text-sm font-ancient text-accent-gold font-bold">
                          {localPrice} {currCurrency.name}
                        </span>
                      </div>
                      <div className="flex justify-between items-center px-1 py-1 bg-white/5 rounded-sm">
                        <span className="text-[8px] text-accent-bronze uppercase font-bold italic">建议目的地:</span>
                        <span className="text-[9px] text-accent-gold text-right font-serif underline decoration-accent-gold/30 underline-offset-2">
                          {bestMarket}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <button 
            onClick={() => setShowRules(true)}
            className="flex items-center justify-center gap-2 py-3 bg-accent-gold/5 hover:bg-accent-gold/10 text-accent-gold text-[10px] uppercase tracking-widest rounded-sm border border-accent-gold/20 transition-all"
          >
            <HelpCircle className="w-4 h-4" /> 游戏规则
          </button>
          <button 
            onClick={() => setShowHistory(true)}
            className="flex items-center justify-center gap-2 py-3 bg-white/[0.05] hover:bg-white/[0.1] text-text-secondary text-[10px] uppercase tracking-widest rounded-sm border border-border-main transition-all"
          >
            <History className="w-4 h-4" /> 旅程日志
          </button>
          <button 
            onClick={() => {
              if (window.confirm('您确定要放弃当前进度并重新开始吗？')) {
                setGameState(INITIAL_STATE);
                setActiveEvent(null);
                setIsSetup(true);
              }
            }}
            className="flex items-center justify-center gap-2 py-3 bg-red-900/5 hover:bg-red-900/15 text-red-400 text-[10px] uppercase tracking-widest rounded-sm border border-red-900/20 transition-all mt-4"
          >
            <RotateCcw className="w-4 h-4" /> 重新开始
          </button>
        </div>
      </aside>

      {/* Main Map View */}
      <main className="flex-1 relative flex flex-col p-4 md:p-8 min-w-0 dark-gradient overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-accent-gold font-bold">路线图</p>
            <h1 className="text-4xl font-ancient text-text-primary uppercase flex items-center gap-3 tracking-widest">
              <Navigation className="w-6 h-6 text-accent-bronze" />
              {currentLocation.name}
            </h1>
          </div>
          
          <div className="text-right max-w-xs relative z-30">
            <p className="text-[10px] uppercase tracking-widest text-accent-bronze font-bold mb-1">当前目标</p>
            {gameState.tasks.filter(t => t.status === 'active').map(t => {
               const hasItem = t.requiredItem ? (gameState.inventory.find(inv => inv.itemId === t.requiredItem)?.quantity || 0) >= (t.requiredQuantity || 1) : true;
               const atDestination = t.targetLocationId === gameState.currentLocationId;

               return (
                 <div key={t.id} className={cn(
                   "bg-panel-bg border px-4 py-2 rounded-sm text-right flex flex-col items-end gap-1 shadow-2xl backdrop-blur-md transition-all",
                   atDestination && !hasItem ? "border-red-500/50 bg-red-900/20" : "border-accent-gold/20"
                 )}>
                   <p className="text-accent-gold font-bold text-xs uppercase tracking-wider">{t.title}</p>
                   <p className="text-[9px] text-text-secondary leading-tight italic">{t.description}</p>
                   
                   {t.requiredItem && (
                     <div className="flex items-center gap-2 mt-1">
                       <span className="text-[8px] text-text-secondary uppercase">进度:</span>
                       <span className={cn(
                         "text-[10px] font-bold",
                         hasItem ? "text-green-500" : "text-amber-500"
                       )}>
                         {ITEMS.find(i => i.id === t.requiredItem)?.name} ({(gameState.inventory.find(i => i.itemId === t.requiredItem)?.quantity || 0)}/{(t.requiredQuantity || 1)})
                       </span>
                     </div>
                   )}

                   {atDestination && !hasItem && (
                     <div className="mt-1 flex items-center gap-1 text-[8px] text-red-400 font-bold animate-pulse">
                       <AlertCircle className="w-2 h-2" />
                       已抵目的地，但缺少物资！
                     </div>
                   )}
                 </div>
               );
             })}
          </div>
        </div>

        {/* The World Map */}
        <div className="flex-1 relative bg-black/40 rounded-lg border border-border-main shadow-2xl overflow-hidden flex items-center justify-center p-4">
          <div className="absolute top-4 left-6 text-[10px] uppercase tracking-[0.2em] text-accent-gold/40 font-serif italic">南方丝绸之路</div>
          
          {/* Connecting Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
            {LOCATIONS.flatMap(loc => 
              loc.connections.map(targetId => {
                const target = LOCATIONS.find(l => l.id === targetId)!;
                if (loc.id < target.id) {
                  return (
                    <motion.line
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 1.5 }}
                      key={`${loc.id}-${target.id}`}
                      x1={`${loc.coords.x}%`}
                      y1={`${loc.coords.y}%`}
                      x2={`${target.coords.x}%`}
                      y2={`${target.coords.y}%`}
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeDasharray="5 5"
                      className="text-border-main"
                    />
                  );
                }
                return null;
              })
            )}
          </svg>

          {/* Location Nodes */}
          {LOCATIONS.map(loc => {
            const isCurrent = loc.id === gameState.currentLocationId;
            const isDestination = currentLocation.connections.includes(loc.id);
            
            return (
              <motion.div
                key={loc.id}
                style={{ left: `${loc.coords.x}%`, top: `${loc.coords.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2"
              >
                <div className="relative group">
                  <motion.button
                    disabled={!isDestination || gameState.isGameOver}
                    onClick={() => handleMove(loc)}
                    animate={{
                      scale: isCurrent ? 1.4 : isDestination ? 1.1 : 1,
                    }}
                    whileHover={isDestination ? { scale: 1.4 } : {}}
                    className={cn(
                      "w-5 h-5 rounded-full transition-all flex items-center justify-center border-2 border-white/10",
                      isCurrent ? "bg-accent-gold shadow-[0_0_20px_rgba(212,175,55,1)] z-20 scale-125" : 
                      isDestination ? "bg-accent-egypt-blue shadow-[0_0_20px_rgba(16,52,166,1)] cursor-pointer z-10" : 
                      "bg-accent-bronze/40"
                    )}
                  >
                    {isDestination && <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                  </motion.button>
                  
                  {/* Label */}
                  <div className={cn(
                    "absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 pointer-events-none transition-all",
                    isCurrent ? "text-accent-gold scale-110" : 
                    isDestination ? "text-accent-egypt-blue opacity-100" : "text-text-secondary/40 opacity-0 group-hover:opacity-100"
                  )}>
                    {loc.name}
                  </div>
                </div>
              </motion.div>
            );
          })}

          <div className="caravan absolute left-[45%] top-[40%] text-2xl opacity-80 pointer-events-none drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
            🐫
          </div>
        </div>

        {/* Travel Options Footer & Market */}
        <div className="mt-8 flex flex-col lg:flex-row gap-4">
          <div className="flex-1 bg-panel-bg rounded-lg p-6 border border-border-main">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] uppercase tracking-widest text-accent-gold font-bold">当地市场</h3>
              <div className="flex items-center gap-2 text-accent-bronze">
                <Coins className="w-4 h-4" />
                <span className="font-ancient text-sm">
                  {(gameState.wallet[currentLocation.currencyId] || 0).toFixed(1)} {CURRENCIES.find(c => c.id === currentLocation.currencyId)?.name}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              <div className="flex flex-col gap-2">
                    <button
                      disabled={gameState.isGameOver || (gameState.wallet[currentLocation.currencyId] || 0) < 10 || gameState.supplies >= 150}
                      onClick={() => {
                        const currId = currentLocation.currencyId;
                        setGameState(prev => ({
                          ...prev,
                          wallet: {
                            ...prev.wallet,
                            [currId]: (prev.wallet[currId] || 0) - 10,
                          },
                          supplies: Math.min(150, prev.supplies + 30),
                          history: [...prev.history, `在 ${currentLocation.name} 补充了补给存量。`]
                        }));
                      }}
                      className={clsx(
                        "flex items-center justify-between p-3 rounded-sm transition-all group border",
                        (gameState.isGameOver || (gameState.wallet[currentLocation.currencyId] || 0) < 10)
                          ? "bg-red-950/20 border-red-900/50 opacity-60 grayscale cursor-not-allowed" 
                          : "market-price-tag hover:bg-white/[0.05] border-border-main"
                      )}
                    >
                  <div className="flex items-center gap-2">
                    <Backpack className={clsx(
                      "w-3 h-3",
                      (gameState.wallet[currentLocation.currencyId] || 0) < 10 ? "text-red-400" : "text-text-secondary"
                    )} />
                    <div className="text-left">
                      <p className="text-[10px] font-bold text-text-primary uppercase tracking-wider">采购补给物资</p>
                      <p className="text-[8px] text-text-secondary/60">获取 30 单位补给</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={clsx(
                      "text-[10px] font-ancient block",
                      (gameState.wallet[currentLocation.currencyId] || 0) < 10 ? "text-red-400" : "text-accent-gold"
                    )}>10 {CURRENCIES.find(c => c.id === currentLocation.currencyId)?.name}</span>
                    {(gameState.wallet[currentLocation.currencyId] || 0) < 10 && (
                      <span className="text-[7px] text-red-400/80 uppercase block mt-0.5">余额不足</span>
                    )}
                  </div>
                </button>
                {(gameState.wallet[currentLocation.currencyId] || 0) < 10 && (
                  <p className="text-[8px] text-red-400/60 text-center px-4 italic">您需要先前往右侧的“货币兑换处”，将手中的异国钱币兑换为当地货币。</p>
                )}
              </div>

              {/* Dynamic Items for Trade based on Location */}
              {ITEMS.filter(i => i.type !== 'supply').map(item => {
                const invItem = gameState.inventory.find(inv => inv.itemId === item.id);
                const currCurrency = CURRENCIES.find(c => c.id === currentLocation.currencyId)!;
                
                // Base calculation for price: baseValue * rateToBase * locationMultiplier
                let multiplier = 1.0;
                if (item.type === 'artifact' && currentLocation.culturalArea === 'Egypt') multiplier = 4.5;
                if (item.id === 'silk_bolt' && currentLocation.culturalArea === 'Egypt') multiplier = 3.5;
                if (item.id === 'spices' && currentLocation.culturalArea === 'China') multiplier = 4.0;
                if (item.type === 'egyptian_good' && currentLocation.culturalArea === 'China') multiplier = 5.0;
                
                const price = Math.floor(item.baseValue * currCurrency.rateToBase * multiplier);
                
                const balance = gameState.wallet[currentLocation.currencyId] || 0;
                const canAfford = Math.floor(balance / price);
                const remainingWeight = gameState.maxWeight - currentWeight;
                const canCarry = Math.floor(remainingWeight / item.weight);
                const maxPossible = Math.max(0, Math.min(canAfford, canCarry));

                // Profit analysis
                let targetArea = '未知';
                let sellMultiplier = 1.0;
                
                if (item.type === 'artifact' || item.id === 'silk_bolt') {
                  targetArea = '埃及';
                  sellMultiplier = item.type === 'artifact' ? 4.5 : 3.5;
                } else if (item.type === 'egyptian_good' || item.id === 'spices') {
                  targetArea = '三星堆';
                  sellMultiplier = item.id === 'spices' ? 4.0 : 5.0;
                }
                
                const targetValue = Math.floor(item.baseValue * sellMultiplier);
                const profitMargin = ((targetValue - item.baseValue) / item.baseValue * 100).toFixed(0);
                const profitMarginNum = parseFloat(profitMargin);
                const isHighProfit = profitMarginNum > 300;

                return (
                  <div key={item.id} className="flex flex-col gap-2 p-3 bg-white/[0.03] border border-border-main rounded-sm group relative">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-bold text-text-primary block">{item.icon} {item.name}</span>
                        <span className="text-[8px] text-text-secondary uppercase font-mono">重 {item.weight} 钧</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-accent-gold block">{price} 🐚</span>
                        <span className={cn(
                          "text-[8px] uppercase font-bold",
                          maxPossible > 0 ? "text-green-500/60" : "text-red-500/60"
                        )}>
                          限购 {maxPossible} 件
                        </span>
                      </div>
                    </div>

                    <div className={cn(
                      "p-2 rounded-sm space-y-1 mb-1 border border-white/5 mt-auto transition-all",
                      isHighProfit ? "bg-accent-gold/20 border-accent-gold/40 shadow-inner" : "bg-white/5 border-white/10"
                    )}>
                      <div className="flex justify-between items-center text-[9px] uppercase tracking-wider text-text-primary">
                        <span className="flex items-center gap-1">
                          <Target className="w-2 h-2 text-accent-gold" />
                          销往: <span className="text-accent-gold font-bold">{targetArea}</span>
                        </span>
                        <span className="text-accent-gold font-bold">回报 {targetValue} 🐚</span>
                      </div>
                      <div className="w-full h-1 bg-black/20 rounded-full overflow-hidden flex border border-white/5">
                        <div 
                          className="h-full bg-accent-gold shadow-[0_0_8px_rgba(212,175,55,0.5)]" 
                          style={{ width: `${Math.min(100, (profitMarginNum / 5))}%` }} 
                        />
                      </div>
                      <div className="flex justify-between items-center text-[8px] italic font-bold">
                        <span className="text-text-secondary opacity-50">贸易回报率</span>
                        <span className="text-accent-gold">+{profitMargin}%</span>
                      </div>
                    </div>

                    <div className="flex gap-1.5 mt-0.5">
                      <button
                        disabled={gameState.isGameOver || maxPossible <= 0}
                        onClick={() => {
                           setGameState(prev => {
                             const newInv = [...prev.inventory];
                             const idx = newInv.findIndex(i => i.itemId === item.id);
                             if (idx >= 0) newInv[idx].quantity += 1;
                             else newInv.push({ itemId: item.id, quantity: 1 });
                             
                             return {
                               ...prev,
                               wallet: { ...prev.wallet, [currentLocation.currencyId]: (prev.wallet[currentLocation.currencyId] || 0) - price },
                               inventory: newInv,
                               history: [...prev.history, `购买了 ${item.name}。`]
                             };
                           });
                        }}
                        className="flex-1 py-1.5 bg-green-900/30 text-green-400 text-[10px] uppercase font-bold rounded-sm border border-green-500/20 hover:bg-green-800/50 transition-all active:scale-95 disabled:opacity-20"
                      >
                        买入
                      </button>
                      <button
                        disabled={gameState.isGameOver || !invItem || invItem.quantity <= 0}
                        onClick={() => {
                          setGameState(prev => {
                            const newInv = [...prev.inventory];
                            const idx = newInv.findIndex(i => i.itemId === item.id);
                            if (newInv[idx].quantity > 1) newInv[idx].quantity -= 1;
                            else newInv.splice(idx, 1);
                            
                            const profit = price / currCurrency.rateToBase; // normalized profit
                            return {
                              ...prev,
                              wallet: { ...prev.wallet, [currentLocation.currencyId]: (prev.wallet[currentLocation.currencyId] || 0) + price },
                              inventory: newInv,
                              stats: { ...prev.stats, tradeProfit: prev.stats.tradeProfit + profit },
                              history: [...prev.history, `以 ${price} ${currCurrency.name} 的价格卖出了 ${item.name}。`]
                            };
                          });
                        }}
                        className="flex-1 py-1.5 bg-red-900/30 text-red-400 text-[10px] uppercase font-bold rounded-sm border border-red-500/20 hover:bg-red-800/50 transition-all active:scale-95 disabled:opacity-20"
                      >
                        卖出
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:w-1/3 flex flex-col gap-4">
            <div className="bg-panel-bg rounded-lg p-6 border border-border-main">
              <h3 className="text-[10px] uppercase tracking-widest text-accent-gold font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-3 h-3" /> 货币兑换处
              </h3>
              <div className="space-y-4">
                <div className="bg-white/5 p-3 rounded space-y-2 border border-blue-900/30">
                  <p className="text-[9px] text-accent-egypt-blue uppercase font-bold tracking-widest border-b border-blue-900/20 pb-1 flex items-center gap-1">
                    <ArrowRight className="w-2 h-2" /> 兑换为当地货币: {CURRENCIES.find(c => c.id === currentLocation.currencyId)?.name}
                  </p>
                  <div className="space-y-1.5 mt-2 ml-1">
                    {CURRENCIES.map(fromCurr => {
                      if (fromCurr.id === currentLocation.currencyId) return null;
                      const balance = gameState.wallet[fromCurr.id] || 0;
                      if (balance < 1) return null;

                      const toCurr = CURRENCIES.find(c => c.id === currentLocation.currencyId)!;
                      const rate = (1 / fromCurr.rateToBase) * toCurr.rateToBase;
                      const amountToExchange = 10;
                      const canExchange = balance >= amountToExchange;

                      return (
                        <button
                          key={fromCurr.id}
                          disabled={gameState.isGameOver || !canExchange}
                          onClick={() => handleCurrencyExchange(fromCurr.id, toCurr.id, amountToExchange)}
                          className="w-full flex items-center justify-between p-2 hover:bg-white/5 rounded transition-all disabled:opacity-30 border border-transparent hover:border-white/10 group"
                        >
                          <div className="text-left">
                            <p className="text-[10px] text-text-primary">用 {fromCurr.name} {fromCurr.symbol}</p>
                            <p className="text-[8px] text-text-secondary/60 italic">花费 {amountToExchange} {fromCurr.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] text-accent-gold font-bold">+{(amountToExchange * rate * 0.9).toFixed(1)} {toCurr.name}</p>
                            <p className="text-[7px] text-text-secondary uppercase mt-0.5">汇率 {rate.toFixed(2)}</p>
                          </div>
                        </button>
                      );
                    })}
                    {Object.keys(gameState.wallet).filter(k => k !== currentLocation.currencyId && (gameState.wallet[k] || 0) >= 1).length === 0 && (
                      <p className="text-[8px] text-text-secondary/50 italic text-center py-2">没有可用于兑换的异国货币</p>
                    )}
                  </div>
                </div>

                <div className="bg-white/[0.02] p-3 rounded space-y-2 border border-white/5">
                  <p className="text-[9px] text-text-secondary uppercase font-bold tracking-widest border-b border-white/5 pb-1">储备异国货币 (用于未来旅程)</p>
                  <div className="grid grid-cols-1 gap-1.5 mt-2">
                    {CURRENCIES.map(toCurr => {
                      if (toCurr.id === currentLocation.currencyId) return null;
                      const fromCurr = CURRENCIES.find(c => c.id === currentLocation.currencyId)!;
                      const rate = (1 / fromCurr.rateToBase) * toCurr.rateToBase;
                      const amountToSpend = 10;
                      const canExchange = (gameState.wallet[fromCurr.id] || 0) >= amountToSpend;

                      return (
                        <button
                          key={toCurr.id}
                          disabled={!canExchange}
                          onClick={() => handleCurrencyExchange(fromCurr.id, toCurr.id, amountToSpend)}
                          className="flex items-center justify-between p-2 hover:bg-white/5 rounded border border-white/5 hover:border-white/10 transition-colors disabled:opacity-30 group"
                        >
                          <span className="text-[10px] text-text-primary">兑换为 {toCurr.name} {toCurr.symbol}</span>
                          <div className="text-right">
                            <p className="text-[8px] text-accent-gold">扣 {amountToSpend} {fromCurr.name}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <p className="text-[8px] text-text-secondary/40 italic text-center leading-tight">注：每次汇兑包含 10% 的商队物流与安全损耗费</p>
              </div>
            </div>

            <div className="bg-panel-bg rounded-lg p-6 border border-border-main">
              <h3 className="text-[10px] uppercase tracking-widest text-accent-bronze font-bold mb-2">当地风情</h3>
              <p className="text-[11px] text-text-secondary italic leading-relaxed font-serif">
                "{currentLocation.description}"
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Event Modal */}
      <AnimatePresence>
        {activeEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-panel-bg max-w-lg w-full rounded-lg p-10 shadow-2xl border border-border-main overflow-hidden relative"
            >
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-sm flex items-center justify-center text-bg-dark",
                    activeEvent.type === 'positive' ? "bg-green-600" : 
                    activeEvent.type === 'negative' ? "bg-red-600" : "bg-accent-gold"
                  )}>
                    <AlertCircle className="w-5 h-5 shadow-sm" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-ancient text-text-primary uppercase tracking-widest">{activeEvent.title}</h2>
                    <p className="text-[9px] text-text-secondary uppercase tracking-[0.2em] font-bold">意外事件</p>
                  </div>
                </div>

                <p className="text-sm text-text-primary/70 leading-relaxed italic font-serif border-l-2 border-accent-bronze pl-4">
                  "{activeEvent.description}"
                </p>

                <div className="grid gap-3 pt-4">
                  {activeEvent.options ? (
                    activeEvent.options.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => resolveEvent(opt.impact)}
                        className="w-full p-4 text-left border border-border-main rounded-sm hover:border-accent-gold hover:text-accent-gold transition-all group flex items-center justify-between text-xs uppercase tracking-widest"
                      >
                        <span className="font-bold">{opt.text}</span>
                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                      </button>
                    ))
                  ) : (
                    <button
                      onClick={() => resolveEvent(activeEvent.impact || (s => s))}
                      className="w-full p-4 bg-accent-bronze text-bg-dark rounded-sm font-ancient text-sm uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2"
                    >
                      继续远征 <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Game Over / Victory Overlay */}
      <AnimatePresence>
        {gameState.isGameOver && (
          <div className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center p-4 sm:p-6 bg-black/98 backdrop-blur-2xl overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="max-w-3xl w-full text-center space-y-6 sm:space-y-8 p-8 sm:p-12 lg:p-16 rounded-lg bg-panel-bg border border-accent-gold/20 shadow-[0_0_50px_rgba(212,175,55,0.1)] my-auto"
            >
              <div className="space-y-4 sm:space-y-6">
                <div className="flex justify-center flex-wrap gap-2">
                  {getAchievements().map(ach => (
                    <motion.span 
                      key={ach.id}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5 + Math.random() * 0.5 }}
                      className="px-3 py-1 bg-accent-gold/10 border border-accent-gold/30 rounded-full text-[10px] text-accent-gold flex items-center gap-1.5"
                    >
                      <span>{ach.icon}</span> {ach.name}
                    </motion.span>
                  ))}
                </div>

                <h2 className={cn(
                  "text-5xl md:text-7xl lg:text-8xl font-ancient uppercase tracking-[0.2em] drop-shadow-lg leading-tight",
                  gameState.isVictory ? "text-accent-gold" : "text-red-600"
                )}>
                  {gameState.isVictory ? "满载而归" : "历史尘封"}
                </h2>
                
                <div className="space-y-2">
                  <p className="text-xl md:text-2xl font-display italic text-text-primary tracking-wide">
                    {gameState.isVictory 
                      ? "您将尼罗河的智慧带回了北纬30度的古蜀之光。" 
                      : "无情的荒漠吞噬了最后一支寻求真理的商队。"}
                  </p>
                  <p className="text-xs uppercase tracking-[0.5em] text-text-secondary pt-2">
                    历经 {gameState.day} 天 惊心动魄的航程
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-8 border-y border-white/5">
                <StatItem label="贸易总利" value={`${gameState.stats.tradeProfit.toFixed(0)} 🐚`} />
                <StatItem label="汇兑损耗" value={`${gameState.stats.exchangeLoss.toFixed(0)} 🐚`} />
                <StatItem label="行进里程" value={`${(gameState.day * 25).toFixed(0)} 里`} />
                <StatItem label="补给残余" value={`${gameState.supplies} 份`} />
              </div>

              {gameState.isVictory && getAchievements().length > 0 && (
                <div className="space-y-4 text-left max-w-lg mx-auto bg-white/5 p-6 rounded border border-white/10">
                  <h3 className="text-[10px] uppercase tracking-widest text-accent-gold font-bold mb-3 flex items-center gap-2">
                    <Trophy className="w-4 h-4" /> 达成的成就
                  </h3>
                  <div className="space-y-4">
                    {getAchievements().map(ach => (
                      <div key={ach.id} className="flex gap-4">
                        <span className="text-2xl">{ach.icon}</span>
                        <div>
                          <p className="text-sm font-bold text-text-primary">{ach.name}</p>
                          <p className="text-[10px] text-text-secondary leading-relaxed">{ach.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col md:flex-row gap-4 justify-center pt-6">
                <button 
                  onClick={() => {
                    setGameState(INITIAL_STATE);
                    setActiveEvent(null);
                    setIsSetup(true);
                  }}
                  className="px-16 py-4 bg-accent-gold text-bg-dark font-ancient text-xl rounded-sm hover:scale-105 transition-all shadow-xl shadow-accent-gold/20 uppercase tracking-widest whitespace-nowrap"
                >
                  再来一局 / 谱写新传
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* History Slide-out */}
      <AnimatePresence>
        {showHistory && (
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setShowHistory(false)}>
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              onClick={e => e.stopPropagation()}
              className="absolute right-0 top-0 h-full w-full max-w-md bg-panel-bg shadow-2xl border-l border-border-main flex flex-col"
            >
              <div className="p-8 border-b border-border-main flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-ancient text-2xl text-text-primary tracking-widest uppercase">功绩簿</h3>
                  <p className="text-[9px] text-text-secondary uppercase tracking-widest">南方丝绸之路的真实记录</p>
                </div>
                <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-text-secondary">
                  <ChevronRight />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-10 space-y-6">
                {gameState.history.map((log, i) => (
                  <div key={i} className="flex gap-4 items-start group">
                    <div className="mt-2 w-1.5 h-1.5 rounded-full bg-accent-bronze/40 group-hover:bg-accent-gold transition-colors shrink-0" />
                    <p className="text-sm font-serif text-text-secondary italic leading-relaxed group-hover:text-text-primary transition-colors">{log}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Rules Modal */}
      <AnimatePresence>
        {showRules && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm" onClick={() => setShowRules(false)}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-panel-bg max-w-2xl w-full rounded-lg p-10 shadow-2xl border border-border-main relative overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="space-y-6 overflow-y-auto pr-4 custom-scrollbar">
                <div className="space-y-1">
                  <h3 className="text-[10px] uppercase tracking-[0.3em] text-accent-gold font-bold">指南</h3>
                  <h2 className="text-4xl font-ancient text-text-primary uppercase tracking-widest flex items-center gap-4">
                    <Shield className="w-8 h-8 text-accent-bronze" /> 丝路准则
                  </h2>
                </div>

                <div className="space-y-8 text-sm text-text-primary/80 leading-relaxed font-serif">
                  <section className="space-y-3">
                    <h4 className="text-accent-gold font-bold uppercase tracking-widest text-[11px] border-b border-white/10 pb-1">1. 胜利之路 (三步曲)</h4>
                    <div className="space-y-2">
                      <p><span className="text-accent-bronze font-bold">● 第一步：丝路首航</span> —— 携带丝绸前往<span className="text-text-primary underline decoration-accent-gold">撒马尔罕</span>完成首次跨国贸易。</p>
                      <p><span className="text-accent-bronze font-bold">● 第二步：文明赠礼</span> —— 带着三星堆至宝“青铜神树”抵达埃及<span className="text-text-primary underline decoration-accent-gold">孟斐斯</span>。</p>
                      <p><span className="text-accent-bronze font-bold">● 第三步：载誉而归</span> —— 必须在埃及采购并确保货舱中<span className="text-accent-gold font-bold">实际持有“草莎纸卷”</span>，成功运回<span className="text-text-primary underline decoration-accent-gold">三星堆</span>故乡方可触发最终胜利。</p>
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h4 className="text-accent-gold font-bold uppercase tracking-widest text-[11px] border-b border-white/10 pb-1">2. 货币与兑换</h4>
                    <p>世界分为四个币种区。若要在当地进行交易，必须使用当地货币。您可以在“货币兑换处”进行转换。请注意，每次跨国结算都会产生 <span className="text-accent-bronze font-bold">10% 的汇兑手续费</span>。</p>
                  </section>

                  <section className="space-y-3">
                    <h4 className="text-accent-gold font-bold uppercase tracking-widest text-[11px] border-b border-white/10 pb-1">3. 补给与生存</h4>
                    <p>旅途遥远，移动会根据天数消耗补给物资。当<span className="text-red-500 font-bold">补给归零（0 份）</span>时，商队将因饥渴而解体，<span className="text-red-500 font-bold underline decoration-red-500/30 underline-offset-4">游戏将立即结束</span>。务必在每个城市及时通过市场补充物资。</p>
                  </section>

                  <section className="space-y-3">
                    <h4 className="text-accent-gold font-bold uppercase tracking-widest text-[11px] border-b border-white/10 pb-1">4. 贸易秘诀</h4>
                    <p>充分利用“物以稀为贵”的原则。三星堆的古物在埃及具有百倍于家乡的价值，反之亦然。关注每个币种相对于贝币的汇率波动。</p>
                  </section>

                  <section className="space-y-3">
                    <h4 className="text-accent-gold font-bold uppercase tracking-widest text-[11px] border-b border-white/10 pb-1">5. 商贸情报 (Trading Tips)</h4>
                    <ul className="space-y-2 text-xs italic opacity-90 border-l-2 border-accent-gold/30 pl-4 py-1">
                      <li><span className="text-accent-gold font-bold">● 三星堆黄金面具</span>：售往<span className="text-accent-egypt-blue font-bold">埃及</span>受益最高，享受 4.5 倍文化溢价。</li>
                      <li><span className="text-accent-gold font-bold">● 埃及特产</span>：如草莎纸卷、圣甲虫，运回<span className="text-accent-bronze font-bold">三星堆</span>故乡能换取巨额报酬。</li>
                      <li><span className="text-accent-gold font-bold">● 丝绸</span>：在前期的撒马尔罕市场是极佳的原始资金积累手段。</li>
                    </ul>
                  </section>

                  <section className="space-y-3">
                    <h4 className="text-accent-gold font-bold uppercase tracking-widest text-[11px] border-b border-white/10 pb-1">6. 载重与限购</h4>
                    <p>您的商队最大载重为 <span className="text-accent-gold font-bold">100 钧</span>。市场中的“限购”数量受限于您的<span className="text-accent-bronze font-bold">可用余额</span>或<span className="text-accent-bronze font-bold">剩余载重</span>（由系统自动算出）。若需腾出空间，请在市场中卖出较重的货物。</p>
                  </section>
                </div>

                <button 
                  onClick={() => setShowRules(false)}
                  className="w-full py-4 bg-accent-bronze text-bg-dark font-ancient text-lg uppercase tracking-widest hover:brightness-110 transition-all rounded-sm shadow-lg"
                >
                  我已领悟准则
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Currency Encyclopedia Modal */}
      <AnimatePresence>
        {inspectedCurrencyData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm" onClick={() => setInspectCurrency(null)}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-panel-bg max-w-md w-full rounded-lg p-8 shadow-2xl border border-accent-gold/30 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 text-8xl font-ancient select-none">
                {inspectedCurrencyData.symbol}
              </div>
              
              <div className="relative space-y-6">
                <div className="space-y-1">
                  <h3 className="text-[10px] uppercase tracking-[0.3em] text-accent-gold font-bold">丝路百科</h3>
                  <h2 className="text-4xl font-ancient text-text-primary flex items-center gap-4">
                    {inspectedCurrencyData.symbol} {inspectedCurrencyData.name}
                  </h2>
                </div>

                <div className="space-y-4">
                  <p className="text-sm text-text-primary/90 leading-relaxed font-serif italic border-l-2 border-accent-gold pl-4">
                    {inspectedCurrencyData.description}
                  </p>
                  <div className="p-4 bg-white/[0.03] rounded border border-border-main space-y-2">
                    <p className="text-[10px] uppercase tracking-widest text-accent-bronze font-bold">商贸信息</p>
                    <p className="text-xs text-text-secondary flex justify-between">
                      <span>基础汇率比</span>
                      <span className="text-accent-gold font-ancient">1 : {inspectedCurrencyData.rateToBase.toFixed(2)}</span>
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setInspectCurrency(null)}
                  className="w-full py-3 bg-accent-gold/10 text-accent-gold border border-accent-gold/20 hover:bg-accent-gold/20 transition-all text-xs uppercase tracking-widest font-bold rounded"
                >
                  合上百科
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
