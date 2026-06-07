import Link from "next/link";

export default function InventoryUnitNotFound() {
  return (
    <main className="state-shell">
      <div className="empty-state">
        <p className="eyebrow">Inventory not found</p>
        <h1>This unit is no longer available.</h1>
        <p>It may have been archived, booked, or moved out of public discovery.</p>
        <Link href="/discover" className="button button-primary">Browse available inventory</Link>
      </div>
    </main>
  );
}
