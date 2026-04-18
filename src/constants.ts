import { Location, Item, GameEvent, Currency, Task } from './types';

export const CURRENCIES: Currency[] = [
  { 
    id: 'cowrie', 
    name: '贝币', 
    symbol: '🐚', 
    rateToBase: 1.0, 
    description: '在古蜀国与中原文明中，海贝是最早的原始货币。三星堆遗址出土的数千枚海贝证明了当时已存在跨越印度洋的远距离贸易。' 
  },
  { 
    id: 'jade_token', 
    name: '玉币', 
    symbol: '💎', 
    rateToBase: 1.8, 
    description: '西域于阗等地以精美玉石闻名。在正式金属货币流行前，珍贵的玉石是丝绸之路绿洲文明中公认的价值衡量标准。'
  },
  { 
    id: 'dirham', 
    name: '迪拉姆', 
    symbol: '🪙', 
    rateToBase: 3.5, 
    description: '源自美索不达米亚与波斯地区。它是古代中东最坚挺的银币，承载了波斯萨珊帝国与后来阿拉伯世界的商贸荣光。'
  },
  { 
    id: 'drachma', 
    name: '德拉克马', 
    symbol: '🏛️', 
    rateToBase: 6.0, 
    description: '古希腊世界的标准货币。随着亚历山大大帝的征服，德拉克马成为托勒密埃及的官方结算货币，象征着地中海贸易的繁荣。'
  },
];

export const LOCATIONS: Location[] = [
  {
    id: 'sanxingdui',
    name: '三星堆',
    description: '古蜀国神秘的青铜时代文明。',
    coords: { x: 10, y: 50 },
    culturalArea: 'China',
    connections: ['khotan'],
    currencyId: 'cowrie',
  },
  {
    id: 'khotan',
    name: '于阗',
    description: '丝绸之路上著名的绿洲城市，以玉石闻名。',
    coords: { x: 25, y: 45 },
    culturalArea: 'CentralAsia',
    connections: ['sanxingdui', 'samarkand', 'kashgar'],
    currencyId: 'jade_token',
  },
  {
    id: 'kashgar',
    name: '喀什',
    description: '南北丝绸之路交汇的重要枢纽。',
    coords: { x: 35, y: 40 },
    culturalArea: 'CentralAsia',
    connections: ['khotan', 'samarkand'],
    currencyId: 'jade_token',
  },
  {
    id: 'samarkand',
    name: '撒马尔罕',
    description: '丝绸之路上的明珠，多文化交织的十字路口。',
    coords: { x: 45, y: 35 },
    culturalArea: 'CentralAsia',
    connections: ['khotan', 'kashgar', 'rayy'],
    currencyId: 'dirham',
  },
  {
    id: 'rayy',
    name: '雷伊',
    description: '安息帝国和萨珊王朝的主要城市之一。',
    coords: { x: 60, y: 45 },
    culturalArea: 'Persia',
    connections: ['samarkand', 'baghdad'],
    currencyId: 'dirham',
  },
  {
    id: 'baghdad',
    name: '巴格达',
    description: '幼发拉底河与底格里斯河之间古代文明的心脏。',
    coords: { x: 75, y: 50 },
    culturalArea: 'MiddleEast',
    connections: ['rayy', 'petra', 'alexandria'],
    currencyId: 'dirham',
  },
  {
    id: 'petra',
    name: '佩特拉',
    description: '雕刻在峡谷岩壁上的“玫瑰红城市”。',
    coords: { x: 80, y: 65 },
    culturalArea: 'MiddleEast',
    connections: ['baghdad', 'memphis'],
    currencyId: 'drachma',
  },
  {
    id: 'alexandria',
    name: '亚历山大',
    description: '拥有伟大图书馆的地中海璀璨明珠。',
    coords: { x: 88, y: 42 },
    culturalArea: 'Egypt',
    connections: ['baghdad', 'memphis'],
    currencyId: 'drachma',
  },
  {
    id: 'memphis',
    name: '孟斐斯',
    description: '下埃及的古都，临近金字塔。',
    coords: { x: 92, y: 62 },
    culturalArea: 'Egypt',
    connections: ['petra', 'alexandria', 'sanxingdui'], // Shortcut for win? No, let's make them travel back.
    currencyId: 'drachma',
  },
];

export const ITEMS: Item[] = [
  {
    id: 'gold_mask',
    name: '三星堆黄金面具',
    description: '纯金薄片打造，闪烁着古老的神秘光芒。',
    type: 'artifact',
    baseValue: 120, // Value in base currency (Cowrie)
    weight: 2,
    icon: '✨',
  },
  {
    id: 'bronze_tree',
    name: '青铜神树',
    description: '复杂的青铜结构，象征着天地万物的连接。',
    type: 'artifact',
    baseValue: 200,
    weight: 10,
    icon: '🌳',
  },
  {
    id: 'silk_bolt',
    name: '精美丝绸',
    description: '在西方市场，这种精美织物等重于黄金。',
    type: 'commodity',
    baseValue: 40,
    weight: 5,
    icon: '🧵',
  },
  {
    id: 'spices',
    name: '稀有香料',
    description: '带有异域风情的香料，可以掩盖旅途的艰辛。',
    type: 'commodity',
    baseValue: 15,
    weight: 1,
    icon: '🌶️',
  },
  {
    id: 'papyrus',
    name: '草莎纸卷',
    description: '古埃及文明的智慧载体。',
    type: 'egyptian_good',
    baseValue: 80,
    weight: 1,
    icon: '📜',
  },
  {
    id: 'amulet',
    name: '黄金圣甲虫',
    description: '象征重生与永恒的护身符。',
    type: 'egyptian_good',
    baseValue: 150,
    weight: 1,
    icon: '🪲',
  },
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 1,
    title: '丝路首航',
    description: '前往撒马尔罕，将精美丝绸卖个好价钱。',
    targetLocationId: 'samarkand',
    requiredItem: 'silk_bolt',
    status: 'active',
  },
  {
    id: 2,
    title: '文明的赠礼',
    description: '将三星堆的青铜神树送到尼罗河畔的孟斐斯。',
    targetLocationId: 'memphis',
    requiredItem: 'bronze_tree',
    status: 'pending',
  },
  {
    id: 3,
    title: '载誉而归',
    description: '从埃及带回草莎纸卷，返回三星堆故乡。',
    targetLocationId: 'sanxingdui',
    requiredItem: 'papyrus',
    status: 'pending',
  },
];

export const EVENTS: GameEvent[] = [
  {
    id: 'sandstorm',
    title: '特大沙暴',
    description: '一面巨大的沙墙吞没了你的商队。你必须原地等待风暴平息。',
    type: 'negative',
    impact: (state) => ({
      ...state,
      supplies: Math.max(0, state.supplies - 10),
      day: state.day + 2,
      history: [...state.history, '遭遇了一场猛烈的沙尘暴。'],
    }),
  },
  {
    id: 'oasis_rest',
    title: '隐秘绿洲',
    description: '你发现了一片绿意葱葱的休息地，那里有充足的淡水。',
    type: 'positive',
    impact: (state) => ({
      ...state,
      supplies: state.supplies + 20,
      history: [...state.history, '在隐秘的绿洲进行了休整。'],
    }),
  },
];
