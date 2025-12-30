import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../lib/api";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "../context/ToastContext";
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
  // Add these type definitions so TS knows about them
  sleep_start_utc?: string | null;
  sleep_end_utc?: string | null;
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

// --- FIXED HELPER FUNCTION ---
// Removed the crashing 'toLocaleString' lines since they weren't being used in the return value anyway.
function localToUtc(timeStr: string): string | null {
  if (!timeStr) return null;
  try {
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date();
    // This sets the time in the User's Current Browser Timezone
    d.setHours(h);
    d.setMinutes(m);
    // Returns the UTC equivalent
    return d.toISOString().substring(11, 16); 
  } catch (e) {
    return null;
  }
}

// Helper: Convert UTC "HH:MM" -> Local "HH:MM" for display
function utcToLocal(utcStr: string): string {
    if(!utcStr) return "";
    try {
        const [h, m] = utcStr.split(':').map(Number);
        const d = new Date();
        d.setUTCHours(h);
        d.setUTCMinutes(m);
        // Return browser local time string
        const localH = d.getHours().toString().padStart(2, '0');
        const localM = d.getMinutes().toString().padStart(2, '0');
        return `${localH}:${localM}`;
    } catch { return ""; }
}

function SpeedPreview({ speed }: { speed: number }) {
  const [index, setIndex] = useState(1);

  useEffect(() => {
    // Reset to image 1 whenever speed changes for instant feedback
    setIndex(1); 
    
    const interval = setInterval(() => {
      setIndex((prev) => (prev % 10) + 1); // Cycles 1 to 10
    }, speed * 1000);

    return () => clearInterval(interval);
  }, [speed]);

  return (
    <div style={{
      marginTop: '12px',
      width: '100%',
      height: '160px', // Adjust height to fit your images
      background: '#000',
      borderRadius: '8px',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid #334155',
      position: 'relative'
    }}>
      {/* Assumes images are in /public folder named spdclip1.jpg, spdclip2.jpg, etc. */}
      <img 
        src={`/spdclip${index}.png`} 
        alt={`Preview frame ${index}`}
        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
      />
      <div style={{
        position: 'absolute', bottom: '5px', right: '5px',
        background: 'rgba(0,0,0,0.7)', color: '#fff',
        padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem'
      }}>
        Switching every {speed}s
      </div>
    </div>
  );
}


// Common Input Style for Dark Mode
const inputStyle = {
    background: '#111',
    border: '1px solid #333',
    color: '#fff',
    padding: '10px',
    borderRadius: '4px',
    width: '100%',
    fontSize: '14px'
};

type DeviceConfigPanelProps = {
  deviceId: string;
  embedded?: boolean;
  onClose?: () => void;
  onSaved?: () => void;
};

export function DeviceConfigPanel({deviceId, embedded = false, onClose, onSaved,
}: DeviceConfigPanelProps) {
  const { toast } = useToast();

  const [timezones, setTimezones] = useState<Timezone[]>([]);
  const [tzLoading, setTzLoading] = useState(true);

  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [editName, setEditName] = useState("");
  const [editTimezoneId, setEditTimezoneId] = useState<string>("");
  const [editRenderType, setEditRenderType] =
    useState<Device["render_type"]>("H");
  const [editRenderSpeed, setEditRenderSpeed] = useState<number>(3);

  const [editSleepStart, setEditSleepStart] = useState(""); 
  const [editSleepEnd, setEditSleepEnd] = useState("");     

  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // --------- load data ---------

  async function loadDevice() {
    if (!deviceId) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`${API_BASE}/devices/${deviceId}`, {
        headers: { ...authHeaders() },
      });
      if (res.status === 401) {
        localStorage.removeItem("token");
        window.location.hash = "#/login";
        return;
      }
      if (res.status === 404) {
        setErr("Device not found.");
        return;
      }
      if (!res.ok)
        throw new Error(await res.text().catch(() => `HTTP ${res.status}`));

      const data: Device = await res.json();
      setDevice(data);

      // initialize form values from device
      setEditName(data.name);
      setEditTimezoneId(data.timezone_id || "");
      setEditRenderType(data.render_type || "H");
      setEditRenderSpeed(
        typeof data.render_speed === "number" ? data.render_speed : 3
      );
      setEditSleepStart(utcToLocal(data.sleep_start_utc || ""));
      setEditSleepEnd(utcToLocal(data.sleep_end_utc || ""));
      setIsEditing(false); // always start read-only
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load device details");
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
    loadDevice();
    loadTimezones();
  }, [deviceId]);

  useEffect(() => {
    if (device && !tzLoading && timezones.length && !editTimezoneId) {
      setEditTimezoneId(device.timezone_id || timezones[0].id);
    }
  }, [device, tzLoading, timezones, editTimezoneId]);

  // --------- save / cancel ---------

  async function saveDeviceSettings() {
    if (!isEditing) return;

    setErr(null);
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

    // FIX: Removed the empty string argument that was causing the crash
    const utcStart = editSleepStart ? localToUtc(editSleepStart) : null;
    const utcEnd = editSleepEnd ? localToUtc(editSleepEnd) : null;

    try {
      const body: any = {
        name: editName,
        firmware_version: device.firmware_version ?? null,
        timezone_id: editTimezoneId,
        render_type: editRenderType ?? "H",
        render_speed: Number.isFinite(editRenderSpeed) ? editRenderSpeed : 3,
        // Send our fixed UTC values
        sleep_start_utc: utcStart,
        sleep_end_utc: utcEnd
      };

      const res = await fetch(`${API_BASE}/devices/${deviceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error(await res.text().catch(() => `HTTP ${res.status}`));
      }

      await loadDevice();
      onSaved?.();
      toast("Settings saved successfully!");
    } catch (e: any) {
      setErr(e?.message ?? "Failed to save device settings");
    } finally {
      setSaving(false);
    }
  }

  function startEditing() {
    setIsEditing(true);
  }

  function cancelEditing() {
    if (!device) {
      setIsEditing(false);
      return;
    }
    setEditName(device.name);
    setEditTimezoneId(device.timezone_id || "");
    setEditRenderType(device.render_type || "H");
    setEditRenderSpeed(
      typeof device.render_speed === "number" ? device.render_speed : 3
    );
    setEditSleepStart(utcToLocal(device.sleep_start_utc || ""));
    setEditSleepEnd(utcToLocal(device.sleep_end_utc || ""));
    setIsEditing(false);
  }

  // --------- render states ---------

  if (loading && !device) {
    return <div className="dv-muted">Loading device details…</div>;
  }
  if (err && !device) {
    return <div className="dv-alert">Error: {err}</div>;
  }
  if (!device) {
    return <div className="dv-alert">Device not found.</div>;
  }

  return (
    <div className={embedded ? "dv-panel-embedded" : "dv-container"}>
      {!embedded && (
        <Link
          to="/devices"
          style={{
            display: "block",
            marginBottom: 12,
            textDecoration: "none",
            color: "#334155",
            fontWeight: 500,
          }}
        >
          ← Back to Device List
        </Link>
      )}

      {/* HEADER ROW WITH BUTTONS */}
      <div 
        className="dv-header-wrap" 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 20 
        }}
      >
        <h1 className="dv-title" style={{ margin: 0, fontSize: '1.5rem' }}>{device.name} Settings</h1>

        <div className="dv-actions" style={{ margin: 0 }}>
          {isEditing ? (
            <>
              <button
                className="dv-btn dv-btn-primary"
                type="button"
                onClick={saveDeviceSettings}
                disabled={saving || tzLoading || !editTimezoneId}
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>

              <button
                className="dv-btn"
                type="button"
                onClick={cancelEditing}
                disabled={saving}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              className="dv-btn dv-btn-primary"
              type="button"
              onClick={startEditing}
            >
              Edit Settings
            </button>
          )}
        </div>
      </div>

      <div className="dv-card" style={{ padding: 24 }}>
        {err && (
          <div className="dv-alert" style={{ marginBottom: 16 }}>
            {err}
          </div>
        )}

        <form>
            <div
              className="dv-settings-grid"
              style={{
                display: "grid",
                gap: 20,
              }}
            >
            <div className="dv-field">
              <label>Device Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value.slice(0, 30))}
                disabled={!isEditing}
                className={`dv-input ${isEditing ? "edit-mode" : "read-mode"}`}
              />
            </div>

            <div className="dv-field">
              <label>Timezone</label>
              <select
                value={editTimezoneId}
                onChange={(e) => setEditTimezoneId(e.target.value)}
                disabled={!isEditing || tzLoading}
                className={`dv-input ${isEditing ? "edit-mode" : "read-mode"}`}
              >
                {tzLoading || timezones.length === 0 ? (
                  <option value="">(Loading...)</option>
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
                onChange={(e) => setEditRenderType(e.target.value as any)}
                disabled={!isEditing}
                className={`dv-input ${isEditing ? "edit-mode" : "read-mode"}`}
              >
                {RENDER_TYPES.map((rt) => (
                  <option key={rt.value} value={rt.value || "H"}>
                    {rt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="dv-field">
              <label>
                Screen Duration: <strong>{editRenderSpeed} seconds</strong>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>2s</span>
                <input
                  type="range"
                  min={2}
                  max={15}
                  step={1}
                  value={editRenderSpeed}
                  onChange={(e) => setEditRenderSpeed(parseInt(e.target.value) || 3)}
                  disabled={!isEditing}
                  style={{ 
                    flex: 1, 
                    cursor: isEditing ? 'pointer' : 'default',
                    accentColor: '#0f172a' // Matches your dark theme vibe
                  }}
                />
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>15s</span>
              </div>
              <small style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                How long each item stays on screen.
              </small>
            </div>

            {/* --- INSERT THIS BLOCK --- */}
            {isEditing && (
              <div className="dv-field" style={{ gridColumn: '1 / -1' }}>
                <label>Speed Preview</label>
                <SpeedPreview speed={editRenderSpeed} />
              </div>
            )}
            {/* ------------------------- */}

            <div className="dv-field">
              <label>Sleep Start (Local Time)</label>
              <input
                type="time"
                value={editSleepStart}
                onChange={(e) => setEditSleepStart(e.target.value)}
                disabled={!isEditing}
                className={`dv-input ${isEditing ? "edit-mode" : "read-mode"}`}
              />
              <small style={{color: '#666', fontSize: '0.8rem'}}>Device will turn off display at this time.</small>
            </div>

            <div className="dv-field">
              <label>Sleep End (Wake Up)</label>
              <input
                type="time"
                value={editSleepEnd}
                onChange={(e) => setEditSleepEnd(e.target.value)}
                disabled={!isEditing}
                className={`dv-input ${isEditing ? "edit-mode" : "read-mode"}`}
              />
            </div>

            
          </div>
        </form>
        {/* --- NEW CONNECTIVITY SECTION --- */}
        <div style={{ 
            marginTop: 32, 
            paddingTop: 24, 
            borderTop: '1px solid #e2e8f0' 
        }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: 8, marginTop: 0 }}>Connectivity</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: 16 }}>
                Need to update the Wi-Fi credentials on this device? Use the Bluetooth setup tool.
            </p>
            <Link 
                to="/wifi-setup" 
                className="dv-btn"
                style={{ 
                    display: 'inline-block', 
                    textDecoration: 'none', 
                    background: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #cbd5e1'
                }}
            >
                Configure Wi-Fi via Bluetooth
            </Link>
        </div>        
      </div>
    </div>
  );
}