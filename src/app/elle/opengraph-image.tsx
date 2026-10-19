import { ImageResponse } from "next/og";

// Prévia do link /elle (WhatsApp, Instagram, X): o orbe em pérola sobre a névoa, sem usar a capa do portfólio.
export const alt = "ELLE — Assistente de debates online";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          background: "radial-gradient(ellipse at 50% 38%, #f8f9fb 0%, #eceef0 70%)",
          color: "#131416",
        }}
      >
        <div
          style={{
            width: 292,
            height: 292,
            borderRadius: 9999,
            marginTop: -112,
            background: "radial-gradient(circle at 34% 30%, #ffffff 0%, #f6f8fc 24%, #e1e7f0 52%, #bfc9d7 80%, #a2aec0 100%)",
            boxShadow: "0 44px 70px -30px rgba(34,44,62,0.5)",
            display: "flex",
          }}
        />
        <div style={{ position: "absolute", left: 72, top: 60, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: 14 }}>ELLE</div>
          <div style={{ fontSize: 26, color: "#5c6269", marginTop: 10 }}>Assistente de debates online</div>
        </div>
        <div style={{ position: "absolute", bottom: 52, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: 58, letterSpacing: -1.5 }}>Envie um print.</div>
          <div style={{ fontSize: 58, letterSpacing: -1.5, color: "#5c6269" }}>O Elle pesquisa o contexto.</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
