
import { AgentRecommendation, StockSnapshot, AgentType, Horizon } from '../types';

export const scoreMomentum = (stock: StockSnapshot, horizon: Horizon): AgentRecommendation => {
  const { returns, trend, risk } = stock;
  
  // Weights change based on horizon
  const lookbackWeight = horizon === 'INTRADAY' ? (returns["1W"] * 0.7 + returns["1D"] * 0.3) : (returns["3M"] * 0.6 + returns["1M"] * 0.4);
  
  let score = lookbackWeight / 15; // Normalized around zero
  let confidence = 50 + (lookbackWeight > 0 ? 20 : -10);
  
  if (trend.aboveMA50) {
    score += 0.2;
    confidence += 10;
  }

  // Volatility penalty
  if (risk.vol20d > 0.03) {
    score -= 0.3;
    confidence -= 15;
  }

  return {
    agentId: AgentType.MOMENTUM,
    symbol: stock.symbol,
    score: Math.min(1, Math.max(0, score + 0.5)),
    confidence: Math.min(95, Math.max(20, confidence)),
    tags: [horizon === 'INTRADAY' ? "Velocity Play" : "Trend Leader"],
    why: [`Price performance over relevant horizon is ${lookbackWeight > 0 ? 'superior' : 'lagging'}.`],
    riskFlags: risk.vol20d > 0.03 ? ["High Intraday Volatility"] : []
  };
};

export const scoreValue = (stock: StockSnapshot, horizon: Horizon): AgentRecommendation => {
  const { fundamentals } = stock;
  let score = 0;
  
  // Lower PE is better for Value
  if (fundamentals.peTTM < 15) score += 0.5;
  else if (fundamentals.peTTM < 25) score += 0.3;
  
  // ROE is secondary but important
  if (fundamentals.roeTTM > 0.20) score += 0.3;

  // Debt matters more for long horizons
  if (horizon === 'THREE_YEAR' && fundamentals.debtToEquity < 0.8) score += 0.2;

  return {
    agentId: AgentType.VALUE,
    symbol: stock.symbol,
    score: Math.min(1, Math.max(0, score)),
    confidence: 65 + (fundamentals.peTTM < 20 ? 15 : 0),
    tags: ["Fundamental Value"],
    why: [`P/E of ${fundamentals.peTTM.toFixed(1)}x indicates ${fundamentals.peTTM < 20 ? 'undervaluation' : 'fair pricing'}.`],
    riskFlags: fundamentals.debtToEquity > 1.5 ? ["Elevated Debt Levels"] : []
  };
};

export const scoreQuality = (stock: StockSnapshot, horizon: Horizon): AgentRecommendation => {
  const { risk, fundamentals } = stock;
  let score = 0;

  if (fundamentals.roeTTM > 0.25) score += 0.5;
  if (risk.maxDrawdown6m > -0.15) score += 0.4;
  
  // Short term quality = stable daily moves
  if (horizon === 'INTRADAY' && risk.vol20d < 0.015) score += 0.1;

  return {
    agentId: AgentType.QUALITY,
    symbol: stock.symbol,
    score: Math.min(1, Math.max(0, score)),
    confidence: 80,
    tags: ["Capital Efficiency"],
    why: [`Return on Equity of ${(fundamentals.roeTTM * 100).toFixed(1)}% shows high operational quality.`],
    riskFlags: []
  };
};
