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

const ZODIAC_SIGNS = [
  "aries", "taurus", "gemini", "cancer", 
  "leo", "virgo", "libra", "scorpio", 
  "sagittarius", "capricorn", "aquarius", "pisces"
];

export function DeviceWeatherPanel({ deviceId }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string>();
  const [isEditing, setIsEditing] = useState(false);

  // --- Weather State ---
  const [weatherZip, setWeatherZip] = useState("");
  const [weather5Day, setWeather5Day] = useState(false);
  const [weatherHourly, setWeatherHourly] = useState(false);
  const [weatherOnOff, setWeatherOnOff] = useState(true);
  const [weatherCurrent, setWeatherCurrent] = useState(true);

  // --- Lottery State ---
  const [showPowerball, setShowPowerball] = useState(false);
  const [showMegaMillions, setShowMegaMillions] = useState(false);

  // --- Horoscope State ---
  const [showHoroscope, setShowHoroscope] = useState(false);
  const [selectedSigns, setSelectedSigns] = useState<string[]>([]);
  const [showNews, setShowNews] = useState(false);
 

  const loadData = useCallback(async () => {
    setLoading(true);
    setErr(undefined);
    try {
      const res = await fetch(`${API_BASE}/devices/${deviceId}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to load settings");
      const data = await res.json();

      // Weather
      const zip = data.weather_zip || "";
      setWeatherZip(zip === "00000" ? "" : zip);
      setWeather5Day(data.weather_5day ?? false);
      setWeatherHourly(data.weather_hourly ?? false);
      setWeatherOnOff(data.weather_onoff !== false);
      setWeatherCurrent(data.weather_current !== false);

      // Lottery
      setShowPowerball(data.show_powerball ?? false);
      setShowMegaMillions(data.show_megamillions ?? false);

      // Horoscope
      setShowHoroscope(data.show_horoscope ?? false);
      const signsStr = data.horoscope_signs || "";
      setSelectedSigns(signsStr ? signsStr.split(",").map((s: string) => s.trim().toLowerCase()) : []);
      // News
      setShowNews(data.show_news ?? false);
   

    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleSign = (sign: string) => {
    if (!isEditing) return;
    if (selectedSigns.includes(sign)) {
      setSelectedSigns(selectedSigns.filter(s => s !== sign));
    } else {
      setSelectedSigns([...selectedSigns, sign]);
    }
  };

  const save = async () => {
    setSaving(true);
    setErr(undefined);

    const zipRegex = /^\d{5}$/;
    let finalZip = weatherZip.trim();

    // Validation
    if (weatherOnOff && !zipRegex.test(finalZip)) {
        setErr("Please enter a valid 5-digit Zip Code.");
        setSaving(false);
        return;
    }
    if (!weatherOnOff && !zipRegex.test(finalZip)) {
        finalZip = "00000";
    }

    try {
      // Fetch current config to merge
      const getRes = await fetch(`${API_BASE}/devices/${deviceId}`, { headers: authHeaders() });
      if (!getRes.ok) throw new Error("Could not fetch current device state");
      const currentData = await getRes.json();

      const payload = {
        ...currentData,
        // Weather
        weather_zip: finalZip,
        weather_5day: weather5Day,
        weather_hourly: weatherHourly,
        weather_onoff: weatherOnOff,
        weather_current: weatherCurrent,

        // Lottery
        show_powerball: showPowerball,
        show_megamillions: showMegaMillions,

        // Horoscope
        show_horoscope: showHoroscope,
        horoscope_signs: selectedSigns.join(","),
        // News 
        show_news: showNews,
      };

      const putRes = await fetch(`${API_BASE}/devices/${deviceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(payload),
      });

      if (!putRes.ok) throw new Error("Failed to save settings");

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

  if (loading) return <div className="dv-muted">Loading settings...</div>;

  return (
    <div style={{ animation: "fadeIn 0.3s ease-in-out" }}>
      <div style={{ background: "white", padding: "24px", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
        
        {/* HEADER ROW */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#111827", margin: 0 }}>
            Lifestyle & Weather
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

        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          
          {/* --- SECTION 1: WEATHER --- */}
          <div>
            <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Weather</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
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

          <div style={{ height: "1px", background: "#e5e7eb" }} />

          {/* --- SECTION 2: LOTTERY --- */}
          <div>
            <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Lottery Results</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label className="checkbox-label" style={{ cursor: isEditing ? "pointer" : "default" }}>
                    <input 
                        type="checkbox" 
                        checked={showPowerball} 
                        onChange={(e) => setShowPowerball(e.target.checked)} 
                        disabled={!isEditing} 
                    />
                    Powerball
                </label>
                <label className="checkbox-label" style={{ cursor: isEditing ? "pointer" : "default" }}>
                    <input 
                        type="checkbox" 
                        checked={showMegaMillions} 
                        onChange={(e) => setShowMegaMillions(e.target.checked)} 
                        disabled={!isEditing} 
                    />
                    Mega Millions
                </label>
            </div>
          </div>

          <div style={{ height: "1px", background: "#e5e7eb" }} />

          {/* --- SECTION 3: HOROSCOPES --- */}
          <div>
            <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Daily Horoscope</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <label className="checkbox-label" style={{ fontWeight: "bold", cursor: isEditing ? "pointer" : "default" }}>
                    <input 
                        type="checkbox" 
                        checked={showHoroscope} 
                        onChange={(e) => setShowHoroscope(e.target.checked)} 
                        disabled={!isEditing} 
                    />
                    Enable Horoscopes
                </label>

                {showHoroscope && (
                    <div style={{ marginLeft: "24px", borderLeft: "2px solid #f3f4f6", paddingLeft: "16px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                            {ZODIAC_SIGNS.map(sign => (
                                <label key={sign} className="checkbox-label" style={{ fontSize: "14px", textTransform: "capitalize", cursor: isEditing ? "pointer" : "default" }}>
                                    <input 
                                        type="checkbox" 
                                        checked={selectedSigns.includes(sign)}
                                        onChange={() => toggleSign(sign)}
                                        disabled={!isEditing}
                                    />
                                    {sign}
                                </label>
                            ))}
                        </div>
                    </div>
                )}
            </div>
          </div>


          {/* --- SECTION 4: NEWS --- */}
          <div style={{ height: "1px", background: "#e5e7eb" }} />

          <div>
            <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>News Feed</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <label className="checkbox-label" style={{ fontWeight: "bold", cursor: isEditing ? "pointer" : "default" }}>
                    <input 
                        type="checkbox" 
                        checked={showNews} 
                        onChange={(e) => setShowNews(e.target.checked)} 
                        disabled={!isEditing} 
                    />
                    Show Top 10 Headlines (Google News)
                </label>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}