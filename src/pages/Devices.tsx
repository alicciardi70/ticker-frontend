import { useEffect, useState } from "react";
import { useParams } from "react-router-dom"; // <--- 1. Import useParams
import { API_BASE } from "../lib/api";
import "./Devices.css";
import { DeviceTeamsPanel } from "./DeviceTeams";

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

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function Devices() {
  const { deviceId } = useParams(); // <--- 2. Get ID from URL (if present)
  
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Layout State
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  // Load Devices List
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
      
      const data = await res.json();
      setDevices(data);
      
      // --- 3. LOGIC UPDATE: Deep Linking ---
      if (deviceId) {
          // If URL has an ID (clicked from Home), use it
          setSelectedDeviceId(deviceId);
      } else if (data.length > 0 && !selectedDeviceId) {
          // Otherwise default to the first device
          setSelectedDeviceId(data[0].id);
      }
      // -------------------------------------

    } catch (e: any) {
      setErr(e?.message ?? "Failed to load devices");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDevices();
  }, [deviceId]); // <--- 4. Re-run if URL parameter changes

  // -- Render Helper: Top Device Ribbon --
  const renderDeviceRibbon = () => {
    return (
        <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '12px',
            marginBottom: '24px' 
        }}>
            {devices.map(d => {
                const isActive = d.id === selectedDeviceId;
                return (
                    <div 
                        key={d.id}
                        onClick={() => setSelectedDeviceId(d.id)}
                        style={{
                            flex: '0 0 auto', 
                            width: '200px',
                            cursor: 'pointer',
                            padding: '12px',
                            borderRadius: '12px',
                            background: isActive ? 'white' : '#f9fafb',
                            border: isActive ? '2px solid #2563eb' : '1px solid #e5e7eb',
                            boxShadow: isActive ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        <div style={{ 
                            fontWeight: '600', 
                            color: '#111827', 
                            fontSize: '0.95rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>
                            {d.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '2px' }}>
                            ID: {d.controller_id}
                        </div>
                    </div>
                )
            })}
        </div>
    )
  };

  if (loading && !devices.length) return <div className="dv-container dv-muted">Loading devices...</div>;
  if (err && !devices.length) return <div className="dv-container dv-alert">{err}</div>;

  return (
    <div className="dv-container">
      <h1 className="dv-title" style={{ marginBottom: '20px' }}>My Devices</h1>
      
      {/* 1. Horizontal Device List */}
      {devices.length === 0 ? (
          <div className="dv-muted">No devices found.</div>
      ) : (
          renderDeviceRibbon()
      )}

      {/* 2. Content Area */}
      {selectedDeviceId && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div className="dv-panel-content">
                  <DeviceTeamsPanel 
                    deviceId={selectedDeviceId} 
                    onDeviceUpdate={loadDevices} 
                  />
              </div>
          </div>
      )}
    </div>
  );
}