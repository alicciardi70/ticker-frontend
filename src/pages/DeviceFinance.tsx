// src/components/DeviceFinance.tsx
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import "./DeviceTeams.css"; 
import { useToast } from "../context/ToastContext"; 

const API_BASE = (import.meta as any).env?.VITE_API_BASE?.replace(/\/+$/, "") || "http://127.0.0.1:8000";
const STOCK_API_KEY = "d4ve149r01qs25evfcm0d4ve149r01qs25evfcmg";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const TABS = ["Stocks", "Crypto", "Indices", "Economic"] as const;

// Reusable Dark Mode Styles
const styles = {
    card: {
        background: '#111',
        padding: '24px',
        borderRadius: '12px',
        border: '1px solid #333'
    },
    // Base row style
    row: {
        background: '#111',
        border: '1px solid #333',
        padding: '10px 12px',
        borderRadius: '8px',
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'center',
        cursor: 'grab',
        color: '#fff',
        transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)' // Smooth animation for the gap
    },
    logoWrapper: {
        marginRight: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000',
        borderRadius: '50%',
        width: 32,
        height: 32,
        overflow: 'hidden',
        border: '1px solid #333'
    },
    sectionTitle: {
        marginBottom: 10,
        fontSize: 14,
        textTransform: 'uppercase' as const,
        color: '#888',
        letterSpacing: 0.5,
        fontWeight: 700
    },
    input: {
        background: '#0a0a0a',
        border: '1px solid #333',
        color: '#fff',
        padding: '12px',
        borderRadius: '8px',
        width: '100%',
        fontSize: '14px'
    }
};

type CryptoItem = {
  id: string;
  pair: string;
  code: string;
  currency: string;
  description: string;
  image_url?: string | null;
  selected: boolean;
  order: number;
  display_text?: string;
  color?: string;
};

type StockItem = {
    id: string;
    stock_ticker: string;
    display_order: number;
    display_text?: string;
    color: string;
    logo_url?: string;    
};

const getIconSrc = (url: string | null | undefined) => {
    if (!url) return undefined;
    if (url.startsWith("http")) return url; 
    return `/${url}`;
};

const GripIcon = () => (
    <svg width="12" height="16" viewBox="0 0 6 10" fill="#666" style={{ cursor: 'grab', marginRight: 12 }}>
        <path d="M0 0h2v2H0V0zm4 0h2v2H4V0zM0 4h2v2H0V4zm4 0h2v2H4V4zM0 8h2v2H0V8zm4 0h2v2H4V8z"/>
    </svg>
);

// --- SEARCH COMPONENTS (Unchanged) ---
function CryptoSearch({ onSelect }: { onSelect: (coin: any) => void }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        if (query.length < 2) { setResults([]); return; }
        const timer = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await fetch(`https://api.coingecko.com/api/v3/search?query=${query}`);
                const data = await res.json();
                setResults(data.coins || []);
            } catch (e) { console.error(e); } finally { setSearching(false); }
        }, 500);
        return () => clearTimeout(timer);
    }, [query]);

    return (
        <div className="search-box" style={{ marginBottom: 20, position: 'relative' }}>
            <input 
                type="text" 
                placeholder="Search to add crypto (e.g. Bitcoin)..." 
                value={query}
                onChange={e => setQuery(e.target.value)}
                style={styles.input}
            />
            {query.length >= 2 && results.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1a1a1a', border: '1px solid #333', borderRadius: '0 0 8px 8px', zIndex: 100, maxHeight: '300px', overflowY: 'auto', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}>
                    {results.map(coin => (
                        <div key={coin.id} onClick={() => { onSelect(coin); setQuery(""); setResults([]); }} 
                             style={{ padding: '12px', borderBottom: '1px solid #333', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, color: '#fff' }}>
                            <img src={coin.thumb} alt={coin.symbol} style={{ width: 20, height: 20, borderRadius: '50%' }} />
                            <div>
                                <div style={{ fontWeight: 600 }}>{coin.name}</div>
                            </div>
                        </div>
                    ))}                    
                </div>
            )}
        </div>
    );
}

function StockSearch({ deviceId, onSelect }: { deviceId: string, onSelect: (stock: any) => void }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (query.length < 2) { 
            setResults([]); 
            setIsLoading(false); 
            return; 
        }
        setIsLoading(true);
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`https://finnhub.io/api/v1/search?q=${query}&token=${STOCK_API_KEY}`);
                if (res.status === 400) { toast?.("API Configuration Error", "error"); return; }
                if (res.ok) { 
                    const data = await res.json(); 
                    setResults(data.result || []);
                }
            } catch (e) { console.error(e); } finally { setIsLoading(false); }
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    return (
        <div className="search-box" style={{ marginBottom: 20, position: 'relative' }}>
            <div style={{ position: 'relative' }}>
                <input 
                    type="text" 
                    placeholder="Search to add stocks (e.g. AAPL)..." 
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    style={{ ...styles.input, paddingRight: '40px' }}
                />
                {isLoading && <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#666', fontSize: '12px', fontStyle: 'italic', pointerEvents: 'none' }}>...</div>}
            </div>
            {query.length >= 2 && results.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1a1a1a', border: '1px solid #333', borderRadius: '0 0 8px 8px', zIndex: 100, maxHeight: '300px', overflowY: 'auto', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}>
                    {results.map((stock, i) => (
                        <div key={i} onClick={() => { onSelect(stock); setQuery(""); setResults([]); }} 
                             style={{ padding: '12px', borderBottom: '1px solid #333', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, color: '#fff' }}>
                            <div style={{ fontWeight: 'bold', width: 90, flexShrink: 0, color: '#00ff41' }}>{stock.symbol}</div>
                            <div style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#ccc' }}>{stock.description}</div>
                        </div>
                    ))}                    
                </div>
            )}
        </div>
    );
}

export function DeviceFinancePanel({ deviceId }: { deviceId: string }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Settings
  const [showHourly, setShowHourly] = useState(false);
  const [showDaily, setShowDaily]   = useState(false);
  const [showWeekly, setShowWeekly] = useState(false);
  const [showIndices, setShowIndices] = useState(false);

  // Data
  const [cryptoData, setCryptoData] = useState<CryptoItem[]>([]);
  const [stockData, setStockData] = useState<StockItem[]>([]);
  const [targetCurrency, setTargetCurrency] = useState("usd");

  // Tab State
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>("Stocks");

  // Drag & Drop State (UPDATED for visual feedback)
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null); // For ghost effect
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null); // For gap effect

  // --- 1. LOAD DATA ---
  const loadData = useCallback(async () => {
    if(!deviceId) return;
    setLoading(true);
    try {
      const [devRes, cRes, sRes] = await Promise.all([
          fetch(`${API_BASE}/devices/${deviceId}`, { headers: authHeaders() }),
          fetch(`${API_BASE}/devices/${deviceId}/crypto/available`, { headers: authHeaders() }),
          fetch(`${API_BASE}/devices/${deviceId}/stocks`, { headers: authHeaders() })
      ]);

      if (devRes.ok) {
        const d = await devRes.json();
        setShowHourly(d.finance_show_hourly_change ?? false);
        setShowDaily(d.finance_show_daily_change ?? false);
        setShowWeekly(d.finance_show_weekly_change ?? false);
        setShowIndices(d.show_indices ?? false);
      }
      if (cRes.ok) setCryptoData(await cRes.json());
      if (sRes.ok) setStockData(await sRes.json());
    } catch (e: any) {
      console.error(e);
      toast?.("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => { loadData(); }, [loadData]);

  // --- 2. AUTO-SAVE FUNCTION ---
  const autoSave = async (newStocks?: StockItem[], newCryptos?: CryptoItem[]) => {
      setIsSaving(true);
      try {
          const stocksToSave = newStocks || stockData;
          const cryptosToSave = newCryptos || cryptoData; 

          // Save Stocks
          const stockPayload = {
              items: stocksToSave.map((item, i) => ({
                  stock_ticker: item.stock_ticker,
                  display_order: i + 1,
                  display_text: item.display_text || item.stock_ticker,
                  color: item.color || 'white'
              }))
          };
          await fetch(`${API_BASE}/devices/${deviceId}/stocks`, {
              method: "PUT",
              headers: { "Content-Type": "application/json", ...authHeaders() },
              body: JSON.stringify(stockPayload),
          });

          // Save Crypto
          const selectedCryptos = cryptosToSave.filter(c => c.selected).sort((a,b) => a.order - b.order);
          const cryptoPayload = {
              items: selectedCryptos.map((item, i) => ({
                  crypto_pair_id: item.id,
                  display_order: i + 1,
                  display_text: item.display_text,
                  color: item.color,
                  hourly_change: showHourly, 
                  daily_change: showDaily,
                  weekly_change: showWeekly
              }))
          };
          const cRes = await fetch(`${API_BASE}/devices/${deviceId}/crypto`, {
              method: "PUT",
              headers: { "Content-Type": "application/json", ...authHeaders() },
              body: JSON.stringify(cryptoPayload),
          });
          if (!cRes.ok) throw new Error("Failed to save crypto");

      } catch (e) {
          console.error("Auto-save failed", e);
          toast?.("Failed to save changes", "error");
      } finally {
          setIsSaving(false);
      }
  };

  const handleIndicesToggle = async (checked: boolean) => {
    setShowIndices(checked);
    try {
        await fetch(`${API_BASE}/devices/${deviceId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", ...authHeaders() },
            body: JSON.stringify({ show_indices: checked }),
        });
    } catch (e) { console.error(e); }
  };

  // --- 3. EVENT HANDLERS ---
  const handleStockAdd = async (s: any) => {
    const newItem: StockItem = {
        id: crypto.randomUUID(), 
        stock_ticker: s.symbol, 
        display_order: stockData.length + 1,
        display_text: s.description,
        color: 'white',
        logo_url: undefined
    };
    const newList = [...stockData, newItem];
    setStockData(newList);
    autoSave(newList); 

    fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${s.symbol}&token=${STOCK_API_KEY}`)
        .then(r => r.json())
        .then(profile => {
            if (profile?.logo) {
                setStockData(prev => prev.map(p => p.id === newItem.id ? { ...p, logo_url: profile.logo } : p));
            }
        });
  }; 

  const handleCryptoAdd = async (coin: any) => {
    try {
        const res = await fetch(`${API_BASE}/devices/${deviceId}/crypto/validate-and-add`, {
            method: 'POST',
            headers: { "Content-Type": "application/json", ...authHeaders() },
            body: JSON.stringify({ 
                code: coin.symbol, 
                name: coin.name, 
                image_url: coin.thumb,
                fetch_id: coin.id,
                currency: targetCurrency 
            })
        });
        if (!res.ok) {
            const err = await res.json();
            toast?.(err.detail || "Failed to add coin. Check currency support.", "error");
            return;
        }
        const validatedCoin = await res.json();
        
        const newItem: CryptoItem = {
            id: validatedCoin.id,
            pair: validatedCoin.pair,
            code: validatedCoin.code,
            currency: targetCurrency, 
            description: validatedCoin.description,
            selected: true,
            order: cryptoData.filter(c => c.selected).length + 1,
            image_url: validatedCoin.image_url || validatedCoin.device_icon_path || coin.thumb 
        };

        const newList = [...cryptoData, newItem];
        setCryptoData(newList);
        await autoSave(undefined, newList); 
        toast?.(`Added ${validatedCoin.code.toUpperCase()} (${targetCurrency.toUpperCase()})`);
    } catch(e) { console.error(e); toast?.("Critical Error adding coin", "error"); }
  };

  const removeStock = (id: string) => {
      const newList = stockData.filter(s => s.id !== id);
      setStockData(newList);
      autoSave(newList);
  };
  
  const removeCrypto = (id: string) => {
      setCryptoData(prev => {
          const newList = prev.map(p => p.id === id ? { ...p, selected: false, order: 0 } : p);
          autoSave(undefined, newList);
          return newList;
      });
  };

// --- 4. DRAG AND DROP LOGIC (FIXED) ---
  const handleSort = () => {
      // 1. Guard: Check validity
      if (dragItem.current === null || dragOverItem.current === null) {
          setDraggingIdx(null);
          setDragOverIdx(null);
          return;
      }

      // 2. Only sort if positions are different
      if (dragItem.current !== dragOverItem.current) {
          const listCopy = activeTab === 'Stocks' ? [...stockData] : [...cryptoData];
          
          if (activeTab === 'Stocks') {
              const draggedItemContent = listCopy[dragItem.current];
              listCopy.splice(dragItem.current, 1);
              listCopy.splice(dragOverItem.current, 0, draggedItemContent);
              
              const reordered = listCopy.map((item: any, index) => ({ ...item, display_order: index + 1 }));
              setStockData(reordered);
              autoSave(reordered as StockItem[]);
          } 
          else if (activeTab === 'Crypto') {
              const selected = cryptoData.filter(c => c.selected).sort((a,b) => a.order - b.order);
              const draggedItemContent = selected[dragItem.current];
              selected.splice(dragItem.current, 1);
              selected.splice(dragOverItem.current, 0, draggedItemContent);
    
              const newOrderMap = new Map();
              selected.forEach((item, idx) => newOrderMap.set(item.id, idx + 1));
    
              const merged = cryptoData.map(c => ({
                  ...c,
                  order: newOrderMap.has(c.id) ? newOrderMap.get(c.id) : c.order
              }));
              setCryptoData(merged);
              autoSave(undefined, merged);
          }
      }
      
      // 3. ALWAYS Reset State (This fixes the stuck dimming)
      dragItem.current = null;
      dragOverItem.current = null;
      setDraggingIdx(null);
      setDragOverIdx(null);
  };

  if (loading) return <div style={{color: '#666'}}>Loading finance...</div>;
  const selectedCryptos = cryptoData.filter(c => c.selected).sort((a,b) => a.order - b.order);

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
           <h3 style={{ fontSize: "18px", fontWeight: "700", margin: 0, color: '#fff' }}>Finance Settings</h3>
           {isSaving && <div style={{ fontSize: 12, color: '#888', fontStyle: 'italic' }}>Saving changes...</div>}
       </div>

       {/* Tabs */}
       <div className="toolbar" style={{ marginBottom: 20 }}>
            <div className="pills">
                {TABS.map(tab => (
                    <button key={tab} 
                        onClick={()=>setActiveTab(tab)}
                        style={{
                            background: activeTab === tab ? '#00ff41' : '#111',
                            color: activeTab === tab ? '#000' : '#fff',
                            border: '1px solid #333',
                            padding: '6px 16px', borderRadius: 20, cursor: 'pointer', fontWeight: 600,
                            marginRight: 8
                        }}
                    >{tab}</button>
                ))}
            </div>
       </div>

        {/* --- STOCKS TAB --- */}
        {activeTab === 'Stocks' && (
            <div style={{ gridColumn: '1/-1' }}>
                <StockSearch deviceId={deviceId} onSelect={handleStockAdd} />
                <h4 style={styles.sectionTitle}>Selected Stocks ({stockData.length})</h4>
                <div className="list" onDragOver={(e) => e.preventDefault()}>
                    {stockData.map((item, idx) => {
                        // --- DYNAMIC STYLING FOR DND ---
                        const isDragging = draggingIdx === idx;
                        const isDragOver = dragOverIdx === idx && !isDragging;
                        return (
                            <div 
                                key={item.id} 
                                draggable
                                onDragStart={() => {
                                    dragItem.current = idx;
                                    setDraggingIdx(idx); // Trigger dimmed state
                                }}
                                onDragEnter={() => {
                                    dragOverItem.current = idx;
                                    setDragOverIdx(idx); // Trigger gap state
                                }}
                                onDragEnd={handleSort}

                                onDragOver={(e) => e.preventDefault()}


                                style={{
                                    ...styles.row,
                                    // Visual Feedback:
                                    opacity: isDragging ? 0.3 : 1, // Dim if dragging
                                    marginTop: isDragOver ? '30px' : '0', // Create gap if hovering
                                    borderTop: isDragOver ? '2px solid #00ff41' : '1px solid #333', // Neon line
                                    transform: isDragOver ? 'scale(1.02)' : 'scale(1)',
                                }}
                            >
                                <GripIcon />
                                <div style={styles.logoWrapper}>
                                    {item.logo_url ? <img src={item.logo_url} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span style={{ fontSize: 16 }}>📈</span>}
                                </div>
                                <div style={{flex: 1}}>
                                    <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#fff' }}>{item.stock_ticker}</div>
                                    <input 
                                        placeholder="Display Name" 
                                        value={item.display_text || ""} 
                                        onChange={e => {
                                            const val = e.target.value;
                                            setStockData(prev => prev.map(p => p.id === item.id ? {...p, display_text: val} : p));
                                        }}
                                        onBlur={() => autoSave()}
                                        style={{ padding: '2px 0', fontSize: '12px', color: '#888', width: '100%', border: 'none', background: 'transparent', outline: 'none' }}
                                    />
                                </div>
                                <button style={{background:'transparent', border:'none', color:'#ef4444', cursor:'pointer'}} onClick={() => removeStock(item.id)}>✕</button>
                            </div>
                        );
                    })}
                    {stockData.length === 0 && <div style={{color: '#666', fontStyle: 'italic', padding: 20, textAlign: 'center'}}>No stocks added.</div>}
                </div>
            </div>
        )}

        {/* --- CRYPTO TAB --- */}
        {activeTab === 'Crypto' && (
            <div style={{ gridColumn: '1/-1' }}>
                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                    <div style={{ flex: 1 }}><CryptoSearch onSelect={handleCryptoAdd} /></div>
                    <select value={targetCurrency} onChange={(e) => setTargetCurrency(e.target.value)} style={{ ...styles.input, width: 'auto', minWidth: '80px', cursor: 'pointer', height: '45px' }}>
                        <option value="usd">USD ($)</option>
                        <option value="eur">EUR (€)</option>
                        <option value="gbp">GBP (£)</option>
                        <option value="jpy">JPY (¥)</option>
                    </select>
                </div>
                <h4 style={styles.sectionTitle}>Selected Cryptos ({selectedCryptos.length})</h4>
                <div className="list" onDragOver={(e) => e.preventDefault()}>
                    {selectedCryptos.map((item, idx) => {
                        // --- DYNAMIC STYLING FOR DND ---
                        const isDragging = draggingIdx === idx;
                        const isDragOver = dragOverIdx === idx && !isDragging;
                        return (
                            <div 
                                key={item.id} 
                                draggable
                                onDragStart={() => {
                                    dragItem.current = idx;
                                    setDraggingIdx(idx);
                                }}
                                onDragEnter={() => {
                                    dragOverItem.current = idx;
                                    setDragOverIdx(idx);
                                }}
                                onDragEnd={handleSort}
                                onDragOver={(e) => e.preventDefault()}
                                style={{
                                    ...styles.row,
                                    // Visual Feedback:
                                    opacity: isDragging ? 0.3 : 1,
                                    marginTop: isDragOver ? '30px' : '0',
                                    borderTop: isDragOver ? '2px solid #00ff41' : '1px solid #333',
                                    transform: isDragOver ? 'scale(1.02)' : 'scale(1)',
                                }}
                            >
                                <GripIcon />
                                <div style={styles.logoWrapper}>
                                    {item.image_url ? <img src={getIconSrc(item.image_url)} alt={item.code} style={{width:24, height:24, borderRadius:'50%'}} /> : <span style={{ fontSize: 20 }}>🪙</span>}
                                </div>
                                <div style={{flex:1}}>
                                    <div style={{fontWeight: 'bold', color: '#fff'}}>{item.description}</div>
                                    <div style={{ fontSize: 11, color: '#666' }}>{item.pair.toUpperCase()}</div>
                                </div>                            
                                <div style={{ background: '#222', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600, marginRight: 8, color: '#ccc', border: '1px solid #333' }}>
                                    {item.code.toUpperCase()}
                                </div>
                                <button style={{background:'transparent', border:'none', color:'#ef4444', cursor:'pointer'}} onClick={()=>removeCrypto(item.id)}>✕</button>
                            </div>
                        );
                    })}
                    {selectedCryptos.length === 0 && <div style={{color: '#666', fontStyle: 'italic', padding: 20, textAlign: 'center'}}>No crypto selected.</div>}
                </div>
            </div>
        )}

        {/* --- INDICES TAB (Unchanged) --- */}
        {activeTab === 'Indices' && (
            <div style={styles.card}>
                <h4 style={styles.sectionTitle}>Market Indices</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <label style={{ fontWeight: 600, cursor: "pointer", display: 'flex', alignItems: 'center', gap: 10, color: '#fff' }}>
                        <input type="checkbox" checked={showIndices} onChange={(e) => handleIndicesToggle(e.target.checked)} style={{ width: 18, height: 18, cursor: "pointer", accentColor: '#00ff41' }} />
                        <span style={{ fontSize: 15 }}>Show Major Indices (Dow, S&P 500)</span>
                    </label>
                    <div style={{ fontSize: 12, color: '#888', marginLeft: 28 }}>Displays the current value and daily change for major US market indices.</div>
                </div>
            </div>
        )}
        { activeTab === 'Economic' && <div style={{ padding: 40, color: '#666', textAlign: 'center' }}>Coming Soon</div>}
    </div>
  );
}