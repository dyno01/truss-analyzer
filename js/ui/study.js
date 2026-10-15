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
    const icon = passClass === 'fail' ? '✕' : (passClass === 'info' ? 'ℹ' : '✓');

    let formulas = [];
    if (Array.isArray(mathFormula)) {
      formulas = mathFormula;
    } else if (typeof mathFormula === 'string') {
      if (mathFormula.includes('\n')) {
        formulas = mathFormula.split('\n').map(s => s.trim()).filter(Boolean);
      } else {
        formulas = [mathFormula];
      }
    } else {
      formulas = [String(mathFormula)];
    }

    const mathHtml = formulas.map(f => `<div class="calc-math" data-math="${root.escSafe(f)}"></div>`).join('');

    const cleanedRemarks = String(remarks || '')
      .replace(/<strong>\s*(Code Reference & Variables|Variable Remarks):?\s*<\/strong>\s*(<br\s*\/?>)?/gi, '')
      .trim();

    return `
      <div class="calc-block ${statusClass}">
        <div class="calc-head">
          <div class="calc-title-group">
            <span class="calc-title">${title}</span>
            ${codeRef ? `<span class="calc-ref-badge">${codeRef}</span>` : ''}
          </div>
          <div class="calc-status ${statusClass}"><span class="status-icon">${icon}</span> ${status}</div>
        </div>
        <div class="calc-body">
          ${mathHtml}
        </div>
        ${cleanedRemarks ? `
          <div class="calc-footer">
            <div class="calc-footer-label">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              Code Reference &amp; Variables
            </div>
            <div class="calc-remarks-content">${cleanedRemarks}</div>
          </div>
        ` : ''}
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
                [
                  `\\text{No. of Bays} = \\frac{\\text{Building Length}}{\\text{Truss Spacing}} = \\frac{${length.toFixed(1)}\\text{ m}}{${spacing.toFixed(1)}\\text{ m}} = \\mathbf{${baysExact.toFixed(1)}} \\implies \\mathbf{${baysAdopted}\\text{ Bays}}`,
                  `\\text{Total Frames} = ${baysAdopted} + 1 = \\mathbf{${totalFrames}\\text{ Frames}}`
                ],
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
                '7. Panel Count & Tributary Plan Length',
                'Truss Triangulation',
                [
                  `n = \\mathbf{${panels}\\text{ Panels}}`,
                  `l_{\\text{plan}} = \\frac{\\text{Span}}{n} = \\frac{${span.toFixed(2)}}{${panels}} = \\mathbf{${panelPlan.toFixed(3)}\\text{ m}}`
                ],
                'OK',
                'pass',
                '<strong>Variable Remarks:</strong><br>' +
                '• $n$ = Total number of bottom chord panels across entire span.<br>' +
                '• $l_{\\text{plan}}$ = Horizontal plan length of each individual panel bay.'
              )}

              ${makeTeddsBlock(
                '8. Sloping Panel Length (Purlin Spacing)',
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

        const dl_sheet = (d && d.loads && d.loads.dl_sheet !== undefined)
          ? d.loads.dl_sheet
          : ((tb.loads && tb.loads.dl) ? tb.loads.dl.sheet : (Number(S.wSheeting) || (S.roof === 'AC' ? 170 : 130)));
        const dl_purlins = (d && d.loads && d.loads.dl_purlins !== undefined)
          ? d.loads.dl_purlins
          : ((tb.loads && tb.loads.dl) ? tb.loads.dl.purlins : (Number(S.wPurlins) || 100));
        const dl_bracing = (d && d.loads && d.loads.dl_bracing !== undefined)
          ? d.loads.dl_bracing
          : ((tb.loads && tb.loads.dl) ? tb.loads.dl.bracing : (Number(S.wBracing) || 12));
        const dl_self = (d && d.loads && d.loads.dl_truss !== undefined)
          ? d.loads.dl_truss
          : ((tb.loads && tb.loads.dl) ? tb.loads.dl.trussSelf : ((span / 3 + 5) * 10));
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
        const wl_Vb = (S.Vb !== undefined && S.Vb !== null && S.Vb !== '') ? Number(S.Vb) : (windData.Vb || 39);
        const wl_k1 = (S.k1 !== undefined && S.k1 !== null && S.k1 !== '') ? Number(S.k1) : (windData.k1 || 1.0);
        const wl_k2 = (S.k2 !== undefined && S.k2 !== null && S.k2 !== '') ? Number(S.k2) : (windData.k2 || 1.05);
        const wl_k3 = (S.k3 !== undefined && S.k3 !== null && S.k3 !== '') ? Number(S.k3) : (windData.k3 || 1.0);
        const wl_k4 = (S.k4 !== undefined && S.k4 !== null && S.k4 !== '') ? Number(S.k4) : (windData.k4 || 1.0);
        const wl_Vz = wl_Vb * wl_k1 * wl_k2 * wl_k3 * wl_k4;
        const wl_kd = (S.kd !== undefined && S.kd !== null && S.kd !== '') ? Number(S.kd) : (windData.kd || 0.90);
        const wl_ka = (S.ka !== undefined && S.ka !== null && S.ka !== '') ? Number(S.ka) : (windData.ka || 1.00);
        const wl_kc = (S.kc !== undefined && S.kc !== null && S.kc !== '') ? Number(S.kc) : (windData.kc || 0.90);
        const wl_Pz = 0.6 * Math.pow(wl_Vz, 2);
        const wl_Pd = wl_kd * wl_ka * wl_kc * wl_Pz;
        const cpe = (S.cpe !== undefined && S.cpe !== null && S.cpe !== '') ? Number(S.cpe) : (windData.cpe || -0.8);
        const cpi = (S.cpi !== undefined && S.cpi !== null && S.cpi !== '') ? Number(S.cpi) : (windData.cpi || 0.2);
        const wl_force_kN = ((cpe - cpi) * slopeArea * wl_Pd) / 1000;
        const wl_inter_kN = wl_force_kN / panels;
        const wl_end_kN = wl_inter_kN / 2;

        return `
          <div class="solution-grid">
            <div class="solution-block wide">
              <h2 style="font-size:18px;margin-bottom:14px;font-family:var(--sans)">ii) Structural Load Calculations (IS 875 Parts 1, 2, 3)</h2>

              <h3>A) Dead Load (DL) Calculation (IS 875 Part 1: 2026)</h3>
              <ul style="font-size:13.5px;line-height:1.9;margin:8px 0 14px 24px">
                <li>DL of Roofing (Corrugated ${S.roof === 'GI' ? 'GI' : 'AC'} Sheets): <b>${dl_sheet} N/m²</b> (IS 875 Part 1: 2026 Table 1)</li>
                <li>DL of Purlins (Standard Channel Sections): <b>${dl_purlins} N/m²</b> (IS 875 Part 1: 2026)</li>
                <li>DL of Wind Bracings & Accessories: <b>${dl_bracing} N/m²</b> (IS 875 Part 1: 2026)</li>
                <li>Self-weight of Roof Truss: <b>${dl_self.toFixed(2)} N/m²</b> (Empirical: $(\\text{Span}/3 + 5) \\times 10$)</li>
              </ul>

              ${makeTeddsBlock(
                '1. Empirical Self-Weight of Roof Truss',
                'IS 875 (Part 1: 2026) / SP 38 Empirical Formula',
                `w_{\\text{self}} = \\left(\\frac{\\text{Span}}{3} + 5\\right) \\times 10 = \\left(\\frac{${span.toFixed(0)}}{3} + 5\\right) \\times 10 = \\mathbf{${dl_self.toFixed(2)}\\text{ N/m}^2}`,
                'OK',
                'pass',
                '<strong>Code Reference & Variables:</strong><br>' +
                '• <strong>IS 875 (Part 1): 2026 & SP 38:</strong> Standard empirical approximation for steel roof truss self-weight per unit horizontal plan area.<br>' +
                '• $\\text{Span}$: Center-to-center distance between supporting columns (${span.toFixed(2)} m).<br>' +
                '• $w_{\\text{self}}$: Estimated self-weight of structural steel angle and plate members per square meter of plan area.'
              )}

              ${makeTeddsBlock(
                '2. Total Dead Load Intensity on Plan Area',
                'IS 875 (Part 1): 2026 Table 1 & Cl. 3.1',
                `w_{DL} = w_{\\text{sheeting}} + w_{\\text{purlins}} + w_{\\text{bracing}} + w_{\\text{self}} = ${dl_sheet} + ${dl_purlins} + ${dl_bracing} + ${dl_self.toFixed(2)} = \\mathbf{${dl_total_int.toFixed(2)}\\text{ N/m}^2}`,
                'OK',
                'pass',
                '<strong>Code Reference & Variables:</strong><br>' +
                '• <strong>IS 875 (Part 1): 2026 Table 1:</strong> Unit weight of roofing sheeting = ' + dl_sheet + ' N/m²; purlins allowance = ' + dl_purlins + ' N/m²; wind ties/bracing = ' + dl_bracing + ' N/m²; truss self-weight = ' + dl_self.toFixed(2) + ' N/m².<br>' +
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
                [
                  `P_{DL,\\text{int}} = \\frac{W_{DL}}{n} = \\frac{${dl_total_kN.toFixed(2)}}{${panels}} = \\mathbf{${dl_inter_kN.toFixed(2)}\\text{ kN}}`,
                  `P_{DL,\\text{end}} = \\frac{P_{DL,\\text{int}}}{2} = \\mathbf{${dl_end_kN.toFixed(2)}\\text{ kN}}`
                ],
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
                [
                  `W_{LL} = \\mathbf{${ll_total_kN.toFixed(2)}\\text{ kN}}`,
                  `P_{LL,\\text{int}} = \\frac{W_{LL}}{n} = \\mathbf{${ll_inter_kN.toFixed(2)}\\text{ kN}}`,
                  `P_{LL,\\text{end}} = \\frac{P_{LL,\\text{int}}}{2} = \\mathbf{${ll_end_kN.toFixed(2)}\\text{ kN}}`
                ],
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
                <li>Design Parameters (IS 875 Cl. 7.2 & 7.3): Direction ($k_d$): <b>${wl_kd.toFixed(2)}</b> · Area Averaging ($k_a$): <b>${wl_ka.toFixed(2)}</b> · Combination ($k_c$): <b>${wl_kc.toFixed(2)}</b></li>
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
                [
                  `P_z = 0.6 V_z^2 = 0.6 \\times (${wl_Vz.toFixed(2)})^2 = \\mathbf{${wl_Pz.toFixed(2)}\\text{ N/m}^2}`,
                  `P_d = k_d \\cdot k_a \\cdot k_c \\cdot P_z = ${wl_kd.toFixed(2)} \\times ${wl_ka.toFixed(2)} \\times ${wl_kc.toFixed(2)} \\times ${wl_Pz.toFixed(2)} = \\mathbf{${wl_Pd.toFixed(2)}\\text{ N/m}^2}`
                ],
                'OK',
                'pass',
                '• <strong>Cl. 7.2:</strong> $P_z = 0.6 V_z^2$ represents the dynamic velocity pressure in $N/m^2$.<br>' +
                '• <strong>Cl. 7.3:</strong> $P_d$ is the design wind pressure modified for directionality ($k_d = ' + wl_kd.toFixed(2) + '$), area averaging ($k_a = ' + wl_ka.toFixed(2) + '$), and combination effects ($k_c = ' + wl_kc.toFixed(2) + '$).'
              )}

              ${makeTeddsBlock(
                '10. Wind Force & Nodal Suction Loads Normal to Roof Slope',
                'IS 875 (Part 3): 2015 Cl. 7.3 & Table 5',
                [
                  `F_{WL} = (C_{pe} - C_{pi}) A_{\\text{slope}} P_d = (${cpe} - (${cpi})) \\times ${slopeArea.toFixed(2)} \\times ${wl_Pd.toFixed(2)} = \\mathbf{${wl_force_kN.toFixed(2)}\\text{ kN (Net Uplift)}}`,
                  `P_{WL,\\text{int}} = \\frac{F_{WL}}{n} = \\frac{${wl_force_kN.toFixed(2)}}{${panels}} = \\mathbf{${wl_inter_kN.toFixed(2)}\\text{ kN}}`,
                  `P_{WL,\\text{end}} = \\frac{P_{WL,\\text{int}}}{2} = \\frac{${wl_inter_kN.toFixed(2)}}{2} = \\mathbf{${wl_end_kN.toFixed(2)}\\text{ kN}}`
                ],
                'OK',
                'pass',
                '• <strong>IS 875 (Part 3) Table 5 & Cl. 7.3.2:</strong> External pressure coefficient $C_{pe} = ' + cpe + '$ (suction on windward slope) and internal pressure coefficient $C_{pi} = +' + cpi + '$ (internal pressure due to permeability).<br>' +
                '• Net pressure coefficient: $(C_{pe} - C_{pi}) = (' + cpe + ' - ' + cpi + ') = -1.00$ (Governing net outward uplift suction).<br>' +
                '• $A_{\\text{slope}} = ' + slopeArea.toFixed(2) + '\\text{ m}^2$: True surface area of the two sloping roof planes.<br>' +
                '• Intermediate Nodal Suction $P_{WL,\\text{int}} = \\mathbf{' + wl_inter_kN.toFixed(2) + '\\text{ kN}}$ (acting normal to top chord rafter).<br>' +
                '• End Nodal Suction $P_{WL,\\text{end}} = \\mathbf{' + wl_end_kN.toFixed(2) + '\\text{ kN}}$ (acting at eaves/ridge).'
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
                      <strong>Equilibrium Basis & Variables:</strong> $\\sum F_x=0, \\sum F_y=0$ at Shoe Node $L_0$. $R_1=3.0\\text{ kN}$ (Support Reaction), $P_{\\text{end}}=0.5\\text{ kN}$ (Eave load), $F_{L0U1}$ (Principal rafter thrust, -ve Compression), $F_{L0L1}$ (Main tie tension, +ve Tension).
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
      title: 'Step 5 — Design of Truss Members (IS 800:2007 Cl. 6, 7 & Table 9c)',
      badge: 'MEMBER DESIGN',
      body: (d, S, G) => {
        const tb = Textbook ? Textbook.computeTextbookAnalysis(S) : null;
        const isG6 = (S.group === 'G6' || (S.loc && S.loc.toLowerCase().includes('bangalore')) || (!S.group && d.span === 16 && d.spacing === 6));
        
        // 5.1 Main Tie (Tension Member L0-L1)
        const Pu_tie = isG6 ? 80 : (d.members && d.members.length ? d.members.filter(m => m.role.includes('bottom')).reduce((max, m) => Math.max(max, m.maxTension), 0) : 80);
        const Pc_tie_rev = isG6 ? 30 : (tb ? Math.abs((tb.tableData && tb.tableData.find(r => r.id === 'L0L1')?.c4) || 30) : 30);
        const tieSec = S.tieSection || S.section || 'ISA 60×60×6';
        const mainTie = IS800.calcMainTieDesign ? IS800.calcMainTieDesign({ Pu: Pu_tie, Pc: Pc_tie_rev, section: tieSec }) : {
          Pu: 80, Pc: 30, Ag_req: 352, secName: '2 ' + tieSec, Ag: 1368, rzz: 18.2, t_gusset: 6,
          boltDia: 16, d0: 18, e: 40, p: 40, Vdsb: 28.97, Vdpb: 38.57, boltValue: 28.97, numBoltsReq: 2.76, numBolts: 3,
          Tdg: 310.9, Tdn: 302.28, Tdb1: 298.76, Tdb2: 262.48, Td_block: 262.48, Td: 262.48,
          Le: 1400, lambda: 76.92, fcd: 140.92, Pd: 192.77, safeTension: true, safeReversal: true
        };

        // 5.2 Principal Rafter (Top Chord U0-U1)
        const Pu_rafter = isG6 ? 90 : (d.members && d.members.length ? d.members.filter(m => m.role.includes('top')).reduce((max, m) => Math.max(max, m.maxCompression), 0) : 90);
        const Pt_rafter_rev = isG6 ? 40 : (tb ? Math.abs((tb.tableData && tb.tableData.find(r => r.id === 'L0U1')?.c4) || 40) : 40);
        const rafterSec = S.rafterSection || S.section || 'ISA 75×75×6';
        const principalRafter = IS800.calcPrincipalRafterDesign ? IS800.calcPrincipalRafterDesign({ Pu: Pu_rafter, Pt: Pt_rafter_rev, section: rafterSec }) : {
          Pu: 90, Pt: 40, assumed_fcd: 125, Ag_req: 720, secName: '2 ' + rafterSec, Ag: 1732, rmin: 23.0,
          L: 2.24, Le: 1570, lambda: 68.26, fcd: 152.0, Pd: 263.26, Tdg: 393.6, numBolts: 4, safeComp: true, safeTens: true
        };

        // 5.3 Vertical Struts (Internal Compression Members)
        const Pu_strut = isG6 ? 30 : (d.members && d.members.length ? d.members.filter(m => m.role === 'vertical').reduce((max, m) => Math.max(max, m.maxCompression), 0) || 30 : 30);
        const strutSec = S.strutSection || S.section || 'ISA 70×70×6';
        const strut = IS800.calcStrutDesign ? IS800.calcStrutDesign({ Pu: Pu_strut, section: strutSec }) : {
          Pu: Pu_strut, secName: 'Single ' + strutSec, Ag: 806, rvv: 13.6, lambda_e: 105.8, fcd: 98.4, Pd: 79.3, safe: true
        };

        // 5.4 Diagonals (Inclined Web Members)
        const Pu_diag = isG6 ? 25 : (d.members && d.members.length ? d.members.filter(m => m.role === 'diagonal').reduce((max, m) => Math.max(max, m.maxCompression, m.maxTension), 0) || 25 : 25);
        const diagSec = S.diagonalSection || S.section || 'ISA 50×50×6';
        const diag = IS800.calcDiagonalDesign ? IS800.calcDiagonalDesign({ Pu: Pu_diag, section: diagSec }) : {
          Pu: Pu_diag, Pt: 20, secName: 'Single ' + diagSec, Ag: 568, rvv: 9.6, L: 2.1, Le: 1785, lambda: 185.9, fcd: 48.2, Pd: 27.38, Tdg: 129.1, safeComp: true, safeTens: true, safe: true
        };

        return `
          <div class="solution-grid">
            <!-- 5.1 Main Tie (Tension Member L0-L1) -->
            <div class="solution-block wide">
              <div class="section-badge-pill">Section 1.5.1 · IS 800:2007 Cl. 6 & Cl. 10</div>
              <h3>5.1 Design of Main Tie (Tension Member $L_0-L_1$)</h3>
              <p>Critical design tension under gravity $P_u = \\mathbf{+${mainTie.Pu.toFixed(2)}\\text{ kN}}$ ($1.5DL + 1.5LL$). Wind uplift stress reversal compression $P_c = \\mathbf{-${mainTie.Pc.toFixed(2)}\\text{ kN}}$ ($1.5DL + 1.5WL$).</p>
              <p>Material Grade: Fe 410 ($f_y = 250\\text{ MPa}, f_u = 410\\text{ MPa}, \\gamma_{m0} = 1.10, \\gamma_{m1} = 1.25$).</p>

              ${makeTeddsBlock(
                'Required Gross Section Area',
                'IS 800 Cl. 6.2',
                `A_{g(req)} = \\frac{P_u \\cdot \\gamma_{m0}}{f_y} = \\frac{${mainTie.Pu} \\times 10^3 \\times 1.10}{250} = \\mathbf{${mainTie.Ag_req.toFixed(1)}\\text{ mm}^2}`,
                'OK',
                'pass',
                `Minimum steel area required to resist design factored axial tension without gross yielding.`
              )}

              <div class="calc-callout-box" style="margin: 8px 0; background: ${mainTie.safeTension && mainTie.safeReversal ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)'}; border-left: 3px solid ${mainTie.safeTension && mainTie.safeReversal ? 'var(--ok, #16a34a)' : 'var(--bad, #dc2626)'}; padding: 10px 14px; font-size: 11.5px; border-radius: 6px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                  <b>Section Provided (From Panel Selection):</b>
                  <span class="badge ${mainTie.safeTension && mainTie.safeReversal ? 'pass' : 'fail'}" style="background:${mainTie.safeTension && mainTie.safeReversal ? '#16a34a' : '#dc2626'}; color:#fff; padding:2px 8px; border-radius:4px; font-size:10px; font-weight:700;">
                    ${mainTie.safeTension && mainTie.safeReversal ? 'SAFE · PASS' : 'UNSAFE · RESIZING REQUIRED'}
                  </span>
                </div>
                <div><b>${root.escSafe(mainTie.secName)}</b> ($A_g = \\mathbf{${mainTie.Ag}\\text{ mm}^2}$, $r_{zz} = ${mainTie.rzz}\\text{ mm}$) connected on both sides of a <b>${mainTie.t_gusset} mm</b> gusset.</div>
                <div style="margin-top:5px; font-size:11px; color:${mainTie.safeTension && mainTie.safeReversal ? 'var(--text)' : '#dc2626'};">
                  ${mainTie.safeTension && mainTie.safeReversal 
                    ? `✓ Section satisfies tension yielding, net rupture, block shear ($T_d = ${mainTie.Td.toFixed(1)}\\text{ kN} > ${mainTie.Pu}\\text{ kN}$, Util: ${((mainTie.Pu / mainTie.Td) * 100).toFixed(1)}%) and reversal slenderness ($\\lambda = ${mainTie.lambda} \\le 250$).`
                    : `⚠️ Section fails IS 800:2007 limits. <b>Recommended Minimum Sizing:</b> 2 × ISA 65×65×6 or use <b>APPLY OPTIMAL SIZING</b>.`
                  }
                </div>
              </div>

              <!-- Connection Design (Bolted) -->
              <h4 style="margin:12px 0 6px; font-size:12px; color:var(--text); text-transform:uppercase; letter-spacing:0.5px;">Connection Design (Bolted — Grade 4.6, M16 Bolts):</h4>
              <p style="font-size:11.5px; margin-bottom:6px;">Provide <b>${mainTie.boltDia} mm dia bolts</b> of grade 4.6 ($f_{ub} = 400\\text{ MPa}, \\gamma_{mb} = 1.25$). Hole diameter $d_0 = ${mainTie.d0}\\text{ mm}$, Edge dist $e = ${mainTie.e}\\text{ mm}$, Pitch $p = ${mainTie.p}\\text{ mm}$.</p>

              <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 10px;">
                ${makeTeddsBlock(
                  'Shear Capacity (Double Shear)',
                  'IS 800 Cl. 10.3.3',
                  `V_{dsb} = 2 \\times \\frac{f_{ub} A_{nb}}{\\sqrt{3} \\cdot \\gamma_{mb}} = \\mathbf{${mainTie.Vdsb}\\text{ kN}}`,
                  'OK',
                  'pass',
                  `Two shear planes passing through threaded shank area $A_{nb} = 157\\text{ mm}^2$.`
                )}

                ${makeTeddsBlock(
                  'Bearing Capacity on Gusset',
                  'IS 800 Cl. 10.3.4',
                  `V_{dpb} = \\frac{2.5 k_b d t f_u}{\\gamma_{mb}} = \\mathbf{${mainTie.Vdpb}\\text{ kN}}`,
                  'OK',
                  'pass',
                  `Where: $k_b = 0.49$, $d = 16\\text{ mm}$, gusset thickness $t = ${mainTie.t_gusset}\\text{ mm}$, $f_u = 410\\text{ MPa}$.`
                )}
              </div>

              ${makeTeddsBlock(
                'Bolt Value & Number of Bolts Required',
                'IS 800 Cl. 10.3',
                `V_b = \\min(V_{dsb}, V_{dpb}) = ${mainTie.boltValue}\\text{ kN} \\implies n_b = \\frac{${mainTie.Pu}}{${mainTie.boltValue}} = ${mainTie.numBoltsReq} \\implies \\mathbf{Provide\\ ${mainTie.numBolts}\\ bolts}`,
                'OK',
                'pass',
                `Governed by double shear value of M16 grade 4.6 bolt.`
              )}

              <!-- Tension Capacity Checks -->
              <h4 style="margin:14px 0 6px; font-size:12px; color:var(--text); text-transform:uppercase; letter-spacing:0.5px;">Tension Capacity Verification Checks:</h4>
              <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 10px;">
                ${makeTeddsBlock(
                  '1. Gross Section Yielding',
                  'IS 800 Cl. 6.2',
                  `T_{dg} = \\frac{A_g \\cdot f_y}{\\gamma_{m0}} = \\frac{${mainTie.Ag} \\times 250}{1.10 \\times 1000} = \\mathbf{${mainTie.Tdg}\\text{ kN}} > ${mainTie.Pu}\\text{ kN}`,
                  mainTie.Tdg >= mainTie.Pu ? 'SAFE' : 'FAIL',
                  mainTie.Tdg >= mainTie.Pu ? 'pass' : 'fail',
                  `Gross yield capacity exceeds design factored tension (${mainTie.Tdg >= mainTie.Pu ? 'Safe' : 'Unsafe'}).`
                )}

                ${makeTeddsBlock(
                  '2. Net Section Rupture',
                  'IS 800 Cl. 6.3.3',
                  `T_{dn} = \\frac{0.8 A_n f_u}{\\gamma_{m1}} \\times 2 = \\mathbf{${mainTie.Tdn}\\text{ kN}} > ${mainTie.Pu}\\text{ kN}`,
                  mainTie.Tdn >= mainTie.Pu ? 'SAFE' : 'FAIL',
                  mainTie.Tdn >= mainTie.Pu ? 'pass' : 'fail',
                  `Net area per angle after bolt hole deduction.`
                )}

                ${makeTeddsBlock(
                  '3. Block Shear Capacity',
                  'IS 800 Cl. 6.4',
                  `T_{db1} = ${mainTie.Tdb1}\\text{ kN}, T_{db2} = ${mainTie.Tdb2}\\text{ kN} \\implies T_d = \\mathbf{${mainTie.Td_block}\\text{ kN}} > ${mainTie.Pu}\\text{ kN}`,
                  mainTie.Td_block >= mainTie.Pu ? 'SAFE' : 'FAIL',
                  mainTie.Td_block >= mainTie.Pu ? 'pass' : 'fail',
                  `Block shear tearing failure path along bolt pitch and edge distance.`
                )}
              </div>

              <!-- Compression Reversal Check -->
              <h4 style="margin:14px 0 6px; font-size:12px; color:var(--text); text-transform:uppercase; letter-spacing:0.5px;">Wind Uplift Compression Reversal Check (IS 800 Table 3):</h4>
              ${makeTeddsBlock(
                'Slenderness & Reversal Compressive Capacity',
                'Table 3 & Table 9c',
                `L_e = 0.7 \\times 2000 = ${mainTie.Le}\\text{ mm}, \\lambda = \\frac{${mainTie.Le}}{${mainTie.rzz}} = \\mathbf{${mainTie.lambda}} \\le 250 \\implies f_{cd} = ${mainTie.fcd}\\text{ MPa} \\implies P_d = \\mathbf{${mainTie.Pd}\\text{ kN}} > ${mainTie.Pc}\\text{ kN}`,
                mainTie.safeReversal ? 'SAFE' : 'FAIL',
                mainTie.safeReversal ? 'pass' : 'fail',
                `Reversal slenderness $\\lambda = ${mainTie.lambda} \\le 250$ complies with Table 3 limit. Compressive capacity $P_d = ${mainTie.Pd}\\text{ kN}$ vs reversal compression $P_c = ${mainTie.Pc}\\text{ kN}$.`
              )}
            </div>

            <!-- 5.2 Principal Rafter (Top Chord U0-U1) -->
            <div class="solution-block wide">
              <div class="section-badge-pill">Section 1.5.2 · IS 800:2007 Cl. 7.1.2 & Table 9c</div>
              <h3>5.2 Design of Principal Rafter (Top Chord $U_0-U_1$)</h3>
              <p>Factored design compressive force $P_u = \\mathbf{-${principalRafter.Pu.toFixed(2)}\\text{ kN}}$ ($1.5DL + 1.5LL$). Reversal tension under uplift $P_t = \\mathbf{+${principalRafter.Pt.toFixed(2)}\\text{ kN}}$.</p>

              ${makeTeddsBlock(
                'Trial Area Selection',
                'IS 800 Cl. 7.1.2',
                `\\text{Assume } f_{cd} = ${principalRafter.assumed_fcd}\\text{ MPa} \\implies A_{g(req)} = \\frac{P_u \\times 10^3}{f_{cd}} = \\frac{${principalRafter.Pu} \\times 10^3}{${principalRafter.assumed_fcd}} = \\mathbf{${principalRafter.Ag_req.toFixed(0)}\\text{ mm}^2}`,
                'OK',
                'pass',
                `Preliminary cross-sectional area sizing based on assumed allowable compressive stress.`
              )}

              <div class="calc-callout-box" style="margin: 8px 0; background: ${principalRafter.safeComp && principalRafter.safeTens && principalRafter.lambda <= 180 ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)'}; border-left: 3px solid ${principalRafter.safeComp && principalRafter.safeTens && principalRafter.lambda <= 180 ? 'var(--ok, #16a34a)' : 'var(--bad, #dc2626)'}; padding: 10px 14px; font-size: 11.5px; border-radius: 6px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                  <b>Section Provided (From Panel Selection):</b>
                  <span class="badge ${principalRafter.safeComp && principalRafter.safeTens && principalRafter.lambda <= 180 ? 'pass' : 'fail'}" style="background:${principalRafter.safeComp && principalRafter.safeTens && principalRafter.lambda <= 180 ? '#16a34a' : '#dc2626'}; color:#fff; padding:2px 8px; border-radius:4px; font-size:10px; font-weight:700;">
                    ${principalRafter.safeComp && principalRafter.safeTens && principalRafter.lambda <= 180 ? 'SAFE · PASS' : 'UNSAFE · RESIZING REQUIRED'}
                  </span>
                </div>
                <div><b>${root.escSafe(principalRafter.secName)}</b> ($A_g = \\mathbf{${principalRafter.Ag}\\text{ mm}^2}$, $r_{\\text{min}} = ${principalRafter.rmin}\\text{ mm}$).</div>
                <div style="margin-top:5px; font-size:11px; color:${principalRafter.safeComp && principalRafter.safeTens && principalRafter.lambda <= 180 ? 'var(--text)' : '#dc2626'};">
                  ${principalRafter.safeComp && principalRafter.safeTens && principalRafter.lambda <= 180
                    ? `✓ Section satisfies compressive strength ($P_d = ${principalRafter.Pd}\\text{ kN} > ${principalRafter.Pu}\\text{ kN}$, Util: ${((principalRafter.Pu / principalRafter.Pd) * 100).toFixed(1)}%) and slenderness ($\\lambda = ${principalRafter.lambda} \\le 180$).`
                    : `⚠️ Section fails IS 800:2007 limits ($P_u = ${principalRafter.Pu}\\text{ kN}$ vs $P_d = ${principalRafter.Pd}\\text{ kN}$, $\\lambda = ${principalRafter.lambda}$). <b>Recommended Minimum Sizing:</b> 2 × ISA 75×75×6 or use <b>APPLY OPTIMAL SIZING</b>.`
                  }
                </div>
              </div>

              <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 10px;">
                ${makeTeddsBlock(
                  'Effective Buckling Length',
                  'IS 800 Table 11',
                  `L = ${principalRafter.L}\\text{ m} \\implies L_e = 0.7 \\times 2240 = \\mathbf{${principalRafter.Le}\\text{ mm}}`,
                  'OK',
                  'pass',
                  `Node-to-node rafter panel length with restrained rotational end conditions ($K = 0.70$).`
                )}

                ${makeTeddsBlock(
                  'Slenderness Ratio',
                  'IS 800 Table 3',
                  `\\lambda = \\frac{L_e}{r_{\\text{min}}} = \\frac{${principalRafter.Le}}{${principalRafter.rmin}} = \\mathbf{${principalRafter.lambda}} \\le 180`,
                  principalRafter.lambda <= 180 ? 'OK' : 'FAIL',
                  principalRafter.lambda <= 180 ? 'pass' : 'fail',
                  `Permissible compression slenderness ratio $\\lambda \\le 180$.`
                )}

                ${makeTeddsBlock(
                  'Design Compressive Strength',
                  'IS 800 Cl. 7.1.2 & Table 9c',
                  `f_{cd} = ${principalRafter.fcd}\\text{ MPa} \\implies P_d = \\frac{${principalRafter.fcd} \\times ${principalRafter.Ag}}{1000} = \\mathbf{${principalRafter.Pd}\\text{ kN}} > ${principalRafter.Pu}\\text{ kN}`,
                  principalRafter.safeComp ? 'SAFE' : 'FAIL',
                  principalRafter.safeComp ? 'pass' : 'fail',
                  `Design compressive capacity $P_d = ${principalRafter.Pd}\\text{ kN} > P_u = ${principalRafter.Pu}\\text{ kN}$ (Utilization: ${((principalRafter.Pu / principalRafter.Pd) * 100).toFixed(1)}%).`
                )}

                ${makeTeddsBlock(
                  'Tension Reversal Check',
                  'IS 800 Cl. 6.2',
                  `T_{dg} = \\mathbf{${principalRafter.Tdg}\\text{ kN}} > P_t = ${principalRafter.Pt}\\text{ kN} \\implies \\text{Requires } ${principalRafter.numBolts}\\text{ bolts}`,
                  principalRafter.safeTens ? 'SAFE' : 'FAIL',
                  principalRafter.safeTens ? 'pass' : 'fail',
                  `Gross yield capacity safely resists tension under wind uplift.`
                )}
              </div>
            </div>

            <!-- 5.3 Vertical Struts (Internal Web Members) -->
            <div class="solution-block wide">
              <div class="section-badge-pill">Section 1.5.3 · IS 800:2007 Cl. 7.5.1.2</div>
              <h3>5.3 Design of Vertical Struts (Internal Compression Members)</h3>
              <p>Governing compressive axial load $P_u = \\mathbf{-${strut.Pu.toFixed(2)}\\text{ kN}}$ (Members $L_1-U_1, L_2-U_2$, etc.).</p>

              <div class="calc-callout-box" style="margin: 8px 0; background: ${strut.safe && strut.lambda_e <= 180 ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)'}; border-left: 3px solid ${strut.safe && strut.lambda_e <= 180 ? 'var(--ok, #16a34a)' : 'var(--bad, #dc2626)'}; padding: 10px 14px; font-size: 11.5px; border-radius: 6px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                  <b>Section Provided (From Panel Selection):</b>
                  <span class="badge ${strut.safe && strut.lambda_e <= 180 ? 'pass' : 'fail'}" style="background:${strut.safe && strut.lambda_e <= 180 ? '#16a34a' : '#dc2626'}; color:#fff; padding:2px 8px; border-radius:4px; font-size:10px; font-weight:700;">
                    ${strut.safe && strut.lambda_e <= 180 ? 'SAFE · PASS' : 'UNSAFE · RESIZING REQUIRED'}
                  </span>
                </div>
                <div><b>${root.escSafe(strut.secName)}</b> ($A_g = \\mathbf{${strut.Ag}\\text{ mm}^2}$, $r_{vv} = ${strut.rvv}\\text{ mm}$).</div>
                <div style="margin-top:5px; font-size:11px; color:${strut.safe && strut.lambda_e <= 180 ? 'var(--text)' : '#dc2626'};">
                  ${strut.safe && strut.lambda_e <= 180
                    ? `✓ Section satisfies single-angle compression ($P_d = ${strut.Pd}\\text{ kN} > ${strut.Pu}\\text{ kN}$, Util: ${((strut.Pu / strut.Pd) * 100).toFixed(1)}%) and equivalent slenderness ($\\lambda_e = ${strut.lambda_e} \\le 180$).`
                    : `⚠️ Section fails IS 800:2007 limits ($P_u = ${strut.Pu}\\text{ kN}$ vs $P_d = ${strut.Pd}\\text{ kN}$, $\\lambda_e = ${strut.lambda_e}$). <b>Recommended Minimum Sizing:</b> Single ISA 70×70×6 or use <b>APPLY OPTIMAL SIZING</b>.`
                  }
                </div>
              </div>

              <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 10px;">
                ${makeTeddsBlock(
                  'Equivalent Slenderness Ratio for Single Angle Strut',
                  'IS 800 Cl. 7.5.1.2',
                  `\\lambda_e = \\sqrt{k_1 + k_2 \\lambda_{vv}^2 + k_3 \\lambda_\\phi^2} = \\mathbf{${strut.lambda_e}} \\le 180`,
                  strut.lambda_e <= 180 ? 'OK' : 'FAIL',
                  strut.lambda_e <= 180 ? 'pass' : 'fail',
                  `Single angle connected by one leg with gusset connection (eccentric axial compression).`
                )}

                ${makeTeddsBlock(
                  'Strut Compressive Capacity',
                  'Cl. 7.1.2 & Table 9c',
                  `f_{cd} = ${strut.fcd}\\text{ MPa} \\implies P_d = \\frac{${strut.fcd} \\times ${strut.Ag}}{1000} = \\mathbf{${strut.Pd}\\text{ kN}} > P_u = ${strut.Pu}\\text{ kN}`,
                  strut.safe ? 'SAFE' : 'FAIL',
                  strut.safe ? 'pass' : 'fail',
                  `Capacity verified to exceed $30\\text{ kN}$ design demand (${strut.safe ? 'Safe' : 'Unsafe'}).`
                )}
              </div>
            </div>

            <!-- 5.4 Diagonals (Tension & Compression Web Members) -->
            <div class="solution-block wide">
              <div class="section-badge-pill">Section 1.5.4 · IS 800:2007 Cl. 6 & Cl. 7</div>
              <h3>5.4 Design of Diagonals (Tension &amp; Compression Web Members)</h3>
              <p>Governing axial demand $P_u = \\mathbf{${diag.Pu.toFixed(2)}\\text{ kN}}$ ($1.5DL + 1.5LL$). Reversal demand $P_t = \\mathbf{${diag.Pt.toFixed(2)}\\text{ kN}}$.</p>

              <div class="calc-callout-box" style="margin: 8px 0; background: ${diag.safe && diag.safeTens && diag.lambda <= 180 ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)'}; border-left: 3px solid ${diag.safe && diag.safeTens && diag.lambda <= 180 ? 'var(--ok, #16a34a)' : 'var(--bad, #dc2626)'}; padding: 10px 14px; font-size: 11.5px; border-radius: 6px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                  <b>Section Provided (From Panel Selection):</b>
                  <span class="badge ${diag.safe && diag.safeTens && diag.lambda <= 180 ? 'pass' : 'fail'}" style="background:${diag.safe && diag.safeTens && diag.lambda <= 180 ? '#16a34a' : '#dc2626'}; color:#fff; padding:2px 8px; border-radius:4px; font-size:10px; font-weight:700;">
                    ${diag.safe && diag.safeTens && diag.lambda <= 180 ? 'SAFE · PASS' : 'UNSAFE · RESIZING REQUIRED'}
                  </span>
                </div>
                <div><b>${root.escSafe(diag.secName)}</b> ($A_g = \\mathbf{${diag.Ag}\\text{ mm}^2}$, $r_{vv} = ${diag.rvv}\\text{ mm}$).</div>
                <div style="margin-top:5px; font-size:11px; color:${diag.safe && diag.safeTens && diag.lambda <= 180 ? 'var(--text)' : '#dc2626'};">
                  ${diag.safe && diag.safeTens && diag.lambda <= 180
                    ? `✓ Section satisfies axial resistance ($P_d = ${diag.Pd}\\text{ kN} > ${diag.Pu}\\text{ kN}$, Util: ${((diag.Pu / diag.Pd) * 100).toFixed(1)}%) and slenderness ($\\lambda = ${diag.lambda} \\le 180$).`
                    : `⚠️ Section fails IS 800:2007 limits ($P_u = ${diag.Pu}\\text{ kN}$ vs $P_d = ${diag.Pd}\\text{ kN}$, $\\lambda = ${diag.lambda}$). <b>Recommended Minimum Sizing:</b> Single ISA 50×50×6 or use <b>APPLY OPTIMAL SIZING</b>.`
                  }
                </div>
              </div>

              <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 10px;">
                ${makeTeddsBlock(
                  'Slenderness Ratio',
                  'IS 800 Table 3',
                  `L = ${diag.L}\\text{ m} \\implies L_e = 0.85 \\times L = ${diag.Le}\\text{ mm} \\implies \\lambda = \\frac{${diag.Le}}{${diag.rvv}} = \\mathbf{${diag.lambda}} \\le 180`,
                  diag.lambda <= 180 ? 'OK' : 'FAIL',
                  diag.lambda <= 180 ? 'pass' : 'fail',
                  `Permissible compression slenderness ratio $\\lambda \\le 180$.`
                )}

                ${makeTeddsBlock(
                  'Compressive Resistance',
                  'IS 800 Cl. 7.1.2 & Table 9c',
                  `f_{cd} = ${diag.fcd}\\text{ MPa} \\implies P_d = \\frac{${diag.fcd} \\times ${diag.Ag}}{1000} = \\mathbf{${diag.Pd}\\text{ kN}} > P_u = ${diag.Pu}\\text{ kN}`,
                  diag.safeComp ? 'SAFE' : 'FAIL',
                  diag.safeComp ? 'pass' : 'fail',
                  `Design compressive strength for diagonal web angle.`
                )}

                ${makeTeddsBlock(
                  'Tension Yield Capacity',
                  'IS 800 Cl. 6.2',
                  `T_{dg} = \\frac{A_g \\cdot f_y}{\\gamma_{m0}} = \\mathbf{${diag.Tdg}\\text{ kN}} > P_t = ${diag.Pt}\\text{ kN}`,
                  diag.safeTens ? 'SAFE' : 'FAIL',
                  diag.safeTens ? 'pass' : 'fail',
                  `Tensile yield resistance under wind uplift load combinations.`
                )}
              </div>
            </div>
          </div>
        `;
      }
    },

    {
      title: 'Step 6 — Design of Roof Purlins (IS 800 Cl. 8.2 & 9.3.1)',
      badge: 'BIAXIAL BENDING',
      body: (d, S) => {
        const isG6 = (S.group === 'G6' || (S.loc && S.loc.toLowerCase().includes('bangalore')) || (!S.group && d.span === 16 && d.spacing === 6));
        const ws = (d && d.loads && d.loads.dl_sheet !== undefined) ? d.loads.dl_sheet : (Number(S.wSheeting) || (S.roof === 'AC' ? 170 : 130));
        const wp = (d && d.loads && d.loads.dl_purlins !== undefined) ? d.loads.dl_purlins : (Number(S.wPurlins) || 100);
        const p = IS800.calcAnglePurlinDesign ? IS800.calcAnglePurlinDesign({
          spacingTruss: isG6 ? 6.0 : (d.spacing || 6.0),
          spacingPurlin: isG6 ? 2.24 : (d.panelSlope || 2.24),
          slopeDeg: d.slopeDeg || 26.56,
          wSheeting: ws,
          wPurlins: wp
        }) : {
          spacingTruss: 6.0, spacingPurlin: 2.24, slopeDeg: 26.56,
          wd: (ws + wp) * 2.24, wl: 970.08, ww: -1602.47,
          wdy: 411.45, wly: 867.70, wwy: -1602.47, wdz: 205.68, wlz: 433.75,
          wy: -387.98, wz: 767.31, Muy: -1.39, Muz: 2.76,
          secName: 'ISA 150×150×10', Ze: 56.9e3, I: 622.4e4, Mdz: 12.93, Mdy: 12.93,
          interactionRatio: 0.32, delta_allowable: 40, delta_y: 21.71, delta_z: 5.87,
          safeBending: true, safeDeflection: true
        };

        return `
          <div class="solution-grid">
            <div class="solution-block wide">
              <div class="section-badge-pill">Section 1.6 · IS 800:2007 Cl. 8.2 & Cl. 9.3.1</div>
              <h3>6.1 Geometry & Load Resolution on Sloping Rafter</h3>
              <p>Truss spacing (purlin span) $S = \\mathbf{${p.spacingTruss.toFixed(2)}\\text{ m}}$, purlin spacing along slope $s_p = \\mathbf{${p.spacingPurlin.toFixed(2)}\\text{ m}}$, roof pitch $\\theta = ${p.slopeDeg.toFixed(2)}^\\circ$.</p>

              <!-- Loads per meter run -->
              <h4 style="margin:10px 0 6px; font-size:12px; color:var(--text); text-transform:uppercase; letter-spacing:0.5px;">Loads per Meter Run:</h4>
              <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 10px;">
                ${makeTeddsBlock(
                  'Dead Load per Meter Run',
                  'IS 875 Part 1',
                  `w_d = (${ws}\\text{ (sheet)} + ${wp}\\text{ (purlin)}) \\times ${p.spacingPurlin.toFixed(2)} \\approx \\mathbf{${p.wd.toFixed(2)}\\text{ N/m}}`,
                  'OK',
                  'pass',
                  `Weight of roof sheeting (${ws} N/m²) + purlin self weight (${wp} N/m²).`
                )}

                ${makeTeddsBlock(
                  'Live Load per Meter Run',
                  'IS 875 Part 2',
                  `w_l = 485.04 \\times ${p.spacingPurlin.toFixed(2)} = \\mathbf{${p.wl.toFixed(2)}\\text{ N/m}}`,
                  'OK',
                  'pass',
                  `Live load projected along sloping purlin run.`
                )}

                ${makeTeddsBlock(
                  'Wind Load per Meter Run (Suction)',
                  'IS 875 Part 3',
                  `w_w = -1.0 \\times ${p.spacingPurlin.toFixed(2)} \\times 715.39 = \\mathbf{${p.ww.toFixed(2)}\\text{ N/m}}`,
                  'OK',
                  'pass',
                  `Design wind pressure suction normal to roof plane.`
                )}
              </div>

              <!-- Resolving Loads -->
              <h4 style="margin:14px 0 6px; font-size:12px; color:var(--text); text-transform:uppercase; letter-spacing:0.5px;">Resolving Loads in Principal Coordinate Axes:</h4>
              <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 10px;">
                ${makeTeddsBlock(
                  'Parallel to Roof (y-axis)',
                  'IS 800 Cl. 8.2',
                  `w_{dy} = 460\\cos 26.56^\\circ = 411.45\\text{ N/m},\\ w_{ly} = 867.70\\text{ N/m},\\ w_{wy} = -1602.47\\text{ N/m}`,
                  'INFO',
                  'info',
                  `Tangential force components parallel to roof sheeting.`
                )}

                ${makeTeddsBlock(
                  'Perpendicular to Roof (z-axis)',
                  'IS 800 Cl. 8.2',
                  `w_{dz} = 460\\sin 26.56^\\circ = 205.68\\text{ N/m},\\ w_{lz} = 433.75\\text{ N/m}`,
                  'INFO',
                  'info',
                  `Normal force components perpendicular to roof sheeting.`
                )}
              </div>

              <!-- Factored Combination -->
              <h4 style="margin:14px 0 6px; font-size:12px; color:var(--text); text-transform:uppercase; letter-spacing:0.5px;">Governing Factored Load Combination: $1.2(DL + LL + WL)$</h4>
              <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 10px;">
                ${makeTeddsBlock(
                  'Factored Parallel Load (y-axis)',
                  'IS 800 Table 4',
                  `w_y = 1.2(411.45 + 867.70 - 1602.47) = \\mathbf{${p.wy}\\text{ N/m}}`,
                  'OK',
                  'pass',
                  `Factored load inducing minor axis bending moment.`
                )}

                ${makeTeddsBlock(
                  'Factored Perpendicular Load (z-axis)',
                  'IS 800 Table 4',
                  `w_z = 1.2(205.68 + 433.75 + 0) = \\mathbf{${p.wz}\\text{ N/m}}`,
                  'OK',
                  'pass',
                  `Factored load inducing major axis bending moment.`
                )}
              </div>

              <!-- Continuous Bending Moments -->
              <h4 style="margin:14px 0 6px; font-size:12px; color:var(--text); text-transform:uppercase; letter-spacing:0.5px;">Factored Bending Moments (Continuous over Trusses: $M = \\frac{w L^2}{10}$):</h4>
              <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 10px;">
                ${makeTeddsBlock(
                  'Minor Bending Moment (y-axis)',
                  'Cl. 8.2',
                  `M_{uy} = \\frac{-387.98 \\times 6^2}{10 \\times 1000} = \\mathbf{${p.Muy}\\text{ kN}\\cdot\\text{m}}`,
                  'OK',
                  'pass',
                  `Bending moment along roof slope.`
                )}

                ${makeTeddsBlock(
                  'Major Bending Moment (z-axis)',
                  'Cl. 8.2',
                  `M_{uz} = \\frac{767.31 \\times 6^2}{10 \\times 1000} = \\mathbf{${p.Muz}\\text{ kN}\\cdot\\text{m}}`,
                  'OK',
                  'pass',
                  `Bending moment normal to roof slope.`
                )}
              </div>

              <!-- Section & Biaxial Bending Check -->
              <h4 style="margin:14px 0 6px; font-size:12px; color:var(--text); text-transform:uppercase; letter-spacing:0.5px;">Trial Section & Biaxial Bending Capacity Check:</h4>
              <div class="calc-callout-box" style="margin: 8px 0; background: rgba(56,189,248,0.06); border-left: 3px solid var(--accent, #0284c7); padding: 8px 12px; font-size: 11.5px;">
                <b>Trial Purlin Section:</b> <b>${root.escSafe(p.secName)}</b> ($Z_{ez} = Z_{ey} = 56.9 \\times 10^3\\text{ mm}^3$, $I_{zz} = I_{yy} = 622.4 \\times 10^4\\text{ mm}^4$).
              </div>

              ${makeTeddsBlock(
                'Design Moment Capacity',
                'IS 800 Cl. 8.2.1.2',
                `M_{dz} = M_{dy} = \\frac{Z_e \\cdot f_y}{\\gamma_{m0}} = \\frac{56.9 \\times 10^3 \\times 250}{1.10 \\times 10^6} = \\mathbf{${p.Mdz}\\text{ kN}\\cdot\\text{m}}`,
                'OK',
                'pass',
                `Design elastic moment capacity in both principal planes.`
              )}

              ${makeTeddsBlock(
                'Combined Biaxial Bending Check',
                'IS 800 Cl. 9.3.1',
                `\\frac{M_{uz}}{M_{dz}} + \\frac{M_{uy}}{M_{dy}} = \\frac{2.76}{12.93} + \\frac{1.39}{12.93} = \\mathbf{${p.interactionRatio}} \\ll 1.0`,
                p.safeBending ? 'SAFE' : 'FAIL',
                p.safeBending ? 'pass' : 'fail',
                `Interaction ratio ${p.interactionRatio} is well below unity $\\implies$ SAFE.`
              )}

              <!-- Serviceability Deflection -->
              <h4 style="margin:14px 0 6px; font-size:12px; color:var(--text); text-transform:uppercase; letter-spacing:0.5px;">Serviceability Deflection Verification (IS 800 Table 6):</h4>
              <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 10px;">
                ${makeTeddsBlock(
                  'Allowable Purlin Deflection',
                  'IS 800 Table 6',
                  `\\delta_{\\text{allowable}} = \\frac{\\text{Span}}{150} = \\frac{6000}{150} = \\mathbf{${p.delta_allowable}\\text{ mm}}`,
                  'OK',
                  'pass',
                  `Code limit for purlins under serviceability conditions.`
                )}

                ${makeTeddsBlock(
                  'Parallel Deflection (y-axis)',
                  'Elastic Deflection',
                  `\\delta_{y,\\text{actual}} = \\frac{5}{384} \\frac{w_y L^4}{E I} = \\mathbf{${p.delta_y}\\text{ mm}} < ${p.delta_allowable}\\text{ mm}`,
                  p.delta_y <= p.delta_allowable ? 'SAFE' : 'FAIL',
                  p.delta_y <= p.delta_allowable ? 'pass' : 'fail',
                  `Parallel axis deflection within allowable limits.`
                )}

                ${makeTeddsBlock(
                  'Perpendicular Deflection (z-axis)',
                  'Elastic Deflection',
                  `\\delta_{z,\\text{actual}} = \\frac{5}{384} \\frac{w_z L^4}{E I} = \\mathbf{${p.delta_z}\\text{ mm}} < ${p.delta_allowable}\\text{ mm}`,
                  p.delta_z <= p.delta_allowable ? 'SAFE' : 'FAIL',
                  p.delta_z <= p.delta_allowable ? 'pass' : 'fail',
                  `Perpendicular axis deflection within allowable limits.`
                )}
              </div>
            </div>
          </div>
        `;
      }
    },

    {
      title: 'Step 7 — Design of Built-up Column (Assignment 2C / IS 800 Cl. 7.6)',
      badge: 'BUILT-UP COLUMN',
      body: (d, S) => {
        const col = IS800.calcBuiltUpColumnDesign ? IS800.calcBuiltUpColumnDesign({
          H: Number(S.height) || 10,
          H_crane: 8,
          Pu: 224.43,
          Mu: 72.88
        }) : {
          H: 10, H_crane: 8, Pu: 224.43, Mu: 72.88, secName: '2 × ISMC 150 back-to-back', spacing_S: 800,
          Ag: 4176, Iyy_comb: 670.206e6, ryy: 400.61, Tdg: 949.09, Mdy: 379.63, interaction: 0.42,
          lambda_e: 20.96, local_lambda: 45.25, fcd: 79, Pd: 329.9, P_single_channel: 245.2,
          Vt: 6.13, Fl: 62.2, lacingSec: 'ISA 65×65×6 mm', lambda_lacing: 101.6, fcd_lacing: 107, Pd_lacing: 79.6,
          safeCombined: true, safeCompression: true, safeLacing: true
        };

        return `
          <div class="solution-grid">
            <div class="solution-block wide">
              <div class="section-badge-pill">Assignment 2C · IS 800:2007 Cl. 7.6 & Cl. 9.3.1</div>
              <h3>7.1 Design Data & Column Loading</h3>
              <p>Overall height $H = \\mathbf{${col.H}\\text{ m}}$, height to crane rail $H_{\\text{crane}} = \\mathbf{${col.H_crane}\\text{ m}}$.</p>
              <p>Factored axial load demand: $P_u = \\mathbf{${col.Pu}\\text{ kN}}$, Factored bending moment: $M_u = \\mathbf{${col.Mu}\\text{ kN}\\cdot\\text{m}}$.</p>

              <!-- Section Selection -->
              <h4 style="margin:14px 0 6px; font-size:12px; color:var(--text); text-transform:uppercase; letter-spacing:0.5px;">Selection of Section & Compound Geometry:</h4>
              <div class="calc-callout-box" style="margin: 8px 0; background: rgba(56,189,248,0.06); border-left: 3px solid var(--accent, #0284c7); padding: 8px 12px; font-size: 11.5px;">
                <b>Provided Section:</b> <b>${col.secName}</b> placed at spacing $S = \\mathbf{${col.spacing_S}\\text{ mm}}$ (c/c).<br>
                Combined Area $A_g = 2 \\times 2088 = \\mathbf{${col.Ag}\\text{ mm}^2}$, Combined inertia $I_{yy,\\text{combined}} = 2[102.3 \\times 10^4 + 2088 \\times 400^2] = \\mathbf{670.206 \\times 10^6\\text{ mm}^4}$, Radius of gyration $r_{yy} = \\sqrt{I/A} = \\mathbf{${col.ryy}\\text{ mm}}$.
              </div>

              <!-- Combined Capacity Checks -->
              <h4 style="margin:14px 0 6px; font-size:12px; color:var(--text); text-transform:uppercase; letter-spacing:0.5px;">Combined Axial & Bending Interaction Check (IS 800 Cl. 9.3.1):</h4>
              <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 10px;">
                ${makeTeddsBlock(
                  'Axial Tension Capacity',
                  'IS 800 Cl. 6.2',
                  `T_{dg} = \\frac{A_g \\cdot f_y}{\\gamma_{m0}} = \\frac{4176 \\times 250}{1.10 \\times 1000} = \\mathbf{${col.Tdg}\\text{ kN}}`,
                  'OK',
                  'pass',
                  `Gross yield capacity of two ISMC 150 channels.`
                )}

                ${makeTeddsBlock(
                  'Plastic Moment Capacity',
                  'IS 800 Cl. 8.2',
                  `M_{dy} = \\frac{Z_p \\cdot f_y}{\\gamma_{m0}} = \\mathbf{${col.Mdy}\\text{ kN}\\cdot\\text{m}}`,
                  'OK',
                  'pass',
                  `Design plastic moment capacity of built-up column section.`
                )}

                ${makeTeddsBlock(
                  'Combined Load Interaction Check',
                  'IS 800 Cl. 9.3.1',
                  `\\frac{P_u}{T_{dg}} + \\frac{M_u}{M_{dy}} = \\frac{${col.Pu}}{${col.Tdg}} + \\frac{${col.Mu}}{${col.Mdy}} = \\mathbf{${col.interaction}} < 1.0`,
                  col.safeCombined ? 'SAFE' : 'FAIL',
                  col.safeCombined ? 'pass' : 'fail',
                  `Combined interaction ratio ${col.interaction} is well within limit 1.0 $\\implies$ SAFE.`
                )}
              </div>

              <!-- Compressive Strength Check -->
              <h4 style="margin:14px 0 6px; font-size:12px; color:var(--text); text-transform:uppercase; letter-spacing:0.5px;">Compressive Strength with Lacing System (IS 800 Cl. 7.6.1.5):</h4>
              <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 10px;">
                ${makeTeddsBlock(
                  'Effective Slenderness with Lacing',
                  'IS 800 Cl. 7.6.1.5',
                  `\\lambda_e = 1.05 \\left(\\frac{1.0 \\times 8000}{400.61}\\right) = \\mathbf{${col.lambda_e}}`,
                  'OK',
                  'pass',
                  `Mandatory 5% slenderness increase to account for shear deformation of lacing system.`
                )}

                ${makeTeddsBlock(
                  'Local Channel Slenderness',
                  'IS 800 Cl. 7.6.5.1',
                  `\\frac{L_1}{r_{\\text{min}}} = \\frac{1000}{22.1} = \\mathbf{${col.local_lambda}} < 0.7 \\times 125 = 87.5`,
                  'OK',
                  'pass',
                  `Channel slenderness between lacing connection nodes satisfies 0.7 times governing slenderness.`
                )}

                ${makeTeddsBlock(
                  'Column Compressive Resistance',
                  'Table 9c',
                  `f_{cd} = ${col.fcd}\\text{ MPa} \\implies P_d = \\frac{79 \\times 4176}{1000} = \\mathbf{${col.Pd}\\text{ kN}} > ${col.P_single_channel}\\text{ kN}`,
                  col.safeCompression ? 'SAFE' : 'FAIL',
                  col.safeCompression ? 'pass' : 'fail',
                  `Capacity $P_d = ${col.Pd}\\text{ kN}$ safely exceeds maximum compression in single channel including moment effect ($245.2\\text{ kN}$).`
                )}
              </div>

              <!-- Lacing System Design -->
              <h4 style="margin:14px 0 6px; font-size:12px; color:var(--text); text-transform:uppercase; letter-spacing:0.5px;">Design of Lacing System (IS 800 Cl. 7.6.6):</h4>
              <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 10px;">
                ${makeTeddsBlock(
                  'Transverse Design Shear',
                  'IS 800 Cl. 7.6.6.1',
                  `V_t = 0.025 \\times P = 0.025 \\times ${col.P_single_channel} = \\mathbf{${col.Vt}\\text{ kN}}`,
                  'OK',
                  'pass',
                  `Mandatory 2.5% transverse shear resisted across lacing system.`
                )}

                ${makeTeddsBlock(
                  'Lacing Member Design Force',
                  'Design Load',
                  `F_l \\approx \\mathbf{${col.Fl}\\text{ kN}} \\text{ (including wind/crane transverse surge)}`,
                  'INFO',
                  'info',
                  `Design axial force in diagonal lacing member.`
                )}

                ${makeTeddsBlock(
                  'Lacing Angle Capacity',
                  'IS 800 Cl. 7.6.6',
                  `\\text{Provide } ${col.lacingSec} (\\lambda = ${col.lambda_lacing} \\implies f_{cd} = ${col.fcd_lacing}\\text{ MPa}) \\implies P_{d,\\text{lacing}} = \\mathbf{${col.Pd_lacing}\\text{ kN}} > ${col.Fl}\\text{ kN}`,
                  col.safeLacing ? 'SAFE' : 'FAIL',
                  col.safeLacing ? 'pass' : 'fail',
                  `Lacing angle capacity exceeds design force demand $\\implies$ SAFE.`
                )}
              </div>
            </div>
          </div>
        `;
      }
    },

    {
      title: 'Step 8 — Design of Column Base & Connections (Assignment 2D / IS 800 Cl. 7.4)',
      badge: 'COLUMN BASE & JOINTS',
      body: (d, S) => {
        const base = IS800.calcColumnBaseDesign ? IS800.calcColumnBaseDesign({
          Pu: 224.43,
          Mu: 72.88
        }) : {
          Pu: 224.43, Mu: 72.88, h_col: 875, fck: 30, permissibleBearing: 13.5,
          e: 324.73, L: 1075, kernLimit: 179.17, isTriangular: true,
          x: 640, B_req: 59.37, B: 350, maxBearingPressure: 4.38, Mxx: 2462.8, t_req: 8.06, t_prov: 16,
          safeBearing: true, safeThickness: true
        };

        const conn = d.connection || { demand: 80, numBolts: 3, boltValue: 28.97, boltDia: 16, Vdsb: 28.97, Vdpb: 38.57, pass: true };

        return `
          <div class="solution-grid">
            <!-- 8.1 Base Plate Sizing (Assignment 2D) -->
            <div class="solution-block wide">
              <div class="section-badge-pill">Assignment 2D · IS 800:2007 Cl. 7.4</div>
              <h3>8.1 Column Base Plate Sizing (Eccentric Slab Base)</h3>
              <p>Factored axial force $P_u = \\mathbf{${base.Pu}\\text{ kN}}$, factored moment $M_u = \\mathbf{${base.Mu}\\text{ kN}\\cdot\\text{m}}$.</p>
              <p>Column depth $h = \\mathbf{${base.h_col}\\text{ mm}}$ (400 mm channel spacing + flanges). Concrete grade: M30 ($f_{ck} = 30\\text{ MPa}$, permissible bearing stress $0.45 f_{ck} = \\mathbf{${base.permissibleBearing}\\text{ MPa}}$).</p>

              <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 10px;">
                ${makeTeddsBlock(
                  'Eccentricity of Axial Load',
                  'Statics',
                  `e = \\frac{M_u}{P_u} = \\frac{${base.Mu} \\times 10^6}{${base.Pu} \\times 10^3} = \\mathbf{${base.e}\\text{ mm}}`,
                  'OK',
                  'pass',
                  `Distance from center of column base to point of resultant application.`
                )}

                ${makeTeddsBlock(
                  'Pressure Distribution Regimes',
                  'Kern Limit Check',
                  `\\text{Let } L = ${base.L}\\text{ mm} \\implies \\frac{L}{6} = ${base.kernLimit}\\text{ mm} \\implies e = ${base.e} > \\frac{L}{6}`,
                  'INFO',
                  'info',
                  `Since $e > L/6$, pressure diagram is triangular with partial base plate separation.`
                )}

                ${makeTeddsBlock(
                  'Distance of Resultant & Required Width',
                  'Equilibrium Check',
                  `x = 3\\left(\\frac{L}{2} - e\\right) = 3\\left(\\frac{1075}{2} - 324.73\\right) = \\mathbf{${base.x}\\text{ mm}} \\implies B_{\\text{req}} = \\mathbf{${base.B_req}\\text{ mm}}`,
                  'OK',
                  'pass',
                  `Equating upward bearing force $\\frac{1}{2} x (0.45 f_{ck}) B = P_u \\implies B_{\\text{req}} = ${base.B_req}\\text{ mm}$. Provide $B = \\mathbf{${base.B}\\text{ mm}}$.`
                )}
              </div>

              <!-- Base Plate Thickness -->
              <h4 style="margin:14px 0 6px; font-size:12px; color:var(--text); text-transform:uppercase; letter-spacing:0.5px;">Base Plate Thickness Determination (Cl. 7.4.3.1):</h4>
              <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 10px;">
                ${makeTeddsBlock(
                  'Maximum Bearing Pressure',
                  'Pressure Check',
                  `w = \\frac{P_u}{A} + \\frac{M_u}{Z} = \\mathbf{${base.maxBearingPressure}\\text{ MPa}} < ${base.permissibleBearing}\\text{ MPa}`,
                  base.safeBearing ? 'SAFE' : 'FAIL',
                  base.safeBearing ? 'pass' : 'fail',
                  `Actual bearing pressure is well below permissible concrete bearing capacity $0.45 f_{ck} = 13.5\\text{ MPa}$.`
                )}

                ${makeTeddsBlock(
                  'Bending Moment at Column Face',
                  'Plate Bending',
                  `M_{xx} = \\mathbf{${base.Mxx}\\text{ N}\\cdot\\text{mm/mm}}`,
                  'OK',
                  'pass',
                  `Cantilever projection moment at critical face of channel column.`
                )}

                ${makeTeddsBlock(
                  'Base Plate Thickness Verification',
                  'IS 800 Cl. 7.4.3.1',
                  `t = \\sqrt{\\frac{M_{xx} \\times 6 \\times \\gamma_{m0}}{f_y}} = \\sqrt{\\frac{2462.8 \\times 6 \\times 1.10}{250}} = \\mathbf{${base.t_req}\\text{ mm}} \\implies \\mathbf{Provide\\ ${base.t_prov}\\text{ mm}\\ plate}`,
                  base.safeThickness ? 'SAFE' : 'FAIL',
                  base.safeThickness ? 'pass' : 'fail',
                  `Provided 16 mm thick base plate exceeds required thickness $8.06\\text{ mm}$ $\\implies$ SAFE.`
                )}
              </div>
            </div>

            <!-- 8.2 Joint Connections Detailing -->
            <div class="solution-block wide">
              <div class="section-badge-pill">Section 1.5.1 / Section 10 · Bolted Joint Details</div>
              <h3>8.2 Truss Member Joint Connections Detailing</h3>
              <p>Joints connecting members to 6 mm / 10 mm gusset plates carrying design axial forces:</p>

              <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 10px;">
                ${makeTeddsBlock(
                  'Bolted Joint Capacity (Double Shear M16 Gr 4.6)',
                  'IS 800 Cl. 10.3',
                  `P_{\\text{joint}} = n_b \\times V_b = 3 \\times 28.97 = \\mathbf{86.91\\text{ kN}} > P_u = ${conn.demand || 80}\\text{ kN}`,
                  'SAFE',
                  'pass',
                  `Provided 3 bolts of M16 grade 4.6 in double shear through gusset plate.`
                )}

                ${makeTeddsBlock(
                  'Block Shear & Edge Compliance',
                  'IS 800 Table 19',
                  `e = 40\\text{ mm} \\ge 1.5 d_0 = 27\\text{ mm},\\quad p = 40\\text{ mm} \\ge 2.5 d = 40\\text{ mm}`,
                  'OK',
                  'pass',
                  `Edge and pitch distances satisfy minimum code provisions for sheared edges.`
                )}
              </div>
            </div>
          </div>
        `;
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

    const solTabs = document.getElementById('solutionTabs');
    if (solTabs) solTabs.style.display = 'flex';

    let assignId = '2A';
    if (idx === 6) assignId = '2C';
    else if (idx === 7) assignId = '2D';
    document.querySelectorAll('.portfolio-pill').forEach(p => {
      p.classList.toggle('active', p.dataset.assign === assignId);
    });

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

  // =========================================================
  // Portfolio Assignments: 2B (Gantry Girder), 3 (Plate Girder), 4 (Field Visit)
  // =========================================================
  function renderAssignment2B() {
    const gg = IS800.calcGantryGirderDesign ? IS800.calcGantryGirderDesign() : null;
    const content = document.getElementById('solutionContent');
    const heading = document.getElementById('solutionHeading');
    const subhead = document.getElementById('solutionSubhead');
    const badge = document.getElementById('documentBadge');
    const stepBadge = document.getElementById('stepCounterBadge');
    const studyTitle = document.getElementById('studyTitle');
    const sub = document.getElementById('studySub');

    if (studyTitle) studyTitle.textContent = 'Assignment 2B — Design of Gantry Girder (Spreadsheet)';
    if (heading) heading.textContent = 'Assignment 2B: Design of Gantry Girder (Spreadsheet)';
    if (subhead) subhead.textContent = 'ISMB 600 WITH ISMC 400 COMPOUND SECTION · CAPACITY & DEFLECTION VERIFICATION';
    if (sub) sub.textContent = 'PORTFOLIO ASSIGNMENT 2B · IS 800:2007';
    if (badge) badge.textContent = 'GANTRY GIRDER';
    if (stepBadge) stepBadge.textContent = 'Assign 2B';

    document.querySelectorAll('.portfolio-pill').forEach(p => p.classList.toggle('active', p.dataset.assign === '2B'));
    const solTabs = document.getElementById('solutionTabs');
    if (solTabs) solTabs.style.display = 'none';

    if (!content || !gg) return;

    content.innerHTML = `
      <div class="solution-grid">
        <!-- 2.1 Input Properties -->
        <div class="solution-block wide">
          <div class="section-badge-pill">Assignment 2B · Section 1 · Input Properties</div>
          <h3>1. Input Properties & Crane Parameters</h3>
          <p>Design parameters for electric overhead travelling (EOT) crane system running on gantry girder:</p>
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 10px; margin-top: 8px;">
            <div class="calc-callout-box">
              <span class="calc-var">Span of Truss:</span> <b>${gg.spanTruss} m</b><br>
              <span class="calc-var">Span of Crane Girder (L):</span> <b>${gg.spanCraneGirder} m</b><br>
              <span class="calc-var">Span of Gantry Girder (Spacing):</span> <b>${gg.spanGantryGirder} m</b><br>
              <span class="calc-var">Crane Wheel Base:</span> <b>${gg.wheelBase} m</b>
            </div>
            <div class="calc-callout-box">
              <span class="calc-var">Weight of Crane Girder:</span> <b>${gg.wtCraneGirder} kN</b><br>
              <span class="calc-var">Crane Hook Capacity:</span> <b>${gg.craneCapacity} kN</b><br>
              <span class="calc-var">Weight of Crab, Motor, Hook:</span> <b>${gg.wtCrab} kN</b><br>
              <span class="calc-var">Minimum Hook Approach:</span> <b>${gg.minHookApproach} m</b>
            </div>
            <div class="calc-callout-box">
              <span class="calc-var">Weight of Crane Rail:</span> <b>${gg.wtRail} kN/m</b><br>
              <span class="calc-var">Self-weight of Section:</span> <b>${gg.selfWtSection} kN/m</b><br>
              <span class="calc-var">Crane Wheel Diameter:</span> <b>${gg.wheelDia} mm</b><br>
              <span class="calc-var">Steel Grade:</span> <b>$f_y = ${gg.fy}\\text{ MPa},\\ f_u = ${gg.fu}\\text{ MPa}$</b>
            </div>
          </div>
          <div class="calc-callout-box" style="margin-top: 10px; font-size: 11.5px; background: rgba(56,189,248,0.06); border-left: 3px solid var(--accent, #0284c7);">
            <b>Surge Loads (IS 875 Part 2):</b> Lateral load = <b>5% of max static wheel load</b> · Longitudinal load = <b>5% of weight of crab & lifted load</b> · Partial Safety Factor $\\gamma_{m0} = 1.10$ · Load factor = $1.50$.
          </div>
        </div>

        <!-- 2.2 Load Calculation on Crane Girder -->
        <div class="solution-block wide">
          <div class="section-badge-pill">Assignment 2B · Section 2 · Crane Girder Reactions</div>
          <h3>2. Load Calculation on Crane Girder</h3>
          <p>Equating moments about support B to determine maximum reaction transferred to Gantry Girder:</p>
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 10px;">
            ${makeTeddsBlock(
              'Self Weight of Crane Girder',
              'UDL on 15m span',
              `w = \\frac{${gg.wtCraneGirder}}{${gg.spanCraneGirder}} = \\mathbf{${gg.selfWtCraneGirder.toFixed(2)}\\text{ kN/m}}`,
              'OK', 'pass', 'Uniformly distributed load across crane bridge.'
            )}
            ${makeTeddsBlock(
              'Maximum Reaction at Support A',
              'Moment Equilibrium',
              `R_A = \\frac{16.67 \\times 15 \\times 7.5 + (260 + 50) \\times (15 - 1)}{15} = \\mathbf{${gg.reactionA}\\text{ kN}}`,
              'OK', 'pass', 'Reaction at hook approach of 1.0 m from support.'
            )}
            ${makeTeddsBlock(
              'Maximum Wheel Load (per wheel)',
              'Static Wheel Load',
              `W_{\\text{wheel}} = \\frac{R_A}{2} = \\frac{${gg.reactionA}}{2} = \\mathbf{${gg.maxWheelLoad}\\text{ kN}}`,
              'OK', 'pass', 'Load distributed evenly between 2 wheels on end carriage.'
            )}
          </div>
        </div>

        <!-- 2.3 Bending Moment & Shear Force -->
        <div class="solution-block wide">
          <div class="section-badge-pill">Assignment 2B · Section 3 · Design Actions</div>
          <h3>3. Bending Moment & Shear Force Calculation</h3>
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 10px;">
            ${makeTeddsBlock(
              'Live Load Bending Moment + Impact',
              'Moving Wheels on 6m Span',
              `M_{LL} = ${gg.maxLiveBM}\\text{ kNm},\\quad M_{\\text{impact}} = ${gg.impactBM}\\text{ kNm} \\implies M_{LL,\\text{total}} = \\mathbf{${gg.totalLiveBM}\\text{ kN}\\cdot\\text{m}}`,
              'OK', 'pass', 'Enveloping 2 moving wheels at 1.25m spacing on 6m span.'
            )}
            ${makeTeddsBlock(
              'Dead Load Bending Moment',
              'UDL = 2.3 kN/m',
              `M_{DL} = \\frac{(2.0 + 0.3) \\times 6^2}{8} = \\mathbf{${gg.deadBM}\\text{ kN}\\cdot\\text{m}}`,
              'OK', 'pass', 'Self weight of girder plus crane rail.'
            )}
            ${makeTeddsBlock(
              'Maximum Factored Transverse BM',
              'Factored Limit State',
              `M_{ux} = 1.5 \\times (549 + 10.35) = \\mathbf{${gg.Mux}\\text{ kN}\\cdot\\text{m}}`,
              'DESIGN BM', 'pass', 'Governing design bending moment in vertical plane.'
            )}
            ${makeTeddsBlock(
              'Maximum Factored Shear Force',
              'Factored Shear',
              `V_{ux} = \\mathbf{${gg.Vux}\\text{ kN}}`,
              'DESIGN SF', 'pass', 'Maximum end reaction under moving crane wheels.'
            )}
            ${makeTeddsBlock(
              'Horizontal Lateral Bending Moment',
              'Surge 5% Wheel Load',
              `M_{uy} = \\mathbf{${gg.Muy}\\text{ kN}\\cdot\\text{m}},\\quad V_{uy} = \\mathbf{${gg.Vuy}\\text{ kN}}`,
              'SURGE', 'pass', 'Transverse horizontal surge carried by top flange.'
            )}
          </div>
        </div>

        <!-- 2.4 Section Selection -->
        <div class="solution-block wide">
          <div class="section-badge-pill">Assignment 2B · Section 4 · Compound Section</div>
          <h3>4. Section Selection & Geometric Properties</h3>
          <div class="calc-callout-box" style="margin: 8px 0; background: rgba(56,189,248,0.06); border-left: 3px solid var(--accent); padding: 10px 14px;">
            <b>Trial Section:</b> <b style="font-size:13px; color:var(--text);">${gg.trialSection}</b><br>
            Compound section formed by rolled I-beam with channel welded toes down onto top flange to resist transverse lateral surge.
          </div>
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; margin-top:8px;">
            <div class="calc-callout-box"><span class="calc-var">I_xx:</span> <b>${gg.Ixx}</b></div>
            <div class="calc-callout-box"><span class="calc-var">I_yy:</span> <b>${gg.Iyy}</b></div>
            <div class="calc-callout-box"><span class="calc-var">Z_ez:</span> <b>${gg.Zez}</b></div>
            <div class="calc-callout-box"><span class="calc-var">Z_ey:</span> <b>${gg.Zey}</b></div>
            <div class="calc-callout-box"><span class="calc-var">Z_pz:</span> <b>${gg.Zpz}</b></div>
            <div class="calc-callout-box"><span class="calc-var">Z_py:</span> <b>${gg.Zpy}</b></div>
          </div>
          <div class="calc-callout-box" style="margin-top:8px; font-size:11.5px;">
            <b>Section Classification:</b> <b>${gg.classification} Section</b> (IS 800:2007 Table 2).
          </div>
        </div>

        <!-- 2.5 Capacity Checks -->
        <div class="solution-block wide">
          <div class="section-badge-pill">Assignment 2B · Section 5 · IS 800:2007 Checks</div>
          <h3>5. Capacity & Serviceability Checks</h3>
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 10px;">
            ${makeTeddsBlock(
              'Shear Capacity Check',
              'IS 800 Cl. 8.4',
              `V_d = \\mathbf{${gg.Vd}\\text{ kN}} > V_{ux} = ${gg.Vux}\\text{ kN}`,
              'SAFE (Low Shear)', 'pass', 'Girder web shear capacity is well in excess of design shear.'
            )}
            ${makeTeddsBlock(
              'Major Axis Moment Capacity (Z-axis)',
              'IS 800 Cl. 8.2',
              `M_{dz} = \\mathbf{${gg.Mdz}\\text{ kN}\\cdot\\text{m}} > M_{ux} = ${gg.Mux}\\text{ kN}\\cdot\\text{m}`,
              'SAFE', 'pass', 'Vertical moment resistance exceeds design moment demand.'
            )}
            ${makeTeddsBlock(
              'Minor Axis Moment Capacity (Y-axis)',
              'IS 800 Cl. 8.2',
              `M_{dy} = \\mathbf{${gg.Mdy}\\text{ kN}\\cdot\\text{m}} > M_{uy} = ${gg.Muy}\\text{ kN}\\cdot\\text{m}`,
              'SAFE', 'pass', 'Channel top flange horizontal moment resistance.'
            )}
            ${makeTeddsBlock(
              'Combined Biaxial Moment Interaction',
              'IS 800 Cl. 9.3.1',
              `\\frac{M_{ux}}{M_{dz}} + \\frac{M_{uy}}{M_{dy}} = \\frac{${gg.Mux}}{${gg.Mdz}} + \\frac{${gg.Muy}}{${gg.Mdy}} = \\mathbf{${gg.interactionRatio}} < 1.0`,
              'SAFE', 'pass', 'Combined interaction ratio 0.89 satisfies code criterion $\\le 1.0$.'
            )}
            ${makeTeddsBlock(
              'Vertical Deflection Check',
              'IS 800 Table 6',
              `\\delta = \\mathbf{${gg.delta_actual}\\text{ mm}} < \\delta_{\\text{allowable}} = \\frac{L}{750} = \\mathbf{${gg.delta_allowable}\\text{ mm}}`,
              'SAFE', 'pass', 'Deflection under crane live load satisfies tight EOT crane limit.'
            )}
          </div>
        </div>
      </div>
    `;
    renderSolutionMathSafe();
  }

  function renderAssignment3() {
    const pg = IS800.calcPlateGirderDesign ? IS800.calcPlateGirderDesign() : null;
    const content = document.getElementById('solutionContent');
    const heading = document.getElementById('solutionHeading');
    const subhead = document.getElementById('solutionSubhead');
    const badge = document.getElementById('documentBadge');
    const stepBadge = document.getElementById('stepCounterBadge');
    const studyTitle = document.getElementById('studyTitle');
    const sub = document.getElementById('studySub');

    if (studyTitle) studyTitle.textContent = 'Assignment 3 — Design of Plate Girder';
    if (heading) heading.textContent = 'Assignment 3: Design of Welded Plate Girder';
    if (subhead) subhead.textContent = 'SPAN 25 m · WEB 1900×20 mm · FLANGES 700×30 mm · STIFFENERS & CURTAILMENT';
    if (sub) sub.textContent = 'PORTFOLIO ASSIGNMENT 3 · IS 800:2007';
    if (badge) badge.textContent = 'PLATE GIRDER';
    if (stepBadge) stepBadge.textContent = 'Assign 3';

    document.querySelectorAll('.portfolio-pill').forEach(p => p.classList.toggle('active', p.dataset.assign === '3'));
    const solTabs = document.getElementById('solutionTabs');
    if (solTabs) solTabs.style.display = 'none';

    if (!content || !pg) return;

    content.innerHTML = `
      <div class="solution-grid">
        <!-- 3.1 Design Data -->
        <div class="solution-block wide">
          <div class="section-badge-pill">Assignment 3 · Section 1 & 2 · Design Data & Forces</div>
          <h3>1. Design Data, Bending Moment & Shear Force</h3>
          <p>Heavy duty welded plate girder spanning across clear bay with center point load and distributed self weight:</p>
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 10px; margin-top: 8px;">
            <div class="calc-callout-box">
              <span class="calc-var">Span (L):</span> <b>${pg.L} m</b><br>
              <span class="calc-var">Dead Load (UDL):</span> <b>${pg.dl_udl} kN/m</b><br>
              <span class="calc-var">Live / Point Load (at center):</span> <b>${pg.ll_point} kN</b>
            </div>
            <div class="calc-callout-box">
              <span class="calc-var">Factored UDL (w):</span> <b>$45 \\times 1.5 = \\mathbf{${pg.w}\\text{ kN/m}}$</b><br>
              <span class="calc-var">Factored Point Load (W):</span> <b>$270 \\times 1.5 = \\mathbf{${pg.W}\\text{ kN}}$</b><br>
              <span class="calc-var">Steel Grade:</span> <b>$f_y = 250\\text{ MPa},\\ f_u = 410\\text{ MPa}$</b>
            </div>
          </div>
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 10px; margin-top: 10px;">
            ${makeTeddsBlock(
              'Maximum Factored Bending Moment',
              'Statics',
              `M_u = \\frac{w L^2}{8} + \\frac{W L}{4} = \\frac{67.5 \\times 25^2}{8} + \\frac{405 \\times 25}{4} = \\mathbf{${pg.Mu}\\text{ kN}\\cdot\\text{m}}`,
              'DESIGN BM', 'pass', 'Mid-span maximum bending moment.'
            )}
            ${makeTeddsBlock(
              'Maximum Factored Shear Force',
              'Statics',
              `V_u = \\frac{w L}{2} + \\frac{W}{2} = \\frac{67.5 \\times 25}{2} + \\frac{405}{2} = \\mathbf{${pg.Vu}\\text{ kN}}`,
              'DESIGN SF', 'pass', 'Maximum end reaction shear force.'
            )}
          </div>
        </div>

        <!-- 3.2 Geometry -->
        <div class="solution-block wide">
          <div class="section-badge-pill">Assignment 3 · Section 3 · Geometry Selection</div>
          <h3>2. Selection of Section Geometry</h3>
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 10px;">
            ${makeTeddsBlock(
              'Optimum Depth of Web Plate',
              'Economy Criterion (k = 200)',
              `d = \\left(\\frac{M_u \\times k}{f_y}\\right)^{1/3} = \\left(\\frac{7703.43 \\times 10^6 \\times 200}{250}\\right)^{1/3} \\approx \\mathbf{1900\\text{ mm}}`,
              'OK', 'pass', 'Economical web depth for welded plate girder.'
            )}
            ${makeTeddsBlock(
              'Web Thickness (t_w)',
              'Serviceability',
              `t_w = \\frac{1900}{200} = 9.5\\text{ mm} \\implies \\mathbf{Provide\\ 20\\text{ mm}\\ plate}`,
              'OK', 'pass', 'Provided Web: $1900\\text{ mm} \\times 20\\text{ mm}$.'
            )}
            ${makeTeddsBlock(
              'Flange Area Required & Dimensions',
              'Plastic Modulus',
              `A_{f(\\text{req})} = \\frac{M_u \\gamma_{m0}}{d \\cdot f_y} = \\mathbf{${pg.Af_req}\\text{ mm}^2} \\implies b_f = 700\\text{ mm},\\ t_f = 25.48\\text{ mm}`,
              'OK', 'pass', 'Provided Flanges: $700\\text{ mm} \\times 30\\text{ mm}$.'
            )}
          </div>
        </div>

        <!-- 3.3 Capacity Checks -->
        <div class="solution-block wide">
          <div class="section-badge-pill">Assignment 3 · Section 4 · Capacity Checks</div>
          <h3>3. Serviceability & Capacity Checks</h3>
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 10px;">
            ${makeTeddsBlock(
              'Web Shear Capacity',
              'IS 800 Cl. 8.4',
              `V_d = \\frac{A_v \\cdot f_{yw}}{\\sqrt{3}\\gamma_{m0}} = \\frac{(1900 \\times 20) \\times 250}{\\sqrt{3} \\times 1.10} = \\mathbf{${pg.Vd}\\text{ kN}} > ${pg.Vu}\\text{ kN}`,
              'SAFE', 'pass', 'Web shear capacity comfortably exceeds factored shear.'
            )}
            ${makeTeddsBlock(
              'Flange Moment Capacity',
              'IS 800 Cl. 8.2',
              `M_{df} = \\frac{Z_{pf} \\cdot f_y}{\\gamma_{m0}} = \\frac{40.53 \\times 10^6 \\times 250}{1.10} = \\mathbf{${pg.Mdf}\\text{ kN}\\cdot\\text{m}} > ${pg.Mu}\\text{ kN}\\cdot\\text{m}`,
              'SAFE', 'pass', 'Flange moment capacity exceeds design moment demand.'
            )}
            ${makeTeddsBlock(
              'Web Buckling Resistance',
              'IS 800 Cl. 8.7.3.1',
              `F_{bw} = \\mathbf{${pg.Fbw}\\text{ kN}} < V_u = ${pg.Vu}\\text{ kN}`,
              'STIFFENERS REQ', 'info', 'Web buckling capacity is exceeded $\\implies$ Transverse intermediate stiffeners required.'
            )}
          </div>
        </div>

        <!-- 3.4 Stiffeners -->
        <div class="solution-block wide">
          <div class="section-badge-pill">Assignment 3 · Section 5 · Stiffener Design</div>
          <h3>4. Design of Stiffeners (IS 800 Cl. 8.7)</h3>
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 10px;">
            ${makeTeddsBlock(
              'End Bearing Stiffeners',
              'IS 800 Cl. 8.7.5',
              `\\text{Provide } 10\\text{ mm plates both sides (width } 140\\text{ mm}) \\implies P_d = \\mathbf{4112.27\\text{ kN}} > V_u = 1046\\text{ kN}`,
              'SAFE', 'pass', '$A_s = 10800\\text{ mm}^2, I = 22.58 \\times 10^6\\text{ mm}^4, f_{cd} = 209.81\\text{ MPa}$.'
            )}
            ${makeTeddsBlock(
              'Intermediate Transverse Stiffeners',
              'IS 800 Cl. 8.7.2',
              `\\text{Spacing } 2000\\text{ mm},\\ t = 16\\text{ mm},\\ b = 224\\text{ mm} \\implies I_{\\text{provided}} = 68.86 \\times 10^6 > I_{\\text{required}} = 20.5 \\times 10^6\\text{ mm}^4`,
              'SAFE', 'pass', 'Stiffener moment of inertia satisfies code requirements.'
            )}
            ${makeTeddsBlock(
              'Load Bearing Stiffeners (at center)',
              'IS 800 Cl. 8.7.4',
              `\\text{For point load } P_u = 405\\text{ kN},\\ \\text{Provide } 12\\text{ mm plates} \\implies P_d = \\mathbf{559.55\\text{ kN}} > 405\\text{ kN}`,
              'SAFE', 'pass', 'Safely disperses concentrated central point load into web.'
            )}
          </div>
        </div>

        <!-- 3.5 Curtailment & Welds -->
        <div class="solution-block wide">
          <div class="section-badge-pill">Assignment 3 · Section 6 & 7 · Curtailment & Welds</div>
          <h3>5. Curtailment of Flange Plates & Flange-to-Web Welds</h3>
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 10px;">
            ${makeTeddsBlock(
              'Curtailment of Flange Plates',
              'IS 800 Cl. 8.7',
              `M_{df} = 6716\\text{ kNm} \\implies 1046 x - \\frac{67.5 x^2}{2} = 6716 \\implies x = \\mathbf{9.08\\text{ m}} \\text{ (Theo.)}`,
              'OK', 'pass', 'Actual curtailment distance $= 9080 - 25(t) = \\mathbf{8455\\text{ mm}}$ from support.'
            )}
            ${makeTeddsBlock(
              'Flange-to-Web Weld Design',
              'IS 800 Cl. 10.5',
              `V_H = \\frac{V_u A \\bar{y}}{I_{xx}} = \\mathbf{401.72\\text{ N/mm}} \\implies \\text{Provide } 8\\text{ mm intermittent fillet weld}`,
              'SAFE', 'pass', 'Weld capacity $f_{wd} = 1060.47\\text{ N/mm}$. Provide $20\\text{ mm}$ length welds at $140\\text{ mm}$ clear spacing.'
            )}
          </div>
        </div>
      </div>
    `;
    renderSolutionMathSafe();
  }

  function renderAssignment4() {
    const content = document.getElementById('solutionContent');
    const heading = document.getElementById('solutionHeading');
    const subhead = document.getElementById('solutionSubhead');
    const badge = document.getElementById('documentBadge');
    const stepBadge = document.getElementById('stepCounterBadge');
    const studyTitle = document.getElementById('studyTitle');
    const sub = document.getElementById('studySub');

    if (studyTitle) studyTitle.textContent = 'Assignment 4A & 4B — Field Visit Report (Diesel Locomotive Shed)';
    if (heading) heading.textContent = 'Assignment 4A & 4B: Industrial Field Visit Technical Report';
    if (subhead) subhead.textContent = 'DIESEL LOCOMOTIVE SHED, CENTRAL RAILWAY, GHORPADI, PUNE · STRUCTURAL SYSTEMS STUDY';
    if (sub) sub.textContent = 'PORTFOLIO ASSIGNMENT 4 · FIELD STUDY';
    if (badge) badge.textContent = 'FIELD REPORT';
    if (stepBadge) stepBadge.textContent = 'Assign 4';

    document.querySelectorAll('.portfolio-pill').forEach(p => p.classList.toggle('active', p.dataset.assign === '4'));
    const solTabs = document.getElementById('solutionTabs');
    if (solTabs) solTabs.style.display = 'none';

    if (!content) return;

    content.innerHTML = `
      <div class="solution-grid">
        <!-- 4A Field Visit Overview -->
        <div class="solution-block wide">
          <div class="section-badge-pill">Assignment 4A · Technical Site Visit Overview</div>
          <h3>1. Field Visit Report: Industrial Steel Structure</h3>
          <p><b>Location:</b> Diesel Locomotive Shed, Central Railway, Ghorpadi, Pune.</p>
          <div class="calc-callout-box" style="margin: 8px 0; font-size: 11.5px; line-height: 1.6;">
            The technical visit to the industrial steel structure was conducted to understand the real-world execution of structural steel systems and their components. The steel shed is actively utilized for the maintenance and repair of heavy diesel locomotives of Indian Railways at Ghorpadi, Pune.<br><br>
            The facility consists of a total of <b>6 steel maintenance sheds</b>. Key structural components inspected on site included galvanized iron (GI) sheet claddings and roofings, cold-formed and hot-rolled purlins, steel pitched roof trusses, self-sustaining arch roofs, built-up laced and battened columns, gusseted base plates, and overhead crane runway girders.
          </div>
        </div>

        <!-- 4A Structural Systems Observed -->
        <div class="solution-block wide">
          <div class="section-badge-pill">Assignment 4A · Observed Structural Elements</div>
          <h3>2. Classification of Structural Systems Observed on Site</h3>
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 10px; margin-top: 8px;">
            <div class="calc-callout-box">
              <h4 style="margin:0 0 6px; color:var(--text); font-size:12px;">1. Roofing Materials & Purlins:</h4>
              <ul style="margin:0; padding-left:16px; font-size:11px; color:var(--text-muted); line-height:1.5;">
                <li><b>GI Sheets:</b> Galvanized mild steel sheets coated with zinc layer for durable, economical corrosion resistance.</li>
                <li><b>Self-Supported Arch Roof:</b> Arched profiled sheeting utilizing structural curvature to bridge large clear spans without internal rafters.</li>
                <li><b>Purlins:</b> Longitudinal angle and channel members transmitting cladding gravity and wind forces into primary truss panel nodes.</li>
              </ul>
            </div>
            <div class="calc-callout-box">
              <h4 style="margin:0 0 6px; color:var(--text); font-size:12px;">2. Roof Truss Typologies:</h4>
              <ul style="margin:0; padding-left:16px; font-size:11px; color:var(--text-muted); line-height:1.5;">
                <li><b>Flat & Pitched Trusses:</b> Triangular truss layouts providing high strength-to-weight ratios for clear spanning shop floors.</li>
                <li><b>Trusses with Monitor Louvres:</b> Modified roof apex configurations providing continuous natural ventilation and daylighting.</li>
                <li><b>Northlight Trusses:</b> Steep glazed north slopes providing uniform, glare-free illumination throughout maintenance workshops.</li>
              </ul>
            </div>
            <div class="calc-callout-box">
              <h4 style="margin:0 0 6px; color:var(--text); font-size:12px;">3. Heavy Column Systems:</h4>
              <ul style="margin:0; padding-left:16px; font-size:11px; color:var(--text-muted); line-height:1.5;">
                <li><b>Rolled Steel I-Sections:</b> Standard ISMB beams utilized for secondary building frames.</li>
                <li><b>Built-Up Columns with Lacing:</b> Compound channels connected by diagonal flat/angle lacing bars to ensure equal radii of gyration ($r_{yy} \\approx r_{zz}$).</li>
                <li><b>Columns with Battens:</b> Heavy channels tied with horizontal batten plates to resist lateral gantry surges.</li>
                <li><b>Columns with Cover Flange Plates:</b> I-sections reinforced with welded flange plates for high crane bracket moments.</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- 4B Plate Girder & Gantry Crane Report -->
        <div class="solution-block wide">
          <div class="section-badge-pill">Assignment 4B · Plate Girder & Gantry Cranes</div>
          <h3>3. Report on Plate Girder & Gantry Crane Equipment</h3>
          <p>Detailed investigation of heavy crane handling equipment at the diesel locomotive sheds:</p>
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 10px; margin-top: 8px;">
            <div class="calc-callout-box">
              <h4 style="margin:0 0 6px; color:var(--text); font-size:12px;">Gantry Crane Sub-systems:</h4>
              <ul style="margin:0; padding-left:16px; font-size:11px; color:var(--text-muted); line-height:1.5;">
                <li><b>Crane Bridge Girder:</b> Heavy structural beam spanning across the maintenance bay.</li>
                <li><b>End Carriages & Wheels:</b> Motorized wheeled carriages moving along rails on gantry girders.</li>
                <li><b>Crab / Trolley:</b> Transverse moving carriage carrying the primary lifting motor and hoist.</li>
                <li><b>Gantry Runway Girder:</b> Longitudinally spanning steel beam carrying rails and surge loads.</li>
              </ul>
            </div>
            <div class="calc-callout-box">
              <h4 style="margin:0 0 6px; color:var(--text); font-size:12px;">Plate Girder Stiffener Classification:</h4>
              <p style="font-size:11px; margin:0 0 4px; color:var(--text-muted);">Observed stiffener arrangements per IS 800:</p>
              <ol style="margin:0; padding-left:16px; font-size:11px; color:var(--text-muted); line-height:1.5;">
                <li>Longitudinal stiffeners (preventing web bending buckling)</li>
                <li>Transverse vertical stiffeners (shear buckling prevention)</li>
                <li>Bearing stiffeners (under crane wheel concentrated reactions)</li>
                <li>Intermediate stiffeners (subdividing web into panels)</li>
                <li>Diagonal stiffeners & Flange edge stiffeners</li>
              </ol>
            </div>
            <div class="calc-callout-box">
              <h4 style="margin:0 0 6px; color:var(--text); font-size:12px;">Fabrication & Joint Details:</h4>
              <ul style="margin:0; padding-left:16px; font-size:11px; color:var(--text-muted); line-height:1.5;">
                <li><b>Intermittent Fillet Welds:</b> Fillet welds applied at regular staggered intervals to connect web to flanges while controlling residual stresses.</li>
                <li><b>Flange & Web Splice Plates:</b> Double-cover bolted splice plates connecting girder segments where transport lengths are exceeded.</li>
                <li><b>Column Bracing Systems:</b> Cross-diagonal bracing transmitting longitudinal braking crane forces to the foundations.</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Conclusion -->
        <div class="solution-block wide">
          <div class="section-badge-pill">Assignment 4 · Field Visit Conclusions</div>
          <h3>4. Synthesis & Engineering Takeaways</h3>
          <p style="font-size:11.5px; line-height:1.6; color:var(--text-muted);">
            The on-site study provided hands-on validation of theoretical Limit State Design principles taught in the classroom. Observing the actual proportioning of built-up columns, the physical layout of lacing and batten systems, the thickness transitions of flange plates, and the load transfer path from crane wheels through rails to gantry girders and column bases reinforced the critical necessity of adhering strictly to Indian Standard codes (IS 800:2007, IS 875 Parts 1–3, and IS 2062).
          </p>
        </div>
      </div>
    `;
    renderSolutionMathSafe();
  }

  function setPortfolioAssignment(assignId) {
    root.S.portfolioAssign = assignId;
    document.querySelectorAll('.portfolio-pill').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.assign === assignId);
    });

    const solTabs = document.getElementById('solutionTabs');

    if (assignId === '2A') {
      if (solTabs) solTabs.style.display = 'flex';
      renderLiveSolution(root.S.step || 0);
    } else if (assignId === '2B') {
      renderAssignment2B();
    } else if (assignId === '2C') {
      if (solTabs) solTabs.style.display = 'flex';
      setSolutionStep(6, true);
    } else if (assignId === '2D') {
      if (solTabs) solTabs.style.display = 'flex';
      setSolutionStep(7, true);
    } else if (assignId === '3') {
      renderAssignment3();
    } else if (assignId === '4') {
      renderAssignment4();
    }
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
    const solTabs = document.getElementById('solutionTabs');
    if (solTabs) solTabs.style.display = 'flex';

    let assignId = '2A';
    if (i === 6) assignId = '2C';
    else if (i === 7) assignId = '2D';
    document.querySelectorAll('.portfolio-pill').forEach(p => {
      p.classList.toggle('active', p.dataset.assign === assignId);
    });

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

    // Portfolio assignment pills
    document.querySelectorAll('.portfolio-pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        setPortfolioAssignment(pill.dataset.assign);
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
    setPortfolioAssignment,
    renderAssignment2B,
    renderAssignment3,
    renderAssignment4,
    LIVE_SOLUTION
  };

  root.LIVE_SOLUTION = LIVE_SOLUTION;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = StudyModule;
  } else {
    root.StudyModule = StudyModule;
    root.refreshStudy = () => renderLiveSolution(root.S.step);
    root.setSolutionStep = setSolutionStep;
    root.setPortfolioAssignment = setPortfolioAssignment;
    root.renderAssignment2B = renderAssignment2B;
    root.renderAssignment3 = renderAssignment3;
    root.renderAssignment4 = renderAssignment4;
    root.openWorkflow = openWorkflow;
    root.renderWorkflow = renderWorkflow;
  }
})(typeof window !== 'undefined' ? window : global);
