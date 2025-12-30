import { useEffect, useState } from "react";
import { useParams } from "react-router-dom"; 
import { API_BASE } from "../lib/api";
import "./Devices.css";
import { DeviceTeamsPanel } from "./DeviceTeams";

type Device = {
  id: string;
  name: string;
  controller_id: string;
  last_seen_at?: string | null;
};

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function Devices() {
  const { deviceId } = useParams(); 
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  async function loadDevices() {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/devices`, { headers: { ...authHeaders() }});
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setDevices(data);
      if (deviceId) setSelectedDeviceId(deviceId);
      else if (data.length > 0 && !selectedDeviceId) setSelectedDeviceId(data[0].id);
    } catch (e: any) { setErr(e?.message); } finally { setLoading(false); }
  }

  useEffect(() => { loadDevices(); }, [deviceId]);

  const renderDeviceRibbon = () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '32px' }}>
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
                        padding: '16px',
                        borderRadius: '8px',
                        // Dark Card Styling
                        background: isActive ? '#1a1a1a' : 'transparent',
                        border: isActive ? '1px solid #00ff41' : '1px solid #333',
                        boxShadow: isActive ? '0 0 15px rgba(0, 255, 65, 0.1)' : 'none',
                        transition: 'all 0.2s ease',
                        display: 'flex', flexDirection: 'column'
                    }}
                >
                    <div style={{ fontWeight: '700', color: '#fff', fontSize: '0.95rem' }}>{d.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px' }}>ID: {d.controller_id}</div>
                    <div style={{ fontSize: '0.70rem', color: d.last_seen_at ? '#00ff41' : '#444', marginTop: '8px' }}>
                        {d.last_seen_at ? "Online" : "Offline"}
                    </div>                        
                </div>
            )
        })}
    </div>
  );

  if (loading && !devices.length) return <div style={{color: '#666'}}>Loading devices...</div>;

  return (
    <div>
      <h1 style={{ marginBottom: '24px', fontSize: '2rem', fontWeight: 900, letterSpacing: '-1px' }}>
        My Devices
      </h1>
      
      {devices.length === 0 ? <div style={{color: '#666'}}>No devices found.</div> : renderDeviceRibbon()}

      {selectedDeviceId && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <DeviceTeamsPanel deviceId={selectedDeviceId} onDeviceUpdate={loadDevices} />
          </div>
      )}
    </div>
  );
}