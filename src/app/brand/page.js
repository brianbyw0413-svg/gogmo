"use client";
import { useState, useEffect, useCallback } from "react";

const MEDIA = [
  { type: "video", src: "/856171-hd_1920_1080_30fps.mp4", label: "影片 — 車輛夜景" },
  { type: "image", src: "/PXL_20240912_093938326.MP.jpg", label: "實拍 1" },
  { type: "image", src: "/PXL_20240912_093945075.MP.jpg", label: "實拍 2" },
  { type: "image", src: "/pexels-bertelli-1.jpg", label: "Bertelli 1" },
  { type: "image", src: "/pexels-bertelli-2.jpg", label: "Bertelli 2" },
  { type: "image", src: "/pexels-pixabay-531756.jpg", label: "Pixabay 飛機" },
  { type: "image", src: "/pexels-tanathip-rattanatum-2026324.jpg", label: "Tanathip 車輛" },
];

const PRESET_COLORS = ["#ffffff", "#d4af37", "#ff69b4", "#00d4ff", "#ff6b35"];
const TABS = ["背景", "LOGO", "標題", "按鈕"];

/* ═══ Separate defaults for mobile / desktop ═══ */
const SHARED_STATE = {
  bgIndex: 3,
  overlayDepth: 0.6,
  logoColor: "gold",
  titleText: "朋友\n真高興見到你。\nNice to meet you.",
  titleWeight: 700,
  titleColor: "#ffffff",
  btnBgOpacity: 0.01,
  btnBorderOpacity: 0.15,
  btnGap: 16,
  btnTitleColor: "#d4af37",
  buttons: [
    { title: "接機", desc: "抵達台灣，專業司機準時迎接", href: "https://liffbooking.pickyouup.tw" },
    { title: "送機", desc: "前往機場，從容開啟精彩旅程", href: "https://liffbooking.pickyouup.tw" },
    { title: "宜蘭共乘平台", desc: "免費共乘媒合，每日通勤好夥伴", href: "https://liff.line.me/2009262593-SeB2VF83" },
    { title: "加入好友", desc: "立即加入 LINE 領取專屬優惠", href: "https://line.me/ti/p/@835acfgq" },
  ],
};

const MOBILE_DEFAULTS = {
  logoSize: 44,
  logoX: 34,
  logoY: 2,
  logoAlign: "center",
  titleSize: 28,
  titleX: 4,
  titleY: 17,
  btnFontSize: 17,
  btnPadding: 11,
  btnRadius: 12,
  btnBgOpacity: 0.06,
  btnBorderOpacity: 0,
  btnX: 50,
  btnY: 85,
  btnWidth: 340,
};

const DESKTOP_DEFAULTS = {
  logoSize: 48,
  logoX: 3,
  logoY: 2,
  logoAlign: "left",
  titleSize: 69,
  titleX: 5,
  titleY: 81,
  btnFontSize: 18,
  btnPadding: 32,
  btnRadius: 24,
  btnBgOpacity: 0.01,
  btnBorderOpacity: 0.15,
  btnX: 87,
  btnY: 69,
  btnWidth: 258,
};

/* ─── SliderRow ─── */
function SliderRow({ label, min, max, step, value, onChange }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
        <span style={{ fontSize: 11, color: "#999" }}>{label}</span>
        <span style={{ fontSize: 11, color: "#d4af37" }}>{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step || 1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: "#d4af37" }}
      />
    </div>
  );
}

export default function Home() {
  /* ── state ── */
  const [shared, setShared] = useState(SHARED_STATE);
  const [mobile, setMobile] = useState(MOBILE_DEFAULTS);
  const [desktop, setDesktop] = useState(DESKTOP_DEFAULTS);

  const [realDevice, setRealDevice] = useState("mobile"); // actual screen
  const [previewMode, setPreviewMode] = useState("auto"); // auto | mobile | desktop
  const [showEditor, setShowEditor] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const check = () => setRealDevice(window.innerWidth >= 768 ? "desktop" : "mobile");
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /* Which device are we rendering / editing? */
  const activeDevice = previewMode === "auto" ? realDevice : previewMode;
  const isDesktop = activeDevice === "desktop";
  const ds = isDesktop ? desktop : mobile; // device-specific settings
  const setDs = isDesktop ? setDesktop : setMobile;

  /* helpers */
  const uShared = (key, val) => setShared((prev) => ({ ...prev, [key]: val }));
  const uDevice = (key, val) => setDs((prev) => ({ ...prev, [key]: val }));
  const uBtn = (idx, key, val) =>
    setShared((prev) => {
      const btns = [...prev.buttons];
      btns[idx] = { ...btns[idx], [key]: val };
      return { ...prev, buttons: btns };
    });

  const active = MEDIA[shared.bgIndex];
  const logoSrc = shared.logoColor === "gold" ? "/logo-gold.png" : "/logo-pink.png";

  /* Export both settings */
  const exportJSON = useCallback(() => {
    const data = { shared, mobile, desktop };
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shared, mobile, desktop]);

  /* ════════════ RENDER ════════════ */
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0c0a09",
        color: "#ffffff",
        display: "flex",
        flexDirection: "column",
        overflowX: "hidden",
        position: "relative",
        fontFamily: "'Inter', 'Noto Sans TC', sans-serif",
      }}
    >
      {/* ───── HERO ───── */}
      <section
        style={{
          position: "relative",
          width: "100%",
          height: isDesktop ? "90vh" : "100dvh",
          overflow: "hidden",
        }}
      >
        {/* bg media */}
        {active.type === "video" ? (
          <video
            key={active.src}
            autoPlay
            muted
            loop
            playsInline
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          >
            <source src={active.src} type="video/mp4" />
          </video>
        ) : (
          <img
            key={active.src}
            src={active.src}
            alt="Hero"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        )}

        {/* overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            background: isDesktop
              ? `linear-gradient(to right, rgba(0,0,0,${Math.max(0, shared.overlayDepth - 0.35)}) 0%, rgba(0,0,0,${shared.overlayDepth - 0.1}) 50%, rgba(0,0,0,${Math.min(1, shared.overlayDepth + 0.25)}) 100%)`
              : `linear-gradient(to bottom, rgba(0,0,0,${Math.max(0, shared.overlayDepth - 0.4)}) 0%, rgba(0,0,0,${shared.overlayDepth}) 100%)`,
          }}
        />

        {/* content layer */}
        <div style={{ position: "absolute", inset: 0, zIndex: 10 }}>
          {/* LOGO */}
          <div
            style={{
              position: "absolute",
              ...(ds.logoAlign === "center"
                ? { left: "50%", transform: "translateX(-50%)", top: `${ds.logoY}%` }
                : ds.logoAlign === "right"
                  ? { right: `${100 - ds.logoX - 5}%`, top: `${ds.logoY}%` }
                  : { left: `${ds.logoX}%`, top: `${ds.logoY}%` }
              ),
            }}
          >
            <img
              src={logoSrc}
              alt="PickYouUP"
              style={{
                height: `${ds.logoSize}px`,
                width: "auto",
                objectFit: "contain",
                display: "block",
              }}
            />
          </div>

          {/* Title */}
          <div
            style={{
              position: "absolute",
              left: `${ds.titleX}%`,
              top: `${ds.titleY}%`,
              ...(isDesktop
                ? { transform: "translateY(-50%)" }
                : { right: "24px", textAlign: "left" }
              ),
            }}
          >
            <h1
              style={{
                fontSize: `${ds.titleSize}px`,
                fontWeight: shared.titleWeight,
                lineHeight: 1.15,
                whiteSpace: "pre-line",
                color: shared.titleColor,
                margin: 0,
                textShadow: "0 2px 20px rgba(0,0,0,0.5)",
              }}
            >
              {shared.titleText}
            </h1>
          </div>

          {/* Desktop buttons — right side vertical */}
          {isDesktop && (
            <div
              style={{
                position: "absolute",
                left: `${ds.btnX}%`,
                top: `${ds.btnY}%`,
                transform: "translate(-50%, -50%)",
                width: `${ds.btnWidth}px`,
                display: "flex",
                flexDirection: "column",
                gap: `${shared.btnGap}px`,
              }}
            >
              {shared.buttons.map((btn, i) => (
                <a
                  key={i}
                  href={btn.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "block",
                    padding: `${ds.btnPadding}px`,
                    borderRadius: `${ds.btnRadius}px`,
                    background: `rgba(255,255,255,${ds.btnBgOpacity ?? shared.btnBgOpacity})`,
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    border: `1px solid rgba(255,255,255,${ds.btnBorderOpacity ?? shared.btnBorderOpacity})`,
                    textDecoration: "none",
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `rgba(255,255,255,${Math.min(1, (ds.btnBgOpacity ?? shared.btnBgOpacity) + 0.06)})`;
                    e.currentTarget.style.borderColor = "rgba(212,175,55,0.5)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = `rgba(255,255,255,${ds.btnBgOpacity ?? shared.btnBgOpacity})`;
                    e.currentTarget.style.borderColor = `rgba(255,255,255,${ds.btnBorderOpacity ?? shared.btnBorderOpacity})`;
                  }}
                >
                  <div
                    style={{
                      color: shared.btnTitleColor,
                      fontSize: `${ds.btnFontSize}px`,
                      fontWeight: 900,
                      marginBottom: 4,
                    }}
                  >
                    {btn.title}
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
                    {btn.desc}
                  </div>
                </a>
              ))}
            </div>
          )}

          {/* Mobile buttons — bottom area */}
          {!isDesktop && (
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: `${ds.btnY}%`,
                transform: "translate(-50%, -50%)",
                width: `min(${ds.btnWidth}px, calc(100% - 48px))`,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              {shared.buttons.map((btn, i) => (
                <a
                  key={i}
                  href={btn.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: `${ds.btnPadding}px 10px`,
                    borderRadius: `${ds.btnRadius}px`,
                    background: `rgba(255,255,255,${ds.btnBgOpacity ?? 0.06})`,
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    border: `1px solid rgba(255,255,255,${ds.btnBorderOpacity ?? 0.1})`,
                    textDecoration: "none",
                    color: "#fff",
                    fontSize: `${ds.btnFontSize}px`,
                    fontWeight: 800,
                    textAlign: "center",
                  }}
                >
                  {btn.title.length > 7 ? btn.title.slice(0, 7) : btn.title}
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ───── FOOTER ───── */}
      <footer
        style={{
          padding: 40,
          textAlign: "center",
          borderTop: "1px solid #222",
          color: "#444",
          fontSize: 11,
          letterSpacing: 3,
        }}
      >
        &copy; 2026 PICKYOUUP.TW
      </footer>

      {/* ═══════════ DESIGN TOOL (HIDDEN — 加 ?edit 到網址可開啟) ═══════════ */}
      {typeof window !== "undefined" && window.location.search.includes("edit") && (
        <>
      <button
        onClick={() => setShowEditor(!showEditor)}
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          zIndex: 9999,
          padding: "8px 18px",
          borderRadius: 24,
          background: showEditor ? "#333" : "#d4af37",
          color: showEditor ? "#d4af37" : "#000",
          fontSize: 12,
          fontWeight: 700,
          border: showEditor ? "1px solid #d4af37" : "none",
          cursor: "pointer",
          transition: "all 0.2s",
        }}
      >
        {showEditor ? "✕ 關閉工具" : "⚙ 設計工具"}
      </button>

      {/* ═══════════ DESIGN TOOL PANEL ═══════════ */}
      {showEditor && (
        <div
          style={{
            position: "fixed",
            top: 56,
            right: 16,
            zIndex: 9998,
            width: 320,
            background: "rgba(0,0,0,0.95)",
            borderRadius: 16,
            border: "1px solid #d4af37",
            maxHeight: "80vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* ── Device Switcher ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              padding: "8px 12px",
              borderBottom: "1px solid rgba(212,175,55,0.15)",
              background: "rgba(212,175,55,0.05)",
            }}
          >
            <span style={{ fontSize: 10, color: "#888", marginRight: 4 }}>預覽：</span>
            {[
              { key: "auto", label: `自動 (${realDevice === "desktop" ? "電腦" : "手機"})` },
              { key: "mobile", label: "📱 手機" },
              { key: "desktop", label: "💻 電腦" },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => setPreviewMode(opt.key)}
                style={{
                  padding: "4px 10px",
                  fontSize: 11,
                  fontWeight: previewMode === opt.key ? 700 : 400,
                  color: previewMode === opt.key ? "#000" : "#999",
                  background: previewMode === opt.key
                    ? (opt.key === "mobile" ? "#4fc3f7" : opt.key === "desktop" ? "#ab47bc" : "#d4af37")
                    : "transparent",
                  border: previewMode === opt.key
                    ? "none"
                    : "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Editing indicator */}
          <div
            style={{
              padding: "4px 16px",
              fontSize: 10,
              textAlign: "center",
              color: isDesktop ? "#ab47bc" : "#4fc3f7",
              background: isDesktop ? "rgba(171,71,188,0.1)" : "rgba(79,195,247,0.1)",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              fontWeight: 700,
              letterSpacing: 1,
            }}
          >
            {isDesktop ? "💻 正在編輯：電腦版" : "📱 正在編輯：手機版"}
          </div>

          {/* Tabs */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid rgba(212,175,55,0.3)",
              flexShrink: 0,
            }}
          >
            {TABS.map((t, i) => (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                style={{
                  flex: 1,
                  padding: "10px 4px",
                  fontSize: 11,
                  fontWeight: activeTab === i ? 800 : 500,
                  color: activeTab === i ? "#d4af37" : "#666",
                  background: activeTab === i ? "rgba(212,175,55,0.1)" : "transparent",
                  border: "none",
                  borderBottom: activeTab === i ? "2px solid #d4af37" : "2px solid transparent",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Tab content — scrollable */}
          <div style={{ padding: 16, overflowY: "auto", flex: 1 }}>
            {/* ── Tab 0: 背景 ── */}
            {activeTab === 0 && (
              <div>
                <div style={{ fontSize: 13, color: "#d4af37", fontWeight: 700, marginBottom: 12 }}>
                  背景素材
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                  {MEDIA.map((m, i) => (
                    <button
                      key={i}
                      onClick={() => uShared("bgIndex", i)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 8,
                        background: shared.bgIndex === i ? "rgba(212,175,55,0.2)" : "rgba(255,255,255,0.04)",
                        border: shared.bgIndex === i ? "1px solid #d4af37" : "1px solid rgba(255,255,255,0.08)",
                        color: shared.bgIndex === i ? "#d4af37" : "#aaa",
                        fontSize: 12,
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.15s",
                      }}
                    >
                      {m.type === "video" ? "🎬" : "🖼"} {m.label}
                    </button>
                  ))}
                </div>
                <SliderRow
                  label="遮罩深度"
                  min={0}
                  max={1}
                  step={0.05}
                  value={shared.overlayDepth}
                  onChange={(v) => uShared("overlayDepth", v)}
                />
              </div>
            )}

            {/* ── Tab 1: LOGO ── */}
            {activeTab === 1 && (
              <div>
                <div style={{ fontSize: 13, color: "#d4af37", fontWeight: 700, marginBottom: 12 }}>
                  LOGO 設定
                </div>
                <SliderRow label="大小" min={16} max={120} value={ds.logoSize} onChange={(v) => uDevice("logoSize", v)} />
                <SliderRow label="水平位置 X" min={0} max={100} value={ds.logoX} onChange={(v) => uDevice("logoX", v)} />
                <SliderRow label="垂直位置 Y" min={0} max={100} value={ds.logoY} onChange={(v) => uDevice("logoY", v)} />
                {/* Alignment */}
                <div style={{ marginBottom: 12 }}>
                  <span style={{ fontSize: 11, color: "#999" }}>對齊方式</span>
                  <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                    {[
                      { key: "left", label: "靠左" },
                      { key: "center", label: "置中" },
                      { key: "right", label: "靠右" },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => uDevice("logoAlign", opt.key)}
                        style={{
                          padding: "5px 14px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                          border: ds.logoAlign === opt.key ? "2px solid #d4af37" : "1px solid #444",
                          background: ds.logoAlign === opt.key ? "rgba(212,175,55,0.15)" : "transparent",
                          color: ds.logoAlign === opt.key ? "#d4af37" : "#888",
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Color */}
                <div style={{ marginBottom: 12 }}>
                  <span style={{ fontSize: 11, color: "#999" }}>顏色</span>
                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    {["gold", "pink"].map((c) => (
                      <button
                        key={c}
                        onClick={() => uShared("logoColor", c)}
                        style={{
                          padding: "6px 16px",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          border: shared.logoColor === c ? "2px solid #d4af37" : "1px solid #444",
                          background: shared.logoColor === c ? "rgba(212,175,55,0.15)" : "transparent",
                          color: c === "gold" ? "#d4af37" : "#ff69b4",
                        }}
                      >
                        {c === "gold" ? "金色" : "粉色"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Tab 2: 標題 ── */}
            {activeTab === 2 && (
              <div>
                <div style={{ fontSize: 13, color: "#d4af37", fontWeight: 700, marginBottom: 12 }}>
                  標題設定
                </div>
                <div style={{ marginBottom: 12 }}>
                  <span style={{ fontSize: 11, color: "#999" }}>文字內容</span>
                  <textarea
                    value={shared.titleText}
                    onChange={(e) => uShared("titleText", e.target.value)}
                    rows={3}
                    style={{
                      width: "100%",
                      marginTop: 4,
                      background: "#1a1a1a",
                      border: "1px solid #333",
                      color: "#fff",
                      padding: 8,
                      borderRadius: 6,
                      fontSize: 13,
                      resize: "vertical",
                      fontFamily: "inherit",
                    }}
                  />
                </div>
                <SliderRow label="字體大小" min={16} max={120} value={ds.titleSize} onChange={(v) => uDevice("titleSize", v)} />
                <SliderRow label="字體粗細" min={400} max={900} step={100} value={shared.titleWeight} onChange={(v) => uShared("titleWeight", v)} />
                <div style={{ marginBottom: 12 }}>
                  <span style={{ fontSize: 11, color: "#999" }}>字體顏色</span>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 4 }}>
                    <input
                      type="color"
                      value={shared.titleColor}
                      onChange={(e) => uShared("titleColor", e.target.value)}
                      style={{
                        width: 28,
                        height: 28,
                        border: "none",
                        borderRadius: 4,
                        cursor: "pointer",
                        background: "transparent",
                        padding: 0,
                      }}
                    />
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => uShared("titleColor", c)}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          background: c,
                          border: shared.titleColor === c ? "2px solid #fff" : "2px solid #444",
                          cursor: "pointer",
                          padding: 0,
                        }}
                      />
                    ))}
                  </div>
                </div>
                <SliderRow label="水平位置 X" min={0} max={100} value={ds.titleX} onChange={(v) => uDevice("titleX", v)} />
                <SliderRow label="垂直位置 Y" min={0} max={100} value={ds.titleY} onChange={(v) => uDevice("titleY", v)} />
              </div>
            )}

            {/* ── Tab 3: 按鈕 ── */}
            {activeTab === 3 && (
              <div>
                <div style={{ fontSize: 13, color: "#d4af37", fontWeight: 700, marginBottom: 12 }}>
                  按鈕設定
                </div>
                <SliderRow label="字體大小" min={10} max={32} value={ds.btnFontSize} onChange={(v) => uDevice("btnFontSize", v)} />
                <SliderRow label="內間距" min={8} max={80} value={ds.btnPadding} onChange={(v) => uDevice("btnPadding", v)} />
                <SliderRow label="圓角" min={0} max={64} value={ds.btnRadius} onChange={(v) => uDevice("btnRadius", v)} />
                <SliderRow label="背景透明度" min={0} max={1} step={0.01} value={ds.btnBgOpacity ?? shared.btnBgOpacity} onChange={(v) => uDevice("btnBgOpacity", v)} />
                <SliderRow label="邊框透明度" min={0} max={0.5} step={0.01} value={ds.btnBorderOpacity ?? shared.btnBorderOpacity} onChange={(v) => uDevice("btnBorderOpacity", v)} />
                <SliderRow label="按鈕間距" min={4} max={48} value={shared.btnGap} onChange={(v) => uShared("btnGap", v)} />
                <SliderRow label="按鈕區 X" min={0} max={100} value={ds.btnX} onChange={(v) => uDevice("btnX", v)} />
                <SliderRow label="按鈕區 Y" min={0} max={100} value={ds.btnY} onChange={(v) => uDevice("btnY", v)} />
                <SliderRow label="按鈕區寬度" min={200} max={600} value={ds.btnWidth} onChange={(v) => uDevice("btnWidth", v)} />
                <div style={{ marginBottom: 12 }}>
                  <span style={{ fontSize: 11, color: "#999" }}>卡片標題顏色</span>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 4 }}>
                    <input
                      type="color"
                      value={shared.btnTitleColor}
                      onChange={(e) => uShared("btnTitleColor", e.target.value)}
                      style={{
                        width: 28,
                        height: 28,
                        border: "none",
                        borderRadius: 4,
                        cursor: "pointer",
                        background: "transparent",
                        padding: 0,
                      }}
                    />
                  </div>
                </div>

                {/* per-button edit */}
                <div style={{ borderTop: "1px solid #333", paddingTop: 12, marginTop: 8 }}>
                  <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>各按鈕文字</div>
                  {shared.buttons.map((btn, i) => (
                    <div
                      key={i}
                      style={{
                        marginBottom: 12,
                        padding: 10,
                        borderRadius: 8,
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <div style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>按鈕 {i + 1}</div>
                      <input
                        type="text"
                        value={btn.title}
                        onChange={(e) => uBtn(i, "title", e.target.value)}
                        placeholder="標題"
                        style={{
                          width: "100%",
                          marginBottom: 4,
                          padding: "5px 8px",
                          background: "#1a1a1a",
                          border: "1px solid #333",
                          borderRadius: 4,
                          color: "#fff",
                          fontSize: 12,
                        }}
                      />
                      <input
                        type="text"
                        value={btn.desc}
                        onChange={(e) => uBtn(i, "desc", e.target.value)}
                        placeholder="描述"
                        style={{
                          width: "100%",
                          padding: "5px 8px",
                          background: "#1a1a1a",
                          border: "1px solid #333",
                          borderRadius: 4,
                          color: "#fff",
                          fontSize: 12,
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Export button */}
          <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(212,175,55,0.3)", flexShrink: 0 }}>
            <button
              onClick={exportJSON}
              style={{
                width: "100%",
                padding: 10,
                background: copied ? "#4caf50" : "#d4af37",
                border: "none",
                borderRadius: 8,
                fontWeight: 800,
                fontSize: 13,
                cursor: "pointer",
                color: "#000",
                transition: "all 0.3s",
              }}
            >
              {copied ? "✅ 已複製！" : "📋 匯出設定（手機+電腦 JSON）"}
            </button>
          </div>
        </div>
      )}
        </>
      )}
    </main>
  );
}
