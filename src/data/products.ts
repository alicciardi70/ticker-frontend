export type Product = {
  id: string;
  name: string;
  price_cents: number;
  short: string;
  image?: string;
};

export const PRODUCTS: Product[] = [
  { id: "p-ny-led-64x32", name: "Yankees LED Scoreboard (64×32)", price_cents: 17900, short: "64×32 HUB75 panel kit with ESP32.", image: "https://via.placeholder.com/600x360?text=64x32+Scoreboard" },
  { id: "p-esp32-kit", name: "Ticker Device (ESP32 Kit)", price_cents: 3900, short: "Pre-flashed ESP32 DevKitC-32E.", image: "https://via.placeholder.com/600x360?text=ESP32+Kit" },
  { id: "p-mount-bracket", name: "Wall Mount Bracket", price_cents: 1900, short: "Low-profile mount.", image: "https://via.placeholder.com/600x360?text=Mount+Bracket" },
];

