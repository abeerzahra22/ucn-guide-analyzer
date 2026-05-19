import { useState, useEffect } from "react";

// ─── Data ────────────────────────────────────────────────────────────────────
const MAT = [
  { id: "dlc",     name: "Diamond-Like Carbon", formula: "DLC (a-C:H)", Vf: 252,  vc: 6.90,  N: 11.3, bc: 6.65,  bi: 0.0,  abs: 0.0035, eta: 1.5,  tag: "hi",  pros: "Very high Vf, chemically inert, smooth surface, low η, compatible with cryogenic guides", cons: "H content variable between depositions, sp2/sp3 ratio affects Vf, internal stress can cause delamination" },
  { id: "ni58",    name: "Nickel-58",            formula: "⁵⁸Ni",        Vf: 335,  vc: 7.96,  N: 9.14, bc: 14.4,  bi: 0.0,  abs: 4.6,    eta: 5.0,  tag: "hi",  pros: "Highest Vf of common coating materials, well-characterised, used in PSI/ILL guides", cons: "Expensive isotope enrichment, neutron activation produces ⁵⁸Co, best for guides not needing cryogenics" },
  { id: "ni",      name: "Natural Nickel",        formula: "Ni (nat)",    Vf: 252,  vc: 6.90,  N: 9.14, bc: 10.3,  bi: 0.0,  abs: 4.49,   eta: 14.0, tag: "mid", pros: "Widely available, affordable, mature PVD deposition, good adhesion", cons: "High η from ⁶²Ni and ⁶⁴Ni isotopes, ⁵⁸Ni preferred for storage applications" },
  { id: "diamond", name: "Diamond",               formula: "C (diamond)", Vf: 304,  vc: 7.59,  N: 17.6, bc: 6.65,  bi: 0.0,  abs: 0.0035, eta: 0.5,  tag: "hi",  pros: "Highest known Vf with lowest η — near-ideal UCN reflector", cons: "CVD diamond deposition very expensive, limited to small areas, not scalable for full guide systems" },
  { id: "fomblin", name: "Fomblin",               formula: "PFPE oil",    Vf: 106,  vc: 4.49,  N: 3.8,  bc: 6.44,  bi: 0.0,  abs: 0.0,    eta: 2.0,  tag: "mid", pros: "Very low η, liquid surface self-heals, used in ILL UCN bottles", cons: "Low Vf limits UCN energy acceptance, liquid — only for room-temp enclosed bottles, contamination risk in guides" },
  { id: "be",      name: "Beryllium",             formula: "Be",          Vf: 252,  vc: 6.90,  N: 12.3, bc: 7.79,  bi: 0.0,  abs: 0.0076, eta: 2.0,  tag: "mid", pros: "High Vf comparable to DLC and nat-Ni, relatively low η", cons: "Extremely toxic — strict ALARA handling, machining prohibited without containment, rarely used in new facilities" },
  { id: "cr",      name: "Chromium",              formula: "Cr",          Vf: 180,  vc: 5.83,  N: 8.33, bc: 3.63,  bi: 0.0,  abs: 3.1,    eta: 8.0,  tag: "mid", pros: "Good adhesion to glass and steel, used as underlayer beneath Ni coatings", cons: "Moderate Vf, high η from absorption — not used alone for UCN storage" },
  { id: "ti",      name: "Titanium",              formula: "Ti",          Vf: -51,  vc: null,  N: 5.66, bc: -3.37, bi: 0.0,  abs: 6.09,   eta: null, tag: "neg", pros: "Negative Vf used in Ti/Ni multilayer supermirrors to extend effective m-value", cons: "Negative Vf — repels UCN, cannot be used alone as a guide coating" },
  { id: "cu",      name: "Copper",                formula: "Cu",          Vf: 168,  vc: 5.64,  N: 8.49, bc: 7.49,  bi: 0.0,  abs: 3.78,   eta: 8.0,  tag: "lo",  pros: "Easy electroplating and PVD deposition, inexpensive", cons: "Moderate Vf, high η — rarely chosen for UCN storage over Ni or DLC" },
];

// ─── Physics constants ────────────────────────────────────────────────────────
const HBAR = 1.0546e-34;
const MN   = 1.6749e-27;
const EV   = 1.602e-19;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function tagStyle(t) {
  if (t === "hi")  return { background: "rgba(0,200,150,0.12)", color: "#00c896", border: "1px solid rgba(0,200,150,0.25)" };
  if (t === "mid") return { background: "rgba(245,166,35,0.12)", color: "#f5a623", border: "1px solid rgba(245,166,35,0.25)" };
  if (t === "neg") return { background: "rgba(138,100,255,0.12)", color: "#a78bfa", border: "1px solid rgba(138,100,255,0.25)" };
  return { background: "rgba(224,82,82,0.12)", color: "#e05252", border: "1px solid rgba(224,82,82,0.25)" };
}
function tagLabel(t) {
  return { hi: "High performance", mid: "Moderate", neg: "Negative V_F", lo: "Limited" }[t];
}
function vfColor(v) {
  return v > 200 ? "#00c896" : v > 0 ? "#4a9eff" : "#e05252";
}

// ─── Styles (object-based, no external CSS needed) ────────────────────────────
const S = {
  app:        { maxWidth: 780, margin: "0 auto", padding: "1.5rem 1rem 3rem", fontFamily: "'IBM Plex Sans', 'Segoe UI', sans-serif", fontSize: 14, color: "#e8eaf0", background: "#0e1117", minHeight: "100vh", lineHeight: 1.6 },
  header:     { borderBottom: "1px solid #2a3348", paddingBottom: "1rem", marginBottom: "1.5rem" },
  h1:         { fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, fontWeight: 500, color: "#00c896", letterSpacing: "0.12em", textTransform: "uppercase", margin: 0 },
  subhead:    { fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#8892a4", marginTop: 4 },
  tabWrap:    { display: "flex", gap: 2, marginBottom: "1.5rem", background: "#161b25", border: "1px solid #2a3348", borderRadius: 6, padding: 3 },
  tab:        (active) => ({ flex: 1, padding: "7px 6px", fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500, letterSpacing: "0.04em", border: active ? "1px solid #2a3348" : "1px solid transparent", background: active ? "#1e2535" : "transparent", color: active ? "#e8eaf0" : "#8892a4", cursor: "pointer", borderRadius: 4, transition: "all 0.15s" }),
  secLabel:   { fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "#4a5568", marginBottom: "0.75rem", paddingBottom: 4, borderBottom: "1px solid #2a3348" },
  matGrid:    { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8, marginBottom: "1.5rem" },
  matBtn:     (active) => ({ background: "#161b25", border: active ? "1px solid #00c896" : "1px solid #2a3348", borderRadius: 6, padding: "10px 12px", cursor: "pointer", textAlign: "left", transition: "all 0.15s", width: "100%" }),
  detailCard: { background: "#161b25", border: "1px solid #2a3348", borderRadius: 8, padding: "1.25rem", marginBottom: "1.5rem" },
  metrics:    { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8, marginBottom: "1rem" },
  metric:     { background: "#1e2535", border: "1px solid #2a3348", borderRadius: 5, padding: "10px 12px" },
  propRow:    { display: "flex", gap: 8, padding: "6px 0", borderBottom: "1px solid #2a3348", fontSize: 13 },
  barRow:     { display: "flex", alignItems: "center", gap: 10, margin: "5px 0" },
  barTrack:   { flex: 1, background: "#1e2535", borderRadius: 3, height: 14, overflow: "hidden", border: "1px solid #2a3348" },
  calcGrid:   { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: "1rem" },
  field:      { display: "flex", flexDirection: "column", gap: 5 },
  input:      { background: "#1e2535", border: "1px solid #2a3348", borderRadius: 5, padding: "8px 10px", color: "#e8eaf0", fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, outline: "none", width: "100%" },
  select:     { background: "#1e2535", border: "1px solid #2a3348", borderRadius: 5, padding: "8px 10px", color: "#e8eaf0", fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, outline: "none", width: "100%" },
  resultBox:  { background: "#1e2535", border: "1px solid #2a3348", borderRadius: 6, padding: "1rem", marginTop: "1rem" },
  resultRow:  { display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "4px 0" },
  infoBox:    { background: "#161b25", borderLeft: "3px solid #4a9eff", borderRadius: "0 6px 6px 0", padding: "0.875rem 1rem", margin: "1rem 0", fontSize: 12, color: "#8892a4", lineHeight: 1.7, border: "1px solid #2a3348" },
  warnBox:    { background: "#161b25", borderLeft: "3px solid #f5a623", borderRadius: "0 6px 6px 0", padding: "0.875rem 1rem", margin: "1rem 0", fontSize: 12, color: "#8892a4", lineHeight: 1.7, border: "1px solid #2a3348" },
  formula:    { background: "#1e2535", border: "1px solid #2a3348", borderRadius: 5, padding: "0.75rem 1rem", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#4a9eff", margin: "0.75rem 0", lineHeight: 2 },
  tag:        (t) => ({ display: "inline-block", fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", padding: "2px 6px", borderRadius: 3, fontWeight: 500, ...tagStyle(t) }),
  assumItem:  { display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid #2a3348", fontSize: 13 },
  table:      { width: "100%", borderCollapse: "collapse", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 },
  th:         { padding: "7px 10px", textAlign: "left", color: "#4a5568", fontWeight: 500, letterSpacing: "0.08em", borderBottom: "1px solid #2a3348", fontSize: 10, textTransform: "uppercase" },
  td:         { padding: "7px 10px", borderBottom: "1px solid #2a3348", color: "#e8eaf0" },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function MaterialsTab({ selIdx, setSelIdx }) {
  const m = MAT[selIdx];
  const maxVf  = 335;
  const maxEta = 14;

  return (
    <div>
      <div style={S.secLabel}>Select material</div>
      <div style={S.matGrid}>
        {MAT.map((mat, i) => (
          <button key={mat.id} style={S.matBtn(i === selIdx)} onClick={() => setSelIdx(i)}>
            <div style={{ fontSize: 12, fontWeight: 500, color: "#e8eaf0", marginBottom: 2 }}>{mat.name}</div>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: "#8892a4", marginBottom: 6 }}>{mat.formula}</div>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 16, fontWeight: 500, color: vfColor(mat.Vf) }}>{mat.Vf}</div>
            <div style={{ fontSize: 10, color: "#8892a4" }}>neV</div>
          </button>
        ))}
      </div>

      <div style={S.detailCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem", flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 500, color: "#e8eaf0" }}>{m.name}</div>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: "#8892a4" }}>{m.formula}</div>
          </div>
          <span style={S.tag(m.tag)}>{tagLabel(m.tag)}</span>
        </div>
        <div style={S.metrics}>
          {[
            ["V_F", m.Vf, "neV"],
            ["v_c", m.vc ? m.vc.toFixed(2) : "N/A", "m/s"],
            ["η (×10⁻⁴)", m.eta ? m.eta.toFixed(1) : "N/A", ""],
            ["N", m.N.toFixed(1), "×10²⁸ m⁻³"],
            ["b_c", m.bc, "fm"],
            ["σ_abs", m.abs, "barn"],
          ].map(([label, val, unit]) => (
            <div key={label} style={S.metric}>
              <div style={{ fontSize: 10, color: "#4a5568", fontFamily: "'IBM Plex Mono',monospace", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</div>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 16, fontWeight: 500, color: "#e8eaf0" }}>{val}</div>
              <div style={{ fontSize: 10, color: "#8892a4" }}>{unit}</div>
            </div>
          ))}
        </div>
        <div style={{ ...S.propRow }}><span style={{ color: "#8892a4", minWidth: 160, flexShrink: 0 }}>Practical advantages</span><span>{m.pros}</span></div>
        <div style={{ ...S.propRow, borderBottom: "none" }}><span style={{ color: "#8892a4", minWidth: 160, flexShrink: 0 }}>Limitations</span><span>{m.cons}</span></div>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <div style={S.secLabel}>Fermi potential ranking</div>
        {[...MAT].sort((a, b) => b.Vf - a.Vf).map(mat => (
          <div key={mat.id} style={S.barRow}>
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: "#8892a4", width: 80, flexShrink: 0, textAlign: "right" }}>{mat.formula}</span>
            <div style={S.barTrack}>
              <div style={{ width: `${Math.max(0, mat.Vf / maxVf * 100).toFixed(1)}%`, height: "100%", borderRadius: 2, background: vfColor(mat.Vf), transition: "width 0.4s" }} />
            </div>
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: "#e8eaf0", width: 65, textAlign: "right" }}>{mat.Vf} neV</span>
          </div>
        ))}
      </div>

      <div>
        <div style={S.secLabel}>Loss factor η ranking (lower = better)</div>
        {[...MAT].filter(m => m.eta).sort((a, b) => a.eta - b.eta).map(mat => (
          <div key={mat.id} style={S.barRow}>
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: "#8892a4", width: 80, flexShrink: 0, textAlign: "right" }}>{mat.formula}</span>
            <div style={S.barTrack}>
              <div style={{ width: `${(mat.eta / maxEta * 100).toFixed(1)}%`, height: "100%", borderRadius: 2, background: mat.eta < 3 ? "#00c896" : mat.eta < 8 ? "#f5a623" : "#e05252", transition: "width 0.4s" }} />
            </div>
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: "#e8eaf0", width: 65, textAlign: "right" }}>{mat.eta.toFixed(1)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LifetimeTab() {
  const [matId,   setMatId]   = useState("dlc");
  const [E,       setE]       = useState(50);
  const [vol,     setVol]     = useState(10);
  const [area,    setArea]    = useState(1500);
  const [rough,   setRough]   = useState(1.0);
  const [temp,    setTemp]    = useState(300);

  const m = MAT.find(x => x.id === matId);
  let results = null;

  if (m && E < m.Vf && m.eta) {
    const VF_J = m.Vf * 1e-9 * EV;
    const E_J  = E    * 1e-9 * EV;
    const v_mean = Math.sqrt(2 * E_J / MN);
    const mu_base = 2 * m.eta * 1e-4 * Math.sqrt(E_J / (VF_J - E_J));
    const lambda_n = HBAR * 2 * Math.PI / (MN * v_mean);
    const roughCorr = 1 - Math.exp(-Math.pow(4 * Math.PI * rough * 1e-9 / lambda_n, 2));
    const mu_rough = roughCorr * 0.05;
    const mu_total = mu_base + mu_rough;
    const vol_m3 = vol * 1e-3;
    const area_m2 = area * 1e-4;
    const mfp = 4 * vol_m3 / area_m2;
    const collision_rate = v_mean / mfp;
    const tau_wall = 1 / (mu_total * collision_rate);
    const tau_beta = 879.4;
    const upscatter_rate = temp > 50 ? (temp / 300) * 1e-4 : 0;
    const tau_upsc = upscatter_rate > 0 ? 1 / upscatter_rate : Infinity;
    const tau_total = 1 / (1 / tau_wall + 1 / tau_beta + (isFinite(tau_upsc) ? 1 / tau_upsc : 0));

    results = [
      ["Loss per bounce μ (base)",     `${(mu_base * 1e4).toFixed(3)} × 10⁻⁴`],
      ["Roughness loss correction",    `${(mu_rough * 1e4).toFixed(3)} × 10⁻⁴`],
      ["Total μ",                      `${(mu_total * 1e4).toFixed(3)} × 10⁻⁴`],
      ["Mean free path (4V/A)",        `${(mfp * 100).toFixed(2)} cm`],
      ["Wall collision rate",          `${collision_rate.toFixed(1)} s⁻¹`],
      ["τ_wall (wall loss only)",      `${tau_wall.toFixed(1)} s`],
      ["τ_β (neutron β-decay)",        "879.4 s"],
      ["τ_upscatter (T correction)",   isFinite(tau_upsc) ? `${tau_upsc.toFixed(0)} s` : "negligible"],
      ["Estimated storage lifetime τ", `${tau_total.toFixed(1)} s`, true],
    ];
  }

  return (
    <div>
      <div style={S.secLabel}>UCN storage lifetime estimator</div>
      <div style={S.infoBox}>
        <strong style={{ color: "#e8eaf0" }}>Model:</strong> Wall collision loss per bounce μ = 2η · f(E, V_F), where f = √(E/(V_F−E)). Mean free path and bottle geometry set the collision rate. Based on Golub & Pendlebury (1975).
      </div>
      <div style={S.calcGrid}>
        {[
          ["Coating material", <select style={S.select} value={matId} onChange={e => setMatId(e.target.value)}>{MAT.filter(m => m.Vf > 0 && m.eta).map(m => <option key={m.id} value={m.id}>{m.name} ({m.formula})</option>)}</select>],
          ["UCN mean energy (neV)",        <input style={S.input} type="number" value={E}     min={1}   max={300} onChange={e => setE(parseFloat(e.target.value)||50)} />],
          ["Bottle volume (L)",            <input style={S.input} type="number" value={vol}   min={0.1}           onChange={e => setVol(parseFloat(e.target.value)||10)} />],
          ["Bottle surface area (cm²)",    <input style={S.input} type="number" value={area}  min={10}            onChange={e => setArea(parseFloat(e.target.value)||1500)} />],
          ["Surface roughness σ (nm)",     <input style={S.input} type="number" value={rough} min={0}   step={0.1} onChange={e => setRough(parseFloat(e.target.value)||0)} />],
          ["Temperature (K)",              <input style={S.input} type="number" value={temp}  min={1}   max={400}  onChange={e => setTemp(parseFloat(e.target.value)||300)} />],
        ].map(([label, el]) => (
          <div key={label} style={S.field}>
            <label style={{ fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", color: "#8892a4", letterSpacing: "0.05em" }}>{label}</label>
            {el}
          </div>
        ))}
      </div>

      <div style={S.resultBox}>
        {!results ? (
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, color: "#e05252" }}>
            {m && E >= m.Vf ? "UCN energy ≥ V_F — no total reflection" : "Adjust inputs above"}
          </div>
        ) : results.map(([key, val, highlight]) => (
          <div key={key} style={{ ...S.resultRow, ...(highlight ? { borderTop: "1px solid #2a3348", marginTop: 6, paddingTop: 8 } : {}) }}>
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: highlight ? "#e8eaf0" : "#8892a4" }}>{key}</span>
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: highlight ? 18 : 14, fontWeight: 500, color: "#00c896" }}>{val}</span>
          </div>
        ))}
      </div>

      <div style={S.warnBox}>
        <strong style={{ color: "#e8eaf0" }}>Note:</strong> Roughness correction uses the Steyerl diffuse scattering factor. Upscattering is estimated via Debye model approximation. Gravity and magnetic corrections are not included — see Model & Limits tab.
      </div>
    </div>
  );
}

function CustomTab() {
  const [N,    setN]    = useState(6.0);
  const [bc,   setBc]   = useState(6.67);
  const [bi,   setBi]   = useState(0.0);
  const [abs,  setAbs]  = useState(0.0);
  const [E,    setE]    = useState(50);

  const N_m3  = N * 1e28;
  const bc_m  = bc * 1e-15;
  const VF_J  = (HBAR * HBAR / (2 * MN)) * 4 * Math.PI * N_m3 * bc_m;
  const VF_neV = VF_J / (1e-9 * EV);
  const abs_m2 = abs * 1e-28;
  const bi_m   = bi * 1e-15;
  const W_J    = (HBAR * HBAR / (2 * MN)) * N_m3 * (abs_m2 * 2200 + 4 * Math.PI * bi_m * bi_m / (4 * Math.PI));
  const eta    = VF_J > 0 ? Math.abs(W_J / VF_J) : null;
  const vc     = VF_neV > 0 ? (Math.sqrt(2 * VF_J / MN)).toFixed(3) : null;
  const E_J    = E * 1e-9 * EV;
  const mu     = eta && VF_J > E_J ? (2 * eta * Math.sqrt(E_J / (VF_J - E_J))).toFixed(6) : null;

  return (
    <div>
      <div style={S.secLabel}>Custom material — Fermi potential calculator</div>
      <div style={S.formula}>
        V_F = (ℏ² / 2m_n) · 4π · N · b_c{"\n"}
        v_c  = √(2·V_F / m_n)   [total reflection threshold]{"\n"}
        μ    = 2η · √(E / (V_F − E))   [loss per wall collision]
      </div>
      <div style={S.calcGrid}>
        {[
          ["N — number density (×10²⁸ m⁻³)", N,   0.1,  setN],
          ["b_c — coherent scatt. length (fm)", bc, 0.1,  setBc],
          ["b_i — incoherent scatt. length (fm)", bi, 0.1, setBi],
          ["σ_abs — absorption cross-section (barn)", abs, 0.01, setAbs],
          ["UCN test energy E (neV)", E, 1, setE],
        ].map(([label, val, step, setter]) => (
          <div key={label} style={S.field}>
            <label style={{ fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", color: "#8892a4", letterSpacing: "0.05em" }}>{label}</label>
            <input style={S.input} type="number" value={val} step={step} onChange={e => setter(parseFloat(e.target.value) || 0)} />
          </div>
        ))}
      </div>
      <div style={S.resultBox}>
        {[
          ["Fermi potential V_F",          `${VF_neV.toFixed(2)} neV`],
          ["Critical velocity v_c",        vc ? `${vc} m/s` : "N/A (negative V_F)"],
          ["Loss factor η",               eta ? `${(eta * 1e4).toFixed(3)} × 10⁻⁴` : "N/A"],
          ["Loss per bounce μ",           mu ? `${(parseFloat(mu) * 1e4).toFixed(3)} × 10⁻⁴` : E_J >= VF_J ? "E ≥ V_F — no reflection" : "N/A"],
        ].map(([key, val]) => (
          <div key={key} style={S.resultRow}>
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: "#8892a4" }}>{key}</span>
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 14, fontWeight: 500, color: "#00c896" }}>{val}</span>
          </div>
        ))}
      </div>
      <div style={S.infoBox}>
        <strong style={{ color: "#e8eaf0" }}>Loss factor η</strong> is computed from Im(V)/Re(V) where Im(V) accounts for both absorption and incoherent scattering. The velocity-scaling v₀/v corrects absorption cross-sections from the tabulated 2200 m/s reference to UCN velocities (~5–8 m/s).
      </div>
    </div>
  );
}

function CompareTab() {
  const [selected, setSelected] = useState(new Set(["dlc", "ni58", "diamond", "ni", "cr"]));

  function toggle(id) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const rows = MAT.filter(m => selected.has(m.id)).sort((a, b) => b.Vf - a.Vf);

  return (
    <div>
      <div style={S.secLabel}>Select materials to compare</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "1rem" }}>
        {MAT.map(m => (
          <label key={m.id} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace", color: "#8892a4" }}>
            <input type="checkbox" checked={selected.has(m.id)} onChange={() => toggle(m.id)} style={{ accentColor: "#00c896" }} />
            {m.formula}
          </label>
        ))}
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={S.table}>
          <thead>
            <tr>
              {["Material", "V_F (neV)", "v_c (m/s)", "η (×10⁻⁴)", "N (×10²⁸)", "b_c (fm)", "Rating"].map(h => (
                <th key={h} style={S.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((m, i) => (
              <tr key={m.id} style={{ background: i === 0 && m.Vf > 0 ? "rgba(0,200,150,0.05)" : "transparent" }}>
                <td style={S.td}>{m.name}</td>
                <td style={{ ...S.td, color: i === 0 && m.Vf > 0 ? "#00c896" : "#e8eaf0" }}>{m.Vf}</td>
                <td style={S.td}>{m.vc ? m.vc.toFixed(2) : "—"}</td>
                <td style={S.td}>{m.eta ? m.eta.toFixed(1) : "—"}</td>
                <td style={S.td}>{m.N.toFixed(1)}</td>
                <td style={S.td}>{m.bc}</td>
                <td style={S.td}><span style={S.tag(m.tag)}>{tagLabel(m.tag)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ModelTab() {
  const items = [
    { ok: true,  text: <><strong>Included:</strong> Fermi potential V_F from coherent scattering length and number density. Critical velocity v_c. Loss factor η from absorption and incoherent scattering. Wall-collision loss per bounce μ. Roughness-induced diffuse scattering (first-order correction). Upscattering estimate at finite temperature.</> },
    { ok: false, text: <><strong>Not included: Surface roughness depth profile.</strong> Only RMS roughness σ is used. Power spectral density of roughness (relevant for DLC on Si) is ignored — this can under- or over-estimate diffuse losses by 2–5×.</> },
    { ok: false, text: <><strong>Not included: Gravitational potential.</strong> UCN are slow enough (~5–8 m/s) that gravitational PE (~102 neV/m) shifts the effective energy in vertical guides. A 1 m height change equals ~102 neV — comparable to the Fermi potential of some materials.</> },
    { ok: false, text: <><strong>Not included: Magnetic potential.</strong> UCN have a magnetic moment μ_n. In strong fields (e.g. TUCAN solenoid regions), the magnetic potential ±μ_n·B adds or subtracts from V_F. At 1 T this is ±60 neV.</> },
    { ok: false, text: <><strong>Not included: Multilayer / supermirror effects.</strong> Ti/Ni depth-graded supermirrors have an effective m-value beyond single-material v_c. The depth-graded Fresnel model is required — this tool treats all coatings as homogeneous single layers.</> },
    { ok: false, text: <><strong>Not included: Coating microstructure.</strong> DLC films can have sp2/sp3 ratio variation, hydrogen content, and internal stress. These affect real-world V_F in ways not captured by bulk b_c alone.</> },
    { ok: false, text: <><strong>Not included: Non-specular scattering angular distribution.</strong> Rough surfaces scatter UCN into a Lambertian-like distribution. This tool assumes isotropic wall-collision loss but does not track scattered flux redistribution inside the guide.</> },
    { ok: false, text: <><strong>Not included: Temperature-dependent V_F and η.</strong> Fomblin viscosity, DLC compressive stress, and phonon upscattering all vary with temperature. The temperature input applies a rough upscattering correction only.</> },
  ];

  return (
    <div>
      <div style={S.secLabel}>Model assumptions & known limitations</div>
      <div style={S.warnBox}>
        This tool uses the <strong style={{ color: "#e8eaf0" }}>optical potential (Fermi potential) approximation</strong> — a single-parameter mean-field model. It is standard and widely used, but incomplete. Below are the physics this tool does and does not capture.
      </div>
      <div style={{ margin: "1.25rem 0" }}>
        {items.map((item, i) => (
          <div key={i} style={{ ...S.assumItem, ...(i === items.length - 1 ? { borderBottom: "none" } : {}) }}>
            <span style={{ color: item.ok ? "#00c896" : "#f5a623", fontFamily: "'IBM Plex Mono',monospace", flexShrink: 0, marginTop: 1 }}>{item.ok ? "✓" : "✗"}</span>
            <span style={{ color: "#8892a4", fontSize: 13 }}>{item.text}</span>
          </div>
        ))}
      </div>
      <div style={S.infoBox}>
        <strong style={{ color: "#e8eaf0" }}>Key references:</strong> Golub & Pendlebury (1975) Rep. Prog. Phys. 38:255 — foundational UCN storage theory. Steyerl (1972) Z. Phys. — surface roughness loss model. Atchison et al. (2005) Phys. Rev. C — DLC coating characterisation for UCN guides. Serebrov et al. (2008) — Fomblin loss measurements.
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
const TABS = ["Materials", "Storage Lifetime", "Custom Calc", "Compare", "Model & Limits"];

export default function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [selIdx,    setSelIdx]    = useState(0);

  return (
    <div style={S.app}>
      <div style={S.header}>
        <div style={S.h1}>UCN Guide Material Analyzer</div>
        <div style={S.subhead}>// Fermi potential · storage lifetime · loss model · material comparison</div>
      </div>

      <div style={S.tabWrap}>
        {TABS.map((t, i) => (
          <button key={t} style={S.tab(i === activeTab)} onClick={() => setActiveTab(i)}>{t}</button>
        ))}
      </div>

      {activeTab === 0 && <MaterialsTab selIdx={selIdx} setSelIdx={setSelIdx} />}
      {activeTab === 1 && <LifetimeTab />}
      {activeTab === 2 && <CustomTab />}
      {activeTab === 3 && <CompareTab />}
      {activeTab === 4 && <ModelTab />}
    </div>
  );
}
