// src/components/DeviceSports.tsx
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import "./DeviceTeams.css";

const API_BASE = (import.meta as any).env?.VITE_API_BASE?.replace(/\/+$/, "") || "http://127.0.0.1:8000";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// --- Dark Mode Styles ---
const styles = {
    panel: {
        background: '#111',
        border: '1px solid #333',
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '20px'
    },
    // Grid Card Style
    card: {
        background: '#111',
        border: '1px solid #333',
        borderRadius: '12px',
        padding: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        color: '#fff'
    },
    cardActive: {
        borderColor: '#00ff41',
        background: 'rgba(0, 255, 65, 0.05)',
        boxShadow: '0 0 15px rgba(0, 255, 65, 0.1)'
    },
    // Sidebar Row Style
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
        transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)'
    },
    sectionTitle: {
        fontSize: "14px", 
        fontWeight: "700", 
        color: "#888", 
        textTransform: "uppercase" as const, 
        letterSpacing: "0.05em",
        marginBottom: "12px"
    },
    logoWrapper: {
        width: 32, height: 32,
        borderRadius: 6,
        background: '#000',
        display: 'grid',
        placeItems: 'center',
        border: '1px solid #333',
        marginRight: 12
    },
    pill: {
        background: '#111',
        border: '1px solid #333',
        color: '#888',
        padding: '6px 16px',
        borderRadius: '20px',
        cursor: 'pointer',
        fontWeight: 600,
        fontSize: '13px',
        transition: 'all 0.2s'
    },
    pillActive: {
        background: '#00ff41',
        color: '#000',
        borderColor: '#00ff41',
        boxShadow: '0 0 10px rgba(0, 255, 65, 0.3)'
    }
};

type Team = {
  id: string;
  league_id: string;
  market: string;
  name: string;
  short_name?: string | null;
  icon_path?: string | null;
};
type SelectedTeam = {
  team_id: string;
  display_order: number;
};

const LEAGUES = ["MLB", "NFL", "NBA", "NHL", "MLS", "EPL"] as const;
const emoji: Record<string, string> = { MLB: "⚾", NFL: "🏈", NBA: "🏀", NHL: "🏒", MLS: "⚽", EPL: "⚽" };

const GripIcon = () => (
    <svg width="12" height="16" viewBox="0 0 6 10" fill="#666" style={{ cursor: 'grab', marginRight: 12 }}>
        <path d="M0 0h2v2H0V0zm4 0h2v2H4V0zM0 4h2v2H0V4zm4 0h2v2H4V4zM0 8h2v2H0V8zm4 0h2v2H4V8z"/>
    </svg>
);

interface Props {
  deviceId: string;
}

export function DeviceSportsPanel({ deviceId }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string>();

  // Data
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [selected, setSelected] = useState<SelectedTeam[]>([]);
  
  // Filters
  const [league, setLeague] = useState<string>("MLB");

  // Global Sports Settings
  const [showUpcoming, setShowUpcoming] = useState(true);

  // Drag & Drop State (Updated for visual feedback)
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErr(undefined);
    try {
      // 1. Get Global Settings
      const devRes = await fetch(`${API_BASE}/devices/${deviceId}`, { headers: authHeaders() });
      if (devRes.ok) {
        const d = await devRes.json();
        setShowUpcoming(d.sports_show_next_upcoming_games ?? true);
      }

      // 2. Get Teams
      let r = await fetch(`${API_BASE}/devices/${deviceId}/teams/available`, { headers: authHeaders() });
      
      const toTeam = (x: any): Team => ({
        id: String(x.team_id ?? x.id),
        league_id: String(x.league_id ?? x.league ?? "").toUpperCase(),
        market: String(x.market ?? ""),
        name: String(x.name ?? ""),
        short_name: x.short_name ?? x.abbr ?? null,
        icon_path: x.icon_path ?? x.icon ?? null,
      });

      if (r.ok) {
        const rows = await r.json();
        setAllTeams(rows.map(toTeam));
        setSelected(
          rows
            .filter((x: any) => !!x.selected)
            .map((x: any, i: number) => ({
              team_id: String(x.team_id ?? x.id),
              display_order: x.order ?? x.display_order ?? i + 1,
            }))
        );
      } else {
         // Fallback legacy endpoint
         r = await fetch(`${API_BASE}/devices/${deviceId}/teams`, { headers: authHeaders() });
         if(!r.ok) throw new Error("Failed to load teams");
         const data = await r.json();
         setAllTeams((data.all_teams ?? []).map(toTeam));
         setSelected((data.selected ?? []).map((x: any, i: number) => ({
             team_id: String(x.team_id ?? x.id),
             display_order: x.display_order ?? i+1,
         })));
      }
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => { loadData(); }, [loadData]);

  // --- AUTO-SAVE LOGIC ---
  const autoSave = async (newSelected?: SelectedTeam[], newUpcoming?: boolean) => {
      setSaving(true);
      try {
          const itemsToSave = newSelected !== undefined ? newSelected : selected;
          const upcomingToSave = newUpcoming !== undefined ? newUpcoming : showUpcoming;

          // 1. Save Globals (if changed)
          if (newUpcoming !== undefined) {
            const res = await fetch(`${API_BASE}/devices/${deviceId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", ...authHeaders() },
                body: JSON.stringify({ sports_show_next_upcoming_games: upcomingToSave }),
            });
            if (!res.ok) throw new Error("Failed to save global settings"); 
          }

          // 2. Save Teams (if changed)
          if (newSelected !== undefined) {
            const teamsPayload = {
                teams: itemsToSave.map((item, i) => ({
                    team_id: item.team_id,
                    display_order: i + 1
                }))
            };
            const res = await fetch(`${API_BASE}/devices/${deviceId}/teams`, {
              method: "PUT",
              headers: { "Content-Type": "application/json", ...authHeaders() },
              body: JSON.stringify(teamsPayload),
          });
          if (!res.ok) throw new Error("Failed to save teams"); 
          }
      } catch (e: any) {
          console.error("Auto-save failed", e);
          setErr("Failed to save changes");
      } finally {
          setSaving(false);
      }
  };

  // --- ACTIONS ---

  const handleGlobalToggle = (val: boolean) => {
      setShowUpcoming(val);
      autoSave(undefined, val);
  };

  const toggleTeam = (id: string) => {
    let newList;
    const exists = selected.find(s => s.team_id === id);
    
    if (exists) {
        // Remove
        newList = selected.filter(s => s.team_id !== id).map((t, i) => ({ ...t, display_order: i + 1 }));
    } else {
        // Add
        newList = [...selected, { team_id: id, display_order: selected.length + 1 }];
    }
    
    setSelected(newList);
    autoSave(newList);
  };

  const remove = (id: string) => toggleTeam(id);


// Drag & Drop Sort (FIXED)
  const handleSort = () => {
    // 1. Guard: Check validity
    if (dragItem.current === null || dragOverItem.current === null) {
        setDraggingIdx(null);
        setDragOverIdx(null);
        return;
    }

    // 2. Only sort if positions are different
    if (dragItem.current !== dragOverItem.current) {
        const listCopy = [...selected];
        const draggedItemContent = listCopy[dragItem.current];
        
        listCopy.splice(dragItem.current, 1);
        listCopy.splice(dragOverItem.current, 0, draggedItemContent);
        
        // Reset Display Orders
        const reordered = listCopy.map((item, index) => ({ ...item, display_order: index + 1 }));
        
        setSelected(reordered);
        autoSave(reordered);
    }

    // 3. ALWAYS Reset State (This fixes the stuck dimming)
    dragItem.current = null;
    dragOverItem.current = null;
    setDraggingIdx(null); 
    setDragOverIdx(null); 
  };


  // --- COMPUTED ---
  const byId = useMemo(() => {
    const m = new Map<string, Team>();
    allTeams.forEach((t) => m.set(t.id, t));
    return m;
  }, [allTeams]);

  const filtered = useMemo(() => {
      return allTeams
        .filter((t) => t.league_id === league)
        .sort((a, b) => `${a.market}${a.name}`.localeCompare(`${b.market}${b.name}`));
    }, [allTeams, league]);

  const isSelected = (id: string) => selected.some((s) => s.team_id === id);


  if (loading) return <div style={{color: '#666'}}>Loading sports...</div>;

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
       
       {/* HEADER */}
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
           <h3 style={{ fontSize: "18px", fontWeight: "700", margin: 0, color: '#fff' }}>Sports Settings</h3>
           {saving && <div style={{ fontSize: 12, color: '#888', fontStyle: 'italic' }}>Saving changes...</div>}
       </div>

       {err && <div className="dv-alert" style={{ marginBottom: 12 }}>{err}</div>}
       
       {/* Global Settings Box */}
       <div style={styles.panel}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 500, cursor: 'pointer', color: '#fff' }}>
                <input 
                    type="checkbox" 
                    checked={showUpcoming} 
                    onChange={e => handleGlobalToggle(e.target.checked)} 
                    style={{ width: '18px', height: '18px', accentColor: '#00ff41', cursor: 'pointer' }}
                />
                Show Upcoming Games
            </label>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {LEAGUES.map(L => (
                <button 
                    key={L} 
                    style={league === L ? styles.pillActive : styles.pill}
                    onClick={()=>setLeague(L)}
                >
                    {L}
                </button>
            ))}
        </div>

        <div className="main" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            
            {/* 1. Grid of Teams (Available) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', alignContent: 'start' }}>
                {filtered.map(t => {
                    const active = isSelected(t.id);
                    return (
                        <div 
                            key={t.id} 
                            onClick={()=>toggleTeam(t.id)}
                            style={{
                                ...styles.card,
                                ...(active ? styles.cardActive : {})
                            }}
                        >
                            <div style={{
                                width: 32, height: 32, borderRadius: 6, background: '#000', 
                                display: 'grid', placeItems: 'center', border: '1px solid #333'
                            }}>
                                {t.icon_path ? <img src={`/${t.icon_path}`} style={{width:'100%', height:'100%', objectFit:'contain'}} /> : emoji[t.league_id]}
                            </div>
                            
                            <div style={{flex:1, minWidth:0}}>
                                <div style={{ fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {t.market} {t.name}
                                </div>
                                <div style={{ fontSize: '11px', color: '#666' }}>{t.league_id}</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 2. Selected List Sidebar */}
            <aside style={{ 
                background: '#111', 
                border: '1px solid #333', 
                borderRadius: '12px', 
                padding: '16px',
                height: 'fit-content'
            }}>
                <div style={{ 
                    marginBottom: '16px', borderBottom: '1px solid #333', paddingBottom: '8px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <strong style={{ color: '#fff', fontSize: '14px' }}>Selected Teams ({selected.length})</strong>
                </div>

                {selected.length === 0 && (
                    <div style={{ padding: '20px 0', color: '#666', fontStyle: 'italic', textAlign: 'center', fontSize: '14px' }}>
                        No teams selected. <br/> Click teams on the left to add them.
                    </div>
                )}
                
                <div className="list" onDragOver={(e) => e.preventDefault()}>
                    {selected.map((s, idx) => {
                        const t = byId.get(s.team_id);
                        if(!t) return null;

                        // --- DYNAMIC STYLING FOR DND ---
                        const isDragging = draggingIdx === idx;
                        const isDragOver = dragOverIdx === idx && !isDragging;

                        return (
                            <div 
                                key={s.team_id} 
                                draggable
                                onDragStart={() => {
                                    dragItem.current = idx;
                                    setDraggingIdx(idx); // Start visual drag
                                }}
                                onDragEnter={() => {
                                    dragOverItem.current = idx;
                                    setDragOverIdx(idx); // Create gap
                                }}
                                onDragEnd={handleSort}
                                onDragOver={(e) => e.preventDefault()}
                                style={{
                                    ...styles.row,
                                    // Apply dynamic styles
                                    opacity: isDragging ? 0.3 : 1,
                                    marginTop: isDragOver ? '30px' : '0',
                                    borderTop: isDragOver ? '2px solid #00ff41' : '1px solid #333',
                                    transform: isDragOver ? 'scale(1.02)' : 'scale(1)',
                                }}
                            >
                                <GripIcon />
                                
                                <div style={styles.logoWrapper}>
                                    {t.icon_path ? (
                                        <img src={`/${t.icon_path}`} style={{width:'100%', height:'100%', objectFit:'contain'}}/>
                                    ) : (
                                        emoji[t.league_id]
                                    )}
                                </div>
                                
                                <div style={{flex:1}}>
                                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{t.market} {t.name}</div>
                                    <div style={{ fontSize: '11px', color: '#666' }}>{t.league_id}</div>
                                </div>
                                
                                <button 
                                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px' }} 
                                    onClick={()=>remove(s.team_id)}
                                >
                                    ✕
                                </button>
                            </div>
                        );
                    })}
                </div>
            </aside>
        </div>
    </div>
  );
}