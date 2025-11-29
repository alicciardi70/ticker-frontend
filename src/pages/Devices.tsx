// src/pages/Devices.tsx (FINALIZED DROP-IN REPLACEMENT)

import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../lib/api";
import { useNavigate } from "react-router-dom";
import "./Devices.css";

type Device = {
  id: string;
  name: string;
  controller_id: string;
  firmware_version?: string | null;
  created_at?: string;
  timezone_id?: string | null;
  render_type?: "H" | "V" | "F" | "B";
  render_speed?: number;
};

type Timezone = {
  id: string;
  tz_label: string;
  tz_name: string;
};

const RENDER_TYPES: Array<{ value: Device["render_type"]; label: string }> = [
  { value: "H", label: "Horizontal scroll" },
  { value: "V", label: "Vertical scroll" },
  { value: "F", label: "Fade" },
  { value: "B", label: "Blink" },
];

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function Devices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [timezones, setTimezones] = useState<Timezone[]>([]);
  const [loading, setLoading] = useState(true);
  const [tzLoading, setTzLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const navigate = useNavigate();

  async function loadDevices() {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/devices`, { headers: { ...authHeaders() } });
      if (res.status === 401) {
        localStorage.removeItem("token");
        window.location.hash = "#/login";
        return;
      }
      if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`));
      setDevices(await res.json());
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load devices");
    } finally {
      setLoading(false);
    }
  }

  async function loadTimezones() {
    setTzLoading(true);
    try {
      const res = await fetch(`${API_BASE}/timezones`, { headers: { ...authHeaders() } });
      if (!res.ok) {
        setTimezones([]);
        return;
      }
      const data: Timezone[] = await res.json();
      setTimezones(data);
    } catch {
      setTimezones([]);
    } finally {
      setTzLoading(false);
    }
  }

  useEffect(() => {
    loadDevices();
    loadTimezones();
  }, []);

  const tzMap = useMemo(() => {
    const m = new Map<string, Timezone>();
    timezones.forEach((t) => m.set(t.id, t));
    return m;
  }, [timezones]);

  return (
    <div className="dv-container">
      <h1 className="dv-title">Your Ticker Devices</h1>

      {err && <div className="dv-alert">{err}</div>}

      {/* LIST */}
      {loading ? (
        <div className="dv-muted">Loading…</div>
      ) : devices.length === 0 ? (
        <div className="dv-muted">No devices yet.</div>
      ) : (
        <ul className="dv-list">
          {devices.map((d) => {
            const tz = d.timezone_id ? tzMap.get(d.timezone_id) : undefined;
            return (
              <li
                key={d.id}
                className={`dv-card dv-row`}
              >
                <div className="dv-row-head">
                  <div className="dv-row-title">{d.name}</div>
                  {/* 🚨 FINAL UPDATE: Controller/Display ID to Device ID */}
                  <div className="dv-row-sub">Device ID: {d.controller_id}</div> 
                  <div className="dv-row-meta">
                    {tz ? (
                      <>
                        Time Zone: <strong>{tz.tz_label}</strong> <span className="dv-dim">({tz.tz_name})</span>
                      </>
                    ) : (
                      <>Time Zone: <em>none</em></>
                    )}
                    <span className="dv-sep">•</span>
                    Animation:{" "}
                    <strong>
                      {RENDER_TYPES.find((x) => x.value === d.render_type)?.label || "Horizontal scroll"}
                    </strong>
                    <span className="dv-sep">•</span> Speed:{" "}
                    <strong>{typeof d.render_speed === "number" ? d.render_speed : 3}</strong>
                  </div>
                </div>

                <div className="dv-row-controls">
                    <button
                      className="dv-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/devices/${d.id}/config`); 
                      }}
                    >
                      Display & Data settings
                    </button>
                  </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}