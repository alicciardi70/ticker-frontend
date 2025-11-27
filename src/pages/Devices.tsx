// src/pages/Devices.tsx
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

  // create form
  const [name, setName] = useState("");
  const [controllerId, setControllerId] = useState("");
  const [newTimezoneId, setNewTimezoneId] = useState<string>("");
  const [newRenderType, setNewRenderType] = useState<Device["render_type"]>("H");
  const [newRenderSpeed, setNewRenderSpeed] = useState<number>(3);
  const [saving, setSaving] = useState(false);

  // per-row edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTimezoneId, setEditTimezoneId] = useState<string>("");
  const [editRenderType, setEditRenderType] = useState<Device["render_type"]>("H");
  const [editRenderSpeed, setEditRenderSpeed] = useState<number>(3);
  const [rowSaving, setRowSaving] = useState<string | null>(null);

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
      if (!newTimezoneId && data.length) setNewTimezoneId(data[0].id);
      if (editingId && !editTimezoneId && data.length) setEditTimezoneId(data[0].id);
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

  useEffect(() => {
    if (!tzLoading && timezones.length) {
      if (!newTimezoneId) setNewTimezoneId(timezones[0].id);
      if (editingId && !editTimezoneId) setEditTimezoneId(timezones[0].id);
    }
  }, [tzLoading, timezones, editingId, newTimezoneId, editTimezoneId]);

  const tzMap = useMemo(() => {
    const m = new Map<string, Timezone>();
    timezones.forEach((t) => m.set(t.id, t));
    return m;
  }, [timezones]);

  async function addDevice(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (tzLoading || !newTimezoneId) {
      setErr("Please select a timezone.");
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: name.trim(),
        controller_id: controllerId.trim(),
        timezone_id: newTimezoneId,
        render_type: newRenderType ?? "H",
        render_speed: Number.isFinite(newRenderSpeed) ? newRenderSpeed : 3,
      };
      const res = await fetch(`${API_BASE}/devices`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(body),
      });
      if (res.status === 401) {
        localStorage.removeItem("token");
        window.location.hash = "#/login";
        return;
      }
      if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`));
      setName("");
      setControllerId("");
      setNewRenderType("H");
      setNewRenderSpeed(3);
      await loadDevices();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to add device");
    } finally {
      setSaving(false);
    }
  }

  function beginEdit(d: Device) {
    setEditingId(d.id);
    setEditTimezoneId(d.timezone_id || (timezones[0]?.id ?? ""));
    setEditRenderType((d.render_type as Device["render_type"]) || "H");
    setEditRenderSpeed(typeof d.render_speed === "number" ? d.render_speed : 3);
  }

  function cancelEdit() {
    setEditingId(null);
    setRowSaving(null);
  }

  function handleRowClick(d: Device) {
    if (editingId === d.id) return;
    navigate(`/devices/${d.id}/teams`);
  }

  function stopRow(e: React.SyntheticEvent) {
    e.stopPropagation();
  }

  async function saveRow(d: Device, e: React.MouseEvent) {
    e.stopPropagation();
    if (!editingId) return;
    if (!editTimezoneId) {
      setErr("Please select a timezone.");
      return;
    }
    setRowSaving(d.id);
    try {
      const body: any = {
        firmware_version: d.firmware_version ?? null,
        timezone_id: editTimezoneId,
        render_type: editRenderType ?? "H",
        render_speed: Number.isFinite(editRenderSpeed) ? editRenderSpeed : 3,
      };
      const res = await fetch(`${API_BASE}/devices/${d.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`));
      await loadDevices();
      cancelEdit();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to save device settings");
    } finally {
      setRowSaving(null);
    }
  }

  return (
    <div className="dv-container">
      <h1 className="dv-title">Your Ticker Devices</h1>

      {err && <div className="dv-alert">{err}</div>}

      {/* CREATE CARD */}
      <form className="dv-card dv-create" onSubmit={addDevice}>
        <div className="dv-grid">
          <div className="dv-field">
            <label>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="dv-field">
            <label>Controller ID</label>
            <input value={controllerId} onChange={(e) => setControllerId(e.target.value)} required />
          </div>

          <div className="dv-field">
            <label>Timezone</label>
            <select
              value={newTimezoneId}
              onChange={(e) => setNewTimezoneId(e.target.value)}
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
            <label>Render Type</label>
            <select
              value={newRenderType}
              onChange={(e) => setNewRenderType(e.target.value as Device["render_type"])}
            >
              {RENDER_TYPES.map((rt) => (
                <option key={rt.value} value={rt.value || "H"}>
                  {rt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="dv-field">
            <label>Render Speed</label>
            <input
              type="number"
              min={1}
              max={100}
              value={newRenderSpeed}
              onChange={(e) => setNewRenderSpeed(parseInt(e.target.value || "3", 10))}
            />
          </div>

          <div className="dv-actions">
            <button
              className="dv-btn dv-btn-primary"
              disabled={saving || tzLoading || !newTimezoneId}
              title={!newTimezoneId ? "Select a timezone first" : "Add device"}
            >
              {saving ? "Adding…" : "Add device"}
            </button>
          </div>
        </div>
      </form>

      {/* LIST */}
      {loading ? (
        <div className="dv-muted">Loading…</div>
      ) : devices.length === 0 ? (
        <div className="dv-muted">No devices yet.</div>
      ) : (
        <ul className="dv-list">
          {devices.map((d) => {
            const tz = d.timezone_id ? tzMap.get(d.timezone_id) : undefined;
            const isEditing = editingId === d.id;
            return (
              <li
                key={d.id}
                onClick={() => handleRowClick(d)}
                className={`dv-card dv-row ${isEditing ? "dv-row-editing" : ""}`}
                title={isEditing ? "" : "Configure teams for this device"}
              >
                <div className="dv-row-head">
                  <div className="dv-row-title">{d.name}</div>
                  <div className="dv-row-sub">Controller: {d.controller_id}</div>
                  <div className="dv-row-meta">
                    {tz ? (
                      <>
                        TZ: <strong>{tz.tz_label}</strong> <span className="dv-dim">({tz.tz_name})</span>
                      </>
                    ) : (
                      <>TZ: <em>none</em></>
                    )}
                    <span className="dv-sep">•</span>
                    Render:{" "}
                    <strong>
                      {RENDER_TYPES.find((x) => x.value === d.render_type)?.label || "Horizontal scroll"}
                    </strong>
                    <span className="dv-sep">•</span> Speed:{" "}
                    <strong>{typeof d.render_speed === "number" ? d.render_speed : 3}</strong>
                  </div>
                </div>

                {!isEditing ? (
                  <div className="dv-row-controls">
                    <button
                      className="dv-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        beginEdit(d);
                      }}
                    >
                      Edit settings
                    </button>
                    <button
                      className="dv-btn dv-btn-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/devices/${d.id}/teams`);
                      }}
                    >
                      Teams →
                    </button>
                  </div>
                ) : (
                  <div
                    className="dv-edit-grid"
                    onClick={stopRow}
                    onMouseDown={stopRow}
                    onPointerDown={stopRow}
                  >
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
                      <label>Render Type</label>
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
                      <label>Render Speed</label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={editRenderSpeed}
                        onChange={(e) => setEditRenderSpeed(parseInt(e.target.value || "3", 10))}
                      />
                    </div>

                    <div className="dv-actions">
                      <button
                        className="dv-btn dv-btn-primary"
                        onClick={(e) => saveRow(d, e)}
                        disabled={rowSaving === d.id || tzLoading || !editTimezoneId}
                      >
                        {rowSaving === d.id ? "Saving…" : "Save"}
                      </button>
                      <button
                        className="dv-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelEdit();
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
