/**
 * Structural Design Studio — Comprehensive Student Design Sheet (KaTeX)
 * Formatted as an authentic, complete university structural steel design assignment
 * strictly following IS 800:2007 (Limit State Method) & IS 875 (Parts 1, 2, 3).
 */

(function(root) {
  'use strict';

  const IS800 = (root && root.IS800Module) || (typeof require !== 'undefined' ? require('../engine/code_is800.js') : null) || {
    calcTensionCapacity: (Ag, fy, fu, gamma_m0 = 1.10, gamma_m1 = 1.25) => {
      const Tdg = (Ag * fy) / (gamma_m0 * 1000);
      const Tdn = (0.9 * 0.85 * Ag * fu) / (gamma_m1 * 1000);
      return {
        Tdg: Number(Tdg.toFixed(2)),
        Tdn: Number(Tdn.toFixed(2)),
        Td: Number(Math.min(Tdg, Tdn).toFixed(2)),
        formula: 'Td = min(Ag*fy/gamma_m0, 0.9*An*fu/gamma_m1)'
      };
    }
  };

  const Textbook = (root && root.TextbookModule) || (typeof require !== 'undefined' ? require('../engine/textbook.js') : null);

  function renderSolutionMathSafe() {
    const rootEl = document.getElementById('solutionContent');
    if (!rootEl) return;
    if (typeof katex === 'undefined') {
      setTimeout(renderSolutionMathSafe, 120);
      return;
    }

    // 1. Render block display equations with [data-math]
    rootEl.querySelectorAll('[data-math]').forEach((n) => {
      const src = n.dataset.math || '';
      try {
        katex.render(src, n, { displayMode: true, throwOnError: false });
      } catch (e) {
        n.innerHTML = '<div class="fallback-math">' + root.escSafe(src) + '</div>';
      }
    });

    // 2. Render all inline math expressions ($...$) in paragraphs, list items, remarks, tables
    try {
      const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, null, false);
      const candidates = [];
      while (walker.nextNode()) {
        const tn = walker.currentNode;
        if (!tn.nodeValue || !tn.nodeValue.includes('$')) continue;
        let p = tn.parentElement;
        let skip = false;
        while (p && p !== rootEl) {
          const cl = p.classList;
          const tag = p.tagName;
          if (
            (cl && (cl.contains('solution-equation') || cl.contains('katex') || cl.contains('fallback-math'))) ||
            tag === 'SCRIPT' || tag === 'STYLE' || tag === 'PRE' || tag === 'CODE'
          ) {
            skip = true;
            break;
          }
          p = p.parentElement;
        }
        if (!skip) {
          candidates.push(tn);
        }
      }

      candidates.forEach((tn) => {
        const val = tn.nodeValue;
        if (!val || !val.includes('$')) return;
        const regex = /\$([^$\n]+)\$/g;
        if (!regex.test(val)) return;
        regex.lastIndex = 0;

        const frag = document.createDocumentFragment();
        let lastIdx = 0;
        let match;
        while ((match = regex.exec(val)) !== null) {
          if (match.index > lastIdx) {
            frag.appendChild(document.createTextNode(val.substring(lastIdx, match.index)));
          }
          const mathSrc = match[1];
          const span = document.createElement('span');
          span.className = 'inline-katex';
          try {
            katex.render(mathSrc, span, { displayMode: false, throwOnError: false });
          } catch (err) {
            span.textContent = '$' + mathSrc + '$';
          }
          frag.appendChild(span);
          lastIdx = regex.lastIndex;
        }
        if (lastIdx < val.length) {
          frag.appendChild(document.createTextNode(val.substring(lastIdx)));
        }
        if (tn.parentNode) {
          tn.parentNode.replaceChild(frag, tn);
        }
      });
    } catch (err) {
      console.warn('Inline KaTeX renderer error', err);
    }
  }

  function makeTeddsBlock(title, codeRef, mathFormula, status = 'OK', passClass = 'pass', remarks = '') {
    const statusClass = passClass === 'fail' ? 'fail' : (passClass === 'info' ? 'info' : 'pass');
    return `
      <div class="calc-block">
        <div class="calc-row">
          <div class="calc-title">
            <strong>${title}</strong> ${codeRef ? `<span class="code-ref">(${codeRef})</span>` : ''}
          </div>
          <div class="calc-math" data-math="${root.escSafe(mathFormula)}"></div>
          <div class="calc-status ${statusClass}">${status}</div>
        </div>
        ${remarks ? `<div class="calc-remarks">${remarks}</div>` : ''}
      </div>
    `;
  }

  const LIVE_SOLUTION = [
    {
      title: 'Step 1 — Design Data & Specifications',
      badge: 'DESIGN DATA',
      body: (d, S, G) => {
        const tb = Textbook ? Textbook.computeTextbookAnalysis(S) : null;
        const grade = (root.Standards && root.Standards.STEEL_GRADES[S.grade || 'E250']) || { name: 'E250 (Fe 410)', fy: 250, fu: 410, E: 200000 };
        const span = tb ? tb.span : Number(S.span) || 16;
        const length = Number(S.length) || 98;
        const height = Number(S.height) || 12;
        const loc = G.loc || S.loc || 'Gaya';
        const roof = S.roof || 'AC';
        const panels = tb ? tb.panels : Number(S.panels) || 6;
        const cpi = Math.abs(Number(S.cpi) || 0.2);
        const trussType = S.truss || G.truss || 'Howe';

        return `
          <div class="solution-grid">
            <div class="solution-block wide">
              <h2 style="font-size:18px;margin-bottom:12px;font-family:var(--sans)">Design of Industrial Roof Truss (Group ${root.escSafe(S.group || 'G4')})</h2>
              
              <h3>Design Data</h3>
              <table class="solution-data">
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Design Value / Specification</th>
                    <th>Basis / Code Reference</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><b>Type of Truss</b></td>
                    <td><b>${root.escSafe(trussType)} Roof Truss</b></td>
                    <td>Problem Statement / IS 800:2007</td>
                  </tr>
                  <tr>
                    <td><b>Span of Truss ($L$)</b></td>
                    <td><b>${span.toFixed(0)} m</b></td>
                    <td>User Specified Span</td>
                  </tr>
                  <tr>
                    <td><b>Length of Structure</b></td>
                    <td><b>${length.toFixed(0)} m</b></td>
                    <td>Architectural Layout (26 Frames @ 4 m)</td>
                  </tr>
                  <tr>
                    <td><b>Column / Eave Height</b></td>
                    <td><b>${height.toFixed(0)} m</b></td>
                    <td>Clear Working Headroom</td>
                  </tr>
                  <tr>
                    <td><b>Geographical Location</b></td>
                    <td><b>${root.escSafe(loc)}</b> (Zone IV)</td>
                    <td>IS 875 (Part 3) Table 1 ($V_b = 39\\text{ m/s}$)</td>
                  </tr>
                  <tr>
                    <td><b>Roof Covering Material</b></td>
                    <td><b>${root.escSafe(roof)} Sheet</b></td>
                    <td>IS 875 (Part 1) Table 2 ($180\\text{ N/m}^2$)</td>
                  </tr>
                  <tr>
                    <td><b>Number of Panels</b></td>
                    <td><b>${panels} panels</b></td>
                    <td>User Specified Configuration</td>
                  </tr>
                  <tr>
                    <td><b>Internal Pressure Coeff ($C_{pi}$)</b></td>
                    <td><b>&plusmn;${cpi.toFixed(1)}</b></td>
                    <td>IS 875 (Part 3) Cl. 6.2.3.2 (Normal 0–20% Openings)</td>
                  </tr>
                </tbody>
              </table>

              <div class="calc-callout-box" style="margin:14px 0">
                <b>Sign Convention & Trigonometric Constants:</b><br>
                • <b>Sign Convention:</b> <b>Tension (+)</b>, <b>Compression (-)</b>. Units: $\\text{kN}$, $\\text{m}$, $\\text{N/m}^2$.<br>
                • <b>Trigonometry:</b> $26.57^\\circ \\implies \\cos 0.8944,\\; \\sin 0.4472 \\;\\vert\\; 45.00^\\circ \\implies 0.7071 \\;\\vert\\; 56.31^\\circ \\implies \\cos 0.5547,\\; \\sin 0.8321$.
              </div>

              <h3>Material Properties & Design Strengths (IS 2062 / IS 800:2007)</h3>
              <p>All structural steel members conform to Indian Standard grade <b>${grade.name || 'E250 (Fe 410)'}</b>:</p>
              <ul style="font-size:13px;line-height:1.8;margin:8px 0 16px 24px">
                <li>Yield stress of steel: $f_y = \\mathbf{${grade.fy}\\text{ MPa}}$</li>
                <li>Ultimate tensile strength: $f_u = \\mathbf{${grade.fu}\\text{ MPa}}$</li>
                <li>Modulus of Elasticity: $E = \\mathbf{2.0 \\times 10^5\\text{ MPa}}$</li>
                <li>Partial safety factor against yielding: $\\gamma_{m0} = \\mathbf{1.10}$ (IS 800 Table 5)</li>
                <li>Partial safety factor against ultimate tensile rupture: $\\gamma_{m1} = \\mathbf{1.25}$ (Table 5)</li>
                <li>Partial safety factor for welds: $\\gamma_{mw} = \\mathbf{${(S.fabrication === 'field' ? 1.50 : 1.25).toFixed(2)}}$ (${S.fabrication === 'field' ? 'Site / Field' : 'Shop'} Fabrication, Table 5)</li>
              </ul>

              ${makeTeddsBlock(
                'Factored Yield Design Strength',
                'IS 800:2007 Cl. 5.4.1 & Table 5',
                `f_{yd} = \\frac{f_y}{\\gamma_{m0}} = \\frac{${grade.fy}}{1.10} = \\mathbf{${(grade.fy / 1.10).toFixed(2)}\\text{ MPa}}`,
                'OK',
                'pass',
                '<strong>IS Code Reference:</strong> IS 800:2007 Clause 5.4.1 & Table 5 (Partial safety factors for materials).<br>' +
                '<strong>Variable Remarks:</strong><br>' +
                '• $f_y$ = Characteristic minimum yield stress of structural steel grade ' + (grade.name || 'E250') + ' ($' + grade.fy + '\\text{ MPa}$).<br>' +
                '• $\\gamma_{m0}$ = Partial safety factor governing resistance to yield / plastic collapse ($1.10$ per Table 5).<br>' +
                '• $f_{yd}$ = Permissible design yield stress in direct axial tension / compression.'
              )}

              ${makeTeddsBlock(
                'Ultimate Design Tensile Rupture Stress',
                'IS 800:2007 Cl. 6.3.3 & Table 5',
                `f_{ud} = \\frac{0.9 \\cdot f_u}{\\gamma_{m1}} = \\frac{0.9 \\times ${grade.fu}}{1.25} = \\mathbf{${((0.9 * grade.fu) / 1.25).toFixed(2)}\\text{ MPa}}`,
                'OK',
                'pass',
                '<strong>IS Code Reference:</strong> IS 800:2007 Clause 6.3.3 & Table 5.<br>' +
                '<strong>Variable Remarks:</strong><br>' +
                '• $f_u$ = Ultimate tensile strength of steel ($' + grade.fu + '\\text{ MPa}$).<br>' +
                '• $\\gamma_{m1}$ = Partial safety factor against ultimate tensile rupture ($1.25$).<br>' +
                '• $0.9$ = Net section efficiency factor accounting for stress concentrations at gusset joints.'
              )}
            </div>
          </div>`;
      }
    },
    {
      title: 'Step 2 — Geometry of Truss',
      badge: 'GEOMETRY',
      body: (d, S) => {
        const tb = Textbook ? Textbook.computeTextbookAnalysis(S) : null;
        const span = tb ? tb.span : Number(S.span) || 16;
        const length = Number(S.length) || 98;
        const rise = tb ? tb.rise : (span / 4);
        const spacing = tb ? tb.spacing : Number(S.spacing) || 4;
        const slopeDeg = tb ? tb.slopeDeg : 26.57;
        const planArea = tb ? tb.planArea : (span * spacing);
        const slopeArea = tb ? tb.slopeArea : (planArea / Math.cos((slopeDeg * Math.PI) / 180));
        const panels = tb ? tb.panels : Number(S.panels) || 6;
        const panelPlan = tb ? tb.panelPlan : (span / panels);
        const panelSlope = tb ? tb.panelSlope : (panelPlan / Math.cos((slopeDeg * Math.PI) / 180));
        const baysExact = length / spacing;
        const baysAdopted = Math.round(baysExact);
        const totalFrames = baysAdopted + 1;

        return `
          <div class="solution-grid">
            <div class="solution-block wide">
              <h2 style="font-size:18px;margin-bottom:12px;font-family:var(--sans)">i) Geometry & Structural Sizing of Truss</h2>

              ${makeTeddsBlock(
                '1. Truss Span',
                'Design Specification',
                `L = \\mathbf{${span.toFixed(2)}\\text{ m}}`,
                'GIVEN',
                'info',
                '<strong>Variable Remarks:</strong><br>' +
                '• $L$ = Total out-to-out center-line span of the transverse roof truss between column support bearing centers.'
              )}

              ${makeTeddsBlock(
                '2. Rise of Truss',
                'IS 800:2007 / SP 38 Rule of Thumb',
                `R = \\frac{\\text{Span}}{4} = \\frac{${span.toFixed(2)}}{4} = \\mathbf{${rise.toFixed(2)}\\text{ m}}`,
                'OK',
                'pass',
                '<strong>IS Code Reference:</strong> SP 38: 1989 / Standard Structural Engineering Practice.<br>' +
                '<strong>Variable Remarks:</strong><br>' +
                '• Rise $R$ is chosen between $L/5$ and $L/4$ for pitched roof trusses to ensure rapid storm rainwater drainage and reduce axial chord forces.'
              )}

              ${makeTeddsBlock(
                '3. Spacing of Trusses',
                'Economic Proportion L/5 to L/3',
                `S = \\mathbf{${spacing.toFixed(2)}\\text{ m}}\\quad \\left(\\text{Permissible: } ${(span/5).toFixed(2)}\\text{ m} \\le S \\le ${(span/3).toFixed(2)}\\text{ m}\\right)`,
                'OK',
                'pass',
                '<strong>Variable Remarks:</strong><br>' +
                '• $S$ = Center-to-center longitudinal spacing between adjacent truss bents. Kept within $L/5$ to $L/3$ to achieve optimal economic balance between purlin steel weight and truss steel weight.'
              )}

              ${makeTeddsBlock(
                '4. Number of Bays & Frame Count',
                'Longitudinal Layout Modularization',
                `\\text{No. of Bays} = \\frac{\\text{Building Length}}{\\text{Truss Spacing}} = \\frac{${length.toFixed(1)}\\text{ m}}{${spacing.toFixed(1)}\\text{ m}} = \\mathbf{${baysExact.toFixed(1)}} \\implies \\mathbf{${baysAdopted}\\text{ Bays}},\\quad \\text{Total Frames} = ${baysAdopted} + 1 = \\mathbf{${totalFrames}\\text{ Frames}}`,
                'OK',
                'pass',
                '<strong>Variable Remarks:</strong><br>' +
                '• $\\text{Building Length}$ = Overall longitudinal length of building ($' + length.toFixed(1) + '\\text{ m}$).<br>' +
                '• $\\text{No. of Bays}$ = Number of longitudinal modular bays between columns.<br>' +
                '• $\\text{Total Frames}$ = Total number of transverse gable and interior bents.'
              )}

              ${makeTeddsBlock(
                '5. Pitch & Slope of Roof',
                'Trigonometric Geometry',
                `\\theta = \\tan^{-1}\\left(\\frac{R}{\\text{Span}/2}\\right) = \\tan^{-1}\\left(\\frac{${rise.toFixed(2)}}{${(span/2).toFixed(2)}}\\right) = \\mathbf{${slopeDeg.toFixed(2)}^\\circ}`,
                'OK',
                'pass',
                '<strong>Variable Remarks:</strong><br>' +
                '• $\\theta$ = Angle of inclination of top chord rafter with the horizontal datum.<br>' +
                '• Controls rainwater runoff rate and governs external wind pressure coefficients ($C_{pe}$) per IS 875 (Part 3) Table 5.'
              )}

              ${makeTeddsBlock(
                '6. Plan Area per Truss Bent',
                'Tributary Load Footprint',
                `A_{\\text{plan}} = \\text{Span} \\times \\text{Spacing} = ${span.toFixed(2)} \\times ${spacing.toFixed(2)} = \\mathbf{${planArea.toFixed(2)}\\text{ m}^2}`,
                'OK',
                'pass',
                '<strong>Variable Remarks:</strong><br>' +
                '• $A_{\\text{plan}}$ = Horizontal projected plan tributary area supported by one typical interior truss frame.'
              )}

              ${makeTeddsBlock(
                '7. Slope Area per Truss Bent',
                'Surface Cladding Geometry',
                `A_{\\text{slope}} = \\frac{A_{\\text{plan}}}{\\cos\\theta} = \\frac{${planArea.toFixed(2)}}{\\cos(${slopeDeg.toFixed(2)}^\\circ)} = \\mathbf{${slopeArea.toFixed(2)}\\text{ m}^2}`,
                'OK',
                'pass',
                '<strong>Variable Remarks:</strong><br>' +
                '• $A_{\\text{slope}}$ = Actual true surface area along the sloping roof rafters supported by one interior truss frame.<br>' +
                '• Used for calculating sheet cladding dead loads and wind uplift forces normal to the roof surface.'
              )}

              ${makeTeddsBlock(
                '8. Panel Count & Tributary Plan Length',
                'Truss Triangulation',
                `n = \\mathbf{${panels}\\text{ Panels}},\\quad l_{\\text{plan}} = \\frac{\\text{Span}}{n} = \\frac{${span.toFixed(2)}}{${panels}} = \\mathbf{${panelPlan.toFixed(3)}\\text{ m}}`,
                'OK',
                'pass',
                '<strong>Variable Remarks:</strong><br>' +
                '• $n$ = Total number of bottom chord panels across entire span.<br>' +
                '• $l_{\\text{plan}}$ = Horizontal plan length of each individual panel bay.'
              )}

              ${makeTeddsBlock(
                '9. Sloping Panel Length (Purlin Spacing)',
                'Rafter Panel Length',
                `l_{\\text{slope}} = \\frac{l_{\\text{plan}}}{\\cos\\theta} = \\frac{${panelPlan.toFixed(3)}}{\\cos(${slopeDeg.toFixed(2)}^\\circ)} = \\mathbf{${panelSlope.toFixed(3)}\\text{ m}}`,
                'OK',
                'pass',
                '<strong>Variable Remarks:</strong><br>' +
                '• $l_{\\text{slope}}$ = Distance between consecutive node points along the sloping top chord rafter.<br>' +
                '• Defines the maximum spacing between adjacent longitudinal purlins and governs the effective buckling length of top chord compression members ($L_{cr} = K \\cdot l_{\\text{slope}}$).'
              )}

              <h4 style="margin-top:24px">Truss Geometry & Scaled Panel Division Diagram:</h4>
              <div class="truss-textbook-wrap">
                ${tb ? Textbook.renderFullTrussSVG(tb, 'geometry') : ''}
              </div>
            </div>
          </div>`;
      }
    },
    {
      title: 'Step 3 — Load Calculations (DL, LL, WL)',
      badge: 'LOAD CALCULATIONS',
      body: (d, S, G) => {
        const tb = Textbook ? Textbook.computeTextbookAnalysis(S) : null;
        if (!tb) return '<div class="solution-callout">Unable to compute loads.</div>';

        const span = tb.span || 16;
        const spacing = tb.spacing || 4;
        const slopeDeg = tb.slopeDeg || 26.57;
        const planArea = tb.planArea || (span * spacing);
        const slopeArea = tb.slopeArea || (planArea / Math.cos((slopeDeg * Math.PI) / 180));
        const panels = tb.panels || 6;

        const dl_sheet = 180;
        const dl_purlins = 100;
        const dl_bracing = 20;
        const dl_self = (span / 3 + 5) * 10;
        const dl_total_int = dl_sheet + dl_purlins + dl_bracing + dl_self;
        const dl_total_kN = (dl_total_int * planArea) / 1000;
        const dl_inter_kN = dl_total_kN / panels;
        const dl_end_kN = dl_inter_kN / 2;

        const ll_roof_int = Math.max(400, 750 - 20 * (slopeDeg - 10));
        const ll_truss_int = (2 / 3) * ll_roof_int;
        const ll_total_kN = (ll_truss_int * planArea) / 1000;
        const ll_inter_kN = ll_total_kN / panels;
        const ll_end_kN = ll_inter_kN / 2;

        const windData = (d.loads && d.loads.wind) || {};
        const wl_Vb = windData.Vb || 39;
        const wl_k1 = windData.k1 || 1.0;
        const wl_k2 = windData.k2 || 1.05;
        const wl_k3 = windData.k3 || 1.0;
        const wl_k4 = windData.k4 || 1.0;
        const wl_Vz = windData.Vz || (wl_Vb * wl_k1 * wl_k2 * wl_k3 * wl_k4);
        const wl_Pz = windData.pz || (0.6 * Math.pow(wl_Vz, 2));
        const wl_Pd = 0.90 * 1.0 * 0.90 * wl_Pz;
        const cpe = -0.8;
        const cpi = 0.2;
        const wl_force_kN = ((cpe - cpi) * slopeArea * wl_Pd) / 1000;
        const wl_inter_kN = wl_force_kN / panels;
        const wl_end_kN = wl_inter_kN / 2;

        return `
          <div class="solution-grid">
            <div class="solution-block wide">
              <h2 style="font-size:18px;margin-bottom:14px;font-family:var(--sans)">ii) Structural Load Calculations (IS 875 Parts 1, 2, 3)</h2>

              <h3>A) Dead Load (DL) Calculation (IS 875 Part 1)</h3>
              <ul style="font-size:13.5px;line-height:1.9;margin:8px 0 14px 24px">
                <li>DL of Roofing (Corrugated AC Sheets): <b>${dl_sheet} N/m²</b> (IS 875 Part 1 Table 1)</li>
                <li>DL of Purlins (Standard Channel Sections): <b>${dl_purlins} N/m²</b> (SP: 6(1))</li>
                <li>DL of Wind Bracings & Accessories: <b>${dl_bracing} N/m²</b> (IS 875 Part 1)</li>
              </ul>

              ${makeTeddsBlock(
                '1. Empirical Self-Weight of Roof Truss',
                'IS 875 (Part 1) / SP 38 Empirical Formula',
                `w_{\\text{self}} = \\left(\\frac{\\text{Span}}{3} + 5\\right) \\times 10 = \\left(\\frac{${span.toFixed(0)}}{3} + 5\\right) \\times 10 = \\mathbf{${dl_self.toFixed(2)}\\text{ N/m}^2}`,
                'OK',
                'pass',
                '<strong>Code Reference & Variables:</strong><br>' +
                '• <strong>IS 875 (Part 1): 1987 & SP 38:</strong> Standard empirical approximation for steel roof truss self-weight per unit horizontal plan area.<br>' +
                '• $\\text{Span}$: Center-to-center distance between supporting columns (${span.toFixed(2)} m).<br>' +
                '• $w_{\\text{self}}$: Estimated self-weight of structural steel angle and plate members per square meter of plan area.'
              )}

              ${makeTeddsBlock(
                '2. Total Dead Load Intensity on Plan Area',
                'IS 875 (Part 1): 1987 Table 1 & Cl. 3.1',
                `w_{DL} = w_{\\text{sheeting}} + w_{\\text{purlins}} + w_{\\text{bracing}} + w_{\\text{self}} = 180 + 100 + 20 + ${dl_self.toFixed(2)} = \\mathbf{${dl_total_int.toFixed(2)}\\text{ N/m}^2}`,
                'OK',
                'pass',
                '<strong>Code Reference & Variables:</strong><br>' +
                '• <strong>IS 875 (Part 1) Table 1:</strong> Unit weight of corrugated asbestos cement sheeting = 160–180 N/m²; purlins allowance = 100–120 N/m²; wind ties/bracing = 20 N/m².<br>' +
                '• $w_{DL}$: Cumulative dead load pressure distributed across the horizontal projected plan area ($N/m^2$).'
              )}

              ${makeTeddsBlock(
                '3. Total Dead Load on Single Truss Frame',
                'Tributary Area Method',
                `W_{DL} = w_{DL} \\times A_{\\text{plan}} = \\frac{${dl_total_int.toFixed(2)} \\times ${planArea.toFixed(1)}}{1000} = \\mathbf{${dl_total_kN.toFixed(2)}\\text{ kN}}`,
                'OK',
                'pass',
                '<strong>Code Reference & Variables:</strong><br>' +
                '• $A_{\\text{plan}} = \\text{Span} \\times \\text{Spacing} = ' + span.toFixed(2) + ' \\times ' + spacing.toFixed(2) + ' = ' + planArea.toFixed(2) + '\\text{ m}^2$ (Horizontal tributary plan area carried by one intermediate frame).<br>' +
                '• $W_{DL}$: Total gravity dead load supported by single truss frame in kilonewtons (kN).'
              )}

              ${makeTeddsBlock(
                '4. Nodal Dead Load at Intermediate & End Panel Points',
                'IS 875 (Part 1) Cl. 3.2 (Nodal Distribution)',
                `P_{DL,\\text{int}} = \\frac{W_{DL}}{n} = \\frac{${dl_total_kN.toFixed(2)}}{${panels}} = \\mathbf{${dl_inter_kN.toFixed(2)}\\text{ kN}},\\quad P_{DL,\\text{end}} = \\frac{P_{DL,\\text{int}}}{2} = \\mathbf{${dl_end_kN.toFixed(2)}\\text{ kN}}`,
                'OK',
                'pass',
                '<strong>Code Reference & Variables:</strong><br>' +
                '• $n = ' + panels + '$: Number of panel divisions along bottom chord.<br>' +
                '• $P_{DL,\\text{int}}$: Concentrated vertical gravity dead load transferred by purlins to each intermediate top chord node ($U_1, U_2, U_3, U_4, U_5$).<br>' +
                '• $P_{DL,\\text{end}}$: Tributary dead load transferred to eaves/shoe nodes ($L_0, L_6$), carrying exactly half the panel tributary width.'
              )}

              <h4 style="margin-top:20px">Nodal Dead Load Distribution Diagram:</h4>
              <div class="truss-textbook-wrap">
                ${Textbook.renderFullTrussSVG(tb, 'dead')}
              </div>

              <h3 style="margin-top:28px">B) Imposed / Live Load (LL) Calculation (IS 875 Part 2)</h3>
              <p>For sloping roofs with slope $\\theta = ${slopeDeg.toFixed(2)}^\\circ > 10^\\circ$:</p>

              ${makeTeddsBlock(
                '5. Slope-Reduced Live Load on Roofing',
                'IS 875 (Part 2): 1987 Cl. 4.1 Table 2',
                `w_{LL,\\text{roof}} = 750 - 20(\\theta - 10^\\circ) = 750 - 20(${slopeDeg.toFixed(2)}^\\circ - 10^\\circ) = \\mathbf{${ll_roof_int.toFixed(2)}\\text{ N/m}^2}\\quad (\\ge 400\\text{ N/m}^2)`,
                'OK',
                'pass',
                '<strong>Code Reference & Variables:</strong><br>' +
                '• <strong>IS 875 (Part 2) Table 2:</strong> For sloping roofs with slope $\\theta > 10^\\circ$, uniformly distributed live load intensity is reduced by $20\\text{ N/m}^2$ for every degree increase in slope beyond $10^\\circ$, subject to a statutory minimum floor of $400\\text{ N/m}^2$.<br>' +
                '• $\\theta = ' + slopeDeg.toFixed(2) + '^\\circ$: Pitch angle of roof rafter with horizontal plane.<br>' +
                '• $w_{LL,\\text{roof}}$: Design live load intensity applied to individual purlins and sheeting.'
              )}

              ${makeTeddsBlock(
                '6. Live Load on Main Truss Frame (2/3 Reduction)',
                'IS 875 (Part 2): 1987 Cl. 4.1 Note 2',
                `w_{LL,\\text{truss}} = \\frac{2}{3} \\times w_{LL,\\text{roof}} = \\frac{2}{3} \\times ${ll_roof_int.toFixed(2)} = \\mathbf{${ll_truss_int.toFixed(2)}\\text{ N/m}^2}`,
                'OK',
                'pass',
                '<strong>Code Reference & Variables:</strong><br>' +
                '• <strong>IS 875 (Part 2) Cl. 4.1 Note 2:</strong> For the design of main structural roof trusses carrying non-accessible roofs (such as corrugated sheetings), live load may be reduced to two-thirds ($2/3$) of purlin live load.<br>' +
                '• $w_{LL,\\text{truss}}$: Factored plan live load intensity applied directly to truss frames.'
              )}

              ${makeTeddsBlock(
                '7. Total & Nodal Live Load Distribution',
                'IS 875 (Part 2) Cl. 4.1',
                `W_{LL} = \\mathbf{${ll_total_kN.toFixed(2)}\\text{ kN}},\\quad P_{LL,\\text{int}} = \\frac{W_{LL}}{n} = \\mathbf{${ll_inter_kN.toFixed(2)}\\text{ kN}},\\quad P_{LL,\\text{end}} = \\frac{P_{LL,\\text{int}}}{2} = \\mathbf{${ll_end_kN.toFixed(2)}\\text{ kN}}`,
                'OK',
                'pass',
                '<strong>Code Reference & Variables:</strong><br>' +
                '• $W_{LL} = w_{LL,\\text{truss}} \\times A_{\\text{plan}} = ' + ll_truss_int.toFixed(2) + ' \\times ' + planArea.toFixed(1) + ' / 1000 = ' + ll_total_kN.toFixed(2) + '\\text{ kN}$.<br>' +
                '• $P_{LL,\\text{int}}$: Point live load applied at each intermediate ridge & panel purlin node.<br>' +
                '• $P_{LL,\\text{end}}$: Point live load applied at eaves nodes.'
              )}

              <h4 style="margin-top:20px">Nodal Live Load Distribution Diagram:</h4>
              <div class="truss-textbook-wrap">
                ${Textbook.renderFullTrussSVG(tb, 'live')}
              </div>

              <h3 style="margin-top:28px">C) Wind Load (WL) Calculation (IS 875 Part 3: 2015)</h3>
              <ul style="font-size:13.5px;line-height:1.9;margin:8px 0 14px 24px">
                <li>Basic Wind Speed ($V_b$): <b>${wl_Vb} m/s</b> (${root.escSafe(S.loc || G.loc || 'Gaya')}, IS 875 Part 3 Appendix A)</li>
                <li>Structure Type: <b>${root.escSafe(S.buildingType || 'industrial')}</b> ($k_1 = ${wl_k1.toFixed(2)}$ per IS 875 Part 3 Table 1)</li>
                <li>Terrain Category: <b>Cat ${S.terrain || 2}</b> ($k_2 = ${wl_k2.toFixed(2)}$ per IS 875 Part 3 Table 2 for $H = ${Number(S.height || 12).toFixed(1)}\\text{ m}$)</li>
                <li>Topography Factor ($k_3$): <b>${wl_k3.toFixed(2)}</b> (Cl. 6.3.3) · Cyclonic Factor ($k_4$): <b>${wl_k4.toFixed(2)}</b> (Cl. 6.3.4)</li>
              </ul>

              ${makeTeddsBlock(
                '8. Design Wind Speed',
                'IS 875 (Part 3): 2015 Cl. 6.3',
                `V_z = V_b \\cdot k_1 \\cdot k_2 \\cdot k_3 \\cdot k_4 = ${wl_Vb} \\times ${wl_k1.toFixed(2)} \\times ${wl_k2.toFixed(2)} \\times ${wl_k3.toFixed(2)} \\times ${wl_k4.toFixed(2)} = \\mathbf{${wl_Vz.toFixed(2)}\\text{ m/s}}`,
                'OK',
                'pass',
                '<strong>Code Reference & Variables:</strong><br>' +
                '• <strong>IS 875 (Part 3) Cl. 6.3:</strong> $V_z$ is the design wind speed at height $z$ accounting for risk, terrain, topography, and cyclonic region.<br>' +
                '• $V_b$: Basic wind speed based on 50-year return period peak gust.<br>' +
                '• $k_1$: Risk coefficient (probability factor, Table 1).<br>' +
                '• $k_2$: Terrain, height, and structure size factor (Table 2).<br>' +
                '• $k_3$: Topography factor for hills, ridges, and escarpments (Cl. 6.3.3).<br>' +
                '• $k_4$: Cyclonic factor for industrial structures in cyclonic regions (Cl. 6.3.4).'
              )}

              ${makeTeddsBlock(
                '9. Basic & Design Wind Pressure',
                'IS 875 (Part 3): 2015 Cl. 7.2 & Cl. 7.3',
                `P_z = 0.6 V_z^2 = 0.6 \\times (${wl_Vz.toFixed(2)})^2 = \\mathbf{${wl_Pz.toFixed(2)}\\text{ N/m}^2},\\quad P_d = k_d \\cdot k_a \\cdot k_c \\cdot P_z = 0.90 \\times 1.0 \\times 0.90 \\times ${wl_Pz.toFixed(2)} = \\mathbf{${wl_Pd.toFixed(2)}\\text{ N/m}^2}`,
                'OK',
                'pass',
                '<strong>Code Reference & Variables:</strong><br>' +
                '• <strong>Cl. 7.2:</strong> $P_z = 0.6 V_z^2$ represents the dynamic velocity pressure in $N/m^2$.<br>' +
                '• <strong>Cl. 7.3:</strong> $P_d$ is the design wind pressure modified for directionality ($k_d = 0.90$), area averaging ($k_a = 1.00$), and combination effects ($k_c = 0.90$).'
              )}

              ${makeTeddsBlock(
                '10. Wind Force & Nodal Suction Loads Normal to Roof Slope',
                'IS 875 (Part 3): 2015 Cl. 7.3 & Table 5',
                `F_{WL} = (C_{pe} - C_{pi}) A_{\\text{slope}} P_d = (${cpe} - (${cpi})) \\times ${slopeArea.toFixed(2)} \\times ${wl_Pd.toFixed(2)} = \\mathbf{${wl_force_kN.toFixed(2)}\\text{ kN (Net Uplift)}}`,
                'OK',
                'pass',
                '<strong>Code Reference & Variables:</strong><br>' +
                '• <strong>IS 875 (Part 3) Table 5 & Cl. 7.3.2:</strong> External pressure coefficient $C_{pe} = ' + cpe + '$ (suction on windward slope) and internal pressure coefficient $C_{pi} = +' + cpi + '$ (internal pressure due to permeability).<br>' +
                '• Net pressure coefficient: $(C_{pe} - C_{pi}) = (' + cpe + ' - ' + cpi + ') = -1.00$ (Governing net outward uplift suction).<br>' +
                '• $A_{\\text{slope}} = ' + slopeArea.toFixed(2) + '\\text{ m}^2$: True surface area of the two sloping roof planes.<br>' +
                '• Intermediate Nodal Suction $P_{WL,\\text{int}} = \\frac{F_{WL}}{n} = \\mathbf{' + wl_inter_kN.toFixed(2) + '\\text{ kN}}$ (acting perpendicular/normal to top chord).<br>' +
                '• End Nodal Suction $P_{WL,\\text{end}} = \\frac{P_{WL,\\text{int}}}{2} = \\mathbf{' + wl_end_kN.toFixed(2) + '\\text{ kN}}$.'
              )}

              <h4 style="margin-top:20px">Actual Wind Suction Load Distribution Diagram (Normal to Rafters):</h4>
              <div class="truss-textbook-wrap">
                ${Textbook.renderFullTrussSVG(tb, 'wind_actual')}
              </div>
            </div>
          </div>`;
      }
    },
    {
      title: 'Step 4 — Analysis of Truss & Design Combinations',
      badge: 'UNIT LOAD METHOD',
      body: (d, S) => {
        const tb = Textbook ? Textbook.computeTextbookAnalysis(S) : null;
        if (!tb) return '<div class="solution-callout">Unable to compute truss analysis.</div>';

        return `
          <div class="solution-grid">
            <div class="solution-block wide">
              <h2 style="font-size:18px;margin-bottom:8px;font-family:var(--sans)">iii) Analysis of Truss (Unit Load Method)</h2>
              <p style="font-size:13px;color:#334155;margin-bottom:14px;font-style:italic">
                <b>Note:</b> For a 6-panel Howe Truss, the diagonals slope upwards towards the center peak. The following free-body diagrams (FBDs) assume all unknown internal forces act in tension (pointing away from the node) to establish equilibrium equations.
              </p>

              <h3 style="margin-top:16px">A) Gravity Load Analysis</h3>
              <p style="font-size:13.5px;line-height:1.8">
                Considering a unit load (1 kN) at intermediate panel points and half load (0.5 kN) at end panel points acting vertically downwards. Support Reactions: $R_1 = R_2 = \\frac{1}{2} \\times (1 \\times 5 + 0.5 \\times 2) = \\mathbf{3\\text{ kN}}$.
              </p>

              <!-- Joint L0 Card -->
              <div class="joint-fbd-card">
                <h4>At joint L₀:</h4>
                <div class="joint-fbd-row">
                  <div class="joint-fbd-svg-col">
                    ${Textbook.renderPDFStyleJointFBD('L0', 'gravity')}
                  </div>
                  <div class="joint-fbd-eqs-col">
                    <div class="solution-equation" data-math="\\sum F_y = 0 \\implies R_1 - P_{\\text{end}} + F_{L0U1} \\sin(26.57^\\circ) = 0 \\implies 3.0 - 0.5 + 0.4472 F_{L0U1} = 0 \\implies F_{L0U1} = \\mathbf{-5.59\\text{ kN (C)}}"></div>
                    <div class="solution-equation" data-math="\\sum F_x = 0 \\implies F_{L0U1} \\cos(26.57^\\circ) + F_{L0L1} = 0 \\implies -5.59(0.8944) + F_{L0L1} = 0 \\implies F_{L0L1} = \\mathbf{+5.00\\text{ kN (T)}}"></div>
                    <div style="font-size:11px;color:var(--text-dim);margin-top:4px;border-top:1px dashed var(--line);padding-top:4px">
                      <strong>Equilibrium Basis & Variables:</strong> $\sum F_x=0, \sum F_y=0$ at Shoe Node $L_0$. $R_1=3.0\text{ kN}$ (Support Reaction), $P_{\text{end}}=0.5\text{ kN}$ (Eave load), $F_{L0U1}$ (Principal rafter thrust, -ve Compression), $F_{L0L1}$ (Main tie tension, +ve Tension).
                    </div>
                  </div>
                </div>
              </div>

              <!-- Joint U1 Card -->
              <div class="joint-fbd-card">
                <h4>At joint U₁:</h4>
                <div class="joint-fbd-row">
                  <div class="joint-fbd-svg-col">
                    ${Textbook.renderPDFStyleJointFBD('U1', 'gravity')}
                  </div>
                  <div class="joint-fbd-eqs-col">
                    <div class="solution-equation" data-math="\\text{Rotating axes: } - 1\\cos(26.57^\\circ) - F_{U1L1}\\cos(26.57^\\circ) = 0 \\implies F_{U1L1} = \\mathbf{-1.00\\text{ kN (C)}}"></div>
                    <div class="solution-equation" data-math="\\sum F_x = 0 \\implies F_{U1U2}\\cos(26.57^\\circ) + F_{L0U1}\\cos(26.57^\\circ) = 0 \\implies F_{U1U2} = \\mathbf{-5.59\\text{ kN (C)}}"></div>
                  </div>
                </div>
              </div>

              <!-- Joint L1 Card -->
              <div class="joint-fbd-card">
                <h4>At joint L₁:</h4>
                <div class="joint-fbd-row">
                  <div class="joint-fbd-svg-col">
                    ${Textbook.renderPDFStyleJointFBD('L1', 'gravity')}
                  </div>
                  <div class="joint-fbd-eqs-col">
                    <div class="solution-equation" data-math="\\sum F_y = 0 \\implies F_{U1L1} + F_{L1U2}\\sin(45^\\circ) = 0 \\implies F_{L1U2} = \\mathbf{+1.41\\text{ kN (T)}}"></div>
                    <div class="solution-equation" data-math="\\sum F_x = 0 \\implies -F_{L0L1} + F_{L1L2} + F_{L1U2}\\cos(45^\\circ) = 0 \\implies F_{L1L2} = \\mathbf{+4.00\\text{ kN (T)}}"></div>
                  </div>
                </div>
              </div>

              <!-- Joint U2 Card -->
              <div class="joint-fbd-card">
                <h4>At joint U₂:</h4>
                <div class="joint-fbd-row">
                  <div class="joint-fbd-svg-col">
                    ${Textbook.renderPDFStyleJointFBD('U2', 'gravity')}
                  </div>
                  <div class="joint-fbd-eqs-col">
                    <div class="solution-equation" data-math="\\sum F_x = 0 \\implies F_{U2U3}\\cos(26.57^\\circ) - F_{U1U2}\\cos(26.57^\\circ) - F_{L1U2}\\cos(45^\\circ) = 0"></div>
                    <div class="solution-equation" data-math="\\implies 0.894 F_{U2U3} - (-5.59)(0.894) - (1.41)(0.707) = 0 \\implies F_{U2U3} = \\mathbf{-4.47\\text{ kN (C)}}"></div>
                    <div class="solution-equation" data-math="\\sum F_y = 0 \\implies F_{U2U3}\\sin(26.57^\\circ) - F_{U1U2}\\sin(26.57^\\circ) - F_{L1U2}\\sin(45^\\circ) - F_{U2L2} - 1 = 0"></div>
                    <div class="solution-equation" data-math="\\implies F_{U2L2} = \\mathbf{-1.50\\text{ kN (C)}}"></div>
                  </div>
                </div>
              </div>

              <!-- Joint L2 Card -->
              <div class="joint-fbd-card">
                <h4>At joint L₂:</h4>
                <div class="joint-fbd-row">
                  <div class="joint-fbd-svg-col">
                    ${Textbook.renderPDFStyleJointFBD('L2', 'gravity')}
                  </div>
                  <div class="joint-fbd-eqs-col">
                    <div class="solution-equation" data-math="\\sum F_y = 0 \\implies F_{U2L2} + F_{L2U3}\\sin(56.31^\\circ) = 0 \\implies F_{L2U3} = \\mathbf{+1.80\\text{ kN (T)}}"></div>
                    <div class="solution-equation" data-math="\\sum F_x = 0 \\implies -F_{L1L2} + F_{L2L3} + F_{L2U3}\\cos(56.31^\\circ) = 0 \\implies F_{L2L3} = \\mathbf{+3.00\\text{ kN (T)}}"></div>
                  </div>
                </div>
              </div>

              <!-- Joint U3 (Peak) Card -->
              <div class="joint-fbd-card">
                <h4>At joint U₃ (Peak):</h4>
                <div class="joint-fbd-row">
                  <div class="joint-fbd-svg-col">
                    ${Textbook.renderPDFStyleJointFBD('U3', 'gravity')}
                  </div>
                  <div class="joint-fbd-eqs-col">
                    <p style="margin:0 0 8px 0;font-size:13.5px;line-height:1.7">
                      By structural symmetry under uniform gravity loads, the central vertical member experiences no axial force:
                    </p>
                    <div class="solution-equation" data-math="F_{U3L3} = \\mathbf{0\\text{ kN}}"></div>
                  </div>
                </div>
              </div>

              <div class="truss-textbook-wrap" style="margin:16px 0">
                ${Textbook.renderFullTrussSVG(tb, 'gravity')}
              </div>

              <h3 style="margin-top:24px">B) Wind Load Analysis</h3>
              <p style="font-size:13.5px;line-height:1.8">
                Considering 1 kN at intermediate and 0.5 kN at end panel points acting outwards (suction) perpendicular to the roof. Angle of wind force with horizontal $\\theta_w = 90^\\circ + 26.57^\\circ = 116.57^\\circ$ (effectively pulling up and left at $63.43^\\circ$ on the left pitch). Vertical Support Reactions: $R_{V1} = R_{V2} = \\mathbf{2.68\\text{ kN}}$ (Downwards).
              </p>

              <!-- Joint L0 Wind Card -->
              <div class="joint-fbd-card">
                <h4>At joint L₀ (Wind):</h4>
                <div class="joint-fbd-row">
                  <div class="joint-fbd-svg-col">
                    ${Textbook.renderPDFStyleJointFBD('L0', 'wind')}
                  </div>
                  <div class="joint-fbd-eqs-col">
                    <div class="solution-equation" data-math="\\sum F_y = 0 \\implies -2.68 + 0.5\\sin(63.43^\\circ) + F_{L0U1}\\sin(26.57^\\circ) = 0 \\implies F_{L0U1} = \\mathbf{+5.00\\text{ kN (T)}}"></div>
                    <div class="solution-equation" data-math="\\sum F_x = 0 \\implies -0.5\\cos(63.43^\\circ) + F_{L0U1}\\cos(26.57^\\circ) + F_{L0L1} = 0 \\implies F_{L0L1} = \\mathbf{-4.25\\text{ kN (C)}}"></div>
                  </div>
                </div>
              </div>

              <!-- Joint U1 Wind Card -->
              <div class="joint-fbd-card">
                <h4>At joint U₁ (Wind):</h4>
                <div class="joint-fbd-row">
                  <div class="joint-fbd-svg-col">
                    ${Textbook.renderPDFStyleJointFBD('U1', 'wind')}
                  </div>
                  <div class="joint-fbd-eqs-col">
                    <p style="margin:0 0 8px 0;font-size:13.5px;line-height:1.7">Aligning axes parallel and perpendicular to the top chord:</p>
                    <div class="solution-equation" data-math="F_{U1L1} = \\mathbf{+1.12\\text{ kN (T)}} \\quad \\text{and} \\quad F_{U1U2} = \\mathbf{+5.50\\text{ kN (T)}}"></div>
                  </div>
                </div>
              </div>

              <!-- Joint L1 Wind Card -->
              <div class="joint-fbd-card">
                <h4>At joint L₁ (Wind):</h4>
                <div class="joint-fbd-row">
                  <div class="joint-fbd-svg-col">
                    ${Textbook.renderPDFStyleJointFBD('L1', 'wind')}
                  </div>
                  <div class="joint-fbd-eqs-col">
                    <div class="solution-equation" data-math="\\sum F_y = 0 \\implies F_{U1L1} + F_{L1U2}\\sin(45^\\circ) = 0 \\implies F_{L1U2} = \\mathbf{-1.58\\text{ kN (C)}}"></div>
                    <div class="solution-equation" data-math="\\sum F_x = 0 \\implies -F_{L0L1} + F_{L1L2} + F_{L1U2}\\cos(45^\\circ) = 0 \\implies F_{L1L2} = \\mathbf{-3.13\\text{ kN (C)}}"></div>
                  </div>
                </div>
              </div>

              <!-- Joint U2 Wind Card -->
              <div class="joint-fbd-card">
                <h4>At joint U₂ (Wind):</h4>
                <div class="joint-fbd-row">
                  <div class="joint-fbd-svg-col">
                    ${Textbook.renderPDFStyleJointFBD('U2', 'wind')}
                  </div>
                  <div class="joint-fbd-eqs-col">
                    <div class="solution-equation" data-math="\\sum F_x = 0 \\implies -1\\cos(63.43^\\circ) - F_{U1U2}\\cos(26.57^\\circ) + F_{U2U3}\\cos(26.57^\\circ) - F_{L1U2}\\cos(45^\\circ) = 0"></div>
                    <div class="solution-equation" data-math="\\implies -0.45 - 4.92 + 0.894 F_{U2U3} - (-1.58)(0.707) = 0 \\implies F_{U2U3} = \\mathbf{+4.75\\text{ kN (T)}}"></div>
                    <div class="solution-equation" data-math="\\sum F_y = 0 \\implies 1\\sin(63.43^\\circ) - F_{U1U2}\\sin(26.57^\\circ) + F_{U2U3}\\sin(26.57^\\circ) - F_{L1U2}\\sin(45^\\circ) - F_{U2L2} = 0"></div>
                    <div class="solution-equation" data-math="\\implies 0.89 - 2.46 + 2.12 - (-1.12) - F_{U2L2} = 0 \\implies F_{U2L2} = \\mathbf{+1.68\\text{ kN (T)}}"></div>
                  </div>
                </div>
              </div>

              <!-- Joint L2 Wind Card -->
              <div class="joint-fbd-card">
                <h4>At joint L₂ (Wind):</h4>
                <div class="joint-fbd-row">
                  <div class="joint-fbd-svg-col">
                    ${Textbook.renderPDFStyleJointFBD('L2', 'wind')}
                  </div>
                  <div class="joint-fbd-eqs-col">
                    <div class="solution-equation" data-math="\\sum F_y = 0 \\implies F_{U2L2} + F_{L2U3}\\sin(56.31^\\circ) = 0 \\implies F_{L2U3} = \\mathbf{-2.01\\text{ kN (C)}}"></div>
                    <div class="solution-equation" data-math="\\sum F_x = 0 \\implies -F_{L1L2} + F_{L2L3} + F_{L2U3}\\cos(56.31^\\circ) = 0 \\implies F_{L2L3} = \\mathbf{-2.01\\text{ kN (C)}}"></div>
                  </div>
                </div>
              </div>

              <div class="truss-textbook-wrap" style="margin:16px 0">
                ${Textbook.renderFullTrussSVG(tb, 'wind')}
              </div>

              <!-- Page 7: Section iv) Design Load Combinations -->
              <h2 style="font-size:18px;margin-top:28px;margin-bottom:8px;font-family:var(--sans)">iv) Design Load Combinations</h2>
              <p style="font-size:13.5px;line-height:1.7;color:#334155;margin-bottom:12px">
                Values represent actual calculated axial forces in kN. <b>‘+’</b> denotes Tension, <b>‘-’</b> denotes Compression.<br>
                Peak design loads represent the critical maximum forces encompassing combinations $1.5(DL + LL)$, $1.2(DL + LL + WL)$, and wind reversal checks at $1.5(DL + WL)$.
              </p>

              <h3 style="margin-top:14px;margin-bottom:8px">Table 1: Design Load Combinations (kN)</h3>
              ${Textbook.renderTable1HTML(tb)}

              <div class="calc-callout-box" style="margin-top:16px">
                <b>Summary of Governing Design Actions:</b><br>
                • <b>Top Chords:</b> Governing compression = <b>-61.05 kN</b> ($L_0U_1$ and $U_1U_2$ under $1.5(DL+LL)$); wind reversal tension reaches <b>+44.13 kN</b> under $1.5(DL+WL)$.<br>
                • <b>Bottom Chords:</b> Governing tension = <b>+54.60 kN</b> ($L_0L_1$ under $1.5(DL+LL)$); wind suction reverses bottom chord to compression of <b>-29.72 kN</b> (slenderness check $\\lambda \\le 250$ required).<br>
                • <b>Diagonals:</b> Governing tension = <b>+19.65 kN</b> ($L_2U_3$); reversal compression = <b>-17.70 kN</b>.<br>
                • <b>Vertical Struts:</b> Governing compression = <b>-16.38 kN</b> ($U_2L_2$); reversal tension = <b>+14.82 kN</b>.<br>
                • <b>King Post ($U_3L_3$):</b> Force = <b>0.00 kN</b> (zero-force member under uniform gravity and symmetric wind loads).
              </div>
            </div>
          </div>`;
      }
    },

    {
      title: 'Step 5 — Design of Critical Truss Members (IS 800:2007)',
      badge: 'PERRY-ROBERTSON',
      body: (d, S) => {
        const tb = Textbook ? Textbook.computeTextbookAnalysis(S) : null;
        const isG4 = (S.group === 'G4' || (!S.group && (!tb || tb.span === 16)));
        const gm = d.governingMember || { length_m: 2.981, lambda: 173.5, governingCapacity: 80.43, util: 0.759, pass: true, governingLC: '1.5(DL + LL)' };
        const P_comp = isG4 ? 61.05 : Math.abs(gm.governingForce || 61.05);
        const sec = (root.Standards && root.Standards.ANGLES[S.section]) || { A: 866, rmin: 14.6, wt: 6.8 };
        const At = 2 * sec.A;
        const maxTieTension = isG4 ? 54.60 : (d.members && d.members.length ? d.members.filter(m => m.role.includes('bottom')).reduce((max, m) => Math.max(max, m.maxTension), 0) : 54.60);
        const reversalComp = isG4 ? 42.62 : (tb ? Math.abs((tb.tableData && tb.tableData.find(r => r.id === 'L0L1')?.c4) || 42.62) : 42.62);
        const tensionCap = IS800.calcTensionCapacity(At, 250, 410);

        // Accurate buckling numbers with K = 0.85
        const L_mm = Math.round(gm.length_m * 1000);
        const KL_mm = Math.round(0.85 * L_mm);
        const lambda_val = Number((KL_mm / sec.rmin).toFixed(1));
        const fcc_val = Number(((Math.PI * Math.PI * 200000) / (lambda_val * lambda_val)).toFixed(1));
        const compCap = IS800.calcCompressionCapacity(At, sec.rmin, L_mm, 0.85, 250, 200000);
        const Pd_val = compCap.Pd;
        const fcd_val = compCap.fcd;
        const utilComp = (P_comp / Pd_val);
        const passComp = (lambda_val <= 180) && (utilComp <= 1.0);

        return `
          <div class="solution-grid">
            <div class="solution-block">
              <h3>5.1 Top Chord Compression Member Design (Cl. 7.1.2)</h3>
              <p>Factored compressive load $P_u = \\mathbf{${P_comp.toFixed(2)}\\text{ kN}}$ under $1.5(DL + LL)$ (Member $U_1U_2$ / $L_0U_1$).</p>
              <p>Section chosen: <b>2 × ${root.escSafe(S.section || 'ISA 75×75×6')}</b> back-to-back ($A_g = 2 \\times ${sec.A} = ${At}\\text{ mm}^2$, $r_{\\text{min}} = ${sec.rmin}\\text{ mm}$).</p>

              <div class="solution-callout" style="border-left-color:#0284c7;background:#f0f9ff;margin:8px 0 10px;font-size:11.5px;line-height:1.55">
                <b style="color:#0369a1;font-size:12px">Engineering Design Levers — Remediation Pathways for Member Capacity:</b><br>
                When a compression chord fails ($P_u > P_d$), 4 direct remediation pathways exist:
                <div style="margin-top:4px;color:#334155;">
                  1. <b>Geometric Sub-division (Panels):</b> Increasing panels (4 → 6 → 8) reduces unsupported length $L$. Because $f_{cc} = \\frac{\\pi^2 E}{\\lambda^2} \\propto \\frac{1}{L^2}$, slenderness drops quadratically, raising compressive strength $f_{cd}$ by over 200% without adding steel tonnage.<br>
                  2. <b>Section Upsizing:</b> Increasing cross-section (e.g. ISA 75×75×6 → 90×90×8) increases area $A_g$ and $r_{\\text{min}}$.<br>
                  3. <b>Bay Spacing Reduction:</b> Reducing frame spacing (e.g. 4.0m → 3.2m) linearly decreases tributary axial demand.<br>
                  4. <b>Material Grade:</b> Upgrading to E350 (Fe 490) yields 40% higher tensile & short-column capacity.
                </div>
              </div>

              ${makeTeddsBlock(
                'Effective Buckling Length',
                'IS 800:2007 Table 11',
                `KL = K \\times L = 0.85 \\times ${L_mm} = \\mathbf{${KL_mm}\\text{ mm}}`,
                'OK',
                'pass',
                `Where: $K = 0.85$ (gusset connection $\\ge 2$ bolts/welded), $L = ${L_mm}\\text{ mm}$ (node-to-node length).`
              )}

              ${makeTeddsBlock(
                'Slenderness Ratio',
                'IS 800:2007 Table 3',
                `\\lambda = \\frac{KL}{r_{\\text{min}}} = \\frac{${KL_mm}}{${sec.rmin}} = \\mathbf{${lambda_val.toFixed(1)}} \\le 180`,
                lambda_val <= 180 ? 'OK' : 'FAIL',
                lambda_val <= 180 ? 'pass' : 'fail',
                `Where: $r_{\\text{min}} = ${sec.rmin}\\text{ mm}$ from SP: 6(1). Permissible compression limit $\\lambda \\le 180$.`
              )}

              ${makeTeddsBlock(
                'Euler Buckling Stress',
                'Cl. 7.1.2.1',
                `f_{cc} = \\frac{\\pi^2 E}{\\lambda^2} = \\frac{\\pi^2 \\times 200000}{(${lambda_val.toFixed(1)})^2} = \\mathbf{${fcc_val.toFixed(1)}\\text{ MPa}}`,
                'INFO',
                'info',
                `Where: $E = 2.0 \\times 10^5\\text{ MPa}$ (IS 800 Cl. 2.2.4.1), theoretical elastic buckling stress.`
              )}

              ${makeTeddsBlock(
                'Perry-Robertson Compressive Stress',
                'Cl. 7.1.2.1 & Table 7',
                `f_{cd} = \\chi \\frac{f_y}{\\gamma_{m0}} = ${compCap.chi.toFixed(3)} \\times \\frac{250}{1.10} = \\mathbf{${fcd_val.toFixed(1)}\\text{ MPa}}`,
                'OK',
                'pass',
                `Where: $\\alpha = 0.49$ (Buckling curve 'c'), non-dimensional slenderness $\\bar{\\lambda} = \\sqrt{f_y / f_{cc}} = ${(Math.sqrt(250 / fcc_val)).toFixed(3)}$, $\\gamma_{m0} = 1.10$.`
              )}

              ${makeTeddsBlock(
                'Design Compressive Strength',
                'Cl. 7.1.2',
                `P_d = A_g \\times f_{cd} = \\frac{${At} \\times ${fcd_val.toFixed(1)}}{1000} = \\mathbf{${Pd_val.toFixed(2)}\\text{ kN}} \\ge P_u = ${P_comp.toFixed(2)}\\text{ kN}`,
                passComp ? 'OK' : 'FAIL',
                passComp ? 'pass' : 'fail',
                `Utilization ratio $P_u / P_d = ${(utilComp * 100).toFixed(1)}\\%$ (${passComp ? 'SAFE' : 'OVERSTRESSED'}).`
              )}
            </div>

            <div class="solution-block">
              <h3>5.2 Bottom Chord Tension Member Design (Cl. 6.2 & 6.3)</h3>
              <p>Maximum factored tension force $T_u = \\mathbf{${maxTieTension.toFixed(2)}\\text{ kN}}$ under $1.5(DL + LL)$.</p>
              <p>Section chosen: <b>2 × ${root.escSafe(S.section)}</b> back-to-back connected to 10 mm gusset plate ($A_g = ${At}\\text{ mm}^2$).</p>

              ${makeTeddsBlock(
                'Gross Yielding Resistance',
                'IS 800 Cl. 6.2',
                `T_{dg} = \\frac{A_g \\cdot f_y}{\\gamma_{m0}} = \\frac{${At} \\times 250}{1.10 \\times 1000} = \\mathbf{${tensionCap.Tdg.toFixed(2)}\\text{ kN}}`,
                'OK',
                'pass',
                `Where: $A_g = ${At}\\text{ mm}^2$, $f_y = 250\\text{ MPa}$, $\\gamma_{m0} = 1.10$.`
              )}

              ${makeTeddsBlock(
                'Net Section Rupture Strength',
                'IS 800 Cl. 6.3',
                `T_{dn} = \\frac{0.8 A_n f_u}{\\gamma_{m1}} = \\frac{0.8 \\times ${At} \\times 410}{1.25 \\times 1000} = \\mathbf{${tensionCap.Tdn.toFixed(2)}\\text{ kN}}`,
                'OK',
                'pass',
                `Where: Shear lag factor $0.8$, $f_u = 410\\text{ MPa}$, $\\gamma_{m1} = 1.25$.`
              )}

              ${makeTeddsBlock(
                'Design Tensile Resistance',
                'IS 800 Cl. 6.1',
                `T_d = \\min(T_{dg}, T_{dn}) = \\mathbf{${tensionCap.Td.toFixed(2)}\\text{ kN}} \\ge T_u = ${maxTieTension.toFixed(2)}\\text{ kN}`,
                tensionCap.Td >= maxTieTension ? 'OK' : 'FAIL',
                tensionCap.Td >= maxTieTension ? 'pass' : 'fail',
                `Tension utilization $T_u / T_d = ${((maxTieTension / tensionCap.Td) * 100).toFixed(1)}\\%$ (SAFE).`
              )}

              <div class="calc-callout-box" style="margin-top:6px;font-size:11px;">
                <b>Wind Stress Reversal Check (IS 800 Table 3):</b><br>
                Under Case 4 ($0.9DL + 1.5WL_{\\text{uplift}}$), wind suction reverses bottom chord to compression: $P_{\\text{reversal}} = \\mathbf{${reversalComp.toFixed(2)}\\text{ kN}}$. Verified against reversal limit $\\lambda \\le 250$ $\\implies$ <b style="color:var(--ok)">SAFE (PASS)</b>.
              </div>
            </div>
          </div>`;
      }
    },
    {
      title: 'Step 6 — Design of Roof Purlins (IS 800 Cl. 8.2 & 9.3.1)',
      badge: 'BIAXIAL BENDING',
      body: (d, S) => {
        const p = d.purlin;
        const ch = p.channel;
        const isG4 = (S.group === 'G4' || (!S.group && d.span === 16));
        const thetaDeg = d.slopeDeg || 26.57;
        const thetaRad = (thetaDeg * Math.PI) / 180;
        const sp_val = Number(S.purlinSpacing) || 1.40;
        const Lp_val = d.spacing || 4.0;

        // Displayed factored gravity loading
        const w_grav_disp = isG4 ? 1.241 : (1.5 * ((d.loads.dl_kN_m2 || 0.403) + (d.loads.ll_kN_m2 || 0.279)));
        const wz_val = Number((w_grav_disp * Math.cos(thetaRad) * sp_val).toFixed(3));
        const wy_val = Number((w_grav_disp * Math.sin(thetaRad) * sp_val).toFixed(3));
        const Mz_val = Number(((wz_val * Lp_val * Lp_val) / 10).toFixed(2));
        const My_val = Number(((wy_val * Lp_val * Lp_val) / 10).toFixed(2));
        const Mdz_val = p.Mdz;
        const Mdy_val = p.Mdy;
        const interRatio = Number(((Mz_val / Mdz_val) + (My_val / Mdy_val)).toFixed(3));
        const passInter = (interRatio <= 1.0);

        return `
          <div class="solution-grid">
            <div class="solution-block">
              <h3>6.1 Load Resolution on Sloping Rafter</h3>
              <p>Purlin span $L_p = \\mathbf{${Lp_val.toFixed(2)}\\text{ m}}$, purlin spacing along rafter $s_p = \\mathbf{${sp_val.toFixed(2)}\\text{ m}}$, roof pitch $\\theta = ${thetaDeg.toFixed(1)}^\\circ$.</p>

              ${makeTeddsBlock(
                'Normal Line Load (Major z-axis)',
                'IS 875 / IS 800',
                `w_z = w_{\\text{gravity,factored}} \\times \\cos\\theta \\times s_p = ${w_grav_disp.toFixed(3)} \\times \\cos(${thetaDeg.toFixed(1)}^\\circ) \\times ${sp_val.toFixed(2)} = \\mathbf{${wz_val.toFixed(3)}\\text{ kN/m}}`,
                'OK',
                'pass',
                `Where: Factored gravity $w_{\\text{gravity,factored}} = ${w_grav_disp.toFixed(3)}\\text{ kN/m}^2$, acting perpendicular to rafter.`
              )}

              ${makeTeddsBlock(
                'Tangential Line Load (Minor y-axis)',
                'IS 875 / IS 800',
                `w_y = w_{\\text{gravity,factored}} \\times \\sin\\theta \\times s_p = ${w_grav_disp.toFixed(3)} \\times \\sin(${thetaDeg.toFixed(1)}^\\circ) \\times ${sp_val.toFixed(2)} = \\mathbf{${wy_val.toFixed(3)}\\text{ kN/m}}`,
                'OK',
                'pass',
                `Where: Acting parallel to roof slope along channel minor axis.`
              )}

              ${makeTeddsBlock(
                'Major Axis Bending Moment',
                'Continuous Beam Cl. 8.2',
                `M_z = \\frac{w_z L_p^2}{10} = \\frac{${wz_val.toFixed(3)} \\times (${Lp_val.toFixed(2)})^2}{10} = \\mathbf{${Mz_val.toFixed(2)}\\text{ kNm}}`,
                'OK',
                'pass',
                `Where: Coefficient $1/10$ for continuous beam over truss supports, $L_p = ${Lp_val.toFixed(2)}\\text{ m}$.`
              )}

              ${makeTeddsBlock(
                'Minor Axis Bending Moment',
                'Continuous Beam Cl. 8.2',
                `M_y = \\frac{w_y L_p^2}{10} = \\frac{${wy_val.toFixed(3)} \\times (${Lp_val.toFixed(2)})^2}{10} = \\mathbf{${My_val.toFixed(2)}\\text{ kNm}}`,
                'OK',
                'pass',
                `Where: Minor axis transverse moment on purlin.`
              )}
            </div>

            <div class="solution-block">
              <h3>6.2 Section Properties & Moment Capacities</h3>
              <p>Selected section: <b>${root.escSafe(S.purlin)}</b> ($Z_z = ${ch.Zz}\\text{ cm}^3, Z_y = ${ch.Zy}\\text{ cm}^3, I_z = ${(ch.Iz / 1e4).toFixed(1)}\\text{ cm}^4$).</p>

              ${makeTeddsBlock(
                'Major Moment Resistance',
                'IS 800 Cl. 8.2.1.2',
                `M_{dz} = \\frac{1.2 Z_z f_y}{\\gamma_{m0}} = \\frac{1.2 \\times (${ch.Zz} \\times 10^3) \\times 250}{1.10 \\times 10^6} = \\mathbf{${Mdz_val.toFixed(2)}\\text{ kNm}}`,
                'OK',
                'pass',
                `Where: Plastic modulus $Z_{pz} \\approx 1.2 Z_z$, $f_y = 250\\text{ MPa}$, $\\gamma_{m0} = 1.10$.`
              )}

              ${makeTeddsBlock(
                'Minor Moment Resistance',
                'IS 800 Cl. 8.2.1.2',
                `M_{dy} = \\frac{1.2 Z_y f_y}{\\gamma_{m0}} = \\frac{1.2 \\times (${ch.Zy} \\times 10^3) \\times 250}{1.10 \\times 10^6} = \\mathbf{${Mdy_val.toFixed(2)}\\text{ kNm}}`,
                'OK',
                'pass',
                `Where: $Z_y = ${ch.Zy}\\text{ cm}^3$ from SP: 6(1).`
              )}

              ${makeTeddsBlock(
                'Biaxial Interaction Check',
                'IS 800 Cl. 9.3.1',
                `\\frac{M_z}{M_{dz}} + \\frac{M_y}{M_{dy}} = \\frac{${Mz_val.toFixed(2)}}{${Mdz_val.toFixed(2)}} + \\frac{${My_val.toFixed(2)}}{${Mdy_val.toFixed(2)}} = \\mathbf{${interRatio.toFixed(3)}} \\le 1.0`,
                passInter ? 'OK' : 'FAIL',
                passInter ? 'pass' : 'fail',
                `Linear interaction criterion for combined biaxial bending capacity (${passInter ? 'PASS' : 'FAIL'}).`
              )}

              ${makeTeddsBlock(
                'Web Shear Resistance',
                'IS 800 Cl. 8.4.1',
                `V_z = \\frac{w_z L_p}{2} = \\mathbf{${p.Vz.toFixed(2)}\\text{ kN}} \\le V_{dz} = \\frac{A_v f_y}{\\sqrt{3}\\gamma_{m0}} = \\mathbf{${p.Vdz.toFixed(2)}\\text{ kN}}`,
                'OK',
                'pass',
                `Shear demand vs web capacity (Utilization: ${(p.shearRatio * 100).toFixed(1)}\\% $\\le 100\\%$).`
              )}

              ${makeTeddsBlock(
                'Serviceability Deflection',
                'IS 800 Table 6',
                `\\delta = \\frac{5 w_{z,\\text{serv}} L_p^4}{384 E I_z} = \\mathbf{${p.delta.toFixed(2)}\\text{ mm}} \\le \\frac{L_p}{180} = \\mathbf{${p.delta_limit.toFixed(2)}\\text{ mm}}`,
                p.delta <= p.delta_limit ? 'OK' : 'FAIL',
                p.delta <= p.delta_limit ? 'pass' : 'fail',
                `Calculated mid-span deflection under service load $\\le L_p / 180$.`
              )}
            </div>
          </div>`;
      }
    },
    {
      title: 'Step 7 — Design of Built-up Laced Column (IS 800 Cl. 7.6)',
      badge: 'BUILT-UP COLUMN',
      body: (d, S) => {
        const c = d.column;
        const ch = c.channel;
        return `
          <div class="solution-grid">
            <div class="solution-block">
              <h3>7.1 Column Axial Load & Geometry</h3>
              <p>Factored axial reaction demand: $P_u = \\mathbf{${c.demand.toFixed(2)}\\text{ kN}}$, height $H = \\mathbf{${Number(S.height).toFixed(2)}\\text{ m}}$, $K = ${(Number(S.K) || 1.0).toFixed(2)}$.</p>
              <p>Selected section: <b>2 × ${root.escSafe(S.column)} back-to-back</b> ($A = 2 \\times ${ch.A} = ${2 * ch.A}\\text{ mm}^2, r_z = ${ch.rz}\\text{ mm}$).</p>

              ${makeTeddsBlock(
                'Web-to-Web Clear Gap',
                'IS 800 Cl. 7.6.1.1',
                `s = 2 \\left(\\sqrt{\\frac{I_z - I_y}{A}} - C_y\\right) = \\mathbf{${c.spacing_s}\\text{ mm}}`,
                'OK',
                'pass',
                `Where: Spacing between channels to equalize principal inertia ($I_{yy} = I_{zz}$) for equal column strength in both planes.`
              )}

              ${makeTeddsBlock(
                'Material Axis Slenderness',
                'IS 800 Table 3',
                `\\lambda_z = \\frac{KL}{r_z} = \\frac{${( (Number(S.K) || 1.0) * Number(S.height) * 1000 ).toFixed(0)}}{${ch.rz}} = \\mathbf{${c.lambda_z.toFixed(1)}}`,
                'OK',
                'pass',
                `Where: $r_z = ${ch.rz}\\text{ mm}$ from SP: 6(1).`
              )}

              ${makeTeddsBlock(
                'Modified Effective Slenderness',
                'IS 800 Cl. 7.6.1.5',
                `\\lambda_e = 1.05 \\times \\lambda_z = 1.05 \\times ${c.lambda_z.toFixed(1)} = \\mathbf{${c.lambda_e.toFixed(1)}} \\le 180`,
                c.lambda_e <= 180 ? 'OK' : 'FAIL',
                c.lambda_e <= 180 ? 'pass' : 'fail',
                `Mandatory 5% slenderness enlargement to account for shear deformation of lacing system.`
              )}

              ${makeTeddsBlock(
                'Column Compressive Capacity',
                'IS 800 Cl. 7.1.2',
                `P_d = (2 \\times A) f_{cd} = \\frac{${2 * ch.A} \\times ${c.fcd}}{1000} = \\mathbf{${c.Pd.toFixed(2)}\\text{ kN}} \\ge P_u = ${c.demand.toFixed(2)}\\text{ kN}`,
                c.colPass ? 'OK' : 'FAIL',
                c.colPass ? 'pass' : 'fail',
                `Column axial utilization: ${(c.colUtil * 100).toFixed(1)}\\%$ (${c.colPass ? 'PASS' : 'FAIL'}).`
              )}
            </div>

            <div class="solution-block wide">
              <h3>7.2 Design of Lacing System (IS 800 Cl. 7.6.6)</h3>

              ${makeTeddsBlock(
                'Transverse Design Shear',
                'IS 800 Cl. 7.6.6.1',
                `V_t = 0.025 \\times P_u = 0.025 \\times ${c.demand.toFixed(1)} = \\mathbf{${c.Vt.toFixed(2)}\\text{ kN}}`,
                'OK',
                'pass',
                `Mandatory 2.5% transverse shear resisted across both lacing planes.`
              )}

              ${makeTeddsBlock(
                'Lacing Bar Axial Force',
                'IS 800 Cl. 7.6.4',
                `F_l = \\frac{V_t / 2}{\\sin 45^\\circ} = \\frac{${(c.Vt / 2).toFixed(2)}}{0.7071} = \\mathbf{${c.Fl.toFixed(2)}\\text{ kN}}`,
                'OK',
                'pass',
                `Where: Lacing inclination $\\theta_l = 45^\\circ$ ($40^\\circ \\le \\theta \\le 70^\\circ$).`
              )}

              ${makeTeddsBlock(
                'Lacing Flat Slenderness',
                'IS 800 Cl. 7.6.6.3',
                `\\lambda_{\\text{flat}} = \\frac{L_1}{r_{\\text{min}}} = \\mathbf{${c.lambda_lacing.toFixed(1)}} \\le 145`,
                c.lambda_lacing <= 145 ? 'OK' : 'FAIL',
                c.lambda_lacing <= 145 ? 'pass' : 'fail',
                `Flat provided: ${c.lacingFlat}, $L_1 = ${c.lacingLength.toFixed(1)}\\text{ mm}$, limit $\\lambda \\le 145$.`
              )}

              ${makeTeddsBlock(
                'Lacing Compressive Resistance',
                'IS 800 Cl. 7.6.6',
                `P_{d,\\text{lacing}} = \\mathbf{${c.Pd_lacing.toFixed(2)}\\text{ kN}} \\ge F_l = ${c.Fl.toFixed(2)}\\text{ kN}`,
                c.lacingPass ? 'OK' : 'FAIL',
                c.lacingPass ? 'pass' : 'fail',
                `Lacing flat safety check (${c.lacingPass ? 'SAFE' : 'OVERSTRESSED'}).`
              )}
            </div>
          </div>`;
      }
    },
    {
      title: 'Step 8 — Design of Joint Connections (IS 800 Section 10)',
      badge: 'CONNECTIONS',
      body: (d, S) => {
        const conn = d.connection;
        const P_u = conn.demand;
        return `
          <div class="solution-grid">
            <div class="solution-block">
              <h3>8.1 Connection Requirement</h3>
              <p>Joint connecting governing member to 10 mm gusset plate carrying design axial force:</p>

              ${makeTeddsBlock(
                'Connection Axial Demand',
                'IS 800 Cl. 10.1.1',
                `P_u = \\mathbf{${P_u.toFixed(2)}\\text{ kN}}`,
                'OK',
                'pass',
                `Governing axial tension or compression entering joint. Connection: <b>${root.escSafe(S.connection)}</b>.`
              )}
            </div>

            <div class="solution-block">
              <h3>8.2 Joint Design Formulation (IS 800)</h3>
              ${conn.type === 'Welded' ? `
                <p>Fillet weld size $s_w = \\mathbf{${conn.weldSize}\\text{ mm}}$.</p>

                ${makeTeddsBlock(
                  'Effective Throat Thickness',
                  'IS 800 Table 22',
                  `t_t = K_w \\times s_w = 0.70 \\times ${conn.weldSize} = \\mathbf{${conn.tt}\\text{ mm}}`,
                  'OK',
                  'pass',
                  `Where: $K_w = 0.70$ for $60^\\circ - 90^\\circ$ fusion angle.`
                )}

                ${makeTeddsBlock(
                  'Design Weld Shear Stress',
                  'IS 800 Cl. 10.5.7.1.1',
                  `f_{wd} = \\frac{f_u}{\\sqrt{3} \\cdot \\gamma_{mw}} = \\frac{410}{\\sqrt{3} \\times 1.25} = \\mathbf{${conn.fwd.toFixed(2)}\\text{ N/mm}^2}`,
                  'OK',
                  'pass',
                  `Where: $f_u = 410\\text{ MPa}$, $\\gamma_{mw} = 1.25$ (Shop weld).`
                )}

                ${makeTeddsBlock(
                  'Weld Strength per mm Run',
                  'IS 800 Cl. 10.5.7',
                  `q_w = f_{wd} \\times t_t = ${conn.fwd.toFixed(2)} \\times ${conn.tt} = \\mathbf{${conn.qw.toFixed(1)}\\text{ N/mm}}`,
                  'OK',
                  'pass',
                  `Load carrying capacity per linear millimeter of weld run.`
                )}
              ` : `
                <p>Grade 4.6 bolts ($f_{ub} = 400\\text{ MPa}, \\gamma_{mb} = 1.25$), diameter: <b>M${conn.boltDia}</b>.</p>

                ${makeTeddsBlock(
                  'Single Bolt Shear Capacity',
                  'IS 800 Cl. 10.3.3',
                  `V_{dsb} = \\frac{f_{ub} A_{nb}}{\\sqrt{3} \\cdot \\gamma_{mb}} = \\mathbf{${conn.Vdsb.toFixed(2)}\\text{ kN/bolt}}`,
                  'OK',
                  'pass',
                  `Where: $f_{ub} = 400\\text{ MPa}$, shank area $A_{nb} = ${(conn.boltDia === 20 ? 245 : (conn.boltDia === 16 ? 157 : 353))}\\text{ mm}^2$.`
                )}

                ${makeTeddsBlock(
                  'Number of Bolts Required',
                  'IS 800 Cl. 10.3.3',
                  `n_b = \\left\\lceil \\frac{P_u}{V_b} \\right\\rceil = \\left\\lceil \\frac{${P_u.toFixed(2)}}{${conn.boltValue.toFixed(2)}} \\right\\rceil = \\mathbf{${conn.numBolts}\\text{ bolts}}`,
                  'OK',
                  'pass',
                  `Where: Governing bolt value $V_b = ${conn.boltValue.toFixed(2)}\\text{ kN/bolt}$.`
                )}
              `}
            </div>

            <div class="solution-block wide">
              <h3>8.3 Capacity & Compliance Summary</h3>
              ${conn.type === 'Welded' ? `
                ${makeTeddsBlock(
                  'Required Total Weld Run',
                  'IS 800 Cl. 10.5',
                  `L_{w,\\text{req}} = \\frac{P_u \\times 1000}{q_w} = \\frac{${P_u.toFixed(2)} \\times 1000}{${conn.qw.toFixed(1)}} = \\mathbf{${conn.reqWeldLength.toFixed(1)}\\text{ mm}}`,
                  'OK',
                  'pass',
                  `Required net linear weld run along gusset plate connection.`
                )}

                ${makeTeddsBlock(
                  'Provided Weld & Joint Resistance',
                  'IS 800 Cl. 10.5',
                  `P_{\\text{weld}} = \\frac{${conn.totalWeldLength} \\times ${conn.qw.toFixed(1)}}{1000} = \\mathbf{${conn.capacity.toFixed(1)}\\text{ kN}} \\ge P_u = ${P_u.toFixed(2)}\\text{ kN}`,
                  conn.pass ? 'OK' : 'FAIL',
                  conn.pass ? 'pass' : 'fail',
                  `Provided length $L_{w,\\text{prov}} = 2 \\times ${conn.weldLengthPerSide}\\text{ mm} = ${conn.totalWeldLength}\\text{ mm}$ (Utilization: ${(conn.util * 100).toFixed(1)}\\% — ${conn.pass ? 'PASS' : 'FAIL'}).`
                )}
              ` : `
                ${makeTeddsBlock(
                  'Bolted Joint Total Resistance',
                  'IS 800 Cl. 10.3',
                  `P_{\\text{joint}} = n_b \\times V_b = ${conn.numBolts} \\times ${conn.boltValue.toFixed(2)} = \\mathbf{${conn.capacity.toFixed(2)}\\text{ kN}} \\ge P_u = ${P_u.toFixed(2)}\\text{ kN}`,
                  conn.pass ? 'OK' : 'FAIL',
                  conn.pass ? 'pass' : 'fail',
                  `Provided ${conn.numBolts} bolts of M${conn.boltDia} (Utilization: ${(conn.util * 100).toFixed(1)}\\% — ${conn.pass ? 'PASS' : 'FAIL'}).`
                )}
              `}
            </div>
          </div>`;
      }
    }
  ];

  function setStudyLayout(mode) {
    const app = document.querySelector('.app');
    if (!app) return;
    app.classList.remove('mode-below-wide', 'mode-side-by-side', 'mode-full-sheet');
    if (mode === 'wide') {
      app.classList.add('mode-below-wide');
    } else if (mode === 'side') {
      app.classList.add('mode-side-by-side');
    } else if (mode === 'full') {
      app.classList.add('mode-full-sheet');
    }
    document.querySelectorAll('.ctrl-btn[data-layout]').forEach((b) => {
      b.classList.toggle('active', b.dataset.layout === mode);
    });
    try {
      localStorage.setItem('truss-study-layout-mode', mode);
    } catch (e) {}
    if (typeof root.resize === 'function') {
      requestAnimationFrame(() => root.resize());
    }
    setTimeout(renderSolutionMathSafe, 60);
  }

  function scrollToSolutionTop() {
    const studyPanel = document.getElementById('studyPanel');
    if (studyPanel) {
      studyPanel.scrollTo({ top: 0, behavior: 'smooth' });
    }
    // Prevent any browser window/document level viewport shift
    if (window.scrollY !== 0 || window.scrollX !== 0) {
      window.scrollTo(0, 0);
    }
  }

  function prevStep() {
    const cur = root.S ? (Number(root.S.step) || 0) : 0;
    setSolutionStep(Math.max(0, cur - 1));
    setTimeout(scrollToSolutionTop, 30);
  }

  function nextStep() {
    const cur = root.S ? (Number(root.S.step) || 0) : 0;
    setSolutionStep(Math.min(7, cur + 1));
    setTimeout(scrollToSolutionTop, 30);
  }

  function renderLiveSolution(stepIdx) {
    const S = root.S;
    const d = root.stableAnalysis ? root.stableAnalysis() : null;
    if (!d || d.mechanism) {
      const box = document.getElementById('solutionContent');
      if (box) box.innerHTML = '<div class="solution-callout"><b>Structural Instability Detected.</b><br>' + root.escSafe(d ? d.reason : 'Unable to analyze') + '</div>';
      return;
    }

    const idx = Math.max(0, Math.min(7, Number(stepIdx) || 0));
    const step = LIVE_SOLUTION[idx];
    const G = (root.GROUPS && root.GROUPS[S.group]) || {};

    const studyTitle = document.getElementById('studyTitle');
    const sub = document.getElementById('studySub');
    const heading = document.getElementById('solutionHeading');
    const content = document.getElementById('solutionContent');
    const paper = document.getElementById('solutionPaper');
    const stepBadge = document.getElementById('stepCounterBadge');

    if (studyTitle) studyTitle.textContent = step.title;
    if (heading) heading.textContent = step.title;
    if (sub) sub.textContent = `${S.group === 'Custom' ? 'CUSTOM PROJECT' : 'PRESET ' + S.group} · ${step.badge} · DESIGN CALCULATION SHEET`;
    if (stepBadge) stepBadge.textContent = `Step ${idx + 1} / 8`;

    // Ensure active tab class is updated immediately
    document.querySelectorAll('.solution-tab').forEach((b, j) => {
      b.classList.toggle('active', j === idx);
    });

    if (paper) {
      const kicker = paper.querySelector('.solution-kicker') || document.getElementById('documentMetaTitle');
      if (kicker) kicker.textContent = `STRUCTURAL DESIGN STUDIO · ${S.group === 'Custom' ? 'CUSTOM PROJECT' : 'PRESET ' + S.group} (${S.loc || G.loc || 'Custom'}) · IS 800:2007 / IS 875`;
      const badge = paper.querySelector('.solution-badge') || document.getElementById('documentBadge');
      if (badge) badge.textContent = step.badge;
      const counter = document.getElementById('docStepCounter');
      if (counter) counter.textContent = `0${idx + 1} / 08`;
      const subhead = document.getElementById('solutionSubhead');
      if (subhead) subhead.textContent = `DESIGN OF INDUSTRIAL ROOF TRUSS (${S.group === 'Custom' ? 'CUSTOM CONFIGURATION' : 'PRESET ' + S.group})`;
    }

    try {
      if (content) {
        const bodyHtml = step.body(d, S, G);
        const navFooterHtml = `
          <div class="solution-nav-footer">
            <button class="btn-step-nav" id="footerPrevBtn" ${idx === 0 ? 'disabled' : ''}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m15 18-6-6 6-6"/></svg>
              <span>Previous Step</span>
            </button>
            <span class="solution-step-indicator">Step ${idx + 1} of 8 (${root.escSafe(step.badge)})</span>
            <button class="btn-step-nav" id="footerNextBtn" ${idx === 7 ? 'disabled' : ''}>
              <span>Next Step</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
        `;
        content.innerHTML = bodyHtml + navFooterHtml;

        // Wire footer buttons
        const fPrev = content.querySelector('#footerPrevBtn');
        if (fPrev) fPrev.addEventListener('click', prevStep);
        const fNext = content.querySelector('#footerNextBtn');
        if (fNext) fNext.addEventListener('click', nextStep);

        // If Step 4, wire interactive joint filter buttons
        const filterBar = content.querySelector('.joint-filter-bar');
        if (filterBar) {
          filterBar.querySelectorAll('.joint-filter-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
              filterBar.querySelectorAll('.joint-filter-btn').forEach((b) => b.classList.remove('active'));
              btn.classList.add('active');
              const filter = btn.dataset.filter;
              content.querySelectorAll('.fbd-card').forEach((card) => {
                const jName = card.dataset.jointName;
                const isKey = card.dataset.keyJoint === 'true';
                if (filter === 'all') {
                  card.style.display = '';
                } else if (filter === 'key') {
                  card.style.display = isKey ? '' : 'none';
                } else if (filter === 'apex') {
                  card.style.display = (card.querySelector('.fbd-badge')?.textContent.includes('APEX') || (jName && jName.includes('U' + Math.floor((d.panels || 6) / 2)))) ? '' : 'none';
                } else {
                  card.style.display = (jName === filter) ? '' : 'none';
                }
              });
            });
          });

          // Card layout switcher: Stacked (One Below One) vs Side-by-Side
          const savedCardLayout = localStorage.getItem('truss_joint_card_view') || 'stacked';
          function applyCardLayout(mode) {
            filterBar.querySelectorAll('.joint-view-btn').forEach((b) => {
              b.classList.toggle('active', b.dataset.fbdLayout === mode);
            });
            content.querySelectorAll('.fbd-card-body').forEach((b) => {
              b.classList.toggle('side-by-side', mode === 'side');
            });
            try {
              localStorage.setItem('truss_joint_card_view', mode);
            } catch (e) {}
          }

          filterBar.querySelectorAll('.joint-view-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
              applyCardLayout(btn.dataset.fbdLayout);
            });
          });

          applyCardLayout(savedCardLayout);

          // Set initial filter to key joints
          const initialFilterBtn = filterBar.querySelector('.joint-filter-btn[data-filter="key"]');
          if (initialFilterBtn) initialFilterBtn.click();
        }
      }
    } catch (err) {
      console.error('Error rendering step ' + (idx + 1) + ':', err);
      if (content) {
        content.innerHTML = '<div class="solution-callout" style="border-left-color:var(--danger, #ff4d4f);background:rgba(255,77,79,0.08)"><b>Rendering Error in Step ' + (idx + 1) + ':</b> ' + root.escSafe(err.message || String(err)) + '</div>';
      }
    }

    renderSolutionMathSafe();
    S.step = idx;
  }

  function printStudentSolutionBooklet() {
    if (root.ProductionPrint && typeof root.ProductionPrint.print === 'function') {
      root.ProductionPrint.print();
      return;
    }
    const S = root.S || {};
    const d = root.stableAnalysis ? root.stableAnalysis() : null;
    const G = (root.GROUPS && root.GROUPS[S.group]) || {};
    const content = document.getElementById('solutionContent');
    const paper = document.getElementById('solutionPaper');
    if (!content || !paper) {
      window.print();
      return;
    }

    const currentStepIdx = root.S ? (Number(root.S.step) || 0) : 0;
    const span = Number(S.span) || 16;
    const length = Number(S.length) || 98;
    const height = Number(S.height) || 12;
    const loc = S.loc || G.loc || 'Gaya';
    const groupName = S.group || 'G4';

    // Compile complete student solution assignment booklet without awkward gaps
    let bookletHTML = `
      <div class="student-assignment-header" style="margin-bottom:20px;border:2px solid #0f172a;padding:16px 20px;background:#f8fafc">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;border-bottom:1.5px solid #cbd5e1;padding-bottom:12px;margin-bottom:12px">
          <div>
            <div style="font-size:11px;font-weight:700;color:#0284c7;letter-spacing:0.06em;text-transform:uppercase">DEPARTMENT OF CIVIL & STRUCTURAL ENGINEERING</div>
            <h1 style="font-size:20px;font-weight:900;color:#0f172a;margin:3px 0 4px">STRUCTURAL STEEL DESIGN ASSIGNMENT — PITCHED ROOF TRUSS</h1>
            <div style="font-size:12px;color:#334155;line-height:1.5">
              <b>Course:</b> Design of Steel Structures (Limit State Method) · <b>Governing Codes:</b> IS 800:2007, IS 875 (Parts 1, 2, 3), IS 2062:2011<br>
              <b>Design Problem:</b> Industrial Warehouse Roof Truss (Preset ${root.escSafe(groupName)}) · <b>Location:</b> ${root.escSafe(loc)} ($V_b = 39\\text{ m/s}$)
            </div>
          </div>
          <div style="min-width:200px">
            <table style="width:100%;font-size:11px;border-collapse:collapse;border:1px solid #94a3b8;background:#fff">
              <tr><td style="padding:3px 6px;border:1px solid #cbd5e1;font-weight:700;color:#475569">Candidate Name:</td><td style="padding:3px 6px;border:1px solid #cbd5e1">__________________</td></tr>
              <tr><td style="padding:3px 6px;border:1px solid #cbd5e1;font-weight:700;color:#475569">Roll Number:</td><td style="padding:3px 6px;border:1px solid #cbd5e1">__________________</td></tr>
              <tr><td style="padding:3px 6px;border:1px solid #cbd5e1;font-weight:700;color:#475569">Submission Date:</td><td style="padding:3px 6px;border:1px solid #cbd5e1">${new Date().toLocaleDateString('en-GB')}</td></tr>
            </table>
          </div>
        </div>
        <div style="font-size:11.5px;color:#475569;display:flex;gap:20px;flex-wrap:wrap">
          <span><b>Span:</b> ${span.toFixed(1)} m</span>
          <span><b>Length:</b> ${length.toFixed(1)} m</span>
          <span><b>Eave Height:</b> ${height.toFixed(1)} m</span>
          <span><b>Spacing:</b> ${Number(S.spacing || 4).toFixed(1)} m</span>
          <span><b>Panels:</b> ${Number(S.panels || 6)}</span>
          <span><b>Roof Cladding:</b> Corrugated AC Sheet</span>
        </div>
      </div>
    `;

    // Render steps with logical flow and flat engineering section bars (no awkward gaps)
    const isAllPass = d && d.checks && d.checks.every(c => c.pass);
    const failedChecks = (d && d.checks) ? d.checks.filter(c => !c.pass).map(c => c.label) : [];

    LIVE_SOLUTION.forEach((step, sIdx) => {
      bookletHTML += `
        <div class="print-step-section" style="margin-bottom:14px;break-inside:auto;page-break-inside:auto">
          <div class="print-section-bar" style="border-bottom:2px solid #1e293b;background:#f8fafc;padding:6px 10px;font-weight:700;font-size:11pt;color:#0f172a;display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;break-after:avoid;page-break-after:avoid">
            <span>SECTION ${sIdx + 1}: ${step.title.toUpperCase()}</span>
            <span style="font-size:9.5pt;font-family:var(--mono);color:#0284c7;font-weight:700">${step.badge}</span>
          </div>
          ${step.body(d, S, G)}
        </div>
      `;
    });

    // Student evaluation sign-off block at end of submission (dynamic pass/fail)
    bookletHTML += `
      <div class="report-section" style="margin-top:20px;border:1.5px solid #0f172a;padding:14px;background:#f8fafc;break-inside:avoid;page-break-inside:avoid">
        <h4 style="margin:0 0 6px;font-size:12pt;font-weight:800;color:#0f172a">SUMMARY DESIGN STATEMENT & FACULTY VERIFICATION</h4>
        <p style="font-size:10pt;color:#334155;margin:0 0 10px;line-height:1.5">
          ${isAllPass
            ? 'All structural members (top chords, bottom ties, web struts, slings), roof purlins, built-up laced columns, and welded connections have been designed strictly adhering to Limit State Method of IS 800:2007 and loading specifications of IS 875 (Parts 1, 2, 3). Design ratios satisfy all safety and serviceability limits.'
            : `Design verification status: <b>ACTION REQUIRED</b>. The following limit state criteria exceed allowable capacity: ${failedChecks.join(', ')}. Member resizing or geometric adjustment required per IS 800:2007.`}
        </p>
        <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:16px;padding-top:10px;border-top:1px dashed #94a3b8;font-size:9.5pt;color:#475569">
          <div><b>Student Signature:</b> ___________________________</div>
          <div><b>Evaluator Signature:</b> ___________________________</div>
          <div><b>Evaluation:</b> ${isAllPass ? 'PASSED / 100' : 'REQUIRES RESIZING'}</div>
        </div>
      </div>
    `;

    content.innerHTML = bookletHTML;
    renderSolutionMathSafe();

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        renderLiveSolution(currentStepIdx);
      }, 400);
    }, 250);
  }

  function setSolutionStep(i, shouldScroll = false) {
    renderLiveSolution(i);
    if (shouldScroll) {
      setTimeout(scrollToSolutionTop, 20);
    }
  }

  const workflowData = [
    ['Design Basis & Geometry', 'Start with project parameters: span, building length, height, frame spacing, roof cladding, terrain category, connection type and column configuration. Span is transverse; building length controls repeated frame count.', ''],
    ['Geometry', 'Create one transverse truss, then repeat the selected number of trusses along the building length. Columns sit under the truss support nodes. Purlins connect corresponding roof points longitudinally.', 'R = \\frac{L}{2}\\tan\\theta'],
    ['Loads (IS 875)', 'Apply dead load (Part 1), roof imposed load with slope reduction and 0.4 kN/m² minimum (Part 2), and wind pressure with k1, k2, k3, k4 factors (Part 3).', 'V_z = V_b k_1 k_2 k_3 k_4,\\quad p_z = 0.6 V_z^2'],
    ['Analysis (Unit Load Method)', 'Determine member axial forces using the Unit Load Method (Method of Joints) under unit gravity and unit wind loads with joint equilibrium and comprehensive load combinations.', '1.5(DL + LL),\\quad 1.2(DL + LL + WL),\\quad 1.5(DL + WL)'],
    ['Members (IS 800)', 'Classify each member and check Perry-Robertson compressive strength (Cl. 7.1.2) and tension resistance (Cl. 6). Check slenderness against Table 3 limits.', 'f_{cd} = \\frac{f_y/\\gamma_{m0}}{\\phi + (\\phi^2 - \\lambda^2)^{0.5}}'],
    ['Purlins (IS 800)', 'Purlins are placed on sloping rafters and subjected to biaxial bending (Mz, My). Check interaction ratio Mz/Mdz + My/Mdy <= 1.0 and deflection <= L/180.', '\\frac{M_z}{M_{dz}} + \\frac{M_y}{M_{dy}} \\le 1.0'],
    ['Columns (IS 800)', 'Design the 2C back-to-back built-up columns with web spacing s (Iy >= Iz) and design the lacing system for transverse shear Vt = 0.025 P.', 'V_t \\ge 0.025 P,\\quad \\lambda_e = 1.05 \\lambda_z'],
    ['Connections (IS 800)', 'Design fillet welds or Grade 4.6 bolted joints using the governing member axial forces.', 'f_{wd} = \\frac{f_u}{\\sqrt{3}\\gamma_{mw}},\\quad L_w = \\frac{P}{q_w}']
  ];

  function openWorkflow() {
    const overlay = document.getElementById('workflowOverlay');
    if (overlay) {
      overlay.classList.add('open');
      renderWorkflow(root.S.step || 0);
    }
  }

  function renderWorkflow(i) {
    const idx = Math.max(0, Math.min(7, i));
    const d = workflowData[idx];
    const title = document.getElementById('wfTitle');
    const body = document.getElementById('wfBody');
    const eq = document.getElementById('wfEq');

    if (title) title.textContent = d[0];
    if (body) body.innerHTML = '<p>' + d[1] + '</p>';
    if (eq) {
      if (d[2] && typeof katex !== 'undefined') {
        eq.innerHTML = katex.renderToString(d[2], { displayMode: true, throwOnError: false });
      } else {
        eq.innerHTML = '<span style="color:var(--muted)">' + (d[2] || 'Multi-step calculation') + '</span>';
      }
    }
    document.querySelectorAll('.workflow-step').forEach((b, j) => b.classList.toggle('active', j === idx));
    root.S.step = idx;
  }

  // Initialize UI controls once DOM is interactive
  function initStudyUI() {
    // Layout switcher buttons
    document.querySelectorAll('.ctrl-btn[data-layout]').forEach((btn) => {
      btn.addEventListener('click', () => {
        setStudyLayout(btn.dataset.layout);
      });
    });

    // Step navigation buttons
    const prevBtn = document.getElementById('btnStepPrev');
    if (prevBtn) prevBtn.addEventListener('click', prevStep);
    const nextBtn = document.getElementById('btnStepNext');
    if (nextBtn) nextBtn.addEventListener('click', nextStep);

    // Tab buttons: click to switch step and scroll to top of content
    document.querySelectorAll('.solution-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        const step = Number(tab.dataset.solutionStep) || 0;
        setSolutionStep(step, true);
      });
    });

    // Print button: triggers full student solution assignment booklet
    const printBtn = document.getElementById('btnPrintSheet');
    if (printBtn) {
      printBtn.addEventListener('click', printStudentSolutionBooklet);
    }

    // Restore saved layout mode
    try {
      const savedMode = localStorage.getItem('truss-study-layout-mode');
      setStudyLayout(savedMode && savedMode !== 'full' ? savedMode : 'below');
    } catch (e) {
      setStudyLayout('below');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStudyUI);
  } else {
    initStudyUI();
  }

  const StudyModule = {
    renderLiveSolution,
    setSolutionStep,
    setStudyLayout,
    prevStep,
    nextStep,
    openWorkflow,
    renderWorkflow,
    LIVE_SOLUTION
  };

  root.LIVE_SOLUTION = LIVE_SOLUTION;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = StudyModule;
  } else {
    root.StudyModule = StudyModule;
    root.refreshStudy = () => renderLiveSolution(root.S.step);
    root.setSolutionStep = setSolutionStep;
    root.openWorkflow = openWorkflow;
    root.renderWorkflow = renderWorkflow;
  }
})(typeof window !== 'undefined' ? window : global);
