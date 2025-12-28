import { BleClient } from "@capacitor-community/bluetooth-le";

export const PROV_SERVICE = "12345678-1234-1234-1234-1234567890ab";
export const WIFI_CHAR = "12345678-1234-1234-1234-1234567890ac";
export const STATUS_CHAR = "12345678-1234-1234-1234-1234567890ad";

function toDataView(str: string): DataView {
  const bytes = new TextEncoder().encode(str);
  return new DataView(bytes.buffer);
}

function fromDataView(v: DataView): string {
  return new TextDecoder().decode(new Uint8Array(v.buffer, v.byteOffset, v.byteLength));
}

export async function provisionWifi(ssid: string, password: string) {
  await BleClient.initialize({ androidNeverForLocation: true });

  const device = await BleClient.requestDevice({
    services: [PROV_SERVICE],
  });

  await BleClient.connect(device.deviceId);

  // Optional: status notifications from device
  try {
    await BleClient.startNotifications(device.deviceId, PROV_SERVICE, STATUS_CHAR, (value) => {
      console.log("Device status:", fromDataView(value));
    });
  } catch {
    // ignore if status char isn't implemented yet
  }

  const payload = JSON.stringify({ ssid, password });
  await BleClient.write(device.deviceId, PROV_SERVICE, WIFI_CHAR, toDataView(payload));
}
