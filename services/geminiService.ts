
import { GoogleGenAI } from "@google/genai";
import { Horizon, CouncilPick, ActionItem, DailyBrief, StockSnapshot, AgentType } from "../types";

export const generateDailyBrief = async (
  horizon: Horizon,
  buy5: CouncilPick[],
  sellList: ActionItem[],
  universeData: StockSnapshot[]
): Promise<DailyBrief> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const metricsString = buy5.map(p => {
    const data = universeData.find(d => d.symbol === p.symbol)!;
    return `${p.symbol}: PE ${data.fundamentals.peTTM.toFixed(1)}, ROE ${(data.fundamentals.roeTTM * 100).toFixed(1)}%, 3M Ret ${data.returns["3M"].toFixed(1)}%`;
  }).join('\n');

  const prompt = `
    You are the Chief Strategist of an Investment Council.
    Horizon: ${horizon}
    
    Candidates for BUY:
    ${metricsString}
    
    SELL/AVOID List:
    ${sellList.map(s => `${s.symbol} (${s.reason})`).join(', ')}

    Task:
    1. Search for current news on these tickers using googleSearch.
    2. Generate a 4-message WhatsApp-style debate between Momentum Max (momentum_v1), Deep Value (value_v1), and Guardian Quality (quality_v1).
    3. The agents must use the specific PE, ROE, and return metrics provided to challenge or support the picks for a ${horizon} horizon.
    4. Provide a 2-sentence Chief Strategist Summary concluding the outlook.

    Response must be JSON:
    {
      "debate": [ { "agentId": "momentum_v1" | "value_v1" | "quality_v1", "text": "...", "timestamp": "HH:MM" } ],
      "chiefSummary": "..."
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      }
    });

    const data = JSON.parse(response.text || "{}");
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = chunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        title: chunk.web.title,
        uri: chunk.web.uri
      }));

    return {
      asOfISO: new Date().toISOString(),
      horizon,
      buy5,
      sellOrAvoid: sellList,
      debate: data.debate || [],
      sources,
      chiefSummary: data.chiefSummary || "Markets are showing mixed signals. Stick to quality leaders."
    };
  } catch (error) {
    console.error("Council Brief Error:", error);
    return {
      asOfISO: new Date().toISOString(),
      horizon,
      buy5,
      sellOrAvoid: sellList,
      debate: [],
      sources: [],
      chiefSummary: "The Council is currently in recess. Algorithmic defaults applied."
    };
  }
};
