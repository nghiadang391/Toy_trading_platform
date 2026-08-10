"use client";

import { useEffect, useState } from "react";

interface ToyPassportModalProps {
  listingId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ToyPassportModal({ listingId, isOpen, onClose }: ToyPassportModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !listingId) return;
    setLoading(true);
    async function fetchPassport() {
      try {
        const res = await fetch(`/api/passport/${listingId}`);
        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error("Failed to load Toy Passport:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPassport();
  }, [isOpen, listingId]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title">
            <span className="passport-badge">📜 Spore DOB Passport</span>
            <h2>{data?.title || "Toy Passport Provenance"}</h2>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div className="loading-state">Loading Toy Passport from CKB...</div>
        ) : (
          <div className="modal-body">
            {/* Safety Status Banner */}
            {data?.isRecalled ? (
              <div className="safety-banner hazard">
                ⚠️ <strong>Safety Warning:</strong> {data.recallReason}
              </div>
            ) : (
              <div className="safety-banner safe">
                🛡️ <strong>Safety Checked:</strong> Verified clear against official recall databases.
              </div>
            )}

            {/* DOB Metadata Info */}
            <div className="info-card">
              <div className="info-row">
                <span className="label">Spore DOB Outpoint:</span>
                <span className="value code">
                  {data?.sporeDobId || "0x9f8c...3a1e:0 (Simulated Testnet Cell)"}
                </span>
              </div>
              <div className="info-row">
                <span className="label">Current Condition:</span>
                <span className="value condition-tag">{data?.condition}</span>
              </div>
            </div>

            {/* Provenance Timeline */}
            <div className="timeline-section">
              <h3>Lifespan Provenance Timeline</h3>
              <div className="timeline">
                {data?.history && data.history.length > 0 ? (
                  data.history.map((event: any, index: number) => (
                    <div key={index} className="timeline-item">
                      <div className="timeline-marker"></div>
                      <div className="timeline-details">
                        <span className="event-type">
                          {event.event === "MINTED" && "🌟 Passport Created & Minted"}
                          {event.event === "PASSPORT_STAMP" && "📝 Condition Log Update"}
                          {event.event === "TRANSFERRED" && "🤝 Ownership Handover"}
                        </span>
                        <span className="event-date">
                          {new Date(event.date).toLocaleDateString()}
                        </span>
                        {event.user && (
                          <p className="event-text">
                            Owner: <strong>{event.user.displayName}</strong> ({event.user.joyIdAddress.slice(0, 8)}...)
                          </p>
                        )}
                        {event.from && event.to && (
                          <p className="event-text">
                            From <strong>{event.from.displayName}</strong> to <strong>{event.to.displayName}</strong>
                          </p>
                        )}
                        {event.notes && <p className="event-notes">{event.notes}</p>}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-history">No transfer history recorded yet.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(8px);
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .modal-content {
          background: #121212;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          width: 100%;
          max-width: 600px;
          max-height: 85vh;
          overflow-y: auto;
          color: #ffffff;
          padding: 24px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.8);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 16px;
        }
        .passport-badge {
          font-size: 0.75rem;
          color: #00ff87;
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.05em;
        }
        h2 {
          font-size: 1.5rem;
          font-weight: 800;
          margin-top: 4px;
        }
        .close-btn {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          font-size: 1.25rem;
          cursor: pointer;
        }
        .close-btn:hover {
          color: #ffffff;
        }
        .loading-state {
          text-align: center;
          padding: 40px 0;
          color: rgba(255, 255, 255, 0.5);
        }
        .safety-banner {
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 0.85rem;
          margin-bottom: 16px;
        }
        .safety-banner.safe {
          background: rgba(0, 255, 135, 0.1);
          border: 1px solid rgba(0, 255, 135, 0.3);
          color: #00ff87;
        }
        .safety-banner.hazard {
          background: rgba(255, 71, 87, 0.1);
          border: 1px solid rgba(255, 71, 87, 0.3);
          color: #ff4757;
        }
        .info-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 24px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 0.85rem;
        }
        .info-row:last-child {
          margin-bottom: 0;
        }
        .label {
          color: rgba(255, 255, 255, 0.5);
        }
        .value.code {
          font-family: monospace;
          color: #60efff;
        }
        .condition-tag {
          color: #00ff87;
          font-weight: 700;
        }
        .timeline-section h3 {
          font-size: 1.1rem;
          margin-bottom: 16px;
          font-weight: 700;
        }
        .timeline {
          display: flex;
          flex-direction: column;
          gap: 16px;
          border-left: 2px solid rgba(0, 255, 135, 0.3);
          padding-left: 16px;
          margin-left: 8px;
        }
        .timeline-item {
          position: relative;
        }
        .timeline-marker {
          position: absolute;
          left: -22px;
          top: 4px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #00ff87;
          box-shadow: 0 0 10px #00ff87;
        }
        .event-type {
          font-weight: 700;
          font-size: 0.9rem;
          color: #ffffff;
          display: block;
        }
        .event-date {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.4);
        }
        .event-text {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.7);
          margin-top: 4px;
        }
        .event-notes {
          font-size: 0.8rem;
          font-style: italic;
          color: rgba(255, 255, 255, 0.5);
          margin-top: 2px;
        }
      `}</style>
    </div>
  );
}
