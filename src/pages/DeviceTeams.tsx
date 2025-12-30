import { useState } from "react";
import { DeviceConfigPanel } from "./DeviceConfig";
import { DeviceSportsPanel } from "./DeviceSports";
import { DeviceWeatherPanel } from "./DeviceWeather";
import { DeviceFinancePanel } from "./DeviceFinance";
import "./DeviceTeams.css";

const CATEGORIES = ["SETTINGS", "SPORTS", "FINANCE", "OTHER"] as const;
type Category = (typeof CATEGORIES)[number];

export function DeviceTeamsPanel({ deviceId, onDeviceUpdate }: { deviceId: string; onDeviceUpdate?: () => void }) {
  const [category, setCategory] = useState<Category>("SPORTS"); 

  return (
    <div>
      {/* Dark Tabs */}
      <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid #333', marginBottom: 32 }}>
        {CATEGORIES.map(cat => {
            const isActive = category === cat;
            return (
              <button 
                key={cat} 
                onClick={() => setCategory(cat)}
                style={{
                    background: 'transparent',
                    border: 'none',
                    borderBottom: isActive ? '2px solid #00ff41' : '2px solid transparent',
                    color: isActive ? '#fff' : '#666',
                    padding: '12px 0',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: isActive ? 700 : 500,
                    transition: 'all 0.2s ease'
                }}
              >
                {cat === "SETTINGS" ? "DEVICE SETTINGS" : cat}
              </button>
            )
        })}
      </div>

      {/* Panels */}
      {category === "SETTINGS" && <DeviceConfigPanel deviceId={deviceId} embedded={true} onSaved={() => onDeviceUpdate?.()} />}
      {category === "SPORTS" && <DeviceSportsPanel deviceId={deviceId} />}
      {category === "FINANCE" && <DeviceFinancePanel deviceId={deviceId} />}
      {category === "OTHER" && <DeviceWeatherPanel deviceId={deviceId} />}
    </div>
  );
}