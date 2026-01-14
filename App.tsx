
import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  BarChart3, 
  ShieldCheck, 
  ChevronRight,
  TrendingDown,
  Activity,
  ArrowUpRight,
  RefreshCcw,
  AlertTriangle,
  Info,
  ExternalLink,
  MessageSquareQuote,
  Zap,
  Target,
  FileSearch
} from 'lucide-react';
import { StockSnapshot, Horizon, DailyBrief, AgentType, CouncilPick } from './types';
import { SP500_UNIVERSE, AGENT_METADATA } from './constants';
import { fetchUniverse, fetchCandles } from './services/finnhub';
import { generateCouncilBriefInternal } from './services/councilEngine';
import { generateDailyBrief } from './services/geminiService';
import { 
  AreaChart, Area, XAxis, Tooltip as ChartTooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

// --- Sub-Components ---

const HorizonSelector = ({ horizon, setHorizon }: { horizon: Horizon, setHorizon: (h: Horizon) => void }) => (
  <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-8 gap-1.5 border border-gray-200">
    {(['INTRADAY', 'ONE_YEAR', 'THREE_YEAR'] as Horizon[]).map((h) => (
      <button 
        key={h}
        onClick={() => setHorizon(h)}
        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${horizon === h ? 'bg-white text-blue-600 shadow-sm border border-blue-50' : 'text-gray-400 hover:text-gray-600'}`}
      >
        {h === 'INTRADAY' ? 'Intraday' : h === 'ONE_YEAR' ? '1 Year' : '3 Year'}
      </button>
    ))}
  </div>
);

const StockDetailModal = ({ stock, pick, onClose }: { stock: StockSnapshot, pick?: CouncilPick, onClose: () => void }) => {
  const [candles, setCandles] = useState<{name: string, value: number}[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'1M' | '6M' | '1Y' | '5Y'>('1M');

  useEffect(() => {
    async function load() {
        setLoading(true);
        let days = 30;
        let res = 'D';
        switch(range) {
            case '6M': days = 180; break;
            case '1Y': days = 365; res = 'W'; break;
            case '5Y': days = 1825; res = 'M'; break;
        }
        const data = await fetchCandles(stock.symbol, days, res);
        if (data) setCandles(data);
        setLoading(false);
    }
    load();
  }, [stock.symbol, range]);

  return (
    <div className="fixed inset-0 bg-white z-[100] overflow-y-auto pb-12 animate-in slide-in-from-bottom duration-300">
      <div className="sticky top-0 bg-white/95 backdrop-blur-xl px-6 py-5 border-b border-gray-100 flex items-center justify-between z-10">
        <button onClick={onClose} className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-900 active:scale-90 transition-transform">
            <ChevronRight size={20} className="rotate-180" />
        </button>
        <h2 className="text-lg font-black tracking-tight">{stock.symbol} Deep Dive</h2>
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-black">{stock.symbol[0]}</div>
      </div>

      <div className="px-6 py-8">
        <div className="mb-8 flex justify-between items-end">
            <div>
              <p className="text-5xl font-black text-gray-900 tracking-tighter">${stock.price.toFixed(2)}</p>
              <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-xl text-[11px] font-black ${stock.changePct >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {stock.changePct >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {stock.changePct.toFixed(2)}%
              </div>
            </div>
            {pick && (
              <div className="text-right">
                 <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Target Price</p>
                 <p className="text-3xl font-black text-blue-600">${pick.targetPrice.toFixed(2)}</p>
                 <p className="text-[11px] font-bold text-emerald-500">+{pick.projectedReturn}%</p>
              </div>
            )}
        </div>

        {pick && (
          <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl mb-8">
              <div className="flex items-center gap-2 mb-3">
                  <FileSearch size={14} className="text-blue-600" />
                  <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Prediction Methodology</p>
              </div>
              <p className="text-xs text-blue-900 font-medium leading-relaxed">{pick.predictionMethodology}</p>
          </div>
        )}

        <div className="flex bg-gray-50 p-1 rounded-xl mb-8 gap-1 border border-gray-100">
            {(['1M', '6M', '1Y', '5Y'] as const).map(r => (
                <button key={r} onClick={() => setRange(r)} className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${range === r ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}>{r}</button>
            ))}
        </div>

        <div className="h-64 mb-10 -mx-2">
            {!candles || loading ? (
                <div className="h-full flex flex-col items-center justify-center gap-2 text-gray-300">
                    <Activity className="animate-spin" size={20} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Streaming Finnhub Tapes...</span>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={candles}>
                        <defs>
                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" hide />
                        <ChartTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} />
                        <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" animationDuration={800} />
                    </AreaChart>
                </ResponsiveContainer>
            )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-10">
            {[
                { label: 'P/E TTM', value: `${stock.fundamentals.peTTM.toFixed(1)}x` },
                { label: 'ROE', value: `${(stock.fundamentals.roeTTM * 100).toFixed(1)}%` },
                { label: 'Debt/Equity', value: stock.fundamentals.debtToEquity.toFixed(2) },
                { label: 'Rev Growth', value: `${(stock.fundamentals.revenueGrowthTTM * 100).toFixed(1)}%` }
            ].map((stat, i) => (
                <div key={i} className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className="text-xl font-black text-gray-900">{stat.value}</p>
                </div>
            ))}
        </div>

        <button onClick={onClose} className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-xl active:scale-95 transition-all text-xs uppercase tracking-[0.2em]">Exit Deep Dive</button>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [horizon, setHorizon] = useState<Horizon>('ONE_YEAR');
  const [universe, setUniverse] = useState<StockSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [brief, setBrief] = useState<DailyBrief | null>(null);
  const [selectedStock, setSelectedStock] = useState<{stock: StockSnapshot, pick?: CouncilPick} | null>(null);

  const init = async () => {
    setLoading(true);
    try {
      const stocks = await fetchUniverse(SP500_UNIVERSE);
      setUniverse(stocks);
      
      const dateKey = new Date().toISOString().split('T')[0];
      const storageKey = `council_picker_${dateKey}_${horizon}`;
      const saved = localStorage.getItem(storageKey);
      
      if (saved) {
        setBrief(JSON.parse(saved));
      } else {
        const { buy5, sellOrAvoid } = await generateCouncilBriefInternal(stocks, horizon);
        const dailyBrief = await generateDailyBrief(horizon, buy5, sellOrAvoid, stocks);
        setBrief(dailyBrief);
        localStorage.setItem(storageKey, JSON.stringify(dailyBrief));
      }
    } catch (e) {
      console.error("Council initialization failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { init(); }, [horizon]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-12 text-center animate-pulse">
        <div className="w-20 h-20 border-8 border-slate-50 border-t-blue-600 rounded-3xl animate-spin mb-6"></div>
        <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Council Verification</h2>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sourcing Live Market Tapes...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto relative shadow-2xl overflow-hidden flex flex-col font-sans">
      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        <div className="pt-10 px-6">
          <header className="mb-8 flex justify-between items-start">
            <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Council Picks</h1>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                  Verified US Equity Council
                </p>
            </div>
            <button 
              onClick={() => { localStorage.clear(); init(); }} 
              className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 shadow-sm active:rotate-180 transition-transform hover:text-blue-600"
            >
              <RefreshCcw size={18} />
            </button>
          </header>

          <HorizonSelector horizon={horizon} setHorizon={setHorizon} />

          <div className="bg-blue-600/5 border border-blue-600/10 p-5 rounded-3xl mb-10">
             <div className="flex items-center gap-2 mb-2">
                <Info size={14} className="text-blue-600" />
                <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Strategy Flow: {horizon}</p>
             </div>
             <p className="text-xs text-blue-900/60 font-medium leading-relaxed">
                {horizon === 'INTRADAY' 
                  ? "Day-Trade Focus: Target represents expected volatility breakout. Ideal exit: End of current session or stop-loss trigger." 
                  : horizon === 'ONE_YEAR'
                  ? "Growth Focus: Targets based on 12-month analyst consensus mean. Buying quality at reasonable entry points."
                  : "Multi-Year Moats: Targets derived from earnings compounding and valuation expansion (P/E Mean Reversion)."
                }
             </p>
          </div>

          {brief && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom duration-500">
              
              {/* Top Picks Section */}
              <section>
                <div className="flex items-center justify-between mb-6 px-1">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                        <Target className="text-blue-600" size={16} /> Suggestions
                    </h3>
                    <span className="text-[10px] font-black text-gray-400 uppercase">Top 5 Picks</span>
                </div>
                
                <div className="space-y-4">
                    {brief.buy5.map((pick, i) => {
                        const stock = universe.find(u => u.symbol === pick.symbol);
                        return (
                        <div 
                          key={pick.symbol} 
                          onClick={() => stock && setSelectedStock({stock, pick})}
                          className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col group active:scale-[0.98] transition-all cursor-pointer hover:border-blue-200"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center font-black text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all text-lg">
                                        {pick.symbol[0]}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-lg text-gray-900">{pick.symbol}</h4>
                                        <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Target: ${pick.targetPrice.toFixed(2)}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-black text-gray-900">${stock?.price.toFixed(2) || '---'}</p>
                                    <p className={`text-[10px] font-black uppercase tracking-widest ${pick.projectedReturn >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                      {pick.projectedReturn > 0 ? '+' : ''}{pick.projectedReturn}%
                                    </p>
                                </div>
                            </div>
                            
                            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100/50">
                                <p className="text-xs text-gray-600 leading-relaxed font-medium line-clamp-2">
                                    {pick.why[0]}
                                </p>
                            </div>

                            <div className="flex gap-1.5 mt-4 overflow-x-auto no-scrollbar">
                                {pick.tags.map(t => (
                                    <span key={t} className="text-[8px] font-black bg-white border border-gray-100 text-gray-400 px-2 py-1 rounded-lg uppercase tracking-widest whitespace-nowrap">
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )})}
                </div>
              </section>

              {/* integrated Council Chamber Reasoning Log */}
              <section className="bg-slate-900 rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 blur-3xl -mr-24 -mt-24 rounded-full"></div>
                 
                 <div className="flex items-center gap-2 mb-8 relative z-10">
                    <MessageSquareQuote size={18} className="text-blue-400" />
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-blue-400">Agent Debate Log</h3>
                 </div>

                 <div className="space-y-8 relative z-10">
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                        <p className="text-sm font-bold text-blue-100 leading-relaxed mb-1 italic">Chief Strategist:</p>
                        <p className="text-xs text-blue-50/70 leading-relaxed italic">"{brief.chiefSummary}"</p>
                    </div>

                    {brief.debate.map((msg, idx) => {
                        const meta = AGENT_METADATA[msg.agentId as AgentType] || { name: 'Council', color: 'bg-gray-400' };
                        return (
                            <div key={idx} className="relative pl-6 border-l-2 border-white/10 pb-2 last:pb-0">
                                <div className={`absolute top-0 left-[-5px] w-2 h-2 rounded-full ${meta.color} shadow-sm shadow-black`}></div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${meta.color.replace('bg-', 'text-')}`}>
                                        {meta.name}
                                    </span>
                                    <span className="text-[9px] text-white/30 font-bold uppercase tracking-widest">• {msg.timestamp}</span>
                                </div>
                                <p className="text-xs text-white/80 leading-relaxed font-medium">{msg.text}</p>
                            </div>
                        );
                    })}
                 </div>

                 {brief.sources.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-white/10 relative z-10">
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-4">Data Source Verification</p>
                        <div className="flex flex-wrap gap-2">
                            {brief.sources.map((s, i) => (
                                <a 
                                  key={i} 
                                  href={s.uri} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="text-[9px] font-bold bg-white/5 text-white/50 px-3 py-1.5 rounded-xl border border-white/5 hover:text-blue-400 transition-colors flex items-center gap-1.5"
                                >
                                    {s.title.slice(0, 15)}... <ExternalLink size={10} />
                                </a>
                            ))}
                        </div>
                    </div>
                 )}
              </section>

              {/* Risk / Watch Section */}
              <section className="px-1">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                        <AlertTriangle className="text-rose-500" size={16} /> Risk Analysis
                    </h3>
                    <span className="text-[10px] font-black text-gray-400 uppercase">Sell / Avoid</span>
                </div>
                <div className="space-y-3">
                    {brief.sellOrAvoid.map(item => (
                        <div key={item.symbol} className="bg-white border border-gray-100 rounded-[28px] p-4 flex justify-between items-center opacity-80 active:opacity-100 transition-opacity">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center font-black text-gray-400">
                                    {item.symbol[0]}
                                </div>
                                <div className="flex flex-col">
                                    <p className="font-black text-gray-900">{item.symbol}</p>
                                    <p className="text-[9px] font-medium text-gray-500 line-clamp-1 pr-4">{item.reason}</p>
                                </div>
                            </div>
                            <span className={`text-[9px] font-black uppercase px-2.5 py-1.5 rounded-xl whitespace-nowrap ${item.action === 'SELL' ? 'bg-rose-50 text-rose-600' : 'bg-orange-50 text-orange-600'}`}>
                                {item.action}
                            </span>
                        </div>
                    ))}
                </div>
              </section>

              {/* Trade Plan Confirmation */}
              <div className="pt-4 pb-12">
                <button 
                    onClick={() => alert("Daily Allocation Syncing...")}
                    className="w-full bg-blue-600 text-white font-black py-6 rounded-3xl shadow-xl shadow-blue-600/30 active:scale-95 transition-all flex items-center justify-center gap-3 tracking-[0.2em] text-[11px] uppercase"
                >
                    <Zap size={16} /> Update Managed Plan
                </button>
                <p className="text-center text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-5">
                  Live Paper-Tier v3.0 • Verified Targets Only
                </p>
              </div>

            </div>
          )}
        </div>
      </div>

      {selectedStock && <StockDetailModal stock={selectedStock.stock} pick={selectedStock.pick} onClose={() => setSelectedStock(null)} />}
    </div>
  );
}
