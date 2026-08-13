"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CreateListingPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceFiat, setPriceFiat] = useState("");
  const [currency, setCurrency] = useState("GBP");
  const [category, setCategory] = useState("BUILDING_SETS");
  const [condition, setCondition] = useState("NEW");
  const [tradeMethod, setTradeMethod] = useState("MEETUP");
  const [shippingRegion, setShippingRegion] = useState("UK");
  const [location, setLocation] = useState("");

  // Safety recall status
  const [safetyCheck, setSafetyCheck] = useState<{ isRecalled: boolean; recallReason: string | null } | null>(null);

  // Live safety recall validation
  useEffect(() => {
    if (!title.trim()) {
      setSafetyCheck(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/safety-check?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}`);
        const result = await res.json();
        setSafetyCheck(result);
      } catch (e) {
        console.error("Safety check error:", e);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [title, description]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !priceFiat) return;

    setSubmitting(true);
    try {
      // Mock JoyID registry sync setup:
      const userRes = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          joyIdAddress: "0xdummyjoyidaddressfrompasskeysignin",
          displayName: "Passkey Collector",
          region: shippingRegion,
        }),
      });
      const user = await userRes.json();

      const message = `create-listing:${title}:${parseFloat(priceFiat)}`;
      const signature = `mock-sig-0xdummyjoyidaddressfrompasskeysignin`;

      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          condition,
          category,
          priceFiat: parseFloat(priceFiat),
          currency,
          imageUrls: [],
          tradeMethod,
          shippingRegion,
          location,
          sellerId: user.id,
          signature,
        }),
      });

      if (res.ok) {
        router.push("/listings");
      }
    } catch (err) {
      console.error("Listing creation failed:", err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container">
      <h1>Sell a Toy</h1>
      <p className="subtitle">List your kids' outgrown toys and secure transaction payment in CKB.</p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Toy Name</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. LEGO Star Wars Millenium Falcon"
            required
          />
        </div>

        {/* Live Safety Recall Check Warning Banner */}
        {safetyCheck && (
          <div className={`safety-alert ${safetyCheck.isRecalled ? "hazard" : "safe"}`}>
            {safetyCheck.isRecalled ? (
              <>
                ⚠️ <strong>Safety Recall Alert:</strong> {safetyCheck.recallReason}
              </>
            ) : (
              <>
                🛡️ <strong>Safety Checked:</strong> No official recall warnings found for this toy model.
              </>
            )}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the condition, missing pieces, etc."
            rows={4}
          />
        </div>

        <div className="row">
          <div className="form-group col">
            <label htmlFor="price">Price</label>
            <input
              type="number"
              id="price"
              value={priceFiat}
              onChange={(e) => setPriceFiat(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
          <div className="form-group col">
            <label htmlFor="currency">Currency</label>
            <select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="GBP">GBP (£)</option>
              <option value="VND">VND (₫)</option>
            </select>
          </div>
        </div>

        <div className="row">
          <div className="form-group col">
            <label htmlFor="category">Category</label>
            <select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="BUILDING_SETS">Building Sets</option>
              <option value="ACTION_FIGURES">Action Figures</option>
              <option value="DOLLS">Dolls</option>
              <option value="PUZZLES">Puzzles</option>
              <option value="BOARD_GAMES">Board Games</option>
            </select>
          </div>
          <div className="form-group col">
            <label htmlFor="condition">Condition</label>
            <select id="condition" value={condition} onChange={(e) => setCondition(e.target.value)}>
              <option value="NEW">New</option>
              <option value="LIKE_NEW">Like New</option>
              <option value="USED">Used</option>
              <option value="DAMAGED">Damaged</option>
            </select>
          </div>
        </div>

        <div className="row">
          <div className="form-group col">
            <label htmlFor="method">Trade Method</label>
            <select id="method" value={tradeMethod} onChange={(e) => setTradeMethod(e.target.value)}>
              <option value="MEETUP">Meetup</option>
              <option value="SHIPPING">Shipping</option>
            </select>
          </div>
          <div className="form-group col">
            <label htmlFor="region">Region</label>
            <select id="region" value={shippingRegion} onChange={(e) => setShippingRegion(e.target.value)}>
              <option value="UK">United Kingdom</option>
              <option value="VN">Vietnam</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="location">Meetup Location / Detail Address</label>
          <input
            type="text"
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Hammersmith, London or District 1, HCMC"
          />
        </div>

        <button type="submit" className="submit-btn" disabled={submitting}>
          {submitting ? "Listing Toy..." : "List Toy for Trade"}
        </button>
      </form>

      <style jsx>{`
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 40px 24px;
          font-family: Inter, sans-serif;
        }
        h1 {
          font-size: 2.25rem;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 8px;
        }
        .subtitle {
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 32px;
          font-size: 0.95rem;
        }
        form {
          display: flex;
          flex-direction: column;
          gap: 20px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 32px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .safety-alert {
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 0.85rem;
          line-height: 1.4;
        }
        .safety-alert.safe {
          background: rgba(0, 255, 135, 0.1);
          border: 1px solid rgba(0, 255, 135, 0.3);
          color: #00ff87;
        }
        .safety-alert.hazard {
          background: rgba(255, 71, 87, 0.1);
          border: 1px solid rgba(255, 71, 87, 0.3);
          color: #ff4757;
        }
        .row {
          display: flex;
          gap: 16px;
        }
        .col {
          flex: 1;
        }
        label {
          font-size: 0.85rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        input, textarea, select {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #ffffff;
          padding: 12px;
          border-radius: 8px;
          font-size: 0.95rem;
          outline: none;
          transition: border-color 0.2s;
        }
        input:focus, textarea:focus, select:focus {
          border-color: #00ff87;
        }
        .submit-btn {
          margin-top: 12px;
          background: linear-gradient(135deg, #00ff87 0%, #60efff 100%);
          border: none;
          color: #0a0a0a;
          padding: 14px;
          font-weight: 700;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
          transition: transform 0.2s;
        }
        .submit-btn:hover {
          transform: translateY(-1px);
        }
        .submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
