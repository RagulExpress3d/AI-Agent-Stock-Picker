
import { StockSnapshot } from '../types';

const BASE_URL = 'https://finnhub.io/api/v1';
const FINNHUB_KEY = 'd5gerd1r01qm6pq2h3f0d5gerd1r01qm6pq2h3fg'; 

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

const cache = new Map<string, CacheEntry<any>>();

const getFromCache = <T,>(key: string): T | null => {
  const entry = cache.get(key);
  if (entry && entry.expiry > Date.now()) {
    return entry.data;
  }
  return null;
};

const setInCache = <T,>(key: string, data: T, ttlMs: number) => {
  cache.set(key, { data, expiry: Date.now() + ttlMs });
};

export const fetchPriceTarget = async (symbol: string): Promise<any> => {
  const cacheKey = `price_target_${symbol}`;
  const cached = getFromCache<any>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(`${BASE_URL}/stock/price-target?symbol=${symbol}&token=${FINNHUB_KEY}`);
    const data = await res.json();
    setInCache(cacheKey, data, 3600000); // 1 hour
    return data;
  } catch (e) {
    console.error(`Failed to fetch price target for ${symbol}`, e);
    return null;
  }
};

export const fetchStockData = async (symbol: string): Promise<StockSnapshot | null> => {
  const cacheKey = `stock_full_${symbol}`;
  const cached = getFromCache<StockSnapshot>(cacheKey);
  if (cached) return cached;

  try {
    const token = FINNHUB_KEY;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];

    const fetchWithFallback = async (url: string) => {
        const r = await fetch(url);
        if (!r.ok) throw new Error(`Status ${r.status}`);
        return r.json();
    };

    const [quoteData, metricData, newsData] = await Promise.all([
      fetchWithFallback(`${BASE_URL}/quote?symbol=${symbol}&token=${token}`),
      fetchWithFallback(`${BASE_URL}/stock/metric?symbol=${symbol}&metric=all&token=${token}`),
      fetchWithFallback(`${BASE_URL}/company-news?symbol=${symbol}&from=${sevenDaysAgo}&to=${today}&token=${token}`).catch(() => [])
    ]);

    if (!quoteData.c) return null;

    // Strict mapping from Finnhub response. If metric is missing, use null or 0, avoiding "mock" defaults like '20'.
    const result: StockSnapshot = {
      symbol,
      ts: Date.now(),
      price: quoteData.c || 0,
      changePct: quoteData.dp || 0,
      returns: {
        "1D": quoteData.dp || 0,
        "1W": metricData.metric?.['52WeekPriceReturnDaily'] ? (metricData.metric['52WeekPriceReturnDaily'] / 52) : 0,
        "1M": metricData.metric?.['1MonthPriceReturnDaily'] || 0,
        "3M": metricData.metric?.['3MonthPriceReturnDaily'] || 0,
      },
      trend: {
        ma20: metricData.metric?.['20DayMovingAverage'] || 0,
        ma50: metricData.metric?.['50DayMovingAverage'] || 0,
        aboveMA50: metricData.metric?.['50DayMovingAverage'] ? quoteData.c > metricData.metric['50DayMovingAverage'] : false,
      },
      risk: {
        vol20d: metricData.metric?.['beta'] ? (metricData.metric['beta'] / 100) : 0.015, // Using a conservative volatility floor for missing beta
        maxDrawdown6m: metricData.metric?.['52WeekHigh'] ? -(metricData.metric['52WeekHigh'] - quoteData.c) / metricData.metric['52WeekHigh'] : 0,
      },
      fundamentals: {
        peTTM: metricData.metric?.peBasicExclExtraTTM || metricData.metric?.peExclExtraTTM || 0,
        roeTTM: metricData.metric?.roeTTM ? (metricData.metric.roeTTM / 100) : 0,
        debtToEquity: metricData.metric?.['totalDebt/totalEquityTTM'] ? (metricData.metric['totalDebt/totalEquityTTM'] / 100) : 0,
        revenueGrowthTTM: metricData.metric?.revenueGrowthTTM ? (metricData.metric.revenueGrowthTTM / 100) : 0,
      },
      news: (newsData || []).slice(0, 3).map((n: any) => ({
        headline: n.headline,
        source: n.source,
        url: n.url,
        publishedAt: new Date(n.datetime * 1000).toISOString()
      }))
    };

    setInCache(cacheKey, result, 60000); 
    return result;
  } catch (error) {
    console.error(`Finnhub Fetch Error for ${symbol}`, error);
    return null;
  }
};

export const fetchCandles = async (
  symbol: string, 
  days: number = 30,
  resolution: string = 'D'
): Promise<{name: string, value: number}[] | null> => {
  const to = Math.floor(Date.now() / 1000);
  const from = to - (days * 24 * 60 * 60);
  const cacheKey = `candles_${symbol}_${resolution}_${days}`;
  const cached = getFromCache<any>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(`${BASE_URL}/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${FINNHUB_KEY}`);
    const data = await res.json();
    
    if (data.s === 'ok' && data.t && data.t.length > 0) {
      const formatted = data.t.map((timestamp: number, idx: number) => {
        const d = new Date(timestamp * 1000);
        let label = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
        if (days > 365) label = d.toLocaleDateString([], { month: 'short', year: '2-digit' });
        
        return {
          name: label,
          value: Number(data.c[idx].toFixed(2))
        };
      });
      setInCache(cacheKey, formatted, 3600000);
      return formatted;
    }
    return null;
  } catch (e) {
      return null;
  }
};

export const fetchUniverse = async (symbols: string[]): Promise<StockSnapshot[]> => {
  const results: StockSnapshot[] = [];
  const batchSize = 3;
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(s => fetchStockData(s)));
    batchResults.forEach(r => { if (r) results.push(r); });
    if (i + batchSize < symbols.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  return results;
};
