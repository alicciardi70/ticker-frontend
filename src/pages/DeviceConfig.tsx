import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../lib/api";
import { useNavigate, useParams, Link } from "react-router-dom";
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

type DeviceConfigPanelProps = {
  deviceId: string;
  embedded?: boolean;
  onClose?: () => void;
  onSaved?: () => void;
};

export function DeviceConfigPanel({
  deviceId,
  embedded = false,
  onClose,
  onSaved,
}: DeviceConfigPanelProps) {
  const navigate = useNavigate();
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

  const tzMap = useMemo(() => {
    const m = new Map<string, Timezone>();
    timezones.forEach((t) => m.set(t.id, t));
    return m;
  }, [timezones]);

  // --------- save / cancel ---------

async function saveDeviceSettings() {
    console.log("[DEBUG] saveDeviceSettings: Started."); 

    if (!isEditing) {
        console.log("[DEBUG] saveDeviceSettings: Not in edit mode, aborting.");
        return;
    }

    setErr(null);

    if (!deviceId || !device) {
        console.error("[DEBUG] saveDeviceSettings: Missing deviceId or device data.");
        return;
    }
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

      const targetUrl = `${API_BASE}/devices/${deviceId}`;
      
      // [DEBUG] Log the exact payload and URL
      console.log(`[DEBUG] Target URL: ${targetUrl}`);
      console.log(`[DEBUG] Method: PUT`); // We are fixing this to PUT
      console.log(`[DEBUG] Payload:`, body);

      // --- THE FIX: Changed 'PATCH' to 'PUT' to match devices.py ---
      const res = await fetch(targetUrl, {
        method: "PUT", 
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(body),
      });

      console.log(`[DEBUG] Response Status: ${res.status} ${res.statusText}`);

      if (!res.ok) {
        const errorText = await res.text().catch(() => `HTTP ${res.status}`);
        console.error(`[DEBUG] Server Error Body:`, errorText);
        throw new Error(errorText);
      }

      console.log("[DEBUG] Update successful. Reloading device data...");
      await loadDevice(); 
      onSaved?.();
      toast("Settings saved successfully!");
    } catch (e: any) {
      console.error("[DEBUG] Exception in saveDeviceSettings:", e);
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
    // revert fields back to device values
    setEditName(device.name);
    setEditTimezoneId(device.timezone_id || "");
    setEditRenderType(device.render_type || "H");
    setEditRenderSpeed(
      typeof device.render_speed === "number" ? device.render_speed : 3
    );
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

  const currentTz = device.timezone_id ? tzMap.get(device.timezone_id) : undefined;

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

      <div className="dv-header-wrap">
        <h1 className="dv-title">{device.name} Settings</h1>

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
                marginBottom: 24,
              }}
            >

            <div className="dv-field">
              <label>Device Name (up to 30 characters)</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => {
                  const value = e.target.value.slice(0, 30); // cap at 30 chars
                  setEditName(value);
                }}
                placeholder="e.g. Basement"
                disabled={!isEditing}
                className={`dv-input ${isEditing ? "edit-mode" : "read-mode"}`}
              />
            </div>

            <div className="dv-field">
              <label>Timezone</label>
              <select
                value={editTimezoneId}
                onChange={(e) => setEditTimezoneId(e.target.value)}
                disabled={!isEditing || tzLoading || timezones.length === 0}
                className={`dv-input ${isEditing ? "edit-mode" : "read-mode"}`}
              >
                {tzLoading || timezones.length === 0 ? (
                  <option value="">
                    {tzLoading ? "(loading…)" : "(no timezones available)"}
                  </option>
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
                onChange={(e) =>
                  setEditRenderType(e.target.value as Device["render_type"])
                }
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
              <label>Animation Speed (1-100)</label>
              <input
                type="number"
                min={1}
                max={100}
                value={editRenderSpeed}
                onChange={(e) => {
                  let value = e.target.value;

                  // Allow empty while typing
                  if (value === "") {
                    setEditRenderSpeed(NaN);
                    return;
                  }

                  // Convert to number
                  let num = parseInt(value, 10);

                  // Clamp between 1 and 100
                  if (num < 1) num = 1;
                  if (num > 100) num = 100;

                  setEditRenderSpeed(num);
                }}

                disabled={!isEditing}
                className={`dv-input ${isEditing ? "edit-mode" : "read-mode"}`}
              />
            </div>
          </div>

          <div className="dv-actions" style={{ justifyContent: "flex-start" }}>
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
                <button
                  className="dv-btn"
                  type="button"
                  onClick={() => navigate(`/devices/${deviceId}/teams`)}
                >
                  Next: Data Settings →
                </button>
              </>
            ) : (
              <>
                <button
                  className="dv-btn dv-btn-primary"
                  type="button"
                  onClick={startEditing}
                >
                  Edit Settings
                </button>
                <button
                  className="dv-btn"
                  type="button"
                  onClick={() => navigate(`/devices/${deviceId}/teams`)}
                >
                  Next: Data Settings →
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DeviceConfig() {
  const { deviceId } = useParams<{ deviceId: string }>();

  if (!deviceId) {
    return (
      <div className="dv-container dv-alert">Error: No device ID provided.</div>
    );
  }

  return <DeviceConfigPanel deviceId={deviceId} />;
}
