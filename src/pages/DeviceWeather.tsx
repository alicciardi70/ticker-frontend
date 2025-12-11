import { useEffect, useState, useCallback } from "react";
import "./DeviceTeams.css";

const API_BASE = (import.meta as any).env?.VITE_API_BASE?.replace(/\/+$/, "") || "http://127.0.0.1:8000";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface Props {
  deviceId: string;
}

export function DeviceWeatherPanel({ deviceId }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string>();
  const [isEditing, setIsEditing] = useState(false);

  // Weather State
  const [weatherZip, setWeatherZip] = useState("");
  const [weather5Day, setWeather5Day] = useState(false);
  const [weatherHourly, setWeatherHourly] = useState(false);
  const [weatherOnOff, setWeatherOnOff] = useState(true);
  const [weatherCurrent, setWeatherCurrent] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErr(undefined);
    try {
      const res = await fetch(`${API_BASE}/devices/${deviceId}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to load settings");
      const data = await res.json();

      const zip = data.weather_zip || "";
      setWeatherZip(zip === "00000" ? "" : zip);
      setWeather5Day(data.weather_5day ?? false);
      setWeatherHourly(data.weather_hourly ?? false);
      setWeatherOnOff(data.weather_onoff !== false);
      setWeatherCurrent(data.weather_current !== false);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const save = async () => {
    setSaving(true);
    setErr(undefined);

    const zipRegex = /^\d{5}$/;
    let finalZip = weatherZip.trim();

    if (weatherOnOff && !zipRegex.test(finalZip)) {
        setErr("Please enter a valid 5-digit Zip Code.");
        setSaving(false);
        return;
    }
    if (!weatherOnOff && !zipRegex.test(finalZip)) {
        finalZip = "00000";
    }

    try {
      const getRes = await fetch(`${API_BASE}/devices/${deviceId}`, { headers: authHeaders() });
      if (!getRes.ok) throw new Error("Could not fetch current device state");
      const currentData = await getRes.json();

      const payload = {
        ...currentData,
        weather_zip: finalZip,
        weather_5day: weather5Day,
        weather_hourly: weatherHourly,
        weather_onoff: weatherOnOff,
        weather_current: weatherCurrent,
      };

      const putRes = await fetch(`${API_BASE}/devices/${deviceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(payload),
      });

      if (!putRes.ok) throw new Error("Failed to save weather settings");

      setIsEditing(false);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setIsEditing(false);
    loadData();
  };

  if (loading) return <div className="dv-muted">Loading weather settings...</div>;

  return (
    <div style={{ animation: "fadeIn 0.3s ease-in-out" }}>
      <div style={{ background: "white", padding: "24px", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
        
        {/* HEADER ROW inside the card */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#111827", margin: 0 }}>
            Weather Settings
            </h3>
            <div className="dv-actions" style={{ margin: 0 }}>
                {isEditing ? (
                    <>
                    <button className="dv-btn dv-btn-primary" onClick={save} disabled={saving}>
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                    <button className="dv-btn" onClick={cancel} disabled={saving}>
                        Cancel
                    </button>
                    </>
                ) : (
                    <button className="dv-btn dv-btn-primary" onClick={() => setIsEditing(true)}>
                    Edit Configuration
                    </button>
                )}
            </div>
        </div>

        {err && <div className="dv-alert">{err}</div>}

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <label className="checkbox-label" style={{ fontWeight: "bold", cursor: isEditing ? "pointer" : "default" }}>
            <input
              type="checkbox"
              checked={weatherOnOff}
              onChange={(e) => setWeatherOnOff(e.target.checked)}
              disabled={!isEditing}
            />
            Enable Weather
          </label>

          {weatherOnOff && (
            <div style={{ marginLeft: "24px", display: "flex", flexDirection: "column", gap: "12px", borderLeft: "2px solid #f3f4f6", paddingLeft: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "12px", fontWeight: "600", color: "#6b7280" }}>ZIP CODE</span>
                {isEditing ? (
                  <input
                    type="text"
                    placeholder="e.g. 10001"
                    value={weatherZip}
                    onChange={(e) => setWeatherZip(e.target.value)}
                    className="dv-input"
                    style={{ maxWidth: "150px" }}
                  />
                ) : (
                  <div style={{ fontWeight: 600 }}>{weatherZip || "Not Set"}</div>
                )}
              </div>

              <div style={{ height: "1px", background: "#f3f4f6", margin: "4px 0" }} />

              <label className="checkbox-label" style={{ cursor: isEditing ? "pointer" : "default" }}>
                <input type="checkbox" checked={weatherCurrent} onChange={(e) => setWeatherCurrent(e.target.checked)} disabled={!isEditing} />
                Current Weather
              </label>
              <label className="checkbox-label" style={{ cursor: isEditing ? "pointer" : "default" }}>
                <input type="checkbox" checked={weather5Day} onChange={(e) => setWeather5Day(e.target.checked)} disabled={!isEditing} />
                5-Day Forecast
              </label>
              <label className="checkbox-label" style={{ cursor: isEditing ? "pointer" : "default" }}>
                <input type="checkbox" checked={weatherHourly} onChange={(e) => setWeatherHourly(e.target.checked)} disabled={!isEditing} />
                Hourly Forecast
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}