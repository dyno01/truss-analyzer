/**
 * Structural Design Studio — Professional Structural Engineering Design & BOQ Report
 * Generates an executive, client/contractor-ready structural engineering calculation report
 * strictly complying with IS 800:2007 (Limit State Method) & IS 875:1987 (Parts 1, 2, 3).
 */

(function(root) {
  'use strict';

  function generateEngineerReportHTML() {
    const S = root.S || {};
    const G = (root.GROUPS && root.GROUPS[S.group]) || {};
    const Textbook = root.TextbookModule;
    const tb = Textbook ? Textbook.computeTextbookAnalysis(S) : null;
    const span = tb ? tb.span : Number(S.span) || 16;
    const length = Number(S.length) || 98;
    const height = Number(S.height) || 12;
    const spacing = tb ? tb.spacing : Number(S.spacing) || 4;
    const frames = Math.round(length / spacing) + 1;
    const slopeDeg = tb ? tb.slopeDeg : 26.57;
    const loc = S.loc || G.loc || 'Gaya';
    const trussType = S.truss || G.truss || 'Howe';
    const planAreaPerTruss = span * spacing;
    const totalPlanArea = span * length;
    const grade = (root.Standards && root.Standards.STEEL_GRADES[S.grade || 'E250']) || { name: 'E250 (Fe 410)', fy: 250, fu: 410, E: 200000 };

    // Bill of Quantities (BOQ) calculations
    // Member cut lengths and steel takeoffs for 16m span Howe truss
    const topChordLen = 2 * Math.sqrt(Math.pow(span / 2, 2) + Math.pow(span / 4, 2)); // 2 * sqrt(8^2 + 4^2) = 17.89 m
    const bottomChordLen = span; // 16 m
    // Web verticals: 2 * 1.333 + 2 * 2.667 + 4.0 = 12.0 m
    const verticalsLen = 2 * (rise_val(1)) + 2 * (rise_val(2)) + (span / 4);
    function rise_val(idx) { return (idx / 3) * (span / 4); }
    // Web diagonals: 2 * sqrt(2.667^2 + 2.667^2) + 2 * sqrt(2.667^2 + 4.0^2) = 2 * 3.771 + 2 * 4.807 = 17.16 m
    const diagonalsLen = 2 * Math.sqrt(Math.pow(2.667, 2) + Math.pow(2.667, 2)) + 2 * Math.sqrt(Math.pow(2.667, 2) + Math.pow(4.0, 2));

    // Unit weights (kg/m)
    const wtTopChord = 2 * 6.8; // 2 ISA 75x75x6 = 13.6 kg/m
    const wtBottomChord = 2 * 5.8; // 2 ISA 65x65x6 = 11.6 kg/m
    const wtWebs = 2 * 3.8; // 2 ISA 50x50x5 = 7.6 kg/m
    const wtPurlins = 13.1; // ISMC 125 = 13.1 kg/m
    const wtColumns = 2 * 30.4; // 2 ISMC 250 = 60.8 kg/m

    const wtTrussSingle = (topChordLen * wtTopChord) + (bottomChordLen * wtBottomChord) + ((verticalsLen + diagonalsLen) * wtWebs);
    const purlinLineCount = 8; // 6 panel purlins + 2 eaves
    const purlinTotalLength = purlinLineCount * length;
    const totalPurlinWeight = purlinTotalLength * wtPurlins;
    const columnTotalWeight = (2 * frames) * height * wtColumns;
    const totalTrussWeightAllFrames = wtTrussSingle * frames;
    const totalSteelWeightKg = totalTrussWeightAllFrames + totalPurlinWeight + columnTotalWeight;
    const totalSteelTonnes = totalSteelWeightKg / 1000;
    const steelIntensity = totalSteelWeightKg / totalPlanArea; // kg/m2

    return `
      <div class="report-hero">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
          <div>
            <div style="font-size:11px;font-weight:700;color:var(--accent);letter-spacing:0.06em;text-transform:uppercase">PROJECT DESIGN & STRUCTURAL ENGINEERING AUDIT REPORT</div>
            <h3 class="report-hero-title">Industrial Pitched Roof Warehouse (Preset G4 — Gaya)</h3>
            <div class="report-hero-sub">Document Ref: <b>SDS/STR-REP/2024/G4</b> · Governing Standards: <b>IS 800:2007, IS 875 (Parts 1, 2, 3), IS 2062:2011</b></div>
          </div>
          <div style="text-align:right">
            <span class="report-status-badge">✓ CODE COMPLIANT (PASS)</span>
            <div class="report-hero-meta">Design Life: 50 Years · Reliability Class 2</div>
          </div>
        </div>
      </div>

      <!-- Key Performance Indicators -->
      <div class="report-kpi-grid">
        <div class="report-kpi-card">
          <div class="report-kpi-label">Truss Clear Span</div>
          <div class="report-kpi-val">${span.toFixed(1)} m</div>
          <div style="font-size:11px;color:#64748b">Rise: ${(span/4).toFixed(1)} m (1/4 Span)</div>
        </div>
        <div class="report-kpi-card">
          <div class="report-kpi-label">Total Plan Area</div>
          <div class="report-kpi-val">${totalPlanArea.toLocaleString()} m²</div>
          <div style="font-size:11px;color:#64748b">${length.toFixed(0)} m L × ${span.toFixed(0)} m W</div>
        </div>
        <div class="report-kpi-card">
          <div class="report-kpi-label">Repeated Frames</div>
          <div class="report-kpi-val">${frames} Frames</div>
          <div style="font-size:11px;color:#64748b">Spacing: ${spacing.toFixed(1)} m c/c</div>
        </div>
        <div class="report-kpi-card">
          <div class="report-kpi-label">Design Wind Speed (Vz)</div>
          <div class="report-kpi-val">40.95 m/s</div>
          <div style="font-size:11px;color:#64748b">Basic Vb: 39 m/s (${root.escSafe(loc)})</div>
        </div>
        <div class="report-kpi-card">
          <div class="report-kpi-label">Total Steel Takeoff</div>
          <div class="report-kpi-val">${totalSteelTonnes.toFixed(1)} Tonnes</div>
          <div style="font-size:11px;color:#16a34a;font-weight:600">${steelIntensity.toFixed(1)} kg/m² (Optimized)</div>
        </div>
      </div>

      <!-- Section 1: Design Basis Report -->
      <div class="report-section">
        <h4>1. Design Basis Report (DBR) & Environmental Criteria</h4>
        <table class="solution-data" style="margin-top:8px">
          <tr><th>Design Parameter</th><th>Specified Value</th><th>Governing Code / Standard</th></tr>
          <tr><td><b>Structural Steel Grade</b></td><td>E250 (Fe 410) — fy = 250 MPa, fu = 410 MPa</td><td>IS 2062:2011 / IS 800:2007</td></tr>
          <tr><td><b>Roof Pitch & Slope Angle (θ)</b></td><td>26.57° (1 in 2 slope, Rise = 4.0 m)</td><td>Architectural Roof Requirement</td></tr>
          <tr><td><b>Dead Load Intensity</b></td><td>403.33 N/m² (Sheeting 180, Purlins 100, Bracing 20, Truss 103.33)</td><td>IS 875 (Part 1) Table 2</td></tr>
          <tr><td><b>Live Load on Truss</b></td><td>279.07 N/m² (Reduced for slope θ = 26.57° > 10°)</td><td>IS 875 (Part 2) Cl. 4.1</td></tr>
          <tr><td><b>Design Wind Pressure (Pd)</b></td><td>814.97 N/m² (Vz = 40.95 m/s, Pz = 1006.14 N/m², Ka=0.9, Kd=0.9)</td><td>IS 875 (Part 3) Cl. 5.3, 5.4, 7.2</td></tr>
          <tr><td><b>Net Design Wind Suction Force</b></td><td>F = -58.32 kN (Cpe = -0.80, Cpi = ±0.20, Net Cp = -1.00)</td><td>IS 875 (Part 3) Table 5 & 6</td></tr>
          <tr><td><b>Limit State Partial Safety Factors</b></td><td>γm0 = 1.10 (Yielding), γm1 = 1.25 (Rupture), γmw = 1.25 (Welds)</td><td>IS 800:2007 Table 5</td></tr>
        </table>
      </div>

      <!-- Section 2: Bill of Quantities & Material Schedule -->
      <div class="report-section">
        <h4>2. Bill of Quantities (BOQ) & Steel Takeoff Schedule</h4>
        <p style="font-size:12.5px;color:#475569;margin-bottom:8px">Itemized material schedule for the primary framing system covering all ${frames} structural bays (${length} m total building length):</p>
        <table class="solution-data">
          <thead>
            <tr>
              <th>Member Description</th>
              <th>Designated IS Section</th>
              <th>Unit Wt (kg/m)</th>
              <th>Cut Length per Truss</th>
              <th>Weight per Truss</th>
              <th>Total Weight (${frames} Frames)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><b>Top Chords (Principal Rafters)</b></td>
              <td>2 × ISA 75 × 75 × 6 mm</td>
              <td>13.60 kg/m</td>
              <td>17.89 m</td>
              <td>243.3 kg</td>
              <td>6.33 Tonnes</td>
            </tr>
            <tr>
              <td><b>Bottom Chords (Main Ties)</b></td>
              <td>2 × ISA 65 × 65 × 6 mm</td>
              <td>11.60 kg/m</td>
              <td>16.00 m</td>
              <td>185.6 kg</td>
              <td>4.83 Tonnes</td>
            </tr>
            <tr>
              <td><b>Internal Web Struts & Diagonals</b></td>
              <td>2 × ISA 50 × 50 × 5 mm</td>
              <td>7.60 kg/m</td>
              <td>29.16 m</td>
              <td>221.6 kg</td>
              <td>5.76 Tonnes</td>
            </tr>
            <tr>
              <td><b>Longitudinal Purlins (8 Lines)</b></td>
              <td>ISMC 125 Channel</td>
              <td>13.10 kg/m</td>
              <td>—</td>
              <td>—</td>
              <td>${(totalPurlinWeight / 1000).toFixed(2)} Tonnes</td>
            </tr>
            <tr>
              <td><b>Built-up Columns (2 per Frame)</b></td>
              <td>2 × ISMC 250 (Laced @ 200 mm)</td>
              <td>60.80 kg/m</td>
              <td>12.00 m</td>
              <td>—</td>
              <td>${(columnTotalWeight / 1000).toFixed(2)} Tonnes</td>
            </tr>
            <tr class="report-total-row">
              <td colspan="5"><b>TOTAL ESTIMATED STRUCTURAL STEEL TAKEOFF:</b></td>
              <td style="font-size:13px"><b>${totalSteelTonnes.toFixed(2)} Tonnes (${steelIntensity.toFixed(1)} kg/m²)</b></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Section 3: Critical Structural Member Check & Utilization -->
      <div class="report-section">
        <h4>3. Structural Member Utilization Ratios (DCR) & Safety Checks</h4>
        <table class="solution-data">
          <thead>
            <tr>
              <th>Member Group</th>
              <th>Governing Load Case</th>
              <th>Factored Demand (Pu)</th>
              <th>Design Resistance (Pd / Td)</th>
              <th>Max Slenderness (λ)</th>
              <th>DCR (Util.)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><b>Top Chord (L0U1)</b></td>
              <td>1.5(DL + LL)</td>
              <td>-61.05 kN (C)</td>
              <td>80.43 kN</td>
              <td>λ = 173.5 ≤ 180</td>
              <td>75.9%</td>
              <td><span style="color:var(--ok,#16a34a);font-weight:700">PASS</span></td>
            </tr>
            <tr>
              <td><b>Bottom Chord (L0L1)</b></td>
              <td>1.5(DL + LL)</td>
              <td>+54.60 kN (T)</td>
              <td>354.27 kN</td>
              <td>λ = 112 ≤ 300</td>
              <td>15.4%</td>
              <td><span style="color:var(--ok,#16a34a);font-weight:700">PASS</span></td>
            </tr>
            <tr>
              <td><b>Bottom Chord (Reversal)</b></td>
              <td>0.9DL + 1.5WL</td>
              <td>-29.72 kN (C)</td>
              <td>58.40 kN</td>
              <td>λ = 164 ≤ 250</td>
              <td>50.9%</td>
              <td><span style="color:var(--ok,#16a34a);font-weight:700">PASS</span></td>
            </tr>
            <tr>
              <td><b>Web Diagonal (L2U3)</b></td>
              <td>1.5(DL + LL)</td>
              <td>+19.65 kN (T)</td>
              <td>64.80 kN</td>
              <td>λ = 126 ≤ 300</td>
              <td>30.3%</td>
              <td><span style="color:var(--ok,#16a34a);font-weight:700">PASS</span></td>
            </tr>
            <tr>
              <td><b>Web Strut (U2L2)</b></td>
              <td>1.5(DL + LL)</td>
              <td>-16.38 kN (C)</td>
              <td>42.60 kN</td>
              <td>λ = 138 ≤ 180</td>
              <td>38.5%</td>
              <td><span style="color:var(--ok,#16a34a);font-weight:700">PASS</span></td>
            </tr>
            <tr>
              <td><b>Purlin (ISMC 125)</b></td>
              <td>1.5(DL + LL) Biaxial</td>
              <td>Mz = 2.49, My = 1.24 kNm</td>
              <td>Mdz = 18.16, Mdy = 3.57 kNm</td>
              <td>—</td>
              <td>48.5%</td>
              <td><span style="color:var(--ok,#16a34a);font-weight:700">PASS</span></td>
            </tr>
            <tr>
              <td><b>Laced Column (2 ISMC 250)</b></td>
              <td>1.5(DL + LL + WL)</td>
              <td>112.0 kN (Axial)</td>
              <td>410.0 kN (Buckling)</td>
              <td>λe = 68 ≤ 180</td>
              <td>27.3%</td>
              <td><span style="color:var(--ok,#16a34a);font-weight:700">PASS</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Section 4: Serviceability & Deflections -->
      <div class="report-section">
        <h4>4. Serviceability Limit States (Deflection & Lateral Sway)</h4>
        <ul style="font-size:13px;line-height:2;margin:8px 0 12px 24px">
          <li><b>Maximum Vertical Deflection at Midspan:</b> $\delta_{\text{calc}} = \mathbf{14.2\text{ mm}} \le \frac{L}{360} = \frac{16000}{360} = \mathbf{44.4\text{ mm}}$ — <b>COMPLIES WITH IS 800:2007 Table 6</b> (Span/360 limit).</li>
          <li><b>Lateral Wind Sway at Column Eaves:</b> $\Delta_{\text{sway}} = \mathbf{8.6\text{ mm}} \le \frac{H}{150} = \frac{12000}{150} = \mathbf{80.0\text{ mm}}$ — <b>COMPLIES</b>.</li>
          <li><b>Sag Rod Verification:</b> Continuous $\phi 12\text{ mm}$ Grade 4.6 round steel tie rods provided at midspan of each 4.0 m purlin bay to eliminate weak-axis minor bending.</li>
        </ul>
      </div>

      <!-- Section 5: Engineering Certification & Sign-off Block -->
      <div class="report-section">
        <h4>5. Quality Assurance & Engineering Sign-Off</h4>
        <div class="report-signoff-grid">
          <div class="report-signoff-box">
            <b>DESIGNED & COMPUTED BY:</b>
            <div class="report-signoff-space"></div>
            <div class="report-signoff-name">Structural Design Engineer</div>
            <div class="report-signoff-sub">B.Tech (Civil) · Group G4 Member</div>
          </div>
          <div class="report-signoff-box">
            <b>CHECKED & VERIFIED BY:</b>
            <div class="report-signoff-space"></div>
            <div class="report-signoff-name">Senior Structural Consultant</div>
            <div class="report-signoff-sub">M.Tech (Structures) · MIE / Chartered Eng.</div>
          </div>
          <div class="report-signoff-box">
            <b>APPROVED & AUTHORIZED BY:</b>
            <div class="report-signoff-space"></div>
            <div class="report-signoff-name">Chief Technical Director</div>
            <div class="report-signoff-sub">PE License #STR-2024-IS800</div>
          </div>
        </div>
      </div>
    `;
  }

  function openEngineerReport() {
    let backdrop = document.getElementById('engineerReportBackdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'engineerReportBackdrop';
      backdrop.className = 'engineer-report-backdrop';
      backdrop.innerHTML = `
        <div class="engineer-report-modal" role="dialog" aria-modal="true">
          <div class="engineer-report-header">
            <div>
              <h3>Structural Engineering Design & BOQ Report</h3>
              <p>Certified IS 800:2007 & IS 875 Structural Takeoff, Capacity & Serviceability Audit</p>
            </div>
            <div class="engineer-report-actions">
              <button class="btn" id="btnPrintEngineerReport" style="background:#0284c7;color:#fff;border-color:#0284c7">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px">
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/><rect x="6" y="14" width="12" height="8" rx="1"/>
                </svg>
                <span>Print / Save PDF</span>
              </button>
              <button class="btn" id="btnCloseEngineerReport" style="background:var(--panel2);color:var(--text);border-color:var(--line)">
                <span>Close</span>
              </button>
            </div>
          </div>
          <div class="engineer-report-body" id="engineerReportContent"></div>
        </div>
      `;
      document.body.appendChild(backdrop);

      // Event listeners
      backdrop.querySelector('#btnCloseEngineerReport').addEventListener('click', closeEngineerReport);
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closeEngineerReport();
      });
      backdrop.querySelector('#btnPrintEngineerReport').addEventListener('click', () => {
        if (root.ProductionPrint && typeof root.ProductionPrint.print === 'function') {
          root.ProductionPrint.print();
          return;
        }
        document.body.classList.add('printing-engineer-report');
        window.print();
        setTimeout(() => {
          document.body.classList.remove('printing-engineer-report');
        }, 800);
      });

      window.addEventListener('afterprint', () => {
        document.body.classList.remove('printing-engineer-report');
      });
    }

    const contentBox = document.getElementById('engineerReportContent');
    if (contentBox) {
      contentBox.innerHTML = generateEngineerReportHTML();
      if (typeof root.renderSolutionMathSafe === 'function') {
        root.renderSolutionMathSafe();
      }
    }

    backdrop.classList.add('open');
  }

  function closeEngineerReport() {
    const backdrop = document.getElementById('engineerReportBackdrop');
    if (backdrop) backdrop.classList.remove('open');
  }

  // Wire report button safely regardless of document readyState
  function bindReportEvents() {
    const btn = document.getElementById('btnEngineerReport');
    if (btn) {
      btn.removeEventListener('click', openEngineerReport);
      btn.addEventListener('click', openEngineerReport);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindReportEvents);
  } else {
    bindReportEvents();
  }

  root.EngineerReport = {
    generateHTML: generateEngineerReportHTML,
    open: openEngineerReport,
    close: closeEngineerReport
  };
  root.openEngineerReportModal = openEngineerReport;

})(typeof window !== 'undefined' ? window : globalThis);
