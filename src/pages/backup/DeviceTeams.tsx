import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./DeviceTeams.css";

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE?.replace(/\/+$/, "") || "http://127.0.0.1:8000";

function authHeaders() {
  const tk = localStorage.getItem("tk");
  return tk ? { Authorization: `Bearer ${tk}` } : {};
}

type Team = {
  id: string;
  league_id: "MLB" | "NFL" | "NBA" | "NHL" | "MLS" | string;
  market: string;
  name: string;
  short_name?: string | null;
  icon_path?: string | null;
};

type SelectedTeam = { team_id: string; display_order: number };

const LEAGUES = ["ALL", "MLB", "NFL", "NBA", "NHL", "MLS"] as const;
const emoji: Record<string,string> = { MLB:"⚾", NFL:"🏈", NBA:"🏀", NHL:"🏒", MLS:"⚽" };


async function downloadConfigJson(deviceId: string, apiBase: string) {
  const res = await fetch(`${apiBase}/devices/${deviceId}/config`, { headers: { /* auth if needed */ } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const blob = new Blob([await res.text()], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `device_${deviceId}_config.json`;
  a.click();
  URL.revokeObjectURL(url);
}



export default function DeviceTeams(){
  const { deviceId } = useParams();
  const navigate = useNavigate();

  const [allTeams,setAllTeams] = useState<Team[]>([]);
  const [selected,setSelected] = useState<SelectedTeam[]>([]);
  const [league,setLeague] = useState<string>("MLB");
  const [q,setQ] = useState("");
  const [loading,setLoading] = useState(true);
  const [saving,setSaving] = useState(false);
  const [err,setErr] = useState<string>();



useEffect(() => {
  let alive = true;
  async function load() {
    if (!deviceId) return;
    setLoading(true); setErr(undefined);

    // Helper to normalize an "available" style row into Team + selection
    const toTeam = (x:any): Team => ({
      id: String(x.team_id ?? x.id),
      league_id: String(x.league_id ?? x.league ?? "").toUpperCase(),
      market: String(x.market ?? ""),
      name: String(x.name ?? ""),
      short_name: x.short_name ?? x.abbr ?? null,
      icon_path: x.icon_path ?? x.icon ?? null,
    });

    try {
      // 1) Preferred: one payload that has all teams + a selected flag/order
      let r = await fetch(`${API_BASE}/devices/${deviceId}/teams/available`, { headers:{...authHeaders()} });
      if (r.ok) {
        const rows = await r.json();
        const all: Team[] = rows.map(toTeam);
        const sel: SelectedTeam[] = rows
          .filter((x:any)=> !!x.selected)
          .map((x:any,i:number)=> ({ team_id: String(x.team_id ?? x.id), display_order: x.order ?? x.display_order ?? (i+1) }));

        if (alive) { setAllTeams(all); setSelected(sel); return; }
      } else if (r.status !== 404) {
        throw new Error(`${r.status} ${r.statusText}`);
      }

      // 2) Fallback A: combined payload { all_teams: [...], selected: [...] }
      r = await fetch(`${API_BASE}/devices/${deviceId}/teams`, { headers:{...authHeaders()} });
      if (!r.ok) {
        if (r.status === 404) { if (alive) setAllTeams([]); if (alive) setSelected([]); return; }
        throw new Error(`${r.status} ${r.statusText}`);
      }
      const data = await r.json();

      // Shape detect
      if (Array.isArray(data)) {
        // Fallback B: only selected array came back
        const sel: SelectedTeam[] = data.map((x:any,i:number)=> ({
          team_id: String(x.team_id ?? x.id),
          display_order: x.display_order ?? x.order ?? (i+1),
        }));
        if (alive) {
          setSelected(sel);
          setAllTeams([]); // no full list available
          setErr(prev => prev ? prev : "This backend route returned only the selected list. The full team catalog isn’t available from this endpoint.");
        }
        return;
      }

      // Combined object
      const all: Team[] = (data.all_teams ?? []).map(toTeam);
      const sel: SelectedTeam[] = (data.selected ?? []).map((x:any,i:number)=> ({
        team_id: String(x.team_id ?? x.id),
        display_order: x.display_order ?? x.order ?? (i+1),
      }));

      if (alive) { setAllTeams(all); setSelected(sel); }
    } catch (e:any) {
      if (alive) setErr(String(e));
    } finally {
      if (alive) setLoading(false);
    }
  }
  load();
  return () => { alive = false; };
}, [deviceId]);





  const byId = useMemo(()=> {
    const m = new Map<string,Team>(); allTeams.forEach(t=>m.set(t.id,t)); return m;
  },[allTeams]);

  const filtered = useMemo(()=>{
    const needle = q.trim().toLowerCase();
    return allTeams
      .filter(t => league==="ALL" ? true : t.league_id===league)
      .filter(t => !needle || (`${t.market} ${t.name}`.toLowerCase().includes(needle)))
      .sort((a,b)=>(`${a.market}${a.name}`).localeCompare(`${b.market}${b.name}`));
  },[allTeams,league,q]);

  const isSelected = (id:string)=> selected.some(s=>s.team_id===id);

  const toggle = (id:string)=>{
    setSelected(prev=>{
      const i = prev.findIndex(p=>p.team_id===id);
      if(i>=0){ const copy=prev.slice(); copy.splice(i,1); return copy.map((t,j)=>({...t,display_order:j+1})); }
      return [...prev,{team_id:id,display_order:prev.length+1}];
    });
  };

  const selectAllShown = ()=>{
    setSelected(prev=>{
      const set = new Set(prev.map(p=>p.team_id));
      const adds = filtered.filter(t=>!set.has(t.id)).map((t,i)=>({team_id:t.id,display_order:prev.length+i+1}));
      return [...prev,...adds];
    });
  };
  const clearAll = ()=> setSelected([]);

  const up = (id:string)=> setSelected(prev=>{
    const i=prev.findIndex(p=>p.team_id===id); if(i<=0) return prev;
    const cp=prev.slice(); [cp[i-1],cp[i]]=[cp[i],cp[i-1]]; return cp.map((t,j)=>({...t,display_order:j+1}));
  });
  const down = (id:string)=> setSelected(prev=>{
    const i=prev.findIndex(p=>p.team_id===id); if(i<0||i===prev.length-1) return prev;
    const cp=prev.slice(); [cp[i+1],cp[i]]=[cp[i],cp[i+1]]; return cp.map((t,j)=>({...t,display_order:j+1}));
  });
  const removeSel = (id:string)=> setSelected(prev=> prev.filter(t=>t.team_id!==id).map((t,i)=>({...t,display_order:i+1})));

  const save = async ()=>{
    if(!deviceId) return;
    setSaving(true); setErr(undefined);
    try{
      const payload = { teams: selected.slice().sort((a,b)=>a.display_order-b.display_order).map((t,i)=>({team_id:t.team_id,display_order:i+1})) };
      const r = await fetch(`${API_BASE}/devices/${deviceId}/teams`, {
        method:"PUT", headers:{ "Content-Type":"application/json", ...authHeaders() }, body: JSON.stringify(payload)
      });
      if(!r.ok) throw new Error(`${r.status} ${r.statusText}`);
    }catch(e:any){ setErr(String(e)); } finally{ setSaving(false); }
  };

  if(loading){
    return <div className="page"><div className="header"><div><div className="h1">Configure Teams</div><div className="sub">Loading…</div></div></div></div>;
  }

  return (
    <div className="page">
      <div className="header">
        <div>
          <button className="btn link" onClick={()=>navigate(-1)}>← Back</button>
          <div className="h1">Configure Teams</div>
          <div className="sub">Choose which teams this device will follow. Reorder the selected list to set priority.</div>
        </div>
        <button className="btn primary" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save"}</button>
      </div>

      {err && <div className="btn" style={{borderColor:"#fecaca", background:"#fef2f2", color:"#b91c1c", marginBottom:12}}>Error: {err}</div>}

      <div className="toolbar">
        <div className="pills">
          {LEAGUES.map(L=>{
            const active = (league||"ALL")===L;
            return <button key={L} className={`pill ${active?"active":""}`} onClick={()=>setLeague(L)}>{L}</button>;
          })}
        </div>
        <div className="search">
          <input placeholder="Search market or team…" value={q} onChange={e=>setQ(e.target.value)} />
          <span>🔎</span>
        </div>
      </div>

      <div className="toolbar">
        <button className="btn" onClick={selectAllShown}>+ Select all shown</button>
        <button className="btn" onClick={clearAll}>✕ Clear selected</button>
        <span className="badge">Showing <strong>{filtered.length}</strong> {league==="ALL"?"teams":league}</span>
      </div>

      <div className="main">
        {/* LEFT: teams grid */}
        <div>
          <div className="grid">
            {filtered.map(t=>{
              const checked = isSelected(t.id);
              return (
                <div key={t.id} className="card">
                  {t.icon_path
                    ? <img className="logo" src={`/${t.icon_path}`} alt="" />
                    : <div className="logo">{emoji[t.league_id] ?? "🏟️"}</div>
                  }
                  <div style={{flex:1,minWidth:0}}>
                    <div className="title">{t.market} {t.name}</div>
                    <div className="meta">{t.league_id}</div>
                  </div>
                  <div className={`switch ${checked?"on":""}`} onClick={()=>toggle(t.id)} title={checked?"Remove":"Add"} />
                </div>
              );
            })}
            {!filtered.length && (
              <div className="card" style={{gridColumn:"1/-1",justifyContent:"center",color:"var(--muted)"}}>
                No teams match that filter.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: selected list */}
        <aside className="aside">
          <div className="aside-h">
            <div><strong>Selected</strong> <span className="count">({selected.length})</span></div>
            <div className="sub">Use ↑/↓ to reorder</div>
          </div>
          <ul className="list">
            {selected.length===0 && <li className="row" style={{color:"var(--muted)"}}>No teams selected yet.</li>}
            {selected
              .slice()
              .sort((a,b)=>a.display_order-b.display_order)
              .map(s=>{
                const t = byId.get(s.team_id); if(!t) return null;
                return (
                  <li key={s.team_id} className="row">
                    {t.icon_path
                      ? <img className="small-logo" src={`/${t.icon_path}`} alt=""/>
                      : <div className="small-logo">{emoji[t.league_id] ?? "🏟️"}</div>
                    }
                    <div style={{minWidth:0}}>
                      <div className="row-title">{t.market} {t.name}</div>
                      <div className="row-meta">#{s.display_order} · {t.league_id}</div>
                    </div>
                    <div className="actions">
                      <button className="icon-btn" title="Move up" onClick={()=>up(s.team_id)}>↑</button>
                      <button className="icon-btn" title="Move down" onClick={()=>down(s.team_id)}>↓</button>
                      <button className="icon-btn danger" title="Remove" onClick={()=>removeSel(s.team_id)}>✕</button>
                    </div>
                  </li>
                );
              })}
          </ul>

<div className="footer" style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
  <button
    className="btn"
    onClick={() =>
      navigator.clipboard.writeText(`${API_BASE}/devices/${deviceId}/config`)
    }
    title="Copy device config URL"
  >
    📋 Copy Config URL
  </button>

  <button
    className="btn"
    onClick={() => deviceId && downloadConfigJson(deviceId, API_BASE)}
    title="Download JSON file"
  >
    💾 Download JSON
  </button>

  <button
    className="btn primary"
    disabled={saving}
    onClick={save}
  >
    {saving ? "Saving…" : "Save changes"}
  </button>
</div>



        </aside>
      </div>
    </div>
  );
}
