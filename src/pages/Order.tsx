import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { API_BASE } from "../lib/api";

type OrderStatus = {
  order_id: string;
  derived_status: string;
  paid: boolean;
  shipped: boolean;
  delivered: boolean;
  cancelled: boolean;
  returned: boolean;
  created_at?: string;
};

export default function OrderPage() {
  const { id } = useParams();
  const [data, setData] = useState<OrderStatus | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setErr(null);
    fetch(`${API_BASE}/orders/${encodeURIComponent(id)}/status`)
      .then(async r => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return r.json();
      })
      .then(setData)
      .catch(e => setErr(String(e)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;
  if (err) return <div style={{ padding: 24, color: "crimson" }}>Error: {err}</div>;
  if (!data) return <div style={{ padding: 24 }}>Not found</div>;

  return (
    <div style={{ padding: 24 }}>
      <Link to="/">← Back</Link>
      <h1>Order #{data.order_id}</h1>
      <div>Status: <strong>{data.derived_status}</strong></div>
      <ul>
        <li>Paid: {String(data.paid)}</li>
        <li>Shipped: {String(data.shipped)}</li>
        <li>Delivered: {String(data.delivered)}</li>
        <li>Cancelled: {String(data.cancelled)}</li>
        <li>Returned: {String(data.returned)}</li>
      </ul>
    </div>
  );
}
