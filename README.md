
<img width="532" height="908" alt="image" src="https://github.com/user-attachments/assets/5263713c-61c7-4972-a70b-a243d252c965" />

**App Live Link:** https://ai-stock-portfolio-council-872747958244.us-west1.run.app/

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
   
Council of Agents: AI Portfolio Strategist

A sophisticated investment decision-support system that synthesizes institutional-grade market data with multi-agent generative reasoning. This prototype demonstrates how a "Council" of specialized AI agents can provide high-conviction equity recommendations across varied investment horizons.

1. The Problem
Retail investors and "prosumers" often struggle with two critical challenges:
Information Asymmetry: Processing thousands of raw data points (P/E, ROE, Beta, Moving Averages) across a large universe of stocks is cognitively overwhelming.
Emotional Bias: Individual decisions are frequently driven by FOMO or panic, lacking the rigorous, multi-factor debate used by professional investment committees.

2. The Solution
The Council of Agents acts as a decentralized digital investment committee. It employs a Hybrid Analytical Framework:
Deterministic Quantitative Scoring: A hard-coded engine processes raw Finnhub metrics to ensure accuracy and speed.
Probabilistic Generative Reasoning: Google Gemini (LLM) synthesizes these scores into a qualitative "Debate," providing the narrative context and news-grounded justification that raw numbers lack.

3. Key Features
Triple-Horizon Strategy: Specialized logic for Intraday (Velocity), 1-Year (Growth), and 3-Year (Compounding).
Institutional Price Targets: Real-time targets sourced from professional Wall Street analyst feeds (Mean/High aggregates).
Agent Debate Logs: A transparent view into the internal disagreement between the Momentum, Value, and Quality agents.
Live Market Tapes: Interactive candle charts (1M to 5Y) and technical metric cards.
Smart Diversification: Heuristic constraints ensuring no more than 2 picks per sector (e.g., Big Tech, Healthcare) to manage concentration risk.

4. Tech Stack
UI/UX: React 19, Tailwind CSS (Mobile-first design).
Charts: Recharts (Interactive Area Gradients).
Intelligence: Google GenAI SDK (gemini-3-flash-preview) with Google Search Grounding.
Market Data: Finnhub REST API (Equity Quote, Metrics, Candles, and Price Targets).
Icons: Lucide React.

5. Logic & Quantitative Methodology
A. Agent Scoring Engine (agentEngine.ts)
Momentum Max: Evaluates 1D, 1W, and 3M price velocity. In Intraday mode, it prioritizes the 1W trend; in long-term modes, it looks for 3M persistence.
Deep Value: Screens for P/E ratios (Target < 15x for high scores) and evaluates Debt-to-Equity to ensure a "Margin of Safety."
Guardian Quality: Focuses on operational excellence via Return on Equity (ROE) and historical stability via 6-Month Max Drawdown.
B. Target Price Calculations (councilEngine.ts)
The methodology shifts strictly based on the user's selected horizon:
Intraday: Uses Sigma Volatility. Target = Current Price + (Price * 20D Volatility). This identifies the statistical "breakout" ceiling for a single session.
One Year: Sourced from the Finnhub Analyst Consensus Mean. It represents the average price target of all professional analysts covering the stock.
Three Year: Sourced from the Finnhub Analyst 'High' Consensus, assuming a multi-year best-case earnings expansion.

6. AI Agent Prompts
The Chief Strategist (Gemini) is prompted via a structured context in geminiService.ts:
"You are the Chief Strategist... Generate a 4-message WhatsApp-style debate between Momentum Max, Deep Value, and Guardian Quality... Use specific PE, ROE, and return metrics provided to challenge or support the picks... Conclude with a 2-sentence outlook."
This prompt forces the AI to be Data-Grounded: it cannot hallucinate metrics because they are passed directly from the quantitative engine as hard variables.

7. Guardrails
Zero-Hallucination Policy: If the Finnhub API returns null for a metric (like Beta or PE), the app defaults to 0 or a conservative constant rather than letting the AI "guess" the value.
Search Grounding: The Gemini model is configured with googleSearch to verify if a ticker has recent negative news (SEC filings, layoffs) that might invalidate its quantitative "Buy" signal.
Type Safety: Strict TypeScript interfaces (StockSnapshot, CouncilPick) ensure the data pipeline from the raw JSON feed to the UI remains unbreakable.

8. Technical Architecture
Data Ingestion Layer (finnhub.ts): Fetches raw equity data, quote tapes, and institutional consensus targets.
Strategy Layer (agentEngine.ts & councilEngine.ts): Converts raw data into weighted scores and applies sector-diversification filters.
Synthesis Layer (geminiService.ts): Sends the "Shortlist" to Gemini for final reasoning, news verification, and debate generation.
Presentation Layer (App.tsx): A high-performance, mobile-optimized React dashboard that renders the final portfolio strategy.
