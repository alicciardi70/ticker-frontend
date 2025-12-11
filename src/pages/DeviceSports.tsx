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
  display_text?: string | null;
  color?: string;
};
const COLORS = ["white", "red", "green", "blue", "yellow"] as const;
const LEAGUES = ["ALL", "MLB", "NFL", "NBA", "NHL", "MLS"] as const;
const emoji: Record<string, string> = { MLB: "⚾", NFL: "🏈", NBA: "🏀", NHL: "🏒", MLS: "⚽" };

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
  const [q, setQ] = useState("");

  // Global Sports Settings
  const [showFinals, setShowFinals] = useState(true);
  const [showUpcoming, setShowUpcoming] = useState(true);
  const [daysAdvance, setDaysAdvance] = useState(3);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErr(undefined);
    try {
      const devRes = await fetch(`${API_BASE}/devices/${deviceId}`, { headers: authHeaders() });
      if (devRes.ok) {
        const d = await devRes.json();
        setShowFinals(d.sports_show_final_games ?? true);
        setShowUpcoming(d.sports_show_next_upcoming_games ?? true);
        setDaysAdvance(d.sports_show_next_upcoming_game_days_in_advance ?? 3);
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
              display_text: x.display_text ?? null,
              color: x.color ?? "white",
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
             display_text: x.display_text ?? null,
             color: x.color ?? "white"
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
    const needle = q.trim().toLowerCase();
    return allTeams
      .filter((t) => (league === "ALL" ? true : t.league_id === league))
      .filter((t) => !needle || `${t.market} ${t.name}`.toLowerCase().includes(needle))
      .sort((a, b) => `${a.market}${a.name}`.localeCompare(`${b.market}${b.name}`));
  }, [allTeams, league, q]);

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
          display_text: (t?.short_name || t?.name || "").slice(0, 5) || null,
          color: "white" 
      }];
    });
  };

  const save = async () => {
    setSaving(true);
    try {
        const getRes = await fetch(`${API_BASE}/devices/${deviceId}`, { headers: authHeaders() });
        if(!getRes.ok) throw new Error("Failed to fetch device context");
        const currentData = await getRes.json();

        const settingsPayload = {
            ...currentData,
            sports_show_final_games: showFinals,
            sports_show_next_upcoming_games: showUpcoming,
            sports_show_next_upcoming_game_days_in_advance: daysAdvance,
        };

        const teamsPayload = {
            teams: selected.map((t, i) => ({
                team_id: t.team_id,
                display_order: i + 1,
                display_text: (t.display_text || "").slice(0, 5) || null,
                color: t.color || "white",
            }))
        };

        const [r1, r2] = await Promise.all([
            fetch(`${API_BASE}/devices/${deviceId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", ...authHeaders() },
                body: JSON.stringify(settingsPayload),
            }),
            fetch(`${API_BASE}/devices/${deviceId}/teams`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", ...authHeaders() },
                body: JSON.stringify(teamsPayload),
            })
        ]);

        if (!r1.ok) throw new Error("Failed to save settings");
        if (!r2.ok) throw new Error("Failed to save teams");

        setIsEditing(false);
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

  const updateSel = (id: string, field: keyof SelectedTeam, val: any) => {
      setSelected(prev => prev.map(p => p.team_id === id ? { ...p, [field]: val } : p));
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
                <input type="checkbox" checked={showFinals} onChange={e => setShowFinals(e.target.checked)} disabled={!isEditing} />
                Show Final Scores
              </label>
              <label className="checkbox-label" style={{ cursor: isEditing ? 'pointer' : 'default' }}>
                <input type="checkbox" checked={showUpcoming} onChange={e => setShowUpcoming(e.target.checked)} disabled={!isEditing} />
                Show Upcoming Games
              </label>
              <div className="input-group" style={{ opacity: showUpcoming ? 1 : 0.4 }}>
                <label>Days in Advance:</label>
                {isEditing ? (
                    <input type="number" min={0} max={7} value={daysAdvance} onChange={e => setDaysAdvance(Number(e.target.value))} className="number-input" disabled={!showUpcoming} />
                ) : ( <span style={{fontWeight:600}}>{daysAdvance}</span> )}
              </div>
            </div>
        </div>

        {/* Filters (Edit Mode Only) */}
        {isEditing && (
            <div className="toolbar">
                <div className="pills">
                    {LEAGUES.map(L => <button key={L} className={`pill ${league === L ? 'active':''}`} onClick={()=>setLeague(L)}>{L}</button>)}
                </div>
                <div className="search">
                    <input placeholder="Search..." value={q} onChange={e => setQ(e.target.value)} />
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
                                        <div className="inline-controls">
                                            <input className="text-input" value={s.display_text||""} onChange={e=>updateSel(s.team_id, 'display_text', e.target.value)} placeholder="Text" maxLength={5} />
                                            <select className="select" value={s.color||"white"} onChange={e=>updateSel(s.team_id, 'color', e.target.value)}>
                                                {COLORS.map(c=><option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div className="actions">
                                            <button className="icon-btn" onClick={()=>move(s.team_id, -1)}>↑</button>
                                            <button className="icon-btn" onClick={()=>move(s.team_id, 1)}>↓</button>
                                            <button className="icon-btn danger" onClick={()=>remove(s.team_id)}>✕</button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="inline-controls" style={{opacity:0.7}}>
                                        {s.display_text && <span className="badge">{s.display_text}</span>}
                                        <span className="badge" style={{background:s.color==="white"?"#eee":s.color, color:s.color==="white"?"black":"white"}}>{s.color}</span>
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </aside>
        </div>
    </div>
  );
}