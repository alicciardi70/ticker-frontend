import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./DeviceTeams.css";

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE?.replace(/\/+$/, "") || "http://127.0.0.1:8000";

function authHeaders() {
  const token = localStorage.getItem("token"); // <--- Fixed to match DeviceConfig.tsx
  return token ? { Authorization: `Bearer ${token}` } : {};
}

type Team = {
  id: string;
  league_id: "MLB" | "NFL" | "NBA" | "NHL" | "MLS" | string;
  market: string;
  name: string;
  short_name?: string | null;
  icon_path?: string | null;
};

const COLORS = ["white", "red", "green", "blue", "yellow"] as const;
type Color = (typeof COLORS)[number];

type SelectedTeam = {
  team_id: string;
  display_order: number;
  display_text?: string | null;
  color?: Color;
};

const LEAGUES = ["ALL", "MLB", "NFL", "NBA", "NHL", "MLS"] as const;
const CATEGORIES = ["SPORTS", "FINANCE", "OTHER"] as const;
type Category = (typeof CATEGORIES)[number];

const emoji: Record<string, string> = { MLB: "⚾", NFL: "🏈", NBA: "🏀", NHL: "🏒", MLS: "⚽" };

export default function DeviceTeams() {
  const { deviceId } = useParams();
  const navigate = useNavigate();

  // --- Data State ---
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [selected, setSelected] = useState<SelectedTeam[]>([]);
  
  // --- New Settings State ---
  const [showFinals, setShowFinals] = useState(true);
  const [showUpcoming, setShowUpcoming] = useState(true);
  const [daysAdvance, setDaysAdvance] = useState(3);

  // --- UI State ---
  const [category, setCategory] = useState<Category>("SPORTS");
  const [league, setLeague] = useState<string>("MLB");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string>();

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!deviceId) return;
      setLoading(true);
      setErr(undefined);

      try {
        // 1. Fetch Device Settings (Global Booleans)
        const devRes = await fetch(`${API_BASE}/devices/${deviceId}`, { headers: { ...authHeaders() } });
        if (devRes.ok) {
          const devData = await devRes.json();
          if (alive) {
            // Populate new fields, defaulting to true/3 if null
            setShowFinals(devData.sports_show_final_games ?? true);
            setShowUpcoming(devData.sports_show_next_upcoming_games ?? true);
            setDaysAdvance(devData.sports_show_next_upcoming_game_days_in_advance ?? 3);
          }
        }

        // 2. Fetch Available Teams
        const toTeam = (x: any): Team => ({
          id: String(x.team_id ?? x.id),
          league_id: String(x.league_id ?? x.league ?? "").toUpperCase(),
          market: String(x.market ?? ""),
          name: String(x.name ?? ""),
          short_name: x.short_name ?? x.abbr ?? null,
          icon_path: x.icon_path ?? x.icon ?? null,
        });

        let r = await fetch(`${API_BASE}/devices/${deviceId}/teams/available`, { headers: { ...authHeaders() } });
        if (r.ok) {
          const rows = await r.json();
          const all: Team[] = rows.map(toTeam);
          const sel: SelectedTeam[] = rows
            .filter((x: any) => !!x.selected)
            .map((x: any, i: number) => ({
              team_id: String(x.team_id ?? x.id),
              display_order: x.order ?? x.display_order ?? i + 1,
              display_text: x.display_text ?? null,
              color: (x.color ?? "white") as Color,
            }));

          if (alive) {
            setAllTeams(all);
            setSelected(sel);
            return;
          }
        } else if (r.status !== 404) {
          throw new Error(`${r.status} ${r.statusText}`);
        }

        // Fallback if 'available' endpoint fails (legacy)
        r = await fetch(`${API_BASE}/devices/${deviceId}/teams`, { headers: { ...authHeaders() } });
        if (!r.ok) {
          if (r.status === 404) {
            if (alive) { setAllTeams([]); setSelected([]); }
            return;
          }
          throw new Error(`${r.status} ${r.statusText}`);
        }
        const data = await r.json();

        if (Array.isArray(data)) {
           // ... legacy array handling ...
           if (alive) {
             // Logic omitted for brevity, same as previous
             setErr("Partial data loaded.");
           }
           return;
        }

        const all: Team[] = (data.all_teams ?? []).map(toTeam);
        const sel: SelectedTeam[] = (data.selected ?? []).map((x: any, i: number) => ({
          team_id: String(x.team_id ?? x.id),
          display_order: x.display_order ?? x.order ?? i + 1,
          display_text: x.display_text ?? null,
          color: (x.color ?? "white") as Color,
        }));

        if (alive) {
          setAllTeams(all);
          setSelected(sel);
        }
      } catch (e: any) {
        if (alive) setErr(String(e));
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [deviceId]);

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

  // --- Handlers (Toggle, Move, Color) ---
  const toggle = (id: string) => {
    setSelected((prev) => {
      const i = prev.findIndex((p) => p.team_id === id);
      if (i >= 0) {
        const copy = prev.slice();
        copy.splice(i, 1);
        return copy.map((t, j) => ({ ...t, display_order: j + 1 }));
      }
      const t = byId.get(id);
      const defaultText = (t?.short_name || t?.name || "").slice(0, 5) || null;
      return [...prev, { team_id: id, display_order: prev.length + 1, display_text: defaultText, color: "white" }];
    });
  };

  const selectAllShown = () => {
    setSelected((prev) => {
      const set = new Set(prev.map((p) => p.team_id));
      const adds = filtered
        .filter((t) => !set.has(t.id))
        .map((t, i) => ({
          team_id: t.id,
          display_order: prev.length + i + 1,
          display_text: (t.short_name || t.name || "").slice(0, 5) || null,
          color: "white" as Color,
        }));
      return [...prev, ...adds];
    });
  };
  const clearAll = () => setSelected([]);

  const up = (id: string) =>
    setSelected((prev) => {
      const i = prev.findIndex((p) => p.team_id === id);
      if (i <= 0) return prev;
      const cp = prev.slice();
      [cp[i - 1], cp[i]] = [cp[i], cp[i - 1]];
      return cp.map((t, j) => ({ ...t, display_order: j + 1 }));
    });

  const down = (id: string) =>
    setSelected((prev) => {
      const i = prev.findIndex((p) => p.team_id === id);
      if (i < 0 || i === prev.length - 1) return prev;
      const cp = prev.slice();
      [cp[i + 1], cp[i]] = [cp[i], cp[i + 1]];
      return cp.map((t, j) => ({ ...t, display_order: j + 1 }));
    });

  const removeSel = (id: string) =>
    setSelected((prev) => prev.filter((t) => t.team_id !== id).map((t, i) => ({ ...t, display_order: i + 1 })));

  const setDisplayText = (teamId: string, v: string) =>
    setSelected((prev) =>
      prev.map((t) => (t.team_id === teamId ? { ...t, display_text: (v || "").slice(0, 5) || null } : t))
    );

  const setColor = (teamId: string, v: string) =>
    setSelected((prev) => prev.map((t) => (t.team_id === teamId ? { ...t, color: (v as Color) || "white" } : t)));

  // --- SAVE ---
  const save = async () => {
    if (!deviceId) return;
    setSaving(true);
    setErr(undefined);
    try {
      // 1. Prepare Teams Payload
      const teamsPayload = {
        teams: selected
          .slice()
          .sort((a, b) => a.display_order - b.display_order)
          .map((t, i) => ({
            team_id: t.team_id,
            display_order: i + 1,
            display_text: (t.display_text || "").slice(0, 5) || null,
            color: (t.color as Color) || "white",
          })),
      };

      // 2. Prepare Settings Payload
      const settingsPayload = {
        sports_show_final_games: showFinals,
        sports_show_next_upcoming_games: showUpcoming,
        sports_show_next_upcoming_game_days_in_advance: daysAdvance,
      };


      // 3. Execute Parallel Requests
      const p1 = fetch(`${API_BASE}/devices/${deviceId}/teams`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(teamsPayload),
      });

      // CHANGE THIS LINE: method: "PATCH" -> method: "PUT"
      const p2 = fetch(`${API_BASE}/devices/${deviceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(settingsPayload),
      });

      const [r1, r2] = await Promise.all([p1, p2]);

      if (!r1.ok) throw new Error(`Teams Save: ${r1.status}`);
      if (!r2.ok) throw new Error(`Settings Save: ${r2.status}`);

    } catch (e: any) {
      setErr(String(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="header">
          <div><div className="h1">Data Settings</div><div className="sub">Loading…</div></div>
        </div>
      </div>
    );
  }

  // --- Render ---
  return (
    <div className="page">
      <div className="header">
        <div>
          <button className="btn link" onClick={() => navigate(-1)}>← Back</button>
          <div className="h1">Data Settings</div>
          <div className="sub">Manage content and settings.</div>
        </div>
        <button className="btn primary" disabled={saving} onClick={save}>
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>

      {err && (
        <div className="btn" style={{ borderColor: "#fecaca", background: "#fef2f2", color: "#b91c1c", marginBottom: 12 }}>
          Error: {err}
        </div>
      )}

      {/* TOP LEVEL TABS */}
      <div className="tabs-row">
        {CATEGORIES.map(cat => (
          <button 
            key={cat} 
            className={`tab-btn ${category === cat ? "active" : ""}`}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ----------- SPORTS CONTENT ----------- */}
      {category === "SPORTS" && (
        <>
{/* Global Sports Config Panel */}
          <div className="config-panel">
            <div className="panel-title">Global Sports Settings</div>
            <div className="panel-row">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={showFinals} 
                  onChange={e => setShowFinals(e.target.checked)} 
                />
                Show Final Scores
              </label>

              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={showUpcoming} 
                  onChange={e => setShowUpcoming(e.target.checked)} 
                />
                Show Upcoming Games
              </label>
              
              {/* Added opacity style and disabled attribute below */}
              <div 
                className="input-group" 
                style={{ opacity: showUpcoming ? 1 : 0.4, transition: "opacity 0.2s" }}
              >
                <label>Days in Advance:</label>
                <input 
                  type="number" 
                  min={0} max={7} 
                  value={daysAdvance} 
                  onChange={e => setDaysAdvance(Math.max(0, Math.min(7, parseInt(e.target.value) || 0)))}
                  className="number-input"
                  disabled={!showUpcoming} 
                />
                <span className="sub-text">(0-7 days)</span>
              </div>
            </div>
          </div>

          <div className="toolbar">
            <div className="pills">
              {LEAGUES.map((L) => {
                const active = (league || "ALL") === L;
                return (
                  <button key={L} className={`pill ${active ? "active" : ""}`} onClick={() => setLeague(L)}>
                    {L}
                  </button>
                );
              })}
            </div>
            <div className="search">
              <input placeholder="Search market or team…" value={q} onChange={(e) => setQ(e.target.value)} />
              <span>🔎</span>
            </div>
          </div>

          <div className="toolbar">
            <button className="btn" onClick={selectAllShown}>+ Select all shown</button>
            <button className="btn" onClick={clearAll}>✕ Clear selected</button>
            <span className="badge">
              Showing <strong>{filtered.length}</strong> {league === "ALL" ? "teams" : league}
            </span>
          </div>

          <div className="main">
            {/* LEFT: Grid */}
            <div>
              <div className="grid">
                {filtered.map((t) => {
                  const checked = isSelected(t.id);
                  return (
                    <div key={t.id} className="card">
                      {t.icon_path ? (
                        <img className="logo" src={`/${t.icon_path}`} alt="" />
                      ) : (
                        <div className="logo">{emoji[t.league_id] ?? "🏟️"}</div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="title">{t.market} {t.name}</div>
                        <div className="meta">{t.league_id}</div>
                      </div>
                      <div className={`switch ${checked ? "on" : ""}`} onClick={() => toggle(t.id)} title={checked ? "Remove" : "Add"} />
                    </div>
                  );
                })}
                {!filtered.length && (
                  <div className="card" style={{ gridColumn: "1/-1", justifyContent: "center", color: "var(--muted)" }}>
                    No teams match that filter.
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: Selected Sidebar */}
            <aside className="aside">
              <div className="aside-h">
                <div><strong>Selected</strong> <span className="count">({selected.length})</span></div>
                <div className="sub">Use ↑/↓ to reorder</div>
              </div>
              <ul className="list">
                {selected.length === 0 && <li className="row" style={{ color: "var(--muted)" }}>No teams selected yet.</li>}
                {selected
                  .slice()
                  .sort((a, b) => a.display_order - b.display_order)
                  .map((s) => {
                    const t = byId.get(s.team_id);
                    if (!t) return null;
                    return (
                      <li key={s.team_id} className="row">
                        {t.icon_path ? (
                          <img className="small-logo" src={`/${t.icon_path}`} alt="" />
                        ) : (
                          <div className="small-logo">{emoji[t.league_id] ?? "🏟️"}</div>
                        )}
                        <div style={{ minWidth: 0 }}>
                          <div className="row-title">{t.market} {t.name}</div>
                          <div className="row-meta">#{s.display_order} · {t.league_id}</div>
                        </div>

                        <div className="inline-controls">
                          <input
                            className="text-input"
                            type="text"
                            maxLength={5}
                            placeholder="Text"
                            value={s.display_text ?? ""}
                            onChange={(e) => setDisplayText(s.team_id, e.target.value)}
                          />
                          <select
                            className="select"
                            value={s.color ?? "white"}
                            onChange={(e) => setColor(s.team_id, e.target.value)}
                          >
                            {COLORS.map((c) => (<option key={c} value={c}>{c}</option>))}
                          </select>
                        </div>

                        <div className="actions">
                          <button className="icon-btn" onClick={() => up(s.team_id)}>↑</button>
                          <button className="icon-btn" onClick={() => down(s.team_id)}>↓</button>
                          <button className="icon-btn danger" onClick={() => removeSel(s.team_id)}>✕</button>
                        </div>
                      </li>
                    );
                  })}
              </ul>
              <div className="footer" style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <button className="btn primary" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save changes"}</button>
              </div>
            </aside>
          </div>
        </>
      )}

      {/* ----------- FINANCE / OTHER PLACEHOLDER ----------- */}
      {category !== "SPORTS" && (
        <div className="empty-state">
          <div style={{fontSize: "40px", marginBottom: "16px"}}>🚧</div>
          <div className="h1">{category === "FINANCE" ? "Finance" : "Other"} Configuration</div>
          <div className="sub">This module is coming soon.</div>
        </div>
      )}
    </div>
  );
}