
export type Horizon = 'INTRADAY' | 'ONE_YEAR' | 'THREE_YEAR';

export interface StockSnapshot {
  symbol: string;
  ts: number;
  price: number;
  changePct: number;
  returns: {
    "1D": number;
    "1W": number;
    "1M": number;
    "3M": number;
  };
  trend: {
    ma20: number;
    ma50: number;
    aboveMA50: boolean;
  };
  risk: {
    vol20d: number;
    maxDrawdown6m: number;
  };
  fundamentals: {
    peTTM: number;
    roeTTM: number;
    debtToEquity: number;
    revenueGrowthTTM: number;
  };
  news: Array<{
    headline: string;
    source: string;
    url: string;
    publishedAt: string;
  }>;
}

export interface AgentRecommendation {
  agentId: string;
  symbol: string;
  score: number;
  confidence: number;
  tags: string[];
  why: string[];
  riskFlags: string[];
}

export interface CouncilPick extends AgentRecommendation {
  consensusCount: number;
  targetPrice: number;
  projectedReturn: number;
  predictionMethodology: string;
}

export interface ActionItem {
  symbol: string;
  action: 'BUY' | 'SELL' | 'AVOID';
  reason: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface DebateMessage {
  agentId: string;
  text: string;
  timestamp: string;
}

export interface DailyBrief {
  asOfISO: string;
  horizon: Horizon;
  buy5: CouncilPick[];
  sellOrAvoid: ActionItem[];
  debate: DebateMessage[];
  sources: { title: string; uri: string }[];
  chiefSummary: string;
}

export enum AgentType {
  MOMENTUM = 'momentum_v1',
  VALUE = 'value_v1',
  QUALITY = 'quality_v1'
}

export type Screen = 'HOME' | 'AGENTS' | 'PLAN';
