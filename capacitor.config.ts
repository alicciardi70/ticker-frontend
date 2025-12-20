import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tickerink.app',
  appName: 'Ticker Ink',
  webDir: 'dist',
  server: {
    url: "http://192.168.68.61:5173",
    cleartext: true
  }
};

export default config;
