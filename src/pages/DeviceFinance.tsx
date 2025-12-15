// src/components/DeviceFinance.tsx
import { useEffect, useMemo, useState, useCallback } from "react";
// Reuse styles from sports if compatible, or ensure DeviceTeams.css is global
import "./DeviceTeams.css"; 
import { useToast } from "../context/ToastContext"; 

const API_BASE = (import.meta as any).env?.VITE_API_BASE?.replace(/\/+$/, "") || "http://127.0.0.1:8000";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Tabs defined by user
const TABS = ["Stocks", "Crypto", "Indices", "Economic"] as const;

type CryptoItem = {
  id: string;
  pair: string;
  code: string;
  currency: string;
  description: string;
  image_url?: string | null;
  // UI State
  selected: boolean;
  order: number;
  display_text?: string;
  color?: string;
};

// Define the type near the top
type StockItem = {
    id: string; // generated UUID from backend
    stock_ticker: string;
    display_order: number;
    display_text?: string;
    color: string;
    // Temp UI flag
    isNew?: boolean; 
    logo_url?: string;    
};



const getIconSrc = (url: string | null | undefined) => {
    if (!url) return undefined;
    if (url.startsWith("http")) return url; // Remote URL (LCW)
    return `/${url}`; // Local path (legacy icons)
};

// --- NEW COMPONENT: Live Crypto Search ---
function CryptoSearch({ onSelect }: { onSelect: (coin: any) => void }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            return;
        }
        
        const timer = setTimeout(async () => {
            setSearching(true);
            try {
                // Free API, no key needed for basic search
                const res = await fetch(`https://api.coingecko.com/api/v3/search?query=${query}`);
                const data = await res.json();
                setResults(data.coins || []);
            } catch (e) {
                console.error("CoinGecko search failed", e);
            } finally {
                setSearching(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [query]);

    return (
        <div className="search-box" style={{ marginBottom: 20, position: 'relative' }}>
            <input 
                type="text" 
                placeholder="Search live crypto (e.g. Bitcoin, Ethereum, Solana)..." 
                value={query}
                onChange={e => setQuery(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
            />
            
            {query.length >= 2 && (
                <div style={{ 
                    position: 'absolute', top: '100%', left: 0, right: 0, 
                    background: 'white', border: '1px solid #ddd', 
                    borderRadius: '0 0 8px 8px', zIndex: 100, maxHeight: '300px', overflowY: 'auto',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                    {searching && <div style={{ padding: 10, color: '#999' }}>Searching CoinGecko...</div>}
                    {!searching && results.length === 0 && <div style={{ padding: 10, color: '#999' }}>No results found</div>}

                    {results.map(coin => (
                        <div 
                            key={coin.id}
                            onClick={() => {
                                onSelect(coin);
                                setQuery(""); 
                                setResults([]);
                            }}
                            style={{ 
                                padding: '10px', borderBottom: '1px solid #eee', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 10
                            }}
                        >
                            <img src={coin.thumb} alt={coin.symbol} style={{ width: 20, height: 20, borderRadius: '50%' }} />
                            <div>
                                <div style={{ fontWeight: 600 }}>{coin.name}</div>
                                {/* --- UPDATED LINE BELOW --- */}
                                <div style={{ fontSize: 11, color: '#666' }}>
                                    {coin.symbol} <span style={{ color: '#999' }}>/ USD</span>
                                </div>
                                {/* -------------------------- */}
                            </div>
                        </div>
                    ))}                    

                </div>
            )}
        </div>
    );
}


interface Props {
  deviceId: string;
}

// --- NEW COMPONENT: Stock Search ---
function StockSearch({ deviceId, onSelect }: { deviceId: string, onSelect: (stock: any) => void }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            return;
        }
        
        const timer = setTimeout(async () => {
            setSearching(true);
            try {
                // Use the backend proxy we created!
                const res = await fetch(`${API_BASE}/devices/${deviceId}/stocks/search?q=${query}`, {
                     headers: authHeaders() 
                });
                
                if (res.status === 400) {
                     // Likely missing API Key
                     const err = await res.json();
                     if(err.detail.includes("API Key")) {
                        toast?.("Please save your Finnhub Key above first!", "error");
                        setResults([]);
                        return;
                     }
                }
                
                if(res.ok) {
                    const data = await res.json();
                    setResults(data || []);
                }
            } catch (e) {
                console.error("Stock search failed", e);
            } finally {
                setSearching(false);
            }
        }, 600);

        return () => clearTimeout(timer);
    }, [query, deviceId]);

    return (
        <div className="search-box" style={{ marginBottom: 20, position: 'relative' }}>
            <input 
                type="text" 
                placeholder="Search stocks (e.g. AAPL, Tesla)..." 
                value={query}
                onChange={e => setQuery(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
            />
            
            {query.length >= 2 && (
                <div style={{ 
                    position: 'absolute', top: '100%', left: 0, right: 0, 
                    background: 'white', border: '1px solid #ddd', 
                    borderRadius: '0 0 8px 8px', zIndex: 100, maxHeight: '300px', overflowY: 'auto',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}>
                    {searching && <div style={{ padding: 10, color: '#999' }}>Searching Finnhub...</div>}
                    {!searching && results.length === 0 && <div style={{ padding: 10, color: '#999' }}>No results found</div>}

                    {results.map((stock, i) => (
                        <div 
                            key={i}
                            onClick={() => {
                                onSelect(stock);
                                setQuery(""); 
                                setResults([]);
                            }}
                            style={{ 
                                padding: '10px', borderBottom: '1px solid #eee', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 10
                            }}
                        >
                            <div style={{ fontWeight: 'bold', width: 60 }}>{stock.symbol}</div>
                            <div style={{ flex: 1 }}>{stock.description}</div>
                            <div style={{ fontSize: 10, color: '#999' }}>{stock.type}</div>
                        </div>
                    ))}                    
                </div>
            )}
        </div>
    );
}


export function DeviceFinancePanel({ deviceId }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string>();
  const [isEditing, setIsEditing] = useState(false);

  // Global Device Settings (Checkboxes)
  const [showHourly, setShowHourly] = useState(false);
  const [showDaily, setShowDaily]   = useState(false);
  const [showWeekly, setShowWeekly] = useState(false);
  const [stockKey, setStockKey] = useState("");

  // Data
  const [cryptoData, setCryptoData] = useState<CryptoItem[]>([]);
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>("Crypto");

// --- PASTE HERE ---
  const [stockData, setStockData] = useState<StockItem[]>([]);

  // Load Data
  const loadData = useCallback(async () => {
    if(!deviceId || deviceId === 'undefined') return;

    setLoading(true);
    setErr(undefined);
    try {
      // 1. Get Device Globals
      const devRes = await fetch(`${API_BASE}/devices/${deviceId}`, { headers: authHeaders() });
      if (devRes.ok) {
        const d = await devRes.json();
        setShowHourly(d.finance_show_hourly_change ?? false);
        setShowDaily(d.finance_show_daily_change ?? false);
        setShowWeekly(d.finance_show_weekly_change ?? false);
        setStockKey(d.finance_stocks_apikey || "");
      }

      // 2. Get Available Crypto
      const cRes = await fetch(`${API_BASE}/devices/${deviceId}/crypto/available`, { headers: authHeaders() });
      if (cRes.ok) {
        const data = await cRes.json();
        setCryptoData(data);
      } else {
        throw new Error("Failed to load crypto data");
      }
      
      // 3. Get Saved Stocks
      const sRes = await fetch(`${API_BASE}/devices/${deviceId}/stocks`, { headers: authHeaders() });
      if (sRes.ok) {
        const data = await sRes.json();
        setStockData(data);
      }


    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => { loadData(); }, [loadData]);

  // Derived Lists
  const selectedItems = useMemo(() => {
    return cryptoData
      .filter(x => x.selected)
      .sort((a, b) => a.order - b.order);
  }, [cryptoData]);

// --- NEW: Handle selection from the "Widget" ---
  const handleLiveSearchSelect = async (coin: any) => {
      // 1. Optimistic Check: Do we already have it loaded?
      const symbol = coin.symbol.toLowerCase(); 
      const pair = `${symbol}usd`; 
      const existing = cryptoData.find(c => c.pair === pair || c.code === symbol);
      
      if (existing) {
          if (existing.selected) {
              toast?.("Already selected!");
              return;
          }
          toggleSelection(existing.id);
          toast?.(`Added ${existing.description}`);
          return;
      }

      // 2. Not found locally? Validate with Backend!
      const toastId = toast?.("Validating with LiveCoinWatch...", "info"); // hypothetical loading toast if supported
      
      try {
          const res = await fetch(`${API_BASE}/devices/${deviceId}/crypto/validate-and-add`, {
              method: 'POST',
              headers: { 
                  "Content-Type": "application/json",
                  ...authHeaders() 
              },
              body: JSON.stringify({
                  code: coin.symbol,
                  name: coin.name,
                  image_url: coin.thumb // Pass the CoinGecko image!
              })
          });

          if (!res.ok) {
              const errData = await res.json();
              throw new Error(errData.detail || "Validation failed");
          }

          const newCoin = await res.json();

          // 3. Add to local state and select it
          setCryptoData(prev => {
              // Create new item object
              const item: CryptoItem = {
                  id: newCoin.id,
                  pair: newCoin.pair,
                  code: newCoin.code,
                  currency: "usd",
                  description: newCoin.description,
                  image_url: newCoin.image_url,
                  selected: true, // Auto-select!
                  order: prev.filter(p => p.selected).length + 1,
                  display_text: newCoin.code.toUpperCase(),
                  color: 'white'
              };
              return [...prev, item];
          });

          toast?.(`Success! Added ${newCoin.description}`);

      } catch (e: any) {
          console.error(e);
          toast?.(`Cannot add ${coin.name}: ${e.message}`, "error");
      }
  };


  // Actions
  const toggleSelection = (id: string) => {
    if (!isEditing) return;
    setCryptoData(prev => {
        const target = prev.find(p => p.id === id);
        if (!target) return prev;

        const isSelecting = !target.selected;
        
        if (isSelecting) {
            // Add to end
            const nextOrder = prev.filter(p => p.selected).length + 1;
            return prev.map(p => p.id === id ? { ...p, selected: true, order: nextOrder } : p);
        } else {
            // Remove and reorder remaining
            const newArr = prev.map(p => p.id === id ? { ...p, selected: false, order: 0 } : p);
            // Re-normalize orders
            let counter = 1;
            return newArr.map(p => p.selected ? { ...p, order: counter++ } : p);
        }
    });
  };

  const moveItem = (id: string, dir: -1 | 1) => {
      const sorted = [...selectedItems];
      const idx = sorted.findIndex(p => p.id === id);
      if (idx < 0) return;
      const neighborIdx = idx + dir;
      if (neighborIdx < 0 || neighborIdx >= sorted.length) return;

      const itemA = sorted[idx];
      const itemB = sorted[neighborIdx];

      setCryptoData(prev => prev.map(p => {
          if (p.id === itemA.id) return { ...p, order: itemB.order };
          if (p.id === itemB.id) return { ...p, order: itemA.order };
          return p;
      }));
  };

// --- ADD THIS FUNCTION ---
  const moveStockItem = (id: string, dir: -1 | 1) => {
      setStockData(prev => {
          const idx = prev.findIndex(p => p.id === id);
          if (idx < 0) return prev;
          
          const neighborIdx = idx + dir;
          if (neighborIdx < 0 || neighborIdx >= prev.length) return prev;

          const newArr = [...prev];
          // Swap the two items
          [newArr[idx], newArr[neighborIdx]] = [newArr[neighborIdx], newArr[idx]];
          return newArr;
      });
  };


  const removeItem = (id: string) => toggleSelection(id); 

  const save = async () => {
    setSaving(true);
    try {
        // 1. Save Globals
        const settingsPayload = {
            finance_show_hourly_change: showHourly,
            finance_show_daily_change: showDaily,
            finance_show_weekly_change: showWeekly,
            finance_stocks_apikey: stockKey
        };
        
        const r1 = await fetch(`${API_BASE}/devices/${deviceId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", ...authHeaders() },
            body: JSON.stringify(settingsPayload),
        });

        if (!r1.ok) throw new Error("Failed to save global settings");

        // 2. Save Crypto Config
        const cryptoPayload = {
            items: selectedItems.map((item, i) => ({
                crypto_pair_id: item.id,
                display_order: i + 1,
                display_text: item.display_text,
                color: item.color,
                hourly_change: showHourly, 
                daily_change: showDaily,
                weekly_change: showWeekly
            }))
        };

        const r2 = await fetch(`${API_BASE}/devices/${deviceId}/crypto`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", ...authHeaders() },
            body: JSON.stringify(cryptoPayload),
        });
        if (!r2.ok) throw new Error("Failed to save crypto config");

        // 3. Save Stock Config (NEW)
        const stockPayload = {
            items: stockData.map((item, i) => ({
                stock_ticker: item.stock_ticker,
                display_order: i + 1,
                display_text: item.display_text || item.stock_ticker,
                color: item.color || 'white'
            }))
        };
        
        const r3 = await fetch(`${API_BASE}/devices/${deviceId}/stocks`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", ...authHeaders() },
            body: JSON.stringify(stockPayload),
        });
        
        if (!r3.ok) throw new Error("Failed to save stock list");


        setIsEditing(false);
        loadData(); 
    } catch (e: any) {
        setErr(e.message);
    } finally {
        setSaving(false);
    }
  };

  const cancel = () => { setIsEditing(false); loadData(); };

  if (loading) return <div className="dv-muted">Loading finance...</div>;

return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
       
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
           <h3 style={{ fontSize: "18px", fontWeight: "700", margin: 0 }}>Finance Settings</h3>
           <div className="dv-actions" style={{ margin: 0 }}>
                {isEditing ? (
                    <>
                        <button className="dv-btn dv-btn-primary" onClick={save} disabled={saving}>
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                        <button className="dv-btn" onClick={cancel} disabled={saving}>Cancel</button>
                    </>
                ) : (
                    <button className="dv-btn dv-btn-primary" onClick={()=>setIsEditing(true)}>Edit Configuration</button>
                )}
           </div>
       </div>

       {err && <div className="dv-alert" style={{ marginBottom: 12 }}>{err}</div>}
       
       <div className="config-panel">
            <div className="panel-row" style={{ gap: 20 }}>
              <label className="checkbox-label" style={{ cursor: isEditing ? 'pointer' : 'default' }}>
                <input type="checkbox" checked={showHourly} onChange={e => setShowHourly(e.target.checked)} disabled={!isEditing} />
                Show Hourly %
              </label>
              <label className="checkbox-label" style={{ cursor: isEditing ? 'pointer' : 'default' }}>
                <input type="checkbox" checked={showDaily} onChange={e => setShowDaily(e.target.checked)} disabled={!isEditing} />
                Show Daily %
              </label>
              <label className="checkbox-label" style={{ cursor: isEditing ? 'pointer' : 'default' }}>
                <input type="checkbox" checked={showWeekly} onChange={e => setShowWeekly(e.target.checked)} disabled={!isEditing} />
                Show Weekly %
              </label>
            </div>
        </div>

        {/* EDIT MODE AREA - WRAPPED IN FRAGMENT */}
        {isEditing && (
            <>
                <div className="toolbar">
                    <div className="pills">
                        {TABS.map(tab => (
                            <button 
                                key={tab} 
                                className={`pill ${activeTab === tab ? 'active':''}`} 
                                onClick={()=>setActiveTab(tab)}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* --- LIVE SEARCH WIDGET --- */}
                {activeTab === 'Crypto' && (
                    <div style={{ marginBottom: 15 }}>
                        <CryptoSearch onSelect={handleLiveSearchSelect} />
                    </div>
                )}
            </>
        )}

        <div className="main">
            {isEditing && (
                <div className="grid">
{/* --- START REPLACEMENT --- */}
{activeTab === 'Stocks' ? (
                        <div style={{ gridColumn: '1/-1' }}>
                            {/* 1. API Key Config Block */}
                            <div style={{ background: '#f8f9fa', padding: 20, borderRadius: 8, border: '1px solid #eee', marginBottom: 20 }}>
                                <h4 style={{ marginTop: 0 }}>Stock Market Configuration</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <label style={{ fontWeight: 600, fontSize: 12 }}>Finnhub API Key</label>
                                    <input 
                                        type="text" 
                                        value={stockKey}
                                        onChange={(e) => setStockKey(e.target.value)}
                                        placeholder="Ex: c123456789..."
                                        disabled={!isEditing}
                                        style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontFamily: 'monospace', width: '100%', maxWidth: '400px' }}
                                    />
                                    <div style={{fontSize: 12, color: '#666'}}>Required for search and display. <a href="https://finnhub.io/register" target="_blank" rel="noreferrer">Get Free Key</a></div>
                                </div>
                            </div>

                            {/* 2. Stock Search & List (THIS WAS MISSING) */}
                            {stockKey && (
                                <>
                                    <h4 style={{marginBottom: 10}}>Selected Stocks</h4>
                            
                                    {/* The Search Bar with Instant Logo Fetch */}
                                    <StockSearch deviceId={deviceId} onSelect={async (s) => {
                                        // 1. Create the new item (initially with no logo)
                                        const newItem: StockItem = {
                                            id: crypto.randomUUID(), 
                                            stock_ticker: s.symbol, 
                                            display_order: stockData.length + 1,
                                            display_text: s.description,
                                            color: 'white',
                                            isNew: true,
                                            logo_url: undefined // Start empty (shows 📈)
                                        };

                                        // 2. Add to list immediately (Optimistic UI)
                                        setStockData(prev => [...prev, newItem]);

                                        // 3. Background Fetch: Get the logo from Finnhub immediately
                                        if (stockKey) {
                                            try {
                                                const res = await fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${s.symbol}&token=${stockKey}`);
                                                if (res.ok) {
                                                    const profile = await res.json();
                                                    if (profile && profile.logo) {
                                                        // Found it! Update the state to show the logo
                                                        setStockData(prev => prev.map(p => 
                                                            p.id === newItem.id ? { ...p, logo_url: profile.logo } : p
                                                        ));
                                                    }
                                                }
                                            } catch (err) {
                                                console.error("Background logo fetch failed", err);
                                            }
                                        }
                                    }} />

                                    {/* The List of Added Stocks */}
                                    <div className="list">
                                        {stockData.map((item, idx) => (
                                            <div key={item.id || idx} className="row" style={{background: 'white', border:'1px solid #eee', padding: '8px 12px', borderRadius: 8, marginBottom: 8, display: 'flex', alignItems: 'center'}}>
                                                
                                                {/* 1. Logo or Generic Icon */}
                                                <div className="small-logo" style={{ marginRight: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', borderRadius: '50%', width: 32, height: 32, overflow: 'hidden' }}>
                                                    {item.logo_url ? (
                                                        <img src={item.logo_url} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                    ) : (
                                                        <span style={{ fontSize: 16 }}>📈</span>
                                                    )}
                                                </div>

                                                {/* 2. Text Stack */}
                                                <div style={{flex: 1}}>
                                                    {/* Top Line: Ticker (Bold) */}
                                                    <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#333' }}>
                                                        {item.stock_ticker}
                                                    </div>
                                                    
                                                    {/* Bottom Line: Display Text Input */}
                                                    <input 
                                                        placeholder="Enter display name..." 
                                                        value={item.display_text || ""} 
                                                        onChange={e => {
                                                            const val = e.target.value;
                                                            setStockData(prev => prev.map(p => p.id === item.id ? {...p, display_text: val} : p));
                                                        }}
                                                        style={{
                                                            padding: '2px 0', 
                                                            fontSize: '12px', 
                                                            color: '#666',
                                                            width: '100%',
                                                            border: 'none',
                                                            borderBottom: '1px dashed #ccc',
                                                            background: 'transparent',
                                                            outline: 'none'
                                                        }}
                                                    />
                                                </div>

                                                {/* 3. Actions */}
                                                <div className="actions">
                                                    <button className="icon-btn" onClick={() => moveStockItem(item.id, -1)}>↑</button>
                                                    <button className="icon-btn" onClick={() => moveStockItem(item.id, 1)}>↓</button>
                                                    <button className="icon-btn danger" onClick={() => {
                                                        setStockData(prev => prev.filter(p => p.id !== item.id));
                                                    }}>✕</button>
                                                </div>
                                            </div>
                                        ))}
                                        {stockData.length === 0 && <div style={{color: '#999', fontStyle: 'italic'}}>No stocks added yet. Search above to add.</div>}
                                    </div>


                                </>
                            )}
                        </div>
                    ) : activeTab !== 'Crypto' ? (
                         <div style={{ padding: 20, color: '#666', gridColumn: '1/-1', textAlign: 'center' }}>
                            {activeTab} data sources not connected yet.
                        </div>
) : (
                        // Crypto Tab: Show Left-Aligned List (Matches Stocks Layout)
                        <div style={{ gridColumn: '1/-1' }}>
                            <div style={{ textAlign: 'center', color: '#999', marginBottom: 20, fontStyle: 'italic', fontSize: '13px' }}>
                                Use the search bar above to add cryptocurrencies.
                            </div>
                            
                            <h4 style={{ marginBottom: 10 }}>Selected Cryptos ({selectedItems.length})</h4>
                            {selectedItems.length === 0 && <div style={{ color: '#999', fontStyle: 'italic' }}>No products selected.</div>}

                            <div className="list">
                                {selectedItems.map(item => (
                                    <div key={item.id} className="row" style={{background: 'white', border:'1px solid #eee', padding: 10, borderRadius: 8, marginBottom: 8, display: 'flex', alignItems: 'center'}}>
                                        <div className="small-logo" style={{ marginRight: 10 }}>
                                            {item.image_url ? (
                                                <img src={getIconSrc(item.image_url)} alt={item.code} className="small-logo" style={{width:24, height:24, borderRadius:'50%'}} />
                                            ) : (
                                                <span style={{ fontSize: 20 }}>🪙</span>
                                            )}
                                        </div>
                                        <div style={{flex:1}}>
                                            <div style={{fontWeight: 'bold'}}>{item.description}</div>
                                            <div style={{ fontSize: 11, color: '#888' }}>{item.pair.toUpperCase()}</div>
                                        </div>                            
                                        <div style={{ 
                                            background: '#eee', 
                                            padding: '2px 8px', 
                                            borderRadius: 4, 
                                            fontSize: 12, 
                                            fontWeight: 600,
                                            marginRight: 8,
                                            color: '#333'
                                        }}>
                                            {item.code.toUpperCase()}
                                        </div>

                                        <div className="actions">
                                            <button className="icon-btn" onClick={()=>moveItem(item.id, -1)}>↑</button>
                                            <button className="icon-btn" onClick={()=>moveItem(item.id, 1)}>↓</button>
                                            <button className="icon-btn danger" onClick={()=>removeItem(item.id)}>✕</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            )}
            {/* --- WRAP THIS BLOCK IN THE CONDITION BELOW --- */}
            {!isEditing && activeTab === 'Crypto' && (
                <aside className="aside" style={!isEditing ? { width: '100%', maxWidth: '600px', gridColumn: '1 / -1' } : {}}>
                    <div className="aside-h">
                        <strong>Selected Cryptos ({selectedItems.length})</strong>
                    </div>
                    {selectedItems.length === 0 && <div style={{ padding: 16, color: '#999' }}>No products selected.</div>}
                    <ul className="list">
                        {selectedItems.map(item => (
                            <li key={item.id} className="row">
                                <div className="small-logo">
                                    {item.image_url ? (
                                        <img src={getIconSrc(item.image_url)} alt={item.code} className="small-logo" />
                                    ) : (
                                        <span style={{ fontSize: 20 }}>🪙</span>
                                    )}
                                </div>
                                <div style={{flex:1}}>
                                    <div className="row-title">{item.description}</div>
                                    <div style={{ fontSize: 11, color: '#888' }}>{item.pair.toUpperCase()}</div>
                                </div>                            
                                <div style={{ 
                                    background: '#eee', 
                                    padding: '2px 8px', 
                                    borderRadius: 4, 
                                    fontSize: 12, 
                                    fontWeight: 600,
                                    marginRight: 8,
                                    color: '#333'
                                }}>
                                    {item.code.toUpperCase()}
                                </div>

                                {isEditing && (
                                    <div className="actions">
                                        <button className="icon-btn" onClick={()=>moveItem(item.id, -1)}>↑</button>
                                        <button className="icon-btn" onClick={()=>moveItem(item.id, 1)}>↓</button>
                                        <button className="icon-btn danger" onClick={()=>removeItem(item.id)}>✕</button>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </aside>
            )}
            {/* --- END OF WRAPPER --- */}

        </div>
    </div>
  );


}