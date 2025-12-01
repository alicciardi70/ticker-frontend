// src/pages/DeviceConfig.tsx

import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../lib/api";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useToast } from "../context/ToastContext"; // <--- 1. Import Toast
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

export default function DeviceConfig() {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast(); // <--- 2. Init Hook
  
  // State for reference data
  const [timezones, setTimezones] = useState<Timezone[]>([]);
  const [tzLoading, setTzLoading] = useState(true);
  
  // State for current device data
  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // State for the EDIT form
  const [editName, setEditName] = useState("");
  const [editTimezoneId, setEditTimezoneId] = useState<string>("");
  const [editRenderType, setEditRenderType] = useState<Device["render_type"]>("H");
  const [editRenderSpeed, setEditRenderSpeed] = useState<number>(3);
  const [saving, setSaving] = useState(false);


  // --- Data Loading Functions ---

  async function loadDevice() {
    if (!deviceId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/devices/${deviceId}`, { headers: { ...authHeaders() } });
      if (res.status === 401) {
        localStorage.removeItem("token");
        window.location.hash = "#/login";
        return;
      }
      if (res.status === 404) {
          setErr("Device not found.");
          return;
      }
      if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`));
      const data: Device = await res.json();
      
      setDevice(data);
      setEditName(data.name);
      setEditTimezoneId(data.timezone_id || (timezones[0]?.id ?? ""));
      setEditRenderType(data.render_type || "H");
      setEditRenderSpeed(typeof data.render_speed === "number" ? data.render_speed : 3);
      
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load device details");
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
    loadDevice();
    loadTimezones();
  }, [deviceId]);
  
  useEffect(() => {
      if (device && !tzLoading && timezones.length && !editTimezoneId) {
          setEditTimezoneId(device.timezone_id || timezones[0].id);
      }
  }, [device, tzLoading, timezones, editTimezoneId]);

  const tzMap = useMemo(() => {
    const m = new Map<string, Timezone>();
    timezones.forEach((t) => m.set(t.id, t));
    return m;
  }, [timezones]);


  // --- Form Submission ---

  async function saveDeviceSettings(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); // Clear previous errors

    if (!deviceId || !device) return;
    if (!editTimezoneId) {
      setErr("Please select a timezone.");
      return;
    }
    if (!editName.trim()) {
        setErr("Device name cannot be empty.");
        return;
    }

    setSaving(true);
    try {
      const body: any = {
        name: editName,
        firmware_version: device.firmware_version ?? null,
        timezone_id: editTimezoneId,
        render_type: editRenderType ?? "H",
        render_speed: Number.isFinite(editRenderSpeed) ? editRenderSpeed : 3,
      };
      const res = await fetch(`${API_BASE}/devices/${deviceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`));
      
      await loadDevice(); 
      
      // 3. Use Toast instead of on-screen message
      toast("Settings saved successfully!");

    } catch (e: any) {
      setErr(e?.message ?? "Failed to save device settings");
    } finally {
      setSaving(false);
    }
  }

  // --- Render ---

  if (!deviceId) return <div className="dv-container dv-alert">Error: No device ID provided.</div>;
  if (loading) return <div className="dv-container dv-muted">Loading device details…</div>;
  if (err && !device) return <div className="dv-container dv-alert">Error: {err}</div>;
  if (!device) return <div className="dv-container dv-alert">Device not found.</div>;
  
  const currentTz = device.timezone_id ? tzMap.get(device.timezone_id) : undefined;


  return (
    <div className="dv-container">
        
        <Link to="/devices" style={{ display: 'block', marginBottom: 12, textDecoration: 'none', color: '#334155', fontWeight: 500 }}>
            ← Back to Device List
        </Link>
        <h1 className="dv-title">{device.name} Configuration</h1>
        
        <div style={{ padding: 16, background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 12, marginBottom: 24 }}>
            <div className="dv-row-title">Device ID: {device.controller_id}</div>
            <div className="dv-row-meta" style={{ marginTop: 4 }}>
                Firmware: <strong>{device.firmware_version ?? 'N/A'}</strong>
                <span className="dv-sep">•</span> Created: {new Date(device.created_at || '').toLocaleDateString()}
            </div>
            <div className="dv-row-meta" style={{ marginTop: 4 }}>
                Timezone: <strong>{currentTz?.tz_label || 'None'}</strong>
                <span className="dv-sep">•</span> Animation: <strong>{RENDER_TYPES.find(x => x.value === device.render_type)?.label || 'H'}</strong>
                <span className="dv-sep">•</span> Speed: <strong>{device.render_speed ?? 3}</strong>
            </div>
        </div>

      <div className="dv-card" style={{ padding: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>Edit Device Settings</h2>

        {/* Only show error alerts here, success is now a toast */}
        {err && <div className="dv-alert">{err}</div>}

        <form onSubmit={saveDeviceSettings}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                
                <div className="dv-field">
                    <label>Device Name (Friendly Name)</label>
                    <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="e.g. Living Room Ticker"
                        required
                    />
                </div>

                <div className="dv-field">
                    <label>Timezone</label>
                    <select
                        value={editTimezoneId}
                        onChange={(e) => setEditTimezoneId(e.target.value)}
                        required
                        disabled={tzLoading || timezones.length === 0}
                    >
                        {tzLoading || timezones.length === 0 ? (
                            <option value="">(loading…)</option>
                        ) : (
                            timezones.map((tz) => (
                                <option key={tz.id} value={tz.id}>
                                    {tz.tz_label} — {tz.tz_name}
                                </option>
                            ))
                        )}
                    </select>
                </div>

                <div className="dv-field">
                    <label>Animation Type</label>
                    <select
                        value={editRenderType}
                        onChange={(e) => setEditRenderType(e.target.value as Device["render_type"])}
                    >
                        {RENDER_TYPES.map((rt) => (
                            <option key={rt.value} value={rt.value || "H"}>
                                {rt.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="dv-field">
                    <label>Animation Speed (1-100)</label>
                    <input
                        type="number"
                        min={1}
                        max={100}
                        value={editRenderSpeed}
                        onChange={(e) => setEditRenderSpeed(parseInt(e.target.value || "3", 10))}
                    />
                </div>
            </div>

            <div className="dv-actions" style={{ justifyContent: 'flex-start' }}>
                <button
                    className="dv-btn dv-btn-primary"
                    type="submit"
                    disabled={saving || tzLoading || !editTimezoneId}
                >
                    {saving ? "Saving…" : "Save Changes"}
                </button>
                <button
                    className="dv-btn"
                    type="button"
                    onClick={() => navigate(`/devices/${deviceId}/teams`)}
                >
                    Go to Teams Configuration →
                </button>
            </div>
        </form>
      </div>
    </div>
  );
}