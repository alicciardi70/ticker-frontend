// C:\hedgefund\tickerview\website\frontend\src\components\ProductCard.tsx
type Props = {
  p: {
    id: string;
    name: string;
    price_cents?: number;
    short?: string;
    image?: string;
  };
};

export default function ProductCard({ p }: Props) {
  return (
    <div style={{ border:"1px solid #e5e7eb", padding:12, borderRadius:8 }}>
      <div style={{ fontWeight: 600 }}>{p.name}</div>
      {typeof p.price_cents === "number" && (
        <div style={{ color:"#6b7280" }}>${(p.price_cents/100).toFixed(2)}</div>
      )}
    </div>
  );
}
