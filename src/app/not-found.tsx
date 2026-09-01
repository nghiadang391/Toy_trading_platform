import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#0A0E12",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      color: "#ffffff",
      textAlign: "center",
    }}>
      {/* Glowing 404 number */}
      <div style={{
        fontSize: "clamp(6rem, 20vw, 12rem)",
        fontWeight: 900,
        lineHeight: 1,
        background: "linear-gradient(135deg, #00FF87 0%, #60EFFF 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        marginBottom: "8px",
        filter: "drop-shadow(0 0 40px rgba(0,255,135,0.3))",
      }}>
        404
      </div>

      {/* Badge */}
      <span style={{
        display: "inline-block",
        fontSize: "0.7rem",
        fontWeight: 700,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        color: "#00FF87",
        background: "rgba(0,255,135,0.1)",
        border: "1px solid rgba(0,255,135,0.3)",
        borderRadius: "99px",
        padding: "4px 14px",
        marginBottom: "24px",
      }}>
        Page Not Found
      </span>

      {/* Title */}
      <h1 style={{
        fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
        fontWeight: 800,
        marginBottom: "12px",
        maxWidth: "480px",
      }}>
        This Toy Has Left the Marketplace
      </h1>

      {/* Subtitle */}
      <p style={{
        fontSize: "1rem",
        color: "rgba(255,255,255,0.55)",
        maxWidth: "400px",
        lineHeight: 1.6,
        marginBottom: "40px",
      }}>
        The page you&apos;re looking for doesn&apos;t exist, has been moved, or the listing has already been traded.
      </p>

      {/* Action buttons */}
      <div style={{
        display: "flex",
        gap: "12px",
        flexWrap: "wrap",
        justifyContent: "center",
      }}>
        <Link href="/" style={{
          display: "inline-block",
          background: "linear-gradient(135deg, #00FF87 0%, #60EFFF 100%)",
          color: "#0A0A0A",
          fontWeight: 700,
          fontSize: "0.95rem",
          padding: "12px 28px",
          borderRadius: "12px",
          textDecoration: "none",
          transition: "opacity 0.2s",
        }}>
          Go Home
        </Link>

        <Link href="/listings" style={{
          display: "inline-block",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.15)",
          color: "#ffffff",
          fontWeight: 600,
          fontSize: "0.95rem",
          padding: "12px 28px",
          borderRadius: "12px",
          textDecoration: "none",
        }}>
          Browse Marketplace
        </Link>
      </div>

      {/* Decorative bottom glow */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "600px",
        height: "200px",
        background: "radial-gradient(ellipse at center bottom, rgba(0,255,135,0.1) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
    </div>
  );
}
