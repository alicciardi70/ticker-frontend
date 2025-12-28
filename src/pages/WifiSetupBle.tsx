import React, { useState } from "react";
import { Capacitor } from "@capacitor/core";
import { provisionWifi } from "../native/ble/provisionWifi";

export default function WifiSetupBle() {
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  const onSend = async () => {
    try {
      if (!Capacitor.isNativePlatform()) {
        setStatus("Bluetooth setup only works in the installed mobile app.");
        return;
      }
      setStatus("Opening Bluetooth picker...");
      await provisionWifi(ssid, password);
      setStatus("Sent! Device should attempt Wi-Fi now.");
    } catch (e: any) {
      console.error(e);
      setStatus(`Error: ${e?.message ?? String(e)}`);
    }
  };

  return (
    <div style={{ padding: 16, maxWidth: 420 }}>
      <h2>Wi-Fi Setup (Bluetooth)</h2>

      <div style={{ marginBottom: 10 }}>
        <div>SSID</div>
        <input
          value={ssid}
          onChange={(e) => setSsid(e.target.value)}
          style={{ width: "100%", padding: 8 }}
        />
      </div>

      <div style={{ marginBottom: 10 }}>
        <div>Password</div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: 8 }}
        />
      </div>

      <button onClick={onSend} style={{ padding: 10, width: "100%" }}>
        Send to Device via Bluetooth
      </button>

      {status && <p style={{ marginTop: 12 }}>{status}</p>}
    </div>
  );
}
