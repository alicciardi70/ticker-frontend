// src/pages/Devices.tsx

import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../lib/api";
import "./Devices.css";
import { DeviceConfigPanel } from "./DeviceConfig";

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

  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // --- responsive breakpoint (mobile vs desktop) ---
  useEffect(() => {
    const check = () => {
      if (typeof window !== "undefined") {
        setIsMobile(window.innerWidth <= 900);
      }
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  async function loadDevices() {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/devices`, {
        headers: { ...authHeaders() },
      });
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
      const res = await fetch(`${API_BASE}/timezones`, {
        headers: { ...authHeaders() },
      });
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

  // reusable list markup so we can show it in mobile & desktop modes
  const deviceList = (
    <>
      <h1 className="dv-title">Your Ticker Devices</h1>

      {err && <div className="dv-alert">{err}</div>}

      {loading ? (
        <div className="dv-muted">Loading…</div>
      ) : devices.length === 0 ? (
        <div className="dv-muted">No devices yet.</div>
      ) : (
        <ul className="dv-list">
          {devices.map((d) => {
            const isSelected = selectedDeviceId === d.id;
            return (
              <li
                key={d.id}
                className={`dv-card dv-row dv-row-compact ${isSelected ? "dv-row-selected" : ""}`}
                onClick={() => setSelectedDeviceId(d.id)}
              >
                <div className="dv-row-main">
                  <div>
                    <div className="dv-row-title">{d.name}</div>
                    <div className="dv-row-sub">Device ID: {d.controller_id}</div>
                  </div>
                  <div className="dv-row-chevron">›</div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );

  // --- MOBILE MODE ---
  if (isMobile) {
    // Screen 1: just the list
    if (!selectedDeviceId) {
      return <div className="dv-container">{deviceList}</div>;
    }

    // Screen 2: full-screen config with back button
    return (
      <div className="dv-container">
        <button
          type="button"
          className="dv-btn dv-btn-ghost"
          style={{ marginBottom: 16 }}
          onClick={() => setSelectedDeviceId(null)}
        >
          ← Back to devices
        </button>
        <DeviceConfigPanel
          deviceId={selectedDeviceId}
          embedded
          onSaved={loadDevices}
          onClose={() => setSelectedDeviceId(null)}
        />
      </div>
    );
  }

  // --- DESKTOP / TABLET MODE (side-by-side) ---
  return (
    <div className="dv-container dv-layout">
      <div className="dv-layout-list">{deviceList}</div>

      <div className="dv-layout-panel">
        {selectedDeviceId ? (
          <DeviceConfigPanel
            deviceId={selectedDeviceId}
            embedded
            onSaved={loadDevices}
            onClose={() => setSelectedDeviceId(null)}
          />
        ) : (
          <div className="dv-muted dv-panel-placeholder">
            Select a device to edit its settings.
          </div>
        )}
      </div>
    </div>
  );
}
