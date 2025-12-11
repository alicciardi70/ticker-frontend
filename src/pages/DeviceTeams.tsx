import { useState } from "react";
import { DeviceConfigPanel } from "./DeviceConfig";
import { DeviceSportsPanel } from "./DeviceSports";
import { DeviceWeatherPanel } from "./DeviceWeather";
import { DeviceFinancePanel } from "./DeviceFinance";
import "./DeviceTeams.css";

const CATEGORIES = ["SETTINGS", "SPORTS", "FINANCE", "OTHER"] as const;
type Category = (typeof CATEGORIES)[number];

interface DeviceTeamsPanelProps {
    deviceId: string;
    onDeviceUpdate?: () => void;
}

export function DeviceTeamsPanel({ deviceId, onDeviceUpdate }: DeviceTeamsPanelProps) {
  const [category, setCategory] = useState<Category>("SPORTS"); 

  return (
    <div style={{ padding: "0" }}>
      
      {/* TABS ROW */}
      <div className="tabs-row">
        {CATEGORIES.map(cat => (
          <button 
            key={cat} 
            className={`tab-btn ${category === cat ? "active" : ""}`}
            onClick={() => setCategory(cat)}
          >
            {cat === "SETTINGS" ? "Device Settings" : cat}
          </button>
        ))}
      </div>

      {/* RENDER ACTIVE TAB */}
      {category === "SETTINGS" && (
         <div style={{ animation: "fadeIn 0.3s ease-in-out" }}>
             <DeviceConfigPanel 
                deviceId={deviceId} 
                embedded={true} 
                onSaved={() => onDeviceUpdate?.()}
             />
         </div>
      )}

      {category === "SPORTS" && <DeviceSportsPanel deviceId={deviceId} />}

      {category === "FINANCE" && <DeviceFinancePanel />}

      {category === "OTHER" && <DeviceWeatherPanel deviceId={deviceId} />}
      
    </div>
  );
}