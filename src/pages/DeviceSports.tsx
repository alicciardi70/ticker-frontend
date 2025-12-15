// src/components/DeviceSports.tsx
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import "./DeviceTeams.css";

const API_BASE = (import.meta as any).env?.VITE_API_BASE?.replace(/\/+$/, "") || "http://127.0.0.1:8000";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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

// --- HELPER: Grip Icon for Dragging ---
const GripIcon = () => (
    <svg width="12" height="16" viewBox="0 0 6 10" fill="#ccc" style={{ cursor: 'grab', marginRight: 8 }}>
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

  // Drag Refs
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

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
          // Use provided values or fallback to current state
          const itemsToSave = newSelected !== undefined ? newSelected : selected;
          const upcomingToSave = newUpcoming !== undefined ? newUpcoming : showUpcoming;

          // 1. Save Globals (if changed)
          if (newUpcoming !== undefined) {
            await fetch(`${API_BASE}/devices/${deviceId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", ...authHeaders() },
                body: JSON.stringify({ sports_show_next_upcoming_games: upcomingToSave }),
            });
          }

          // 2. Save Teams (if changed)
          if (newSelected !== undefined) {
            const teamsPayload = {
                teams: itemsToSave.map((item, i) => ({
                    team_id: item.team_id,
                    display_order: i + 1
                }))
            };
            await fetch(`${API_BASE}/devices/${deviceId}/teams`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", ...authHeaders() },
                body: JSON.stringify(teamsPayload),
            });
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

  // Drag & Drop Sort
  const handleSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) return;

    const listCopy = [...selected];
    const draggedItemContent = listCopy[dragItem.current];
    
    listCopy.splice(dragItem.current, 1);
    listCopy.splice(dragOverItem.current, 0, draggedItemContent);
    
    // Reset Display Orders
    const reordered = listCopy.map((item, index) => ({ ...item, display_order: index + 1 }));

    dragItem.current = null;
    dragOverItem.current = null;

    setSelected(reordered);
    autoSave(reordered);
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


  if (loading) return <div className="dv-muted">Loading sports...</div>;

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
       
       {/* HEADER */}
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
           <h3 style={{ fontSize: "18px", fontWeight: "700", margin: 0 }}>Sports Settings</h3>
           {saving && <div style={{ fontSize: 12, color: '#888', fontStyle: 'italic' }}>Saving changes...</div>}
       </div>

       {err && <div className="dv-alert" style={{ marginBottom: 12 }}>{err}</div>}
       
       {/* Global Settings Box */}
       <div className="config-panel" style={{ marginBottom: 20 }}>
            <div className="panel-row">
              <label className="checkbox-label" style={{ cursor: 'pointer' }}>
                <input type="checkbox" checked={showUpcoming} onChange={e => handleGlobalToggle(e.target.checked)} />
                Show Upcoming Games
              </label>
            </div>
        </div>

        {/* Filter Pills */}
        <div className="toolbar">
            <div className="pills">
                {LEAGUES.map(L => <button key={L} className={`pill ${league === L ? 'active':''}`} onClick={()=>setLeague(L)}>{L}</button>)}
            </div>
        </div>

        <div className="main">
            {/* Grid of Teams */}
            <div className="grid">
                {filtered.map(t => (
                    <div key={t.id} className="card">
                        <div className="logo">{t.icon_path ? <img src={`/${t.icon_path}`} className="logo" /> : emoji[t.league_id]}</div>
                        <div style={{flex:1, minWidth:0}}>
                            <div className="title">{t.market} {t.name}</div>
                            <div className="meta">{t.league_id}</div>
                        </div>
                        <div className={`switch ${isSelected(t.id) ? 'on':''}`} onClick={()=>toggleTeam(t.id)} />
                    </div>
                ))}
            </div>

            {/* Selected List Sidebar */}
            <aside className="aside">
                <div className="aside-h">
                    <strong>Selected Teams ({selected.length})</strong>
                </div>
                {selected.length === 0 && <div style={{ padding: 16, color: '#999', fontStyle: 'italic' }}>No teams selected.</div>}
                
                <div className="list">
                    {selected.map((s, idx) => {
                        const t = byId.get(s.team_id);
                        if(!t) return null;
                        return (
                            <div 
                                key={s.team_id} 
                                className="row"
                                draggable
                                onDragStart={() => (dragItem.current = idx)}
                                onDragEnter={() => (dragOverItem.current = idx)}
                                onDragEnd={handleSort}
                                onDragOver={(e) => e.preventDefault()}
                                style={{ cursor: 'move', background: 'white', border:'1px solid #eee', padding: '8px', borderRadius: 8, marginBottom: 8, display: 'flex', alignItems: 'center'}}
                            >
                                <GripIcon />
                                
                                <div className="small-logo">{t.icon_path ? <img src={`/${t.icon_path}`} className="small-logo"/> : emoji[t.league_id]}</div>
                                <div style={{flex:1}}>
                                    <div className="row-title">{t.market} {t.name}</div>
                                    <div style={{ fontSize: 11, color: '#888' }}>{t.league_id}</div>
                                </div>
                                <button className="icon-btn danger" onClick={()=>remove(s.team_id)}>✕</button>
                            </div>
                        );
                    })}
                </div>
            </aside>
        </div>
    </div>
  );
}