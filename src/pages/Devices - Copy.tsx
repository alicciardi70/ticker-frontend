// src/pages/Devices.tsx
import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../lib/api";
import { useNavigate } from "react-router-dom";

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
      // Auto-pick first tz for create form if not set yet
      if (!newTimezoneId && data.length) setNewTimezoneId(data[0].id);
      // If currently editing and blank, pick first tz
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

  // If timezones load later and we were blank, pick first
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
        timezone_id: newTimezoneId, // REQUIRED
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
      // keep timezone selection for next add
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
    // If device had no tz, default to first available
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
        timezone_id: editTimezoneId, // REQUIRED
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
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, marginBottom: 12 }}>Your Ticker Devices</h1>

      {err && (
        <div
          style={{
            color: "#b91c1c",
            background: "#fee2e2",
            border: "1px solid #fecaca",
            padding: 12,
            borderRadius: 8,
            marginBottom: 12,
            whiteSpace: "pre-wrap",
          }}
        >
          {err}
        </div>
      )}

      {/* CREATE FORM */}
      <form
        onSubmit={addDevice}
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr 1fr 0.9fr 0.6fr auto",
          gap: 8,
          alignItems: "end",
          marginBottom: 16,
        }}
      >
        <div>
          <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: 8 }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Controller ID</label>
          <input
            value={controllerId}
            onChange={(e) => setControllerId(e.target.value)}
            required
            style={{ width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: 8 }}
          />
        </div>

        {/* Timezone (required, no "(none)") */}
        <div>
          <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Timezone</label>
          <select
            value={newTimezoneId}
            onChange={(e) => setNewTimezoneId(e.target.value)}
            required
            disabled={tzLoading || timezones.length === 0}
            style={{ width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: 8 }}
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

        {/* Render type */}
        <div>
          <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Render Type</label>
          <select
            value={newRenderType}
            onChange={(e) => setNewRenderType(e.target.value as Device["render_type"])}
            style={{ width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: 8 }}
          >
            {RENDER_TYPES.map((rt) => (
              <option key={rt.value} value={rt.value || "H"}>
                {rt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Render speed (1–100) */}
        <div>
          <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Render Speed</label>
          <input
            type="number"
            min={1}
            max={100}
            value={newRenderSpeed}
            onChange={(e) => setNewRenderSpeed(parseInt(e.target.value || "3", 10))}
            style={{ width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: 8 }}
          />
        </div>

        <button
          disabled={saving || tzLoading || !newTimezoneId}
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            border: "1px solid #000",
            background: "#000",
            color: "#fff",
            cursor: "pointer",
            opacity: saving || tzLoading || !newTimezoneId ? 0.6 : 1,
          }}
        >
          {saving ? "Adding…" : "Add device"}
        </button>
      </form>

      {/* DEVICES LIST */}
      {loading ? (
        <div>Loading…</div>
      ) : devices.length === 0 ? (
        <div>No devices yet.</div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {devices.map((d) => {
            const tz = d.timezone_id ? tzMap.get(d.timezone_id) : undefined;
            const isEditing = editingId === d.id;
            return (
              <li
                key={d.id}
                onClick={() => handleRowClick(d)}
                style={{
                  border: "1px solid #eee",
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 8,
                  cursor: isEditing ? "default" : "pointer",
                }}
                title={isEditing ? "" : "Configure teams for this device"}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{d.name}</div>
                    <div style={{ color: "#64748b" }}>Controller: {d.controller_id}</div>
                    <div style={{ color: "#64748b", fontSize: 12 }}>
                      {tz ? (
                        <>
                          TZ: <strong>{tz.tz_label}</strong> <span style={{ opacity: 0.8 }}>({tz.tz_name})</span>
                        </>
                      ) : (
                        <>TZ: <em>none</em></>
                      )}{" "}
                      · Render:{" "}
                      <strong>
                        {RENDER_TYPES.find((x) => x.value === d.render_type)?.label || "Horizontal scroll"}
                      </strong>{" "}
                      · Speed: <strong>{typeof d.render_speed === "number" ? d.render_speed : 3}</strong>
                    </div>
                  </div>

                  {!isEditing ? (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          beginEdit(d);
                        }}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 8,
                          border: "1px solid #ddd",
                          background: "#fff",
                          cursor: "pointer",
                        }}
                      >
                        Edit settings
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/devices/${d.id}/teams`);
                        }}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 8,
                          border: "1px solid #111",
                          background: "#111",
                          color: "#fff",
                          cursor: "pointer",
                        }}
                      >
                        Teams →
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={stopRow}
                      onMouseDown={stopRow}
                      onPointerDown={stopRow}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1.2fr 1fr 0.9fr 0.6fr auto",
                        gap: 8,
                        width: "60%",
                      }}
                    >
                      {/* Timezone (required) */}
                      <div>
                        <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Timezone</label>
                        <select
                          value={editTimezoneId}
                          onChange={(e) => setEditTimezoneId(e.target.value)}
                          onClick={stopRow}
                          onMouseDown={stopRow}
                          onPointerDown={stopRow}
                          required
                          disabled={tzLoading || timezones.length === 0}
                          style={{ width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: 8 }}
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

                      {/* Render type */}
                      <div>
                        <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Render Type</label>
                        <select
                          value={editRenderType}
                          onChange={(e) => setEditRenderType(e.target.value as Device["render_type"])}
                          onClick={stopRow}
                          onMouseDown={stopRow}
                          onPointerDown={stopRow}
                          style={{ width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: 8 }}
                        >
                          {RENDER_TYPES.map((rt) => (
                            <option key={rt.value} value={rt.value || "H"}>
                              {rt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Render speed (1–100) */}
                      <div>
                        <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Render Speed</label>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={editRenderSpeed}
                          onChange={(e) => setEditRenderSpeed(parseInt(e.target.value || "3", 10))}
                          onClick={stopRow}
                          onMouseDown={stopRow}
                          onPointerDown={stopRow}
                          style={{ width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: 8 }}
                        />
                      </div>

                      <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                        <button
                          onClick={(e) => saveRow(d, e)}
                          disabled={rowSaving === d.id || tzLoading || !editTimezoneId}
                          style={{
                            padding: "8px 12px",
                            borderRadius: 8,
                            border: "1px solid #111",
                            background: "#111",
                            color: "#fff",
                            cursor: "pointer",
                            opacity: rowSaving === d.id || tzLoading || !editTimezoneId ? 0.6 : 1,
                          }}
                          title="Save settings"
                        >
                          {rowSaving === d.id ? "Saving…" : "Save"}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            cancelEdit();
                          }}
                          style={{
                            padding: "8px 12px",
                            borderRadius: 8,
                            border: "1px solid #ddd",
                            background: "#fff",
                            cursor: "pointer",
                          }}
                          title="Cancel"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
