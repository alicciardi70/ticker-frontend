// src/components/DeviceFinance.tsx
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import "./DeviceTeams.css"; 
import { useToast } from "../context/ToastContext"; 

const API_BASE = (import.meta as any).env?.VITE_API_BASE?.replace(/\/+$/, "") || "http://127.0.0.1:8000";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const TABS = ["Stocks", "Crypto", "Indices", "Economic"] as const;

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

// --- HELPER: Grip Icon for Dragging ---
const GripIcon = () => (
    <svg width="12" height="16" viewBox="0 0 6 10" fill="#ccc" style={{ cursor: 'grab', marginRight: 8 }}>
        <path d="M0 0h2v2H0V0zm4 0h2v2H4V0zM0 4h2v2H0V4zm4 0h2v2H4V4zM0 8h2v2H0V8zm4 0h2v2H4V8z"/>
    </svg>
);

// --- SEARCH COMPONENTS (Unchanged logic, simplified styling) ---
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
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' }}
            />
            {query.length >= 2 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #ddd', borderRadius: '0 0 8px 8px', zIndex: 100, maxHeight: '300px', overflowY: 'auto', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    {results.map(coin => (
                        <div key={coin.id} onClick={() => { onSelect(coin); setQuery(""); setResults([]); }} style={{ padding: '10px', borderBottom: '1px solid #eee', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
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

function StockSearch({ deviceId, stockKey, onSelect }: { deviceId: string, stockKey: string, onSelect: (stock: any) => void }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        if (query.length < 2) { setResults([]); return; }
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`${API_BASE}/devices/${deviceId}/stocks/search?q=${query}`, { headers: authHeaders() });
                if (res.status === 400 && stockKey === "") { toast?.("Please enter API Key first", "error"); return; }
                if(res.ok) { const data = await res.json(); setResults(data || []); }
            } catch (e) { console.error(e); }
        }, 600);
        return () => clearTimeout(timer);
    }, [query, deviceId, stockKey]);

    return (
        <div className="search-box" style={{ marginBottom: 20, position: 'relative' }}>
            <input 
                type="text" 
                placeholder="Search to add stocks (e.g. AAPL)..." 
                value={query}
                onChange={e => setQuery(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' }}
            />
            {query.length >= 2 && results.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #ddd', borderRadius: '0 0 8px 8px', zIndex: 100, maxHeight: '300px', overflowY: 'auto', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    {results.map((stock, i) => (
                        <div key={i} onClick={() => { onSelect(stock); setQuery(""); setResults([]); }} style={{ padding: '10px', borderBottom: '1px solid #eee', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ fontWeight: 'bold', width: 50 }}>{stock.symbol}</div>
                            <div style={{ flex: 1 }}>{stock.description}</div>
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
  const [isSaving, setIsSaving] = useState(false);
  
  // Settings
  const [showHourly, setShowHourly] = useState(false);
  const [showDaily, setShowDaily]   = useState(false);
  const [showWeekly, setShowWeekly] = useState(false);
  const [stockKey, setStockKey] = useState("");

  // Data
  const [cryptoData, setCryptoData] = useState<CryptoItem[]>([]);
  const [stockData, setStockData] = useState<StockItem[]>([]);
  
  // Tab State
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>("Stocks");

  // Drag & Drop Refs
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);


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
        setStockKey(d.finance_stocks_apikey || "");
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
  // This is called explicitly after any data modification
  const autoSave = async (newStocks?: StockItem[], newCryptos?: CryptoItem[], newKey?: string) => {
      setIsSaving(true);
      try {
          // Use provided data or fall back to current state
          const stocksToSave = newStocks || stockData;
          const cryptosToSave = newCryptos || cryptoData; // Note: cryptoData contains ALL, we filter selected
          const keyToSave = newKey !== undefined ? newKey : stockKey;

          // A. Save Stocks
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

          // B. Save Crypto
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
          await fetch(`${API_BASE}/devices/${deviceId}/crypto`, {
              method: "PUT",
              headers: { "Content-Type": "application/json", ...authHeaders() },
              body: JSON.stringify(cryptoPayload),
          });

          // C. Save Globals (Only if key changed)
          if (newKey !== undefined) {
             await fetch(`${API_BASE}/devices/${deviceId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", ...authHeaders() },
                body: JSON.stringify({ finance_stocks_apikey: keyToSave }),
            });
          }

      } catch (e) {
          console.error("Auto-save failed", e);
          toast?.("Failed to save changes", "error");
      } finally {
          setIsSaving(false);
      }
  };


  // --- 3. EVENT HANDLERS ---

  // Stock Add
  const handleStockAdd = async (s: any) => {
    // Optimistic Add
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
    autoSave(newList); // Save immediately

    // Fetch Logo Background
    if (stockKey) {
        fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${s.symbol}&token=${stockKey}`)
            .then(r => r.json())
            .then(profile => {
                if (profile?.logo) {
                    setStockData(prev => prev.map(p => p.id === newItem.id ? { ...p, logo_url: profile.logo } : p));
                }
            });
    }
  };

  // Crypto Add
  const handleCryptoAdd = async (coin: any) => {
      // Check existing
      const existing = cryptoData.find(c => c.code === coin.symbol.toLowerCase());
      if (existing) {
          if(!existing.selected) {
             toggleCryptoSelection(existing.id);
             toast?.(`Added ${existing.description}`);
          } else {
             toast?.("Already added!");
          }
          return;
      }

      // Add New via Backend Validation
      try {
        const res = await fetch(`${API_BASE}/devices/${deviceId}/crypto/validate-and-add`, {
            method: 'POST',
            headers: { "Content-Type": "application/json", ...authHeaders() },
            body: JSON.stringify({ code: coin.symbol, name: coin.name, image_url: coin.thumb })
        });
        if (!res.ok) throw new Error("Failed to add");
        const newCoin = await res.json();
        
        const newItem: CryptoItem = {
            id: newCoin.id,
            pair: newCoin.pair,
            code: newCoin.code,
            currency: "usd",
            description: newCoin.description,
            image_url: newCoin.image_url,
            selected: true,
            order: cryptoData.filter(c=>c.selected).length + 1,
            display_text: newCoin.code.toUpperCase(),
            color: 'white'
        };

        const newList = [...cryptoData, newItem];
        setCryptoData(newList);
        autoSave(undefined, newList);
        toast?.(`Added ${newCoin.description}`);

      } catch(e) { toast?.("Could not add crypto", "error"); }
  };

  const toggleCryptoSelection = (id: string) => {
      setCryptoData(prev => {
          const target = prev.find(p => p.id === id);
          if(!target) return prev;
          
          let newList;
          if (!target.selected) {
              // Add
              const maxOrder = prev.reduce((max, p) => p.selected ? Math.max(max, p.order) : max, 0);
              newList = prev.map(p => p.id === id ? { ...p, selected: true, order: maxOrder + 1 } : p);
          } else {
              // Remove
              newList = prev.map(p => p.id === id ? { ...p, selected: false, order: 0 } : p);
          }
          autoSave(undefined, newList);
          return newList;
      });
  };

  const removeStock = (id: string) => {
      const newList = stockData.filter(s => s.id !== id);
      setStockData(newList);
      autoSave(newList);
  };
  
  const removeCrypto = (id: string) => toggleCryptoSelection(id);


  // --- 4. DRAG AND DROP LOGIC ---
  const handleSort = () => {
      // Duplicate list
      const listCopy = activeTab === 'Stocks' ? [...stockData] : [...cryptoData];
      
      // If we are in Crypto, we are only reordering the *selected* subset visually, 
      // but in the data model we need to be careful.
      // Simplification: For Crypto, we extract selected, reorder, then merge back.
      
      if (dragItem.current === null || dragOverItem.current === null) return;
      if (dragItem.current === dragOverItem.current) return;

      if (activeTab === 'Stocks') {
          const draggedItemContent = listCopy[dragItem.current];
          listCopy.splice(dragItem.current, 1);
          listCopy.splice(dragOverItem.current, 0, draggedItemContent);
          
          // Reassign display_order
          const reordered = listCopy.map((item: any, index) => ({ ...item, display_order: index + 1 }));
          
          setStockData(reordered);
          autoSave(reordered as StockItem[]);
      } 
      else if (activeTab === 'Crypto') {
          // Filter only selected for the drag view
          const selected = cryptoData.filter(c => c.selected).sort((a,b) => a.order - b.order);
          const draggedItemContent = selected[dragItem.current];
          selected.splice(dragItem.current, 1);
          selected.splice(dragOverItem.current, 0, draggedItemContent);

          // Update orders
          const newOrderMap = new Map();
          selected.forEach((item, idx) => newOrderMap.set(item.id, idx + 1));

          const merged = cryptoData.map(c => ({
              ...c,
              order: newOrderMap.has(c.id) ? newOrderMap.get(c.id) : c.order
          }));
          
          setCryptoData(merged);
          autoSave(undefined, merged);
      }
      
      // Reset
      dragItem.current = null;
      dragOverItem.current = null;
  };


  if (loading) return <div className="dv-muted">Loading finance...</div>;

  // Helpers for Render
  const selectedCryptos = cryptoData.filter(c => c.selected).sort((a,b) => a.order - b.order);

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
       
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
           <h3 style={{ fontSize: "18px", fontWeight: "700", margin: 0 }}>Finance Settings</h3>
           {isSaving && <div style={{ fontSize: 12, color: '#888', fontStyle: 'italic' }}>Saving changes...</div>}
       </div>



       {/* Tabs */}
       <div className="toolbar" style={{ marginBottom: 20 }}>
            <div className="pills">
                {TABS.map(tab => (
                    <button key={tab} className={`pill ${activeTab === tab ? 'active':''}`} onClick={()=>setActiveTab(tab)}>
                        {tab}
                    </button>
                ))}
            </div>
       </div>

        {/* --- STOCKS TAB --- */}
        {activeTab === 'Stocks' && (
            <div style={{ gridColumn: '1/-1' }}>

                {/* API Key Box */}
                <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: 8, border: '1px solid #eee', marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>Finnhub API Key</div>
                        <div style={{ fontSize: 11, color: '#666' }}><a href="https://finnhub.io/register" target="_blank" rel="noreferrer">Get Key</a></div>
                    </div>
                    <input 
                        type="text" 
                        value={stockKey}
                        onChange={(e) => {
                            setStockKey(e.target.value);
                            // Debounce or save on blur usually better, but for now specific save:
                        }}
                        onBlur={() => autoSave(undefined, undefined, stockKey)}
                        placeholder="Required for Stocks..."
                        style={{ marginTop: 5, padding: '8px', borderRadius: '6px', border: '1px solid #ccc', fontFamily: 'monospace', width: '100%' }}
                    />
                </div>

                <StockSearch deviceId={deviceId} stockKey={stockKey} onSelect={handleStockAdd} />
                
                <h4 style={{marginBottom: 10, fontSize: 14, textTransform: 'uppercase', color: '#888', letterSpacing: 0.5 }}>
                    Selected Stocks ({stockData.length})
                </h4>

                <div className="list">
                    {stockData.map((item, idx) => (
                        <div 
                            key={item.id} 
                            className="row"
                            draggable
                            onDragStart={() => (dragItem.current = idx)}
                            onDragEnter={() => (dragOverItem.current = idx)}
                            onDragEnd={handleSort}
                            onDragOver={(e) => e.preventDefault()}
                            style={{ cursor: 'move', background: 'white', border:'1px solid #eee', padding: '8px 12px', borderRadius: 8, marginBottom: 8, display: 'flex', alignItems: 'center'}}
                        >
                            <GripIcon />
                            
                            <div className="small-logo" style={{ marginRight: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', borderRadius: '50%', width: 32, height: 32, overflow: 'hidden' }}>
                                {item.logo_url ? (
                                    <img src={item.logo_url} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                ) : (
                                    <span style={{ fontSize: 16 }}>📈</span>
                                )}
                            </div>

                            <div style={{flex: 1}}>
                                <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#333' }}>{item.stock_ticker}</div>
                                <input 
                                    placeholder="Display Name" 
                                    value={item.display_text || ""} 
                                    onChange={e => {
                                        const val = e.target.value;
                                        setStockData(prev => prev.map(p => p.id === item.id ? {...p, display_text: val} : p));
                                    }}
                                    onBlur={() => autoSave()} // Save on finish typing
                                    style={{ padding: '2px 0', fontSize: '12px', color: '#666', width: '100%', border: 'none', background: 'transparent', outline: 'none' }}
                                />
                            </div>

                            <button className="icon-btn danger" onClick={() => removeStock(item.id)}>✕</button>
                        </div>
                    ))}
                    {stockData.length === 0 && <div style={{color: '#999', fontStyle: 'italic', padding: 20, textAlign: 'center'}}>No stocks added.</div>}
                </div>
            </div>
        )}

        {/* --- CRYPTO TAB --- */}
        {activeTab === 'Crypto' && (
            <div style={{ gridColumn: '1/-1' }}>
                <CryptoSearch onSelect={handleCryptoAdd} />
                
                <h4 style={{marginBottom: 10, fontSize: 14, textTransform: 'uppercase', color: '#888', letterSpacing: 0.5 }}>
                    Selected Cryptos ({selectedCryptos.length})
                </h4>

                <div className="list">
                    {selectedCryptos.map((item, idx) => (
                        <div 
                            key={item.id} 
                            className="row"
                            draggable
                            onDragStart={() => (dragItem.current = idx)}
                            onDragEnter={() => (dragOverItem.current = idx)}
                            onDragEnd={handleSort}
                            onDragOver={(e) => e.preventDefault()}
                            style={{ cursor: 'move', background: 'white', border:'1px solid #eee', padding: '10px', borderRadius: 8, marginBottom: 8, display: 'flex', alignItems: 'center'}}
                        >
                            <GripIcon />
                            
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
                            <div style={{ background: '#eee', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600, marginRight: 8, color: '#333' }}>
                                {item.code.toUpperCase()}
                            </div>

                            <button className="icon-btn danger" onClick={()=>removeCrypto(item.id)}>✕</button>
                        </div>
                    ))}
                    {selectedCryptos.length === 0 && <div style={{color: '#999', fontStyle: 'italic', padding: 20, textAlign: 'center'}}>No crypto selected.</div>}
                </div>
            </div>
        )}

        {/* --- OTHER TABS --- */}
        {(activeTab === 'Indices' || activeTab === 'Economic') && (
             <div style={{ padding: 40, color: '#999', textAlign: 'center' }}>
                Coming Soon
            </div>
        )}
    </div>
  );
}