
export type ItemType = 'artifact' | 'commodity' | 'supply' | 'egyptian_good';

export interface Item {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  baseValue: number;
  weight: number;
  icon: string;
}

export interface Currency {
  id: string;
  name: string;
  symbol: string;
  rateToBase: number; // relative to Cowrie (Sanxingdui)
  description: string;
}

export interface Location {
  id: string;
  name: string;
  description: string;
  coords: { x: number; y: number }; // 0-100 percentage
  culturalArea: 'China' | 'CentralAsia' | 'Persia' | 'MiddleEast' | 'Egypt';
  connections: string[]; // IDs of connected locations
  currencyId: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  targetLocationId: string;
  requiredItem?: string;
  requiredQuantity?: number;
  status: 'pending' | 'active' | 'completed';
}

export interface GameState {
  currentLocationId: string;
  inventory: { itemId: string; quantity: number }[];
  wallet: Record<string, number>; // currencyId -> amount
  supplies: number;
  day: number;
  maxWeight: number;
  history: string[];
  isGameOver: boolean;
  isVictory: boolean;
  tasks: Task[];
  stats: {
    exchangeLoss: number;
    tradeProfit: number;
  };
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  type: 'positive' | 'negative' | 'neutral';
  impact?: (state: GameState) => GameState;
  options?: {
    text: string;
    impact: (state: GameState) => GameState;
  }[];
}
