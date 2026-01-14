
import { AgentType, Horizon } from './types';

export const SP500_UNIVERSE = [
  "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "V", "JPM", "AVGO", "COST", "LLY"
];

export const SECTOR_CLUSTERS: Record<string, string[]> = {
  "Big Tech": ["AAPL", "MSFT", "GOOGL", "META", "NVDA", "AVGO"],
  "Consumer/Retail": ["AMZN", "COST"],
  "Financials": ["V", "JPM"],
  "Healthcare": ["LLY"],
  "Automotive": ["TSLA"]
};

export const HORIZON_WEIGHTS: Record<Horizon, Record<AgentType, number>> = {
  INTRADAY: {
    [AgentType.MOMENTUM]: 0.70,
    [AgentType.QUALITY]: 0.20,
    [AgentType.VALUE]: 0.10
  },
  ONE_YEAR: {
    [AgentType.MOMENTUM]: 0.35,
    [AgentType.QUALITY]: 0.35,
    [AgentType.VALUE]: 0.30
  },
  THREE_YEAR: {
    [AgentType.MOMENTUM]: 0.10,
    [AgentType.QUALITY]: 0.40,
    [AgentType.VALUE]: 0.50
  }
};

export const AGENT_METADATA = {
  [AgentType.MOMENTUM]: {
    name: "Momentum Max",
    avatar: "https://picsum.photos/seed/momentum/200",
    color: "bg-blue-500",
    description: "Focuses on price strength and trend persistence."
  },
  [AgentType.VALUE]: {
    name: "Deep Value",
    avatar: "https://picsum.photos/seed/value/200",
    color: "bg-green-500",
    description: "Looks for undervalued assets with strong fundamentals."
  },
  [AgentType.QUALITY]: {
    name: "Guardian Quality",
    avatar: "https://picsum.photos/seed/quality/200",
    color: "bg-purple-500",
    description: "Prioritizes low volatility and high profitability."
  }
};
