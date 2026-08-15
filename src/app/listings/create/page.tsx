"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";

interface MediaItem {
  url: string;
  type: "image" | "video";
  name?: string;
}

export default function CreateListingPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  // Media state (Images and Videos)
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [customUrl, setCustomUrl] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Safety recall status
  const [safetyCheck, setSafetyCheck] = useState<{
    isRecalled: boolean;
    recallReason: string | null;
  } | null>(null);

  // Live safety recall validation
  useEffect(() => {
    if (!title.trim()) {
      setSafetyCheck(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/safety-check?title=${encodeURIComponent(
            title
          )}&description=${encodeURIComponent(description)}`
        );
        const result = await res.json();
        setSafetyCheck(result);
      } catch (e) {
        console.error("Safety check error:", e);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [title, description]);

  // Handle local file uploads (Photos & Videos)
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadError(null);

    Array.from(files).forEach((file) => {
      // 15MB file size limit
      if (file.size > 15 * 1024 * 1024) {
        setUploadError(`File "${file.name}" is larger than 15MB.`);
        return;
      }

      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");

      if (!isImage && !isVideo) {
        setUploadError(`"${file.name}" is not a supported image or video format.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setMediaList((prev) => [
            ...prev,
            {
              url: reader.result as string,
              type: isVideo ? "video" : "image",
              name: file.name,
            },
          ]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  // Handle URL paste
  function handleAddUrl(e: React.MouseEvent) {
    e.preventDefault();
    if (!customUrl.trim()) return;

    const trimmed = customUrl.trim();
    const isVideo =
      trimmed.endsWith(".mp4") ||
      trimmed.endsWith(".webm") ||
      trimmed.includes("video");

    setMediaList((prev) => [
      ...prev,
      {
        url: trimmed,
        type: isVideo ? "video" : "image",
        name: trimmed.split("/").pop() || "media-link",
      },
    ]);
    setCustomUrl("");
  }

  function handleRemoveMedia(index: number) {
    setMediaList((prev) => prev.filter((_, i) => i !== index));
  }

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

      const imageUrls = mediaList.map((m) => m.url);

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
          imageUrls,
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
      <h1>{t("sellTitle")}</h1>
      <p className="subtitle">{t("sellSubtitle")}</p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">{t("toyName")}</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("toyNamePlaceholder")}
            required
          />
        </div>

        {/* Live Safety Recall Check Warning Banner */}
        {safetyCheck && (
          <div
            className={`safety-alert ${
              safetyCheck.isRecalled ? "hazard" : "safe"
            }`}
          >
            {safetyCheck.isRecalled ? (
              <>
                ⚠️ <strong>Safety Recall Alert:</strong> {safetyCheck.recallReason}
              </>
            ) : (
              <>
                🛡️ <strong>Safety Checked:</strong> No official recall warnings
                found for this toy model.
              </>
            )}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="description">{t("descriptionLabel")}</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("descriptionPlaceholder")}
            rows={3}
          />
        </div>

        {/* Media Upload Area (Photos & Videos) */}
        <div className="form-group media-section">
          <label>{t("mediaLabel")}</label>
          <p className="media-hint">{t("mediaSubtitle")}</p>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*,video/*"
            multiple
            style={{ display: "none" }}
            id="mediaFileInput"
          />

          <div className="upload-controls">
            <button
              type="button"
              className="upload-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              📷 {t("uploadButton")}
            </button>
            <span className="upload-specs">{t("uploadHint")}</span>
          </div>

          {/* URL Input */}
          <div className="url-input-row">
            <input
              type="text"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="https://example.com/toy-photo.jpg or video.mp4"
            />
            <button
              type="button"
              className="add-url-btn"
              onClick={handleAddUrl}
            >
              {t("addUrlBtn")}
            </button>
          </div>

          {uploadError && <div className="alert error">{uploadError}</div>}

          {/* Preview Gallery */}
          {mediaList.length > 0 && (
            <div className="media-preview-grid">
              {mediaList.map((item, idx) => (
                <div key={idx} className="preview-tile">
                  {item.type === "video" ? (
                    <video
                      src={item.url}
                      className="preview-media"
                      controls
                      playsInline
                    />
                  ) : (
                    <img
                      src={item.url}
                      alt={item.name || `Photo ${idx + 1}`}
                      className="preview-media"
                    />
                  )}
                  <span className="type-tag">{item.type}</span>
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => handleRemoveMedia(idx)}
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="row">
          <div className="form-group col">
            <label htmlFor="price">{t("priceLabel")}</label>
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
            <label htmlFor="currency">{t("currencyLabel")}</label>
            <select
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="GBP">GBP (£)</option>
              <option value="VND">VND (₫)</option>
            </select>
          </div>
        </div>

        <div className="row">
          <div className="form-group col">
            <label htmlFor="category">{t("categoryLabel")}</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="BUILDING_SETS">{t("cat_BUILDING_SETS")}</option>
              <option value="ACTION_FIGURES">{t("cat_ACTION_FIGURES")}</option>
              <option value="DOLLS">{t("cat_DOLLS")}</option>
              <option value="PUZZLES">{t("cat_PUZZLES")}</option>
              <option value="BOARD_GAMES">{t("cat_BOARD_GAMES")}</option>
            </select>
          </div>
          <div className="form-group col">
            <label htmlFor="condition">{t("conditionLabel")}</label>
            <select
              id="condition"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
            >
              <option value="NEW">{t("cond_NEW")}</option>
              <option value="LIKE_NEW">{t("cond_LIKE_NEW")}</option>
              <option value="USED">{t("cond_USED")}</option>
              <option value="DAMAGED">{t("cond_DAMAGED")}</option>
            </select>
          </div>
        </div>

        <div className="row">
          <div className="form-group col">
            <label htmlFor="method">{t("tradeMethodLabel")}</label>
            <select
              id="method"
              value={tradeMethod}
              onChange={(e) => setTradeMethod(e.target.value)}
            >
              <option value="MEETUP">{t("method_MEETUP")}</option>
              <option value="SHIPPING">{t("method_SHIPPING")}</option>
              <option value="BOTH">{t("method_BOTH")}</option>
            </select>
          </div>
          <div className="form-group col">
            <label htmlFor="region">{t("regionLabel")}</label>
            <select
              id="region"
              value={shippingRegion}
              onChange={(e) => setShippingRegion(e.target.value)}
            >
              <option value="UK">United Kingdom</option>
              <option value="VN">Vietnam</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="location">{t("locationLabel")}</label>
          <input
            type="text"
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={t("locationPlaceholder")}
          />
        </div>

        <button type="submit" className="submit-btn" disabled={submitting}>
          {submitting ? t("submittingListingBtn") : t("submitListingBtn")}
        </button>
      </form>

      <style jsx>{`
        .container {
          max-width: 680px;
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
        input,
        textarea,
        select {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #ffffff;
          padding: 12px;
          border-radius: 8px;
          font-size: 0.95rem;
          outline: none;
          transition: border-color 0.2s;
        }
        input:focus,
        textarea:focus,
        select:focus {
          border-color: #00ff87;
        }

        /* Media Section */
        .media-section {
          background: rgba(255, 255, 255, 0.02);
          border: 1px dashed rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          padding: 20px;
        }
        .media-hint {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.5);
          margin: -4px 0 8px 0;
        }
        .upload-controls {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .upload-btn {
          background: rgba(0, 255, 135, 0.12);
          border: 1px solid rgba(0, 255, 135, 0.35);
          color: #00ff87;
          padding: 10px 18px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .upload-btn:hover {
          background: rgba(0, 255, 135, 0.2);
        }
        .upload-specs {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.4);
        }
        .url-input-row {
          display: flex;
          gap: 8px;
          margin-top: 4px;
        }
        .url-input-row input {
          flex: 1;
          padding: 8px 12px;
          font-size: 0.85rem;
        }
        .add-url-btn {
          background: rgba(96, 239, 255, 0.15);
          border: 1px solid rgba(96, 239, 255, 0.3);
          color: #60efff;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
        }
        .alert.error {
          background: rgba(255, 71, 87, 0.15);
          border: 1px solid rgba(255, 71, 87, 0.3);
          color: #ff4757;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 0.8rem;
          margin-top: 6px;
        }
        .media-preview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
          gap: 12px;
          margin-top: 14px;
        }
        .preview-tile {
          position: relative;
          width: 100%;
          aspect-ratio: 1;
          background: #000000;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          overflow: hidden;
        }
        .preview-media {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .type-tag {
          position: absolute;
          bottom: 4px;
          left: 4px;
          background: rgba(0, 0, 0, 0.7);
          color: #ffffff;
          font-size: 0.65rem;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .remove-btn {
          position: absolute;
          top: 4px;
          right: 4px;
          background: rgba(255, 71, 87, 0.85);
          border: none;
          color: #ffffff;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          cursor: pointer;
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
