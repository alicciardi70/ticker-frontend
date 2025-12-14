import { useEffect, useMemo, useState, useCallback } from "react";
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

interface Props {
  deviceId: string;
}

export function DeviceSportsPanel({ deviceId }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string>();
  const [isEditing, setIsEditing] = useState(false);

  // Data
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [selected, setSelected] = useState<SelectedTeam[]>([]);
  
  // Filters
  const [league, setLeague] = useState<string>("MLB");


  // Global Sports Settings
  
  const [showUpcoming, setShowUpcoming] = useState(true);
  

  const loadData = useCallback(async () => {
    setLoading(true);
    setErr(undefined);
    try {
      const devRes = await fetch(`${API_BASE}/devices/${deviceId}`, { headers: authHeaders() });
      if (devRes.ok) {
        const d = await devRes.json();
   
        setShowUpcoming(d.sports_show_next_upcoming_games ?? true);

      }

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

  const toggle = (id: string) => {
    if (!isEditing) return;
    setSelected((prev) => {
      const idx = prev.findIndex((p) => p.team_id === id);
      if (idx >= 0) {
        const cp = prev.slice();
        cp.splice(idx, 1);
        return cp.map((t, j) => ({ ...t, display_order: j + 1 }));
      }
      const t = byId.get(id);
      return [...prev, { 
          team_id: id, 
          display_order: prev.length + 1, 
      }];
    });
  };

const save = async () => {
    setSaving(true);
    try {
        // 1. Save Globals (Clean Payload - No Fetch Needed)
        const settingsPayload = {
            finance_show_hourly_change: showHourly,
            finance_show_daily_change: showDaily,
            finance_show_weekly_change: showWeekly,
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
                // Pass globals down to item config as well
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

        setIsEditing(false);
        loadData(); 
    } catch (e: any) {
        setErr(e.message);
    } finally {
        setSaving(false);
    }
  };
  const cancel = () => { setIsEditing(false); loadData(); };
  
  const move = (id: string, dir: -1 | 1) => {
     setSelected(prev => {
         const i = prev.findIndex(p => p.team_id === id);
         if(i < 0) return prev;
         const j = i + dir;
         if(j < 0 || j >= prev.length) return prev;
         const cp = prev.slice();
         [cp[i], cp[j]] = [cp[j], cp[i]];
         return cp.map((x, k) => ({...x, display_order: k+1}));
     })
  };


  const remove = (id: string) => setSelected(prev => prev.filter(p => p.team_id !== id));

  if (loading) return <div className="dv-muted">Loading sports...</div>;

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
       
       {/* HEADER ROW with Title & Buttons */}
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
           <h3 style={{ fontSize: "18px", fontWeight: "700", margin: 0 }}>Global Sports Settings</h3>
           <div className="dv-actions" style={{ margin: 0 }}>
                {isEditing ? (
                    <>
                        <button className="dv-btn dv-btn-primary" onClick={save} disabled={saving}>{saving?"Saving...":"Save Changes"}</button>
                        <button className="dv-btn" onClick={cancel} disabled={saving}>Cancel</button>
                    </>
                ) : (
                    <button className="dv-btn dv-btn-primary" onClick={()=>setIsEditing(true)}>Edit Configuration</button>
                )}
           </div>
       </div>

       {err && <div className="dv-alert" style={{ marginBottom: 12 }}>{err}</div>}
       
       {/* Global Settings Box */}
       <div className="config-panel">
            <div className="panel-row">

              <label className="checkbox-label" style={{ cursor: isEditing ? 'pointer' : 'default' }}>
                <input type="checkbox" checked={showUpcoming} onChange={e => setShowUpcoming(e.target.checked)} disabled={!isEditing} />
                Show Upcoming Games
              </label>

            </div>
        </div>

        {/* Filters (Edit Mode Only) */}
        {isEditing && (
            <div className="toolbar">
                <div className="pills">
                    {LEAGUES.map(L => <button key={L} className={`pill ${league === L ? 'active':''}`} onClick={()=>setLeague(L)}>{L}</button>)}
                </div>
            </div>
        )}

        <div className="main">
            {/* Grid (Edit Mode Only) */}
            {isEditing && (
                <div className="grid">
                    {filtered.map(t => (
                        <div key={t.id} className="card">
                            <div className="logo">{t.icon_path ? <img src={`/${t.icon_path}`} className="logo" /> : emoji[t.league_id]}</div>
                            <div style={{flex:1, minWidth:0}}>
                                <div className="title">{t.market} {t.name}</div>
                                <div className="meta">{t.league_id}</div>
                            </div>
                            <div className={`switch ${isSelected(t.id) ? 'on':''}`} onClick={()=>toggle(t.id)} />
                        </div>
                    ))}
                </div>
            )}

            {/* Selected List (Always visible) */}
            <aside className="aside" style={!isEditing ? { width: '100%', maxWidth: '600px', gridColumn: '1 / -1' } : {}}>
                <div className="aside-h">
                    <strong>Selected ({selected.length})</strong>
                </div>
                <ul className="list">
                    {selected.map(s => {
                        const t = byId.get(s.team_id);
                        if(!t) return null;
                        return (
                            <li key={s.team_id} className="row">
                                <div className="small-logo">{t.icon_path ? <img src={`/${t.icon_path}`} className="small-logo"/> : emoji[t.league_id]}</div>
                                <div style={{flex:1}}>
                                    <div className="row-title">{t.market} {t.name}</div>
                                </div>
                                {isEditing ? (
                                    <>
                                        <div className="actions">
                                            <button className="icon-btn" onClick={()=>move(s.team_id, -1)}>↑</button>
                                            <button className="icon-btn" onClick={()=>move(s.team_id, 1)}>↓</button>
                                            <button className="icon-btn danger" onClick={()=>remove(s.team_id)}>✕</button>
                                        </div>
                                    </>
                                ) : null}
                            </li>
                        );
                    })}
                </ul>
            </aside>
        </div>
    </div>
  );
}