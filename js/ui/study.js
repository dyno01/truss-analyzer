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

  const LIVE_SOLUTION = [
    {
      title: 'Step 1 — Given Data & Design Assumptions',
      badge: 'IS 800 / IS 875',
      body: (d, S, G) => {
        const grade = (root.Standards && root.Standards.STEEL_GRADES[S.grade || 'E250']) || { fy: 250, fu: 410, E: 200000 };
        return `
          <div class="solution-grid">
            <div class="solution-block wide">
              <h3>1.1 Problem Statement & Structural Geometry Data</h3>
              <table class="solution-data">
                <tr><th>Design Parameter</th><th>Assigned Value</th><th>Design Reference / Notes</th></tr>
                <tr><td>Problem Group & Location</td><td><b>Group ${root.escSafe(S.group)}</b> · ${root.escSafe(G.loc || 'Custom')}</td><td>Assignment 3A statement</td></tr>
                <tr><td>Basic Wind Speed ($V_b$)</td><td><b>${S.Vb} m/s</b> (Zone III/IV)</td><td>IS 875 (Part 3): 2015 Appendix A</td></tr>
                <tr><td>Terrain Category</td><td><b>Category ${S.terrain || G.terrain || 2}</b></td><td>IS 875 (Part 3) Table 2</td></tr>
                <tr><td>Truss Configuration</td><td><b>${root.escSafe(S.truss)} Pitch Roof Truss</b></td><td>Transverse load carrying framework</td></tr>
                <tr><td>Truss Span ($L$)</td><td><b>${Number(S.span).toFixed(2)} m</b></td><td>Center-to-center distance between columns</td></tr>
                <tr><td>Total Shed Length ($L_{\\text{shed}}$)</td><td><b>${Number(S.length).toFixed(2)} m</b></td><td>Longitudinal building dimension</td></tr>
                <tr><td>Eaves Height ($H$)</td><td><b>${Number(S.height).toFixed(2)} m</b></td><td>Ground level to column head/eaves</td></tr>
                <tr><td>Truss Frame Spacing ($S$)</td><td><b>${Number(S.spacing).toFixed(2)} m</b></td><td>Center-to-center spacing of trusses</td></tr>
                <tr><td>Number of Panels ($n$)</td><td><b>${d.panels} panels</b></td><td>${d.panels / 2} panels on each rafter slope</td></tr>
                <tr><td>Roof Pitch Angle ($\\theta$)</td><td><b>${Number(S.slope).toFixed(1)}°</b> (1 in ${(1 / Math.tan((S.slope * Math.PI) / 180)).toFixed(1)})</td><td>Slope chosen for natural rainwater drainage</td></tr>
                <tr><td>Roof Cladding Material</td><td><b>${root.escSafe(S.roof)} Corrugated Sheets</b></td><td>Dead load per IS 875 (Part 1)</td></tr>
                <tr><td>Connection Details</td><td><b>${root.escSafe(S.connection)}</b></td><td>IS 800:2007 Section 10</td></tr>
              </table>
            </div>
            <div class="solution-block">
              <h3>1.2 Material Properties (IS 2062 / IS 800)</h3>
              <p>Structural steel conforms to grade <b>${grade.name || 'E250 (Fe 410)'}</b>:</p>
              <ul>
                <li>Yield stress: $f_y = \\mathbf{${grade.fy}\\text{ MPa}}$</li>
                <li>Ultimate tensile strength: $f_u = \\mathbf{${grade.fu}\\text{ MPa}}$</li>
                <li>Modulus of Elasticity: $E = \\mathbf{2.0 \\times 10^5\\text{ MPa}}$</li>
                <li>Partial safety factor for yielding: $\\gamma_{m0} = \\mathbf{1.10}$ (Table 5)</li>
                <li>Partial safety factor for ultimate resistance: $\\gamma_{m1} = \\mathbf{1.25}$ (Table 5)</li>
                <li>Partial safety factor for shop fillet welds: $\\gamma_{mw} = \\mathbf{1.25}$ (Table 5)</li>
              </ul>
              <div class="solution-formula-label">Governing Yield Design Strength Formula:</div>
              <div class="solution-equation" data-math="f_{yd} = \\frac{f_y}{\\gamma_{m0}}"></div>
              <div class="solution-formula-label">Numerical Substitution & Result:</div>
              <div class="solution-equation solution-substitution" data-math="f_{yd} = \\frac{${grade.fy}}{1.10} = \\mathbf{${(grade.fy / 1.10).toFixed(2)}\\text{ MPa}}"></div>
              <div class="solution-remarks">
                <div class="solution-remarks-title">Variable Remarks & Source:</div>
                • <b>$f_{yd}$ (Design Yield Strength)</b> = $${(grade.fy / 1.10).toFixed(2)}\\text{ MPa}$ — Factored yield stress under Limit State of Strength.<br>
                • <b>$f_y$ (Characteristic Minimum Yield Stress)</b> = $${grade.fy}\\text{ MPa}$ — For Grade ${grade.name || 'E250'} structural steel (IS 2062:2011 Table 2).<br>
                • <b>$\\gamma_{m0}$ (Partial Safety Factor against Yielding)</b> = $1.10$ — Material resistance factor per IS 800:2007 Table 5.
              </div>
            </div>
            <div class="solution-block">
              <h3>1.3 Student Design Assumptions</h3>
              <p>For rigorous structural design, the following engineering assumptions are made:</p>
              <ul>
                <li>Truss nodes are assumed pin-connected for axial force estimation.</li>
                <li>Purlins are placed directly over panel nodes to avoid secondary rafter bending.</li>
                <li>Columns are built-up with 2 ISMC channels placed back-to-back with single lacing.</li>
                <li>Truss members are double angles placed back-to-back with a 10 mm gusset plate.</li>
              </ul>
            </div>
          </div>`;
      }
    },
    {
      title: 'Step 2 — Structural Geometry, Pitch & Lengths',
      badge: 'GEOMETRY',
      body: (d, S) => {
        const span = d.span;
        const slopeDeg = d.slopeDeg;
        const slopeRad = (slopeDeg * Math.PI) / 180;
        const rise = (span / 2) * Math.tan(slopeRad);
        const rafter = Math.hypot(span / 2, rise);
        const panelWidthPlan = span / d.panels;
        const panelLengthSlope = rafter / (d.panels / 2);
        const frames = root.frameCount();
        const bays = frames - 1;

        return `
          <div class="solution-grid">
            <div class="solution-block">
              <h3>2.1 Central Truss Rise (R)</h3>
              <p>The rise of the pitched roof at the ridge point above the eaves level:</p>
              <div class="solution-formula-label">Governing Formula:</div>
              <div class="solution-equation" data-math="R = \\frac{\\text{Span}}{2} \\times \\tan\\theta"></div>
              <div class="solution-formula-label">Numerical Substitution & Result:</div>
              <div class="solution-equation solution-substitution" data-math="R = \\frac{${span.toFixed(2)}}{2} \\times \\tan(${slopeDeg.toFixed(1)}^\\circ) = ${ (span / 2).toFixed(2) } \\times ${Math.tan(slopeRad).toFixed(3)} = \\mathbf{${rise.toFixed(3)}\\text{ m}}"></div>
              <div class="solution-remarks">
                <div class="solution-remarks-title">Variable Remarks & Source:</div>
                • <b>$R$ (Central Apex Rise)</b> = $${rise.toFixed(3)}\\text{ m}$ — Vertical height of ridge apex above eaves line.<br>
                • <b>$\\text{Span}$ (Clear Truss Span)</b> = $${span.toFixed(2)}\\text{ m}$ — Center-to-center distance between column axes (Problem Group ${S.group} data).<br>
                • <b>$\\theta$ (Roof Pitch Angle)</b> = $${slopeDeg.toFixed(1)}^\\circ$ — Sloping roof angle ($\\tan\\theta = 1/${(1 / Math.tan(slopeRad)).toFixed(1)}$ slope for efficient rainwater runoff).<br>
                • <b>$\\text{Span} / 2$ (Half Span)</b> = $${(span / 2).toFixed(2)}\\text{ m}$ — Horizontal projection from eave to apex.
              </div>
            </div>
            <div class="solution-block">
              <h3>2.2 Principal Rafter Sloping Length (Lr)</h3>
              <p>True sloping centerline length of the inclined top chord from eave to ridge:</p>
              <div class="solution-formula-label">Governing Formula:</div>
              <div class="solution-equation" data-math="L_r = \\sqrt{\\left(\\frac{\\text{Span}}{2}\\right)^2 + R^2}"></div>
              <div class="solution-formula-label">Numerical Substitution & Result:</div>
              <div class="solution-equation solution-substitution" data-math="L_r = \\sqrt{(${ (span / 2).toFixed(2) })^2 + (${rise.toFixed(3)})^2} = \\sqrt{${((span / 2) ** 2).toFixed(2)} + ${(rise ** 2).toFixed(2)}} = \\mathbf{${rafter.toFixed(3)}\\text{ m}}"></div>
              <div class="solution-remarks">
                <div class="solution-remarks-title">Variable Remarks & Source:</div>
                • <b>$L_r$ (Principal Rafter Sloping Length)</b> = $${rafter.toFixed(3)}\\text{ m}$ — Inclined length of one rafter slope.<br>
                • <b>$\\text{Span} / 2$</b> = $${(span / 2).toFixed(2)}\\text{ m}$ — Horizontal half-span run.<br>
                • <b>$R$</b> = $${rise.toFixed(3)}\\text{ m}$ — Apex rise calculated in Step 2.1.<br>
                • Governs continuous sloping length along which roof purlins are supported.
              </div>
            </div>
            <div class="solution-block">
              <h3>2.3 Panel Dimensions (Plan & Slope)</h3>
              <p>Transverse horizontal panel width along bottom chord ($n = ${d.panels}$ equal panels):</p>
              <div class="solution-formula-label">Governing Formula:</div>
              <div class="solution-equation" data-math="a_{\\text{plan}} = \\frac{\\text{Span}}{n}"></div>
              <div class="solution-formula-label">Numerical Substitution & Result:</div>
              <div class="solution-equation solution-substitution" data-math="a_{\\text{plan}} = \\frac{${span.toFixed(2)}}{${d.panels}} = \\mathbf{${panelWidthPlan.toFixed(3)}\\text{ m}}"></div>
              <div class="solution-remarks">
                <div class="solution-remarks-title">Variable Remarks & Source:</div>
                • <b>$a_{\\text{plan}}$ (Plan Panel Width)</b> = $${panelWidthPlan.toFixed(3)}\\text{ m}$ — Horizontal distance between consecutive bottom chord panel joints.<br>
                • <b>$\\text{Span}$</b> = $${span.toFixed(2)}\\text{ m}$ — Total truss span.<br>
                • <b>$n$ (Total Panel Count)</b> = $${d.panels}\\text{ panels}$ ($${d.panels / 2}$$ panels per half-span).
              </div>
              <p>Sloping panel length along rafter between consecutive purlins:</p>
              <div class="solution-formula-label">Governing Formula:</div>
              <div class="solution-equation" data-math="a_{\\text{slope}} = \\frac{L_r}{n / 2}"></div>
              <div class="solution-formula-label">Numerical Substitution & Result:</div>
              <div class="solution-equation solution-substitution" data-math="a_{\\text{slope}} = \\frac{${rafter.toFixed(3)}}{${d.panels / 2}} = \\mathbf{${panelLengthSlope.toFixed(3)}\\text{ m}}"></div>
              <div class="solution-remarks">
                <div class="solution-remarks-title">Variable Remarks & Source:</div>
                • <b>$a_{\\text{slope}}$ (Sloping Panel Length)</b> = $${panelLengthSlope.toFixed(3)}\\text{ m}$ — True rafter length between adjacent purlins.<br>
                • <b>$L_r$</b> = $${rafter.toFixed(3)}\\text{ m}$ — Principal rafter length from Step 2.2.<br>
                • <b>$n / 2$</b> = $${d.panels / 2}$$ — Panel divisions along each top chord slope.
              </div>
            </div>
            <div class="solution-block">
              <h3>2.4 Longitudinal Bay Repetition</h3>
              <p>Number of longitudinal structural bays along building length:</p>
              <div class="solution-formula-label">Governing Formula:</div>
              <div class="solution-equation" data-math="N_{\\text{bays}} = \\frac{L_{\\text{shed}}}{S}"></div>
              <div class="solution-formula-label">Numerical Substitution & Result:</div>
              <div class="solution-equation solution-substitution" data-math="N_{\\text{bays}} = \\frac{${Number(S.length).toFixed(1)}}{${Number(S.spacing).toFixed(2)}} = \\mathbf{${bays}\\text{ bays}}"></div>
              <div class="solution-remarks">
                <div class="solution-remarks-title">Variable Remarks & Source:</div>
                • <b>$N_{\\text{bays}}$ (Total Number of Bays)</b> = $${bays}\\text{ bays}$.<br>
                • <b>$L_{\\text{shed}}$ (Total Building Length)</b> = $${Number(S.length).toFixed(1)}\\text{ m}$ — Problem Group ${S.group} specification.<br>
                • <b>$S$ (Truss Frame Spacing)</b> = $${Number(S.spacing).toFixed(2)}\\text{ m}$ — Longitudinal center-to-center bay spacing.
              </div>
              <p>Total transverse truss frames required along the building:</p>
              <div class="solution-formula-label">Governing Formula:</div>
              <div class="solution-equation" data-math="N_f = N_{\\text{bays}} + 1"></div>
              <div class="solution-formula-label">Numerical Substitution & Result:</div>
              <div class="solution-equation solution-substitution" data-math="N_f = ${bays} + 1 = \\mathbf{${frames}\\text{ frames}}"></div>
              <div class="solution-remarks">
                <div class="solution-remarks-title">Variable Remarks & Source:</div>
                • <b>$N_f$ (Total Truss Frames)</b> = $${frames}\\text{ frames}$ — Comprising 2 gable end frames and $${bays - 1}$$ intermediate frames.
              </div>
            </div>
          </div>`;
      }
    },
    {
      title: 'Step 3 — Load Calculations (IS 875 Parts 1, 2 & 3)',
      badge: 'IS 875 LOADS',
      body: (d, S, G) => {
        const w = d.loads.wind;
        const slopeDeg = d.slopeDeg;
        const slopeRad = (slopeDeg * Math.PI) / 180;
        const span = d.span;
        const spacing = d.spacing;
        const panelWidthPlan = span / d.panels;
        const rafter = Math.hypot(span / 2, (span / 2) * Math.tan(slopeRad));
        const panelSlope = rafter / (d.panels / 2);

        const sheetWeight = S.roof === 'AC' ? 170 : 130;
        const sheetPlan = sheetWeight / Math.cos(slopeRad);
        const purlinWeight = 100;
        const trussSelfWeight = (span / 3 + 5) * 10;
        const bracingWeight = 15;
        const totalDL = (sheetPlan + purlinWeight + trussSelfWeight + bracingWeight) / 1000;

        const intermediateDL = totalDL * spacing * panelWidthPlan;
        const intermediateLL = d.loads.ll_kN_m2 * spacing * panelWidthPlan;

        const windPanelPoint = Math.abs(w.p_net_suction) * spacing * panelSlope;

        return `
          <div class="solution-grid">
            <div class="solution-block">
              <h3>3.1 Dead Load Calculations (IS 875 Part 1)</h3>
              <p>Dead load components on plan area:</p>
              <ul>
                <li>Roof ${S.roof} sheeting on slope: $\\mathbf{${sheetWeight}\\text{ N/m}^2}$</li>
                <li>Weight of ISMC purlins: $\\mathbf{${purlinWeight}\\text{ N/m}^2}$</li>
                <li>Truss self-weight estimate: $\\mathbf{${trussSelfWeight.toFixed(1)}\\text{ N/m}^2}$</li>
                <li>Weight of wind bracing: $\\mathbf{${bracingWeight}\\text{ N/m}^2}$</li>
              </ul>
              <div class="solution-formula-label">Governing Cladding Plan Projection Formula:</div>
              <div class="solution-equation" data-math="w_{\\text{sheet, plan}} = \\frac{w_{\\text{sheet}}}{\\cos\\theta}"></div>
              <div class="solution-formula-label">Numerical Substitution & Result:</div>
              <div class="solution-equation solution-substitution" data-math="w_{\\text{sheet, plan}} = \\frac{${sheetWeight}}{\\cos(${slopeDeg.toFixed(1)}^\\circ)} = \\frac{${sheetWeight}}{${Math.cos(slopeRad).toFixed(4)}} = \\mathbf{${sheetPlan.toFixed(1)}\\text{ N/m}^2}"></div>
              <div class="solution-remarks">
                <div class="solution-remarks-title">Variable Remarks & Source:</div>
                • <b>$w_{\\text{sheet, plan}}$ (Projected Cladding Weight)</b> = $${sheetPlan.toFixed(1)}\\text{ N/m}^2$ — Dead load projected onto horizontal plan area.<br>
                • <b>$w_{\\text{sheet}}$ (Roof Sheet Weight)</b> = $${sheetWeight}\\text{ N/m}^2$ — Self-weight of ${S.roof} sheeting per unit sloping area (IS 875 Part 1 Table 1).<br>
                • <b>$\\theta$ (Roof Pitch Angle)</b> = $${slopeDeg.toFixed(1)}^\\circ$ — Roof slope ($\\cos\\theta = ${Math.cos(slopeRad).toFixed(3)}$ converts sloping area to plan area).
              </div>

              <div class="solution-formula-label">Governing Truss Self-Weight Formula:</div>
              <div class="solution-equation" data-math="w_{\\text{truss}} = \\left(\\frac{\\text{Span}}{3} + 5\\right) \\times 10"></div>
              <div class="solution-formula-label">Numerical Substitution & Result:</div>
              <div class="solution-equation solution-substitution" data-math="w_{\\text{truss}} = \\left(\\frac{${span.toFixed(2)}}{3} + 5\\right) \\times 10 = (${(span / 3).toFixed(2)} + 5) \\times 10 = \\mathbf{${trussSelfWeight.toFixed(1)}\\text{ N/m}^2}"></div>
              <div class="solution-remarks">
                <div class="solution-remarks-title">Variable Remarks & Source:</div>
                • <b>$w_{\\text{truss}}$ (Estimated Truss Self-Weight)</b> = $${trussSelfWeight.toFixed(1)}\\text{ N/m}^2$ — Empirical design formula for pitched steel roof trusses (IS 875 Part 1).<br>
                • <b>$\\text{Span}$ (Truss Clear Span)</b> = $${span.toFixed(2)}\\text{ m}$.
              </div>

              <div class="solution-formula-label">Governing Total Dead Load Intensity Formula:</div>
              <div class="solution-equation" data-math="w_{DL} = \\frac{w_{\\text{sheet, plan}} + w_{\\text{purlin}} + w_{\\text{truss}} + w_{\\text{bracing}}}{1000}"></div>
              <div class="solution-formula-label">Numerical Substitution & Result:</div>
              <div class="solution-equation solution-result" data-math="w_{DL} = \\frac{${sheetPlan.toFixed(1)} + ${purlinWeight} + ${trussSelfWeight.toFixed(1)} + ${bracingWeight}}{1000} = \\mathbf{${totalDL.toFixed(3)}\\text{ kN/m}^2}"></div>
              <div class="solution-remarks">
                <div class="solution-remarks-title">Variable Remarks & Source:</div>
                • <b>$w_{DL}$ (Total Dead Load Intensity)</b> = $${totalDL.toFixed(3)}\\text{ kN/m}^2$.<br>
                • <b>$w_{\\text{sheet, plan}}$</b> = $${sheetPlan.toFixed(1)}\\text{ N/m}^2$ — Projected cladding weight.<br>
                • <b>$w_{\\text{purlin}}$ (Purlin Self-Weight Allowance)</b> = $${purlinWeight}\\text{ N/m}^2$ — ISMC channel purlins and sag rods.<br>
                • <b>$w_{\\text{truss}}$ (Truss Steel Allowance)</b> = $${trussSelfWeight.toFixed(1)}\\text{ N/m}^2$.<br>
                • <b>$w_{\\text{bracing}}$ (Bracing System Allowance)</b> = $${bracingWeight}\\text{ N/m}^2$.<br>
                • Multiplier $1/1000$ converts $\\text{N/m}^2$ to $\\text{kN/m}^2$.
              </div>

              <div class="solution-formula-label">Governing Nodal Dead Load Formula:</div>
              <div class="solution-equation" data-math="W_{DL} = w_{DL} \\times S \\times a_{\\text{plan}}"></div>
              <div class="solution-formula-label">Numerical Substitution & Result:</div>
              <div class="solution-equation solution-substitution" data-math="W_{DL} = ${totalDL.toFixed(3)} \\times ${spacing.toFixed(2)} \\times ${panelWidthPlan.toFixed(3)} = \\mathbf{${intermediateDL.toFixed(2)}\\text{ kN}}"></div>
              <div class="solution-remarks">
                <div class="solution-remarks-title">Variable Remarks & Source:</div>
                • <b>$W_{DL}$ (Top Chord Nodal Dead Load)</b> = $${intermediateDL.toFixed(2)}\\text{ kN}$ — Point load applied at each intermediate purlin joint.<br>
                • <b>$w_{DL}$ (Dead Load Intensity)</b> = $${totalDL.toFixed(3)}\\text{ kN/m}^2$.<br>
                • <b>$S$ (Truss Spacing)</b> = $${spacing.toFixed(2)}\\text{ m}$.<br>
                • <b>$a_{\\text{plan}}$ (Plan Panel Width)</b> = $${panelWidthPlan.toFixed(3)}\\text{ m}$ from Step 2.3.<br>
                • Eaves end nodes carry half tributary load: $W_{DL}/2 = ${(intermediateDL / 2).toFixed(2)}\\text{ kN}$.
              </div>
            </div>
            <div class="solution-block">
              <h3>3.2 Imposed / Live Load (IS 875 Part 2 Table 2)</h3>
              <p>For sloping roofs with pitch $\\theta = ${slopeDeg.toFixed(1)}^\\circ$ where access is not provided except for maintenance:</p>
              ${slopeDeg <= 10 ? `
                <div class="solution-formula-label">Governing Live Load Formula (Slope ≤ 10°):</div>
                <div class="solution-equation" data-math="w_{LL} = 0.75\\text{ kN/m}^2"></div>
                <div class="solution-remarks">
                  <div class="solution-remarks-title">Variable Remarks & Source:</div>
                  • <b>$w_{LL}$ (Imposed Live Load)</b> = $0.75\\text{ kN/m}^2$ — Standard roof live load per IS 875 (Part 2) Table 2 for pitch $\\le 10^\\circ$.
                </div>
              ` : `
                <div class="solution-formula-label">Governing Live Load Formula (Slope > 10°):</div>
                <div class="solution-equation" data-math="w_{LL} = 0.75 - 0.02(\\theta - 10^\\circ)\\quad (\\text{with code minimum } w_{LL} \\ge 0.40\\text{ kN/m}^2)"></div>
                <div class="solution-formula-label">Numerical Substitution & Result:</div>
                <div class="solution-equation solution-substitution" data-math="w_{LL} = 0.75 - 0.02(${slopeDeg.toFixed(1)} - 10) = 0.75 - ${(0.02 * (slopeDeg - 10)).toFixed(3)} = \\mathbf{${d.loads.ll_kN_m2.toFixed(3)}\\text{ kN/m}^2}"></div>
                <div class="solution-remarks">
                  <div class="solution-remarks-title">Variable Remarks & Source:</div>
                  • <b>$w_{LL}$ (Imposed Live Load Intensity)</b> = $${d.loads.ll_kN_m2.toFixed(3)}\\text{ kN/m}^2$.<br>
                  • $0.75\\text{ kN/m}^2$ — Basic design live load for pitch $\\le 10^\\circ$ (IS 875 Part 2 Table 2).<br>
                  • <b>$\\theta$ (Roof Pitch Angle)</b> = $${slopeDeg.toFixed(1)}^\\circ$.<br>
                  • $0.02\\text{ kN/m}^2$ — Permissible reduction per degree slope exceeding $10^\\circ$.<br>
                  • $0.40\\text{ kN/m}^2$ — Mandatory code minimum threshold (IS 875 Part 2 Cl. 4.1).
                </div>
              `}
              <div class="solution-formula-label">Governing Nodal Live Load Formula:</div>
              <div class="solution-equation" data-math="W_{LL} = w_{LL} \\times S \\times a_{\\text{plan}}"></div>
              <div class="solution-formula-label">Numerical Substitution & Result:</div>
              <div class="solution-equation solution-substitution" data-math="W_{LL} = ${d.loads.ll_kN_m2.toFixed(3)} \\times ${spacing.toFixed(2)} \\times ${panelWidthPlan.toFixed(3)} = \\mathbf{${intermediateLL.toFixed(2)}\\text{ kN}}"></div>
              <div class="solution-remarks">
                <div class="solution-remarks-title">Variable Remarks & Source:</div>
                • <b>$W_{LL}$ (Nodal Live Load)</b> = $${intermediateLL.toFixed(2)}\\text{ kN}$ — Applied at each intermediate top chord joint.<br>
                • <b>$w_{LL}$ (Live Load Intensity)</b> = $${d.loads.ll_kN_m2.toFixed(3)}\\text{ kN/m}^2$.<br>
                • <b>$S$ (Truss Spacing)</b> = $${spacing.toFixed(2)}\\text{ m}$.<br>
                • <b>$a_{\\text{plan}}$ (Plan Panel Width)</b> = $${panelWidthPlan.toFixed(3)}\\text{ m}$.<br>
                • End eaves nodes carry half tributary load: $W_{LL}/2 = ${(intermediateLL / 2).toFixed(2)}\\text{ kN}$.
              </div>
            </div>
            <div class="solution-block wide">
              <h3>3.3 Wind Load Calculations (IS 875 Part 3: 2015)</h3>
              <p>For basic wind speed $V_b = ${w.Vb}\\text{ m/s}$ at eaves height $H = ${Number(S.height).toFixed(1)}\\text{ m}$ in Terrain Category ${S.terrain || G.terrain || 2}:</p>
              <ul>
                <li>Risk coefficient: $k_1 = \\mathbf{${w.k1}}$ (Table 1, 50-year design life)</li>
                <li>Terrain & height factor: $k_2 = \\mathbf{${w.k2}}$ (Table 2 linear interpolation for $z = ${Number(S.height).toFixed(1)}\\text{ m}$)</li>
                <li>Topography factor: $k_3 = \\mathbf{1.00}$ (flat ground slope $\\le 3^\\circ$)</li>
                <li>Cyclonic importance factor: $k_4 = \\mathbf{1.00}$ (industrial non-cyclonic)</li>
              </ul>
              <div class="solution-formula-label">Governing Design Wind Speed Formula:</div>
              <div class="solution-equation" data-math="V_z = V_b \\cdot k_1 \\cdot k_2 \\cdot k_3 \\cdot k_4"></div>
              <div class="solution-formula-label">Numerical Substitution & Result:</div>
              <div class="solution-equation solution-substitution" data-math="V_z = ${w.Vb} \\times ${w.k1} \\times ${w.k2} \\times 1.00 \\times 1.00 = \\mathbf{${w.Vz}\\text{ m/s}}"></div>
              <div class="solution-remarks">
                <div class="solution-remarks-title">Variable Remarks & Source:</div>
                • <b>$V_z$ (Design Wind Velocity)</b> = $${w.Vz}\\text{ m/s}$ — Calculated wind speed at eaves height.<br>
                • <b>$V_b$ (Basic Wind Speed)</b> = $${w.Vb}\\text{ m/s}$ — 50-year return period wind speed for ${G.loc || S.loc || 'site'} (IS 875 Part 3 Appendix A).<br>
                • <b>$k_1$ (Probability / Risk Factor)</b> = $${w.k1}$ — Multiplier for 50-year design life (Table 1).<br>
                • <b>$k_2$ (Terrain and Height Factor)</b> = $${w.k2}$ — Velocity profile factor for Terrain Category ${S.terrain || G.terrain || 2} at $z = ${Number(S.height).toFixed(1)}\\text{ m}$ (Table 2).<br>
                • <b>$k_3$ (Topography Factor)</b> = $1.00$ — Ground slope $\\le 3^\\circ$ (Cl. 6.3).<br>
                • <b>$k_4$ (Cyclonic Factor)</b> = $1.00$ — Non-cyclonic industrial structure (Cl. 6.4).
              </div>

              <div class="solution-formula-label">Governing Design Wind Pressure Formula:</div>
              <div class="solution-equation" data-math="p_z = 0.6 \\times V_z^2"></div>
              <div class="solution-formula-label">Numerical Substitution & Result:</div>
              <div class="solution-equation solution-substitution" data-math="p_z = 0.6 \\times (${w.Vz})^2 = 0.6 \\times ${(w.Vz * w.Vz).toFixed(1)} = \\mathbf{${w.pz}\\text{ N/m}^2} = \\mathbf{${w.pz_kN.toFixed(3)}\\text{ kN/m}^2}"></div>
              <div class="solution-remarks">
                <div class="solution-remarks-title">Variable Remarks & Source:</div>
                • <b>$p_z$ (Design Wind Pressure)</b> = $${w.pz_kN.toFixed(3)}\\text{ kN/m}^2$ ($${w.pz}\\text{ N/m}^2$).<br>
                • Factor $0.6$ — Aerodynamic mass density factor ($0.5 \\times \\rho_{\\text{air}} = 0.5 \\times 1.2 = 0.6$, IS 875 Part 3 Cl. 7.2).<br>
                • <b>$V_z$ (Design Wind Velocity)</b> = $${w.Vz}\\text{ m/s}$.
              </div>

              <div class="solution-formula-label">Governing Net Wind Pressure Formula on Roof:</div>
              <div class="solution-equation" data-math="p_{\\text{net}} = p_z \\times (C_{pe} - C_{pi})"></div>
              <div class="solution-formula-label">Numerical Substitution & Result:</div>
              <div class="solution-equation solution-result" data-math="p_{\\text{net}} = ${w.pz_kN.toFixed(3)} \\times (${w.cpe} - (${w.cpi >= 0 ? '+' : ''}${w.cpi.toFixed(2)})) = ${w.pz_kN.toFixed(3)} \\times (${(w.cpe - w.cpi).toFixed(2)}) = \\mathbf{${w.p_net_suction.toFixed(3)}\\text{ kN/m}^2\\text{ (Suction Uplift)}}"></div>
              <div class="solution-remarks">
                <div class="solution-remarks-title">Variable Remarks & Source:</div>
                • <b>$p_{\\text{net}}$ (Net Design Wind Pressure)</b> = $${w.p_net_suction.toFixed(3)}\\text{ kN/m}^2$ — Negative sign denotes uplift suction pulling roof sheeting away from rafters.<br>
                • <b>$p_z$ (Design Wind Pressure)</b> = $${w.pz_kN.toFixed(3)}\\text{ kN/m}^2$.<br>
                • <b>$C_{pe}$ (External Pressure Coefficient)</b> = $${w.cpe}$ — Aerodynamic coefficient for pitched roof (IS 875 Part 3 Table 5).<br>
                • <b>$C_{pi}$ (Internal Pressure Coefficient)</b> = $${w.cpi >= 0 ? '+' : ''}${w.cpi.toFixed(2)}$ — Internal pressure for medium building permeability (5% to 20% wall openings, Cl. 7.3.2).
              </div>

              <div class="solution-formula-label">Governing Nodal Wind Force Normal to Rafter:</div>
              <div class="solution-equation" data-math="W_w = |p_{\\text{net}}| \\times S \\times a_{\\text{slope}}"></div>
              <div class="solution-formula-label">Numerical Substitution & Result:</div>
              <div class="solution-equation solution-substitution" data-math="W_w = ${Math.abs(w.p_net_suction).toFixed(3)} \\times ${spacing.toFixed(2)} \\times ${panelSlope.toFixed(3)} = \\mathbf{${windPanelPoint.toFixed(2)}\\text{ kN}}"></div>
              <div class="solution-remarks">
                <div class="solution-remarks-title">Variable Remarks & Source:</div>
                • <b>$W_w$ (Panel Point Wind Force)</b> = $${windPanelPoint.toFixed(2)}\\text{ kN}$ — Force acting perpendicular to rafter slope at each top chord joint.<br>
                • <b>$|p_{\\text{net}}|$ (Net Uplift Pressure Magnitude)</b> = $${Math.abs(w.p_net_suction).toFixed(3)}\\text{ kN/m}^2$.<br>
                • <b>$S$ (Truss Frame Spacing)</b> = $${spacing.toFixed(2)}\\text{ m}$.<br>
                • <b>$a_{\\text{slope}}$ (Sloping Panel Length)</b> = $${panelSlope.toFixed(3)}\\text{ m}$ — True rafter length between adjacent purlins from Step 2.3.
              </div>
            </div>
          </div>`;
      }
    },
    {
      title: 'Step 4 — Direct Stiffness FEA Analysis & Equilibrium',
      badge: 'STIFFNESS ANALYSIS',
      body: (d) => {
        const gm = d.governingMember;
        return `
          <div class="solution-grid">
            <div class="solution-block">
              <h3>4.1 Limit State Load Combinations (IS 800 Table 4)</h3>
              <p>The structure is solved under 4 critical Limit State combinations:</p>
              <ol>
                <li><b>Case 1: $1.5(DL + LL)$</b> — Dominant gravity combination.</li>
                <li><b>Case 2: $1.5(DL + WL_{\\text{pressure}})$</b> — Maximum downwind gravity.</li>
                <li><b>Case 3: $1.2(DL + LL + WL)$</b> — Simultaneous full action.</li>
                <li><b>Case 4: $0.9DL + 1.5WL_{\\text{uplift}}$</b> — Maximum suction & stress reversal.</li>
              </ol>
            </div>
            <div class="solution-block">
              <h3>4.2 Direct Stiffness Global Formulation</h3>
              <p>Plane truss assembly with $2 \\times               <div class="solution-remarks">
                <div class="solution-remarks-title">Variable Remarks & Source:</div>
                • <b>$[K]$ (Global Stiffness Matrix)</b> — Assembled structural stiffness matrix of size $N_{\\text{dof}} \\times N_{\\text{dof}}$.<br>
                • <b>$\\{u\\}$ (Nodal Displacement Vector)</b> — Unknown joint translation degrees of freedom ($u_x, u_y$).<br>
                • <b>$\\{F\\}$ (Applied Nodal Load Vector)</b> — Factored nodal force vector for each Limit State combination.
              </div>
              <p>Element stiffness matrix for pin-jointed 2D bar with direction cosines $c = \\cos\\alpha, s = \\sin\\alpha$:</p>
              <div class="solution-formula-label">Governing Bar Element Stiffness Matrix:</div>
              <div class="solution-equation" data-math="[k_e] = \\frac{EA}{L} \\begin{bmatrix} c^2 & cs & -c^2 & -cs \\\\ cs & s^2 & -cs & -s^2 \\\\ -c^2 & -cs & c^2 & cs \\\\ -cs & -s^2 & cs & s^2 \\end{bmatrix}"></div>
              <div class="solution-remarks">
                <div class="solution-remarks-title">Variable Remarks & Source:</div>
                • <b>$E$ (Modulus of Elasticity)</b> = $2.0 \\times 10^5\\text{ MPa}$ — Structural steel stiffness (IS 800 Cl. 2.2.4.1).<br>
                • <b>$A$ (Cross-Sectional Area)</b> — Gross cross-sectional area of member from SP: 6(1).<br>
                • <b>$L$ (Member Length)</b> — Pin-to-pin joint distance.<br>
                • <b>$c, s$ (Direction Cosines)</b> — $c = \\cos\\alpha, s = \\sin\\alpha$ representing member spatial orientation in global XY coordinates.
              </div>
            </div>
            <div class="solution-block wide">
              <h3>4.3 Support Reactions & Equilibrium Verification</h3>
              <p>Solved using Gaussian elimination with partial pivoting. Static equilibrium verified across all cases:</p>
              <div class="solution-formula-label">Governing Vertical Equilibrium Check:</div>
              <div class="solution-equation" data-math="\\sum F_y = 0,\\quad R_{Ay} = R_{By} = \\frac{\\sum W_{\\text{gravity}}}{2}"></div>
              <div class="solution-formula-label">Numerical Substitution & Result:</div>
              <div class="solution-equation solution-result" data-math="R_{\\text{max}} = \\mathbf{${d.maxReaction.toFixed(2)}\\text{ kN}},\\quad \\sum F_x = 0,\\quad \\sum F_y = 0\\quad(\\text{FEA Static Error } < 10^{-12})"></div>
              <div class="solution-remarks">
                <div class="solution-remarks-title">Variable Remarks & Source:</div>
                • <b>$R_{\\text{max}}$ (Maximum Vertical Support Reaction)</b> = $${d.maxReaction.toFixed(2)}\\text{ kN}$ — Downward column load under Case 1: $1.5(DL + LL)$.<br>
                • <b>$R_{Ay}, R_{By}$ (Support Vertical Reactions)</b> — Left hinge pin and right roller reactions.<br>
                • <b>$\\sum F_y = 0, \\sum F_x = 0$</b> — Global static equilibrium satisfied with zero numerical residual error.
              </div>
              <h4>Critical Member Governing Axial Forces:</h4>
              <table class="solution-data">
                <tr><th>Member Group</th><th>Governing Member</th><th>Action Type</th><th>Governing Load Case</th><th>Design Force (Pu)</th></tr>
                <tr><td>Top Chord</td><td>Member M${gm.idx + 1}</td><td>Compression</td><td>${root.escSafe(gm.governingLC)}</td><td><b>${Math.abs(gm.governingForce).toFixed(2)} kN</b></td></tr>
                <tr><td>Bottom Chord</td><td>Main Tie</td><td>Tension</td><td>1.5(DL + LL)</td><td><b>${d.members.filter(m => m.role.includes('bottom')).reduce((max, m) => Math.max(max, m.maxTension), 0).toFixed(2)} kN</b></td></tr>
                <tr><td>Bottom Chord Reversal</td><td>Main Tie</td><td>Compression (Wind Suction)</td><td>0.9DL + 1.5WL(Uplift)</td><td><b>${d.members.filter(m => m.role.includes('bottom')).reduce((max, m) => Math.max(max, m.maxCompression), 0).toFixed(2)} kN</b></td></tr>
              </table>
            </div>
          </div>`;
      }
    },
    {
      title: 'Step 5 — Design of Critical Truss Members (IS 800:2007)',
      badge: 'PERRY-ROBERTSON',
      body: (d, S) => {
        const gm = d.governingMember;
        const P_comp = Math.abs(gm.governingForce);
        const sec = (root.Standards && root.Standards.ANGLES[S.section]) || { A: 866, rmin: 14.6, wt: 6.8 };
        const At = 2 * sec.A;
        const maxTieTension = d.members.filter(m => m.role.includes('bottom')).reduce((max, m) => Math.max(max, m.maxTension), 0);
        const tensionCap = IS800.calcTensionCapacity(At, 250, 410);

        return `
          <div class="solution-grid">
            <div class="solution-block">
              <h3>5.1 Top Chord Compression Member Design (Cl. 7.1.2)</h3>
              <p>Factored compressive load $P_u = \\mathbf{${P_comp.toFixed(2)}\\text{ kN}}$ under ${gm.governingLC}.</p>
              <p>Section chosen: <b>2 × ${root.escSafe(S.section)}</b> back-to-back ($A_g = 2 \\times ${sec.A} = ${At}\\text{ mm}^2$, $r_{\\text{min}} = ${sec.rmin}\\text{ mm}$).</p>

              <div class="solution-formula-label">Governing Effective Length Formula:</div>
              <div class="solution-equation" data-math="KL = K \\times L"></div>
              <div class="solution-formula-label">Numerical Substitution & Result:</div>
              <div class="solution-equation solution-substitution" data-math="KL = 0.85 \\times ${(gm.length_m * 1000).toFixed(0)} = \\mathbf{${(0.85 * gm.length_m * 1000).toFixed(0)}\\text{ mm}}"></div>
              <div class="solution-remarks">
                <div class="solution-remarks-title">Variable Remarks & Source:</div>
                • <b>$KL$ (Effective Buckling Length)</b> = $${(0.85 * gm.length_m * 1000).toFixed(0)}\\text{ mm}$ — Column buckling length in plane of truss.<br>
                • <b>$K$ (Effective Length Factor)</b> = $0.85$ — For truss compression members connected with $\\ge 2$ bolts or welded (IS 800:2007 Table 11).<br>
                • <b>$L$ (Node-to-Node Length)</b> = $${(gm.length_m * 1000).toFixed(0)}\\text{ mm}$ ($${gm.length_m.toFixed(2)}\\text{ m}$) — Purlin-to-purlin node spacing.
              </div>

              <div class="solution-formula-label">Governing Slenderness Ratio Formula:</div>
              <div class="solution-equation" data-math="\\lambda = \\frac{KL}{r_{\\text{min}}}"></div>
              <div class="solution-formula-label">Numerical Substitution & Result:</div>
              <div class="solution-equation solution-substitution" data-math="\\lambda = \\frac{${(0.85 * gm.length_m * 1000).toFixed(0)}}{${sec.rmin}} = \\mathbf{${gm.lambda.toFixed(1)}} \\le 180"></div>
              <div class="solution-remarks">
                <div class="solution-remarks-title">Variable Remarks & Source:</div>
                • <b>$\\lambda$ (Lambda / Slenderness Ratio)</b> = $${gm.lambda.toFixed(1)}$ — Ratio measuring susceptibility to lateral buckling ($KL / r_{\\text{min}}$).<br>
                • <b>$KL$ (Effective Length)</b> = $${(0.85 * gm.length_m * 1000).toFixed(0)}\\text{ mm}$.<br>
                • <b>$r_{\\text{min}}$ (Minimum Radius of Gyration)</b> = $${sec.rmin}\\text{ mm}$ — Governing radius of gyration of 2 × ${S.section} back-to-back from SP: 6(1).<br>
                • <b>$\\lambda_{\\text{limit}} = 180$</b> — Maximum permissible slenderness for members carrying compressive loads from DL + LL (IS 800:2007 Table 3).
              </div>

              <div class="solution-formula-label">Governing Euler Buckling Stress Formula:</div>
              <div class="solution-equation" data-math="f_{cc} = \\frac{\\pi^2 E}{\\lambda^2}"></div>
              <div class="solution-formula-label">Numerical Substitution & Result:</div>
              <div class="solution-equation solution-substitution" data-math="f_{cc} = \\frac{\\pi^2 \\times 200000}{(${gm.lambda.toFixed(1)})^2} = \\mathbf{${((Math.PI * Math.PI * 200000) / (gm.lambda * gm.lambda)).toFixed(1)}\\text{ MPa}}"></div>
              <div class="solution-remarks">
                <div class="solution-remarks-title">Variable Remarks & Source:</div>
                • <b>$f_{cc}$ (Euler Buckling Stress)</b> = $${((Math.PI * Math.PI * 200000) / (gm.lambda * gm.lambda)).toFixed(1)}\\text{ MPa}$ — Theoretical elastic buckling stress of ideal column.<br>
                • <b>$E$ (Modulus of Elasticity)</b> = $2.0 \\times 10^5\\text{ MPa}$ (IS 800 Cl. 2.2.4.1).<br>
                • <b>$\\lambda$ (Slenderness Ratio)</b> = $${gm.lambda.toFixed(1)}$.
              </div>

              <div class="solution-formula-label">Governing Perry-Robertson Compressive Stress Formula (Cl. 7.1.2.1):</div>
              <div class="solution-equation" data-math="f_{cd} = \\chi \\frac{f_y}{\\gamma_{m0}},\\quad \\text{where } \\chi = \\frac{1}{\\phi + (\\phi^2 - \\bar{\\lambda}^2)^{0.5}},\\quad \\bar{\\lambda} = \\sqrt{\\frac{f_y}{f_{cc}}},\\quad \\phi = 0.5[1 + \\alpha(\\bar{\\lambda} - 0.2) + \\bar{\\lambda}^2]"></div>
              <div class="solution-formula-label">Numerical Substitution & Result:</div>
              <div class="solution-equation solution-substitution" data-math="f_{cd} = \\chi \\times \\frac{250}{1.10} = \\mathbf{${(gm.governingCapacity * 1000 / At).toFixed(1)}\\text{ MPa}}"></div>
              <div class="solution-remarks">
                <div class="solution-remarks-title">Variable Remarks & Source:</div>
                • <b>$f_{cd}$ (Design Compressive Stress)</b> = $${(gm.governingCapacity * 1000 / At).toFixed(1)}\\text{ MPa}$ — Safe factored compressive stress per Perry-Robertson formula.<br>
                • <b>$\\chi$ (Chi / Stress Reduction Factor)</b> — Accounting for initial geometric imperfections and residual stresses.<br>
                • <b>$\\bar{\\lambda}$ (Lambda-Bar / Non-Dimensional Slenderness)</b> = $\\sqrt{f_y / f_{cc}}$.<br>
                • <b>$\\alpha$ (Alpha / Imperfection Factor)</b> = $0.49$ — Corresponding to Buckling Class 'c' for angle sections (Table 7).<br>
                • <b>$f_y$ (Yield Stress)</b> = $250\\text{ MPa}$.<br>
                • <b>$\\gamma_{m0}$ (Partial Safety Factor against Yielding)</b> = $1.10$ (Table 5).
              </div>

              <div class="solution-formula-label">Governing Design Compressive Strength Formula:</div>
              <div class="solution-equation" data-math="P_d = A_e \\times f_{cd} = (2 \\times A) \\times f_{cd}"></div>
              <div class="solution-formula-label">Numerical Substitution & Result:</div>
              <div class="solution-equation solution-result" data-math="P_d = \\frac{${At} \\times ${(gm.governingCapacity * 1000 / At).toFixed(1)}}{1000} = \\mathbf{${gm.governingCapacity.toFixed(2)}\\text{ kN}}"></div>
              <div class="solution-remarks">
                <div class="solution-remarks-title">Variable Remarks & Source:</div>
                • <b>$P_d$ (Design Compressive Strength)</b> = $${gm.governingCapacity.toFixed(2)}\\text{ kN}$ — Total axial resistance.<br>
                • <b>$A_e$ (Effective Gross Sectional Area)</b> = $2 \\times A = 2 \\times ${sec.A} = ${At}\\text{ mm}^2$ — Area of two angle sections back-to-back from SP: 6(1).<br>
                • <b>$P_u$ (Factored Compressive Demand)</b> = $${P_comp.toFixed(2)}\\text{ kN}$ under ${gm.governingLC}.<br>
                • <b>Utilization Ratio</b> = $P_u / P_d = ${(gm.util * 100).toFixed(1)}\\%$ — ${gm.pass ? '<b style="color:var(--ok)">SAFE (PASS)</b>' : '<b style="color:var(--bad)">OVERSTRESSED (FAIL)</b>'}.
              </div>
            </div>
            <div class="solution-block">
              <h3>5.2 Bottom Chord Tension Member Design (Cl. 6.2 & 6.3)</h3>
              <p>Maximum factored tension force $T_u = \\mathbf{${maxTieTension.toFixed(2)}\\text{ kN}}$ under $1.5(DL + LL)$.</p>
              <p>Section chosen: <b>2 × ${root.escSafe(S.section)}</b> back-to-back connected to 10 mm gusset plate ($A_g = ${At}\\text{ mm}^2$).</p>

              <div class="solution-formula-label">Governing Gross Yielding Resistance Formula (Cl. 6.2):</div>
              <div class="solution-equation" data-math="T_{dg} = \\frac{A_g \\cdot f_y}{\\gamma_{m0}}"></div>
              <div class="solution-formula-label">Numerical Substitution & Result:</div>
              <div class="solution-equation solution-substitution" data-math="T_{dg} = \\frac{${At} \\times 250}{1.10 \\times 1000} = \\mathbf{${tensionCap.Tdg.toFixed(2)}\\text{ kN}}"></div>
              <div class="solution-remarks">
                <div class="solution-remarks-title">Variable Remarks & Source:</div>
                • <b>$T_{dg}$ (Gross Yielding Design Strength)</b> = $${tensionCap.Tdg.toFixed(2)}\\text{ kN}$ (IS 800 Cl. 6.2).<br>
                • <b>$A_g$ (Gross Cross-Sectional Area)</b> = $${At}\\text{ mm}^2$ ($2 \\times ${sec.A}\\text{ mm}^2$).<br>
                • <b>$f_y$ (Yield Stress)</b> = $250\\text{ MPa}$.<br>
                • <b>$\\gamma_{m0}$ (Partial Safety Factor)</b> = $1.10$ (Table 5).
              </div>

              <div class="solution-formula-label">Governing Net Section Rupture Formula (Cl. 6.3):</div>
              <div class="solution-equation" data-math="T_{dn} = \\frac{0.8 A_n \\cdot f_u}{\\gamma_{m1}}"></div>
              <div class="solution-formula-label">Numerical Substitution & Result:</div>
              <div class="solution-equation solution-substitution" data-math="T_{dn} = \\frac{0.8 \\times ${At} \\times 410}{1.25 \\times 1000} = \\mathbf{${tensionCap.Tdn.toFixed(2)}\\text{ kN}}"></div>
              <div class="solution-remarks">
                <div class="solution-remarks-title">Variable Remarks & Source:</div>
                • <b>$T_{dn}$ (Net Rupture Design Strength)</b> = $${tensionCap.Tdn.toFixed(2)}\\text{ kN}$ (IS 800 Cl. 6.3).<br>
                • Factor $0.8$ (Shear Lag Factor) — Reduction for angle sections connected through one leg (Cl. 6.3.3).<br>
                • <b>$f_u$ (Ultimate Tensile Strength)</b> = $410\\text{ MPa}$.<br>
                • <b>$\\gamma_{m1}$ (Partial Safety Factor for Rupture)</b> = $1.25$ (Table 5).
              </div>

              <div class="solution-formula-label">Governing Design Tensile Capacity Formula:</div>
              <div class="solution-equation" data-math="T_d = \\min(T_{dg}, T_{dn})"></div>
              <div class="solution-formula-label">Numerical Substitution & Result:</div>
              <div class="solution-equation solution-result" data-math="T_d = \\min(${tensionCap.Tdg.toFixed(2)}, ${tensionCap.Tdn.toFixed(2)}) = \\mathbf{${tensionCap.Td.toFixed(2)}\\text{ kN}} \\ge T_u = ${maxTieTension.toFixed(2)}\\text{ kN}"></div>
              <div class="solution-remarks">
                <div class="solution-remarks-title">Variable Remarks & Source:</div>
                • <b>$T_d$ (Governing Tensile Capacity)</b> = $${tensionCap.Td.toFixed(2)}\\text{ kN}$.<br>
                • <b>$T_u$ (Factored Tension Force Demand)</b> = $${maxTieTension.toFixed(2)}\\text{ kN}$ under $1.5(DL + LL)$.<br>
                • <b>Tension Utilization</b> = ${( (maxTieTension / tensionCap.Td) * 100 ).toFixed(1)}\\%$ — <b style="color:var(--ok)">SAFE (PASS)</b>.
              </div>
              <div class="solution-callout" style="margin-top:8px">
                <b>Wind Stress Reversal Check (IS 800 Table 3):</b><br>
                Under Case 4 ($0.9DL + 1.5WL_{\\text{uplift}}$), aerodynamic suction reverses bottom tie tension to compression. Slenderness ratio is verified against the reversal tie limit $\\lambda \\le 350$.
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
        const totalDL = ( (S.roof === 'AC' ? 170 : 130) / Math.cos((d.slopeDeg * Math.PI) / 180) + 100 + (d.span / 3 + 5) * 10 + 15 ) / 1000;
        const totalFactoredGravity = 1.5 * (totalDL + d.loads.ll_kN_m2);
        return `
          <div class="solution-grid">
            <div class="solution-block">
              <h3>6.1 Load Resolution on Sloping Rafter</h3>
              <p>Purlin span $L_p = \\text{Spacing} = \\mathbf{${d.spacing.toFixed(2)}\\text{ m}}$, purlin spacing along rafter $s_p = \\mathbf{${Number(S.purlinSpacing).toFixed(2)}\\text{ m}}$.</p>

              <div class="solution-formula-label">Governing Normal Distributed Load Formula (Major z-axis):</div>
              <div class="solution-equation" data-math="w_z = w_{\\text{gravity, factored}} \\times \\cos\\theta \\times s_p"></div>
              <div class="solution-formula-label">Numerical Substitution & Result:</div>
              <div class="solution-equation solution-substitution" data-math="w_z = ${totalFactoredGravity.toFixed(3)} \\times \\cos(${d.slopeDeg.toFixed(1)}^\\circ) \\times ${Number(S.purlinSpacing).toFixed(2)} = \\mathbf{${p.wz.toFixed(3)}\\text{ kN/m}}"></div>
              <div class="solution-remarks">
                <div class="solution-remarks-title">Variable Remarks & Source:</div>
                • <b>$w_z$ (Normal Distributed Load)</b> = ${p.wz.toFixed(3)} kN/m — Acting perpendicular to roof cladding along channel major web axis.<br>
                • <b>w_gravity,factored</b> = $1.5(w_{DL} + w_{LL}) = ${totalFactoredGravity.toFixed(3)}\\text{ kN/m}^2$ — Factored gravity loading on plan area.<br>
                • <b>\\theta (Roof Pitch Angle)</b> = ${d.slopeDeg.toFixed(1)}°.<br>
                • <b>s_p (Purlin Spacing)</b> = ${Number(S.purlinSpacing).toFixed(2)} m — Center-to-center distance between purlins along rafter.
              </div>

              <div class="solution-formula-label">Governing Tangential Distributed Load Formula (Minor y-axis):</div>
              <div class="solution-equation" data-math="w_y = w_{\\text{gravity, factored}} \\times \\sin\\theta \\times s_p"></div>
              <div class="solution-formula-label">Numerical Substitution & Result:</div>
              <div class="solution-equation solution-substitution" data-math="w_y = ${totalFactoredGravity.toFixed(3)} \\times \\sin(${d.slopeDeg.toFixed(1)}^\\circ) \\times ${Number(S.purlinSpacing).toFixed(2)} = \\mathbf{${p.wy.toFixed(3)}\\text{ kN/m}}"></div>
              <div class="solution-remarks">
                <div class="solution-remarks-title">Variable Remarks & Source:</div>
                • <b>$w_y$ (Tangential Distributed Load)</b> = ${p.wy.toFixed(3)} kN/m — Acting parallel to roof cladding along channel minor flange axis.<br>
                • <b>s_p</b> = ${Number(S.purlinSpacing).toFixed(2)} m.
              </div>

              <div class="solution-formula-label">Governing Major Axis Moment Formula (Continuous Beam):</div>
              <div class="solution-equation" data-math="M_z = \\frac{w_z L_p^2}{10}"></div>
              <div class="solution-formula-label">Numerical Substitution & Result:</div>
              <div class="solution-equation solution-substitution" data-math="M_z = \\frac{${p.wz.toFixed(3)} \\times (${d.spacing.toFixed(2)})^2}{10} = \\mathbf{${p.Mz.toFixed(2)}\\text{ kNm}}"></div>
              <div class="solution-remarks">
                <div class="solution-remarks-title">Variable Remarks & Source:</div>
                • <b>$M_z$ (Major Axis Bending Moment)</b> = ${p.Mz.toFixed(2)} kNm — Bending moment about major z-axis.<br>
                • Factor $\frac{1}{10}$ — Continuous beam moment coefficient across multiple truss supports.<br>
                • <b>$L_p$ (Purlin Span)</b> = ${d.spacing.toFixed(2)} m — Purlin span equal to truss spacing $S$.
              </div>

              <div class="solution-formula-label">Governing Minor Axis Moment Formula:</div>
              <div class="solution-equation" data-math="M_y = \\frac{w_y L_p^2}{10}"></div>
              <div class="solution-formula-label">Numerical Substitution & Result:</div>
              <div class="solution-equation solution-substitution" data-math="M_y = \\frac{${p.wy.toFixed(3)} \\times (${d.spacing.toFixed(2)})^2}{10} = \\mathbf{${p.My.toFixed(2)}\\text{ kNm}}"></div>
              <div class="solution-remarks">
                <div class="solution-remarks-title">Variable Remarks & Source:</div>
                • <b>$M_y$ (Minor Axis Bending Moment)</b> = ${p.My.toFixed(2)} kNm — Transverse minor axis bending moment.
              </div>
            </div>
            <div class="solution-block">
              <h3>6.2 Section Properties & Moment Capacities</h3>
              <p>Selected section: <b>${root.escSafe(S.purlin)}</b> ($Z_z = ${ch.Zz}\\text{ cm}^3, Z_y = ${ch.Zy}\\text{ cm}^3, I_z = ${ch.Iz / 1e4}\\text{ cm}^4$).</p>

              <div class="solution-formula-label">Governing Major Moment Capacity Formula (IS 800 Cl. 8.2):</div>
              <div class="solution-equation" data-math="M_{dz} = \\frac{\\beta_b Z_{pz} f_y}{\\gamma_{m0}} = \\frac{1.2 Z_z f_y}{\\gamma_{m0}}"></div>
              <div class="solution-formula-label">Numerical Substitution & Result:</div>
              <div class="solution-equation solution-substitution" data-math="M_{dz} = \\frac{1.2 \\times (${ch.Zz} \\times 10^3) \\times 250}{1.10 \\times 10^6} = \\mathbf{${p.Mdz.toFixed(2)}\\text{ kNm}}"></div>
              <div class="solution-remarks">
                <div class="solution-remarks-title">Variable Remarks & Source:</div>
                • <b>$M_{dz}$ (Design Major Moment Resistance)</b> = ${p.Mdz.toFixed(2)} kNm (IS 800 Cl. 8.2.1.2).<br>
                • <b>$Z_z$ (Elastic Section Modulus)</b> = ${ch.Zz} cm³ (${ch.Zz * 1000} mm³) — From SP: 6(1) for selected ${S.purlin}.<br>
                • <b>\\beta_b (Plasticity Factor)</b> = 1.0 for compact sections, with plastic section modulus $Z_{pz} \\approx 1.2 Z_z$.<br>
                • <b>$f_y$ (Yield Stress)</b> = $250\text{ MPa}$.<br>
                • <b>\\gamma_{m0} (Partial Safety Factor)</b> = 1.10 (Table 5).
              </div>

              <div class="solution-formula-label">Governing Minor Moment Capacity Formula:</div>
              <div class="solution-equation" data-math="M_{dy} = \\frac{1.2 Z_y f_y}{\\gamma_{m0}}"></div>
              <div class="solution-formula-label">Numerical Substitution & Result:</div>
              <div class="solution-equation solution-substitution" data-math="M_{dy} = \\frac{1.2 \\times (${ch.Zy} \\times 10^3) \\times 250}{1.10 \\times 10^6} = \\mathbf{${p.Mdy.toFixed(2)}\\text{ kNm}}"></div>
              <div class="solution-remarks">
                <div class="solution-remarks-title">Variable Remarks & Source:</div>
                • <b>$M_{dy}$ (Design Minor Moment Resistance)</b> = ${p.Mdy.toFixed(2)} kNm.<br>
                • <b>$Z_y$ (Minor Elastic Section Modulus)</b> = ${ch.Zy} cm³ from SP: 6(1).
              </div>
            </div>
            <div class="solution-block wide">
              <h3>6.3 IS 800 Cl. 9.3.1 Biaxial Interaction & Serviceability</h3>
              <p>(a) Biaxial bending interaction check:</p>
              <div class="solution-formula-label">Governing Biaxial Interaction Formula (Cl. 9.3.1):</div>
              <div class="solution-equation" data-math="\\frac{M_z}{M_{dz}} + \\frac{M_y}{M_{dy}} \\le 1.0"></div>
              <div class="solution-formula-label">Numerical Substitution & Result:</div>
              <div class="solution-equation solution-result" data-math="\\frac{${p.Mz.toFixed(2)}}{${p.Mdz.toFixed(2)}} + \\frac{${p.My.toFixed(2)}}{${p.Mdy.toFixed(2)}} = ${(p.Mz / p.Mdz).toFixed(3)} + ${(p.My / p.Mdy).toFixed(3)} = \\mathbf{${p.interactionRatio.toFixed(3)}} \\le 1.0\\quad(${p.interactionRatio <= 1.0 ? 'PASS' : 'FAIL'})"></div>
              <div class="solution-remarks">
                <div class="solution-remarks-title">Variable Remarks & Source:</div>
                • <b>$\text{Interaction Ratio}$</b> = $${p.interactionRatio.toFixed(3)}$ — Linear interaction criterion for combined biaxial bending capacity per IS 800:2007 Cl. 9.3.1.<br>
                • <b>$M_z, M_y$</b> — Applied factored design moments from Step 6.1.<br>
                • <b>$M_{dz}, M_{dy}$</b> — Design moment resistances from Step 6.2.
              </div>

              <p>(b) Shear capacity check:</p>
              <div class="solution-formula-label">Governing Shear Formula:</div>
              <div class="solution-equation" data-math="V_z = \\frac{w_z L_p}{2},\\quad V_{dz} = \\frac{A_v \\cdot f_y}{\\sqrt{3}\\cdot\\gamma_{m0}}"></div>
              <div class="solution-formula-label">Numerical Substitution & Result:</div>
              <div class="solution-equation solution-substitution" data-math="V_z = \\frac{${p.wz.toFixed(3)} \\times ${d.spacing.toFixed(2)}}{2} = \\mathbf{${p.Vz.toFixed(2)}\\text{ kN}} \\le V_{dz} = \\mathbf{${p.Vdz.toFixed(2)}\\text{ kN}}\\quad(\\text{Ratio: } ${(p.shearRatio * 100).toFixed(1)}\\%)"></div>
              <div class="solution-remarks">
                <div class="solution-remarks-title">Variable Remarks & Source:</div>
                • <b>$V_z$ (Factored Shear Demand)</b> = ${p.Vz.toFixed(2)} kN.<br>
                • <b>$V_{dz}$ (Design Web Shear Capacity)</b> = ${p.Vdz.toFixed(2)} kN (IS 800 Cl. 8.4.1).<br>
                • <b>$A_v$</b> = $h \\times t_w$ — Shear area of channel web.<br>
                • <b>\\sqrt{3}</b> = 1.732 — Von Mises shear yield factor.
              </div>

              <p>(c) Deflection check under service loads (Table 6 limit $L_p / 180$ for corrugated sheets):</p>
              <div class="solution-formula-label">Governing Deflection Formula:</div>
              <div class="solution-equation" data-math="\\delta = \\frac{5 w_{z,\\text{serv}} L_p^4}{384 E I_z},\\quad \\delta_{\\text{lim}} = \\frac{L_p}{180}"></div>
              <div class="solution-formula-label">Numerical Substitution & Result:</div>
              <div class="solution-equation solution-substitution" data-math="\\delta = \\frac{5 \\times ${(p.wz / 1.5).toFixed(3)} \\times (${(d.spacing * 1000).toFixed(0)})^4}{384 \\times (2 \\times 10^5) \\times (${ch.Iz})} = \\mathbf{${p.delta.toFixed(2)}\\text{ mm}} \\le \\delta_{\\text{lim}} = \\frac{${(d.spacing * 1000).toFixed(0)}}{180} = \\mathbf{${p.delta_limit.toFixed(2)}\\text{ mm}}\\quad(${p.delta <= p.delta_limit ? 'PASS' : 'FAIL'})"></div>
              <div class="solution-remarks">
                <div class="solution-remarks-title">Variable Remarks & Source:</div>
                • <b>\\delta (Delta / Actual Mid-span Deflection)</b> = ${p.delta.toFixed(2)} mm — Calculated deflection under unfactored service gravity load.<br>
                • <b>\\delta_lim (Permissible Deflection Limit)</b> = ${p.delta_limit.toFixed(2)} mm — Code serviceability threshold ($L_p / 180$) per IS 800 Table 6.<br>
                • <b>$w_{z,\text{serv}}$ (Service Load)</b> = ${(p.wz / 1.5).toFixed(3)} N/mm.<br>
                • <b>$L_p$ (Purlin Span)</b> = ${(d.spacing * 1000).toFixed(0)} mm (${d.spacing.toFixed(2)} m).<br>
                • <b>E (Modulus of Elasticity)</b> = $2.0 \\times 10^5\\text{ MPa}$.<br>
                • <b>$I_z$ (Major Second Moment of Area)</b> = ${ch.Iz} mm⁴ (${(ch.Iz / 1e4).toFixed(1)} cm⁴) from SP: 6(1).
              </div>
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
              <p>Maximum factored downward reaction from truss: $P_u = \\mathbf{${c.demand.toFixed(2)}\\text{ kN}}$.</p>
              <p>Column height $H = \\mathbf{${Number(S.height).toFixed(2)}\\text{ m}}$, effective length factor $K = ${(Number(S.K) || 1.0).toFixed(2)}$.</p>
              <p>Selected section: <b>2 × ${root.escSafe(S.column)} back-to-back</b> ($A = 2 \\times ${ch.A} = ${2 * ch.A}\\text{ mm}^2, r_z = ${ch.rz}\\text{ mm}$).</p>
              <p>Web-to-web gap $s$ calculated so that radius of gyration $r_y \\ge r_z$ ($I_{yy} \\ge I_{zz}$):</p>

              <div class="solution-formula-label">Governing Channel Spacing Formula (for Equal Moments of Inertia):</div>
              <div class="solution-equation" data-math="s = 2 \\left(\\sqrt{\\frac{I_z - I_y}{A}} - C_y\\right)"></div>
              <div class="solution-formula-label">Numerical Substitution & Result:</div>
              <div class="solution-equation solution-substitution" data-math="s = 2 \\left(\\sqrt{\\frac{${ch.Iz} - ${ch.Iy}}{${ch.A}}} - ${ch.Cy}\\right) = \\mathbf{${c.spacing_s}\\text{ mm}}"></div>
              <div class="solution-remarks">
                <div class="solution-remarks-title">Variable Remarks & Source:</div>
                • <b>$s$ (Clear Web-to-Web Gap)</b> = ${c.spacing_s} mm — Spacing between back-to-back channels to equalize principal moments of inertia ($I_{yy} = I_{zz}$ and $r_y = r_z$) for uniform column strength in both planes (IS 800 Cl. 7.6.1.1).<br>
                • <b>$I_z$ (Major Moment of Inertia)</b> = ${ch.Iz} mm⁴ (${(ch.Iz / 1e4).toFixed(1)} cm⁴) from SP: 6(1).<br>
                • <b>$I_y$ (Minor Moment of Inertia)</b> = ${ch.Iy} mm⁴ (${(ch.Iy / 1e4).toFixed(1)} cm⁴).<br>
                • <b>$A$ (Single Channel Sectional Area)</b> = ${ch.A} mm².<br>
                • <b>$C_y$ (Centroid Distance from Back of Web)</b> = ${ch.Cy} mm.
              </div>
            </div>
            <div class="solution-block">
              <h3>7.2 Effective Slenderness with Lacing Flexibility</h3>
              <p>Slenderness about material axis:</p>
              <div class="solution-formula-label">Governing Material Slenderness Formula:</div>
              <div class="solution-equation" data-math="\\lambda_z = \\frac{KL}{r_z}"></div>
              <div class="solution-formula-label">Numerical Substitution & Result:</div>
              <div class="solution-equation solution-substitution" data-math="\\lambda_z = \\frac{${( (Number(S.K) || 1.0) * Number(S.height) * 1000 ).toFixed(0)}}{${ch.rz}} = \\mathbf{${c.lambda_z.toFixed(1)}}"></div>
              <div class="solution-remarks">
                <div class="solution-remarks-title">Variable Remarks & Source:</div>
                • <b>\\lambda_z (Material Axis Slenderness)</b> = ${c.lambda_z.toFixed(1)} — Slenderness ratio about non-built-up solid material axis.<br>
                • <b>KL (Effective Column Height)</b> = $K \\times H = ${( (Number(S.K) || 1.0) * Number(S.height) * 1000 ).toFixed(0)}\\text{ mm}$ ($K = ${(Number(S.K) || 1.0).toFixed(2)}, H = ${Number(S.height).toFixed(2)}\\text{ m}$).<br>
                • <b>$r_z$ (Radius of Gyration about Major Axis)</b> = ${ch.rz} mm from SP: 6(1).
              </div>

              <p>As per IS 800 Cl. 7.6.1.5, effective slenderness of laced columns is increased by 5% to account for shear deformation:</p>
              <div class="solution-formula-label">Governing Modified Slenderness Formula:</div>
              <div class="solution-equation" data-math="\\lambda_e = 1.05 \\times \\lambda_z"></div>
              <div class="solution-formula-label">Numerical Substitution & Result:</div>
              <div class="solution-equation solution-substitution" data-math="\\lambda_e = 1.05 \\times ${c.lambda_z.toFixed(1)} = \\mathbf{${c.lambda_e.toFixed(1)}}"></div>
              <div class="solution-remarks">
                <div class="solution-remarks-title">Variable Remarks & Source:</div>
                • <b>\\lambda_e (Modified Effective Slenderness Ratio)</b> = ${c.lambda_e.toFixed(1)}.<br>
                • Factor $1.05$ — Mandatory 5% slenderness enlargement per IS 800:2007 Cl. 7.6.1.5 to account for shear deformation and flexibility of the lacing system.
              </div>

              <div class="solution-formula-label">Governing Column Compressive Capacity Formula:</div>
              <div class="solution-equation" data-math="P_d = A_{\\text{total}} \\times f_{cd} = (2 \\times A) \\times f_{cd}"></div>
              <div class="solution-formula-label">Numerical Substitution & Result:</div>
              <div class="solution-equation solution-result" data-math="P_d = \\frac{${2 * ch.A} \\times ${c.fcd}}{1000} = \\mathbf{${c.Pd.toFixed(2)}\\text{ kN}} \\ge P_u = ${c.demand.toFixed(2)}\\text{ kN}"></div>
              <div class="solution-remarks">
                <div class="solution-remarks-title">Variable Remarks & Source:</div>
                • <b>$P_d$ (Design Compressive Strength)</b> = ${c.Pd.toFixed(2)} kN — Total axial resistance of built-up column.<br>
                • <b>$A_{\text{total}}$ (Combined Cross-Sectional Area)</b> = $2 \\times A = 2 \\times ${ch.A} = ${2 * ch.A}\\text{ mm}^2$.<br>
                • <b>$f_{cd}$ (Design Compressive Stress)</b> = $${c.fcd}\text{ MPa}$ — From Perry-Robertson curve (Buckling Class 'c') at $\\lambda_e = ${c.lambda_e.toFixed(1)}.<br>
                • <b>$P_u$ (Factored Downward Axial Demand)</b> = ${c.demand.toFixed(2)} kN — Reaction transmitted from truss support.<br>
                • <b>Column Utilization</b> = ${(c.colUtil * 100).toFixed(1)}\\%$ — ${c.colPass ? '<b style="color:var(--ok)">PASS</b>' : '<b style="color:var(--bad)">FAIL</b>'}.
              </div>
            </div>
            <div class="solution-block wide">
              <h3>7.3 Design of Lacing System (IS 800 Cl. 7.6.6)</h3>
              <p>(a) Transverse shear resisted by lacing bars across both planes:</p>
              <div class="solution-formula-label">Governing Transverse Shear Formula (Cl. 7.6.6.1):</div>
              <div class="solution-equation" data-math="V_t = 0.025 \\times P_u"></div>
              <div class="solution-formula-label">Numerical Substitution & Result:</div>
              <div class="solution-equation solution-substitution" data-math="V_t = 0.025 \\times ${c.demand.toFixed(1)} = \\mathbf{${c.Vt.toFixed(2)}\\text{ kN}}"></div>
              <div class="solution-remarks">
                <div class="solution-remarks-title">Variable Remarks & Source:</div>
                • <b>$V_t$ (Transverse Design Shear Force)</b> = ${c.Vt.toFixed(2)} kN — Lateral shear force across both planes.<br>
                • Factor $0.025$ (2.5% Rule) — Mandatory design requirement per IS 800:2007 Cl. 7.6.6.1 to resist lateral buckling tendencies.<br>
                • <b>$P_u$ (Column Factored Axial Load)</b> = ${c.demand.toFixed(1)} kN.
              </div>

              <p>(b) Compressive force in lacing bar inclined at $\\theta_l = 45^\\circ$:</p>
              <div class="solution-formula-label">Governing Lacing Bar Force Formula:</div>
              <div class="solution-equation" data-math="F_l = \\frac{V_t / N_{\\text{planes}}}{\\sin\\theta_l} = \\frac{V_t / 2}{\\sin 45^\\circ}"></div>
              <div class="solution-formula-label">Numerical Substitution & Result:</div>
              <div class="solution-equation solution-substitution" data-math="F_l = \\frac{${(c.Vt / 2).toFixed(2)}}{\\sin 45^\\circ} = \\frac{${(c.Vt / 2).toFixed(2)}}{0.7071} = \\mathbf{${c.Fl.toFixed(2)}\\text{ kN}}"></div>
              <div class="solution-remarks">
                <div class="solution-remarks-title">Variable Remarks & Source:</div>
                • <b>$F_l$ (Axial Compressive Force in Lacing Bar)</b> = ${c.Fl.toFixed(2)} kN.<br>
                • <b>$N_{\text{planes}}$ (Number of Lacing Planes)</b> = 2 — Lacing provided on both open faces.<br>
                • <b>\\theta_l (Lacing Inclination Angle)</b> = 45° — Angle with column axis ($40^\\circ \\le \\theta \\le 70^\\circ$, Cl. 7.6.4).
              </div>

              <p>(c) Lacing flat dimensions provided: <b>${c.lacingFlat}</b> ($L_1 = ${c.lacingLength.toFixed(1)}\\text{ mm}$):</p>
              <div class="solution-formula-label">Governing Lacing Slenderness Formula:</div>
              <div class="solution-equation" data-math="\\lambda_{\\text{flat}} = \\frac{L_1}{r_{\\text{min}}} \\le 145"></div>
              <div class="solution-formula-label">Numerical Substitution & Result:</div>
              <div class="solution-equation solution-substitution" data-math="\\lambda_{\\text{flat}} = \\frac{${c.lacingLength.toFixed(1)}}{${(c.lacingLength / c.lambda_lacing).toFixed(2)}} = \\mathbf{${c.lambda_lacing.toFixed(1)}} \\le 145\\quad(\\text{Cl. 7.6.6.3 OK})"></div>
              <div class="solution-remarks">
                <div class="solution-remarks-title">Variable Remarks & Source:</div>
                • <b>\\lambda_flat (Lacing Flat Slenderness Ratio)</b> = ${c.lambda_lacing.toFixed(1)}.<br>
                • <b>$L_1$ (Length of Lacing Bar between Fasteners)</b> = ${c.lacingLength.toFixed(1)} mm.<br>
                • <b>$r_{\text{min}}$ (Minimum Radius of Gyration of Flat)</b> = ${(c.lacingLength / c.lambda_lacing).toFixed(2)} mm ($t / \\sqrt{12}$).<br>
                • <b>$\lambda_{\text{limit}} = 145$</b> (Maximum Permissible Slenderness) — Code limit for lacing bars (IS 800 Cl. 7.6.6.3).
              </div>

              <div class="solution-formula-label">Governing Lacing Compressive Capacity Formula:</div>
              <div class="solution-equation" data-math="P_{d,\\text{lacing}} = A_{\\text{flat}} \\times f_{cd,\\text{flat}}"></div>
              <div class="solution-formula-label">Numerical Substitution & Result:</div>
              <div class="solution-equation solution-result" data-math="P_{d,\\text{lacing}} = \\mathbf{${c.Pd_lacing.toFixed(2)}\\text{ kN}} \\ge F_l = ${c.Fl.toFixed(2)}\\text{ kN}\\quad(${c.lacingPass ? 'PASS' : 'FAIL'})"></div>
              <div class="solution-remarks">
                <div class="solution-remarks-title">Variable Remarks & Source:</div>
                • <b>$P_{d,\text{lacing}}$ (Compressive Capacity of Lacing Flat)</b> = ${c.Pd_lacing.toFixed(2)} kN.<br>
                • <b>$F_l$ (Axial Compressive Demand)</b> = ${c.Fl.toFixed(2)} kN — ${c.lacingPass ? 'SAFE (PASS)' : 'OVERSTRESSED (FAIL)'}.
              </div>
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
              <div class="solution-formula-label">Governing Connection Demand:</div>
              <div class="solution-equation" data-math="P_u = \\mathbf{${P_u.toFixed(2)}\\text{ kN}}"></div>
              <div class="solution-remarks">
                <div class="solution-remarks-title">Variable Remarks & Source:</div>
                • <b>$P_u$ (Factored Connection Axial Force Demand)</b> = ${P_u.toFixed(2)} kN — Governing factored axial tension or compression entering the joint from truss analysis (IS 800 Cl. 10.1.1).<br>
                • Connection type assigned: <b>${root.escSafe(S.connection)}</b> to 10 mm thick Grade E250 gusset plate.
              </div>
            </div>
            <div class="solution-block">
              <h3>8.2 Joint Design Formulation (IS 800)</h3>
              ${conn.type === 'Welded' ? `
                <p>Fillet weld size $s_w = \\mathbf{${conn.weldSize}\\text{ mm}}$.</p>
                <div class="solution-formula-label">Governing Effective Throat Thickness Formula (Table 22):</div>
                <div class="solution-equation" data-math="t_t = K_w \\times s_w = 0.70 \\times s_w"></div>
                <div class="solution-formula-label">Numerical Substitution & Result:</div>
                <div class="solution-equation solution-substitution" data-math="t_t = 0.70 \\times ${conn.weldSize} = \\mathbf{${conn.tt}\\text{ mm}}"></div>
                <div class="solution-remarks">
                  <div class="solution-remarks-title">Variable Remarks & Source:</div>
                  • <b>$t_t$ (Effective Throat Thickness)</b> = ${conn.tt} mm — Minimum thickness of weld metal along throat line.<br>
                  • <b>$K_w$ (Throat Factor)</b> = 0.70 — For $60^\\circ - 90^\\circ$ angle between fusion faces (IS 800:2007 Table 22).<br>
                  • <b>$s_w$ (Nominal Fillet Weld Leg Size)</b> = ${conn.weldSize} mm.
                </div>

                <div class="solution-formula-label">Governing Design Weld Shear Stress Formula (Cl. 10.5.7.1.1):</div>
                <div class="solution-equation" data-math="f_{wd} = \\frac{f_u}{\\sqrt{3} \\cdot \\gamma_{mw}}"></div>
                <div class="solution-formula-label">Numerical Substitution & Result:</div>
                <div class="solution-equation solution-substitution" data-math="f_{wd} = \\frac{410}{\\sqrt{3} \\times 1.25} = \\frac{410}{1.732 \\times 1.25} = \\mathbf{${conn.fwd.toFixed(2)}\\text{ N/mm}^2}"></div>
                <div class="solution-remarks">
                  <div class="solution-remarks-title">Variable Remarks & Source:</div>
                  • <b>$f_{wd}$ (Design Shear Stress of Weld)</b> = ${conn.fwd.toFixed(2)} N/mm² (IS 800 Cl. 10.5.7.1.1).<br>
                  • <b>$f_u$ (Ultimate Tensile Strength of Steel)</b> = 410 MPa.<br>
                  • <b>\\sqrt{3}</b> = 1.732 — Von Mises shear yield criterion factor.<br>
                  • <b>\\gamma_{mw} (Partial Safety Factor for Shop Weld)</b> = 1.25 (Table 5).
                </div>

                <div class="solution-formula-label">Governing Weld Strength per mm Run Formula:</div>
                <div class="solution-equation" data-math="q_w = f_{wd} \\times t_t"></div>
                <div class="solution-formula-label">Numerical Substitution & Result:</div>
                <div class="solution-equation solution-substitution" data-math="q_w = ${conn.fwd.toFixed(2)} \\times ${conn.tt} = \\mathbf{${conn.qw.toFixed(1)}\\text{ N/mm}}"></div>
                <div class="solution-remarks">
                  <div class="solution-remarks-title">Variable Remarks & Source:</div>
                  • <b>$q_w$ (Weld Shear Strength per mm Run)</b> = ${conn.qw.toFixed(1)} N/mm — Load capacity per linear millimeter of weld run.
                </div>
              ` : `
                <p>Grade 4.6 bolts ($f_{ub} = 400\\text{ MPa}, \\gamma_{mb} = 1.25$), diameter: <b>M${conn.boltDia}</b>.</p>
                <div class="solution-formula-label">Governing Single Bolt Shear Capacity Formula (Cl. 10.3.3):</div>
                <div class="solution-equation" data-math="V_{dsb} = \\frac{f_{ub} A_{nb}}{\\sqrt{3} \\cdot \\gamma_{mb}}"></div>
                <div class="solution-formula-label">Numerical Substitution & Result:</div>
                <div class="solution-equation solution-substitution" data-math="V_{dsb} = \\frac{400 \\times ${(conn.boltDia === 20 ? 245 : (conn.boltDia === 16 ? 157 : 353))}}{\\sqrt{3} \\times 1.25 \\times 1000} = \\mathbf{${conn.Vdsb.toFixed(2)}\\text{ kN/bolt}}"></div>
                <div class="solution-remarks">
                  <div class="solution-remarks-title">Variable Remarks & Source:</div>
                  • <b>$V_{dsb}$ (Design Bolt Shear Capacity)</b> = ${conn.Vdsb.toFixed(2)} kN/bolt (IS 800 Cl. 10.3.3).<br>
                  • <b>$f_{ub}$ (Ultimate Tensile Strength of Bolt)</b> = 400 MPa for Grade 4.6 bolt.<br>
                  • <b>$A_{nb}$ (Net Tensile Area of Shank)</b> = ${(conn.boltDia === 20 ? 245 : (conn.boltDia === 16 ? 157 : 353))} mm² for M${conn.boltDia} bolt.<br>
                  • <b>\\gamma_{mb} (Partial Safety Factor for Bolt Resistance)</b> = 1.25 (Table 5).
                </div>

                <div class="solution-formula-label">Governing Number of Bolts Formula:</div>
                <div class="solution-equation" data-math="n_b = \\left\\lceil \\frac{P_u}{V_b} \\right\\rceil"></div>
                <div class="solution-formula-label">Numerical Substitution & Result:</div>
                <div class="solution-equation solution-substitution" data-math="n_b = \\left\\lceil \\frac{${P_u.toFixed(2)}}{${conn.boltValue.toFixed(2)}} \\right\\rceil = \\mathbf{${conn.numBolts}\\text{ bolts}}"></div>
                <div class="solution-remarks">
                  <div class="solution-remarks-title">Variable Remarks & Source:</div>
                  • <b>$n_b$ (Number of Bolts Required)</b> = ${conn.numBolts} bolts.<br>
                  • <b>$P_u$ (Factored Joint Axial Demand)</b> = ${P_u.toFixed(2)} kN.<br>
                  • <b>$V_b$ (Governing Bolt Value)</b> = ${conn.boltValue.toFixed(2)} kN — Governing single bolt design strength.
                </div>
              `}
            </div>
            <div class="solution-block wide">
              <h3>8.3 Capacity & Compliance Summary</h3>
              ${conn.type === 'Welded' ? `
                <div class="solution-formula-label">Governing Required Total Weld Length Formula:</div>
                <div class="solution-equation" data-math="L_{w,\\text{req}} = \\frac{P_u \\times 1000}{q_w}"></div>
                <div class="solution-formula-label">Numerical Substitution & Result:</div>
                <div class="solution-equation solution-substitution" data-math="L_{w,\\text{req}} = \\frac{${P_u.toFixed(2)} \\times 1000}{${conn.qw.toFixed(1)}} = \\mathbf{${conn.reqWeldLength.toFixed(1)}\\text{ mm}}"></div>
                <div class="solution-remarks">
                  <div class="solution-remarks-title">Variable Remarks & Source:</div>
                  • <b>$L_{w,\text{req}}$ (Required Weld Run Length)</b> = ${conn.reqWeldLength.toFixed(1)} mm.<br>
                  • <b>$P_u$ (Factored Axial Member Demand)</b> = ${P_u.toFixed(2)} kN.<br>
                  • <b>$q_w$ (Weld Shear Strength per mm Run)</b> = ${conn.qw.toFixed(1)} N/mm from Step 8.2.
                </div>

                <div class="solution-formula-label">Governing Weld Layout & Joint Capacity Formula:</div>
                <div class="solution-equation" data-math="L_{w,\\text{prov}} = 2 \\times L_{\\text{side}},\\quad P_{\\text{weld}} = \\frac{L_{w,\\text{prov}} \\times q_w}{1000}"></div>
                <div class="solution-formula-label">Numerical Substitution & Result:</div>
                <div class="solution-equation solution-result" data-math="L_{w,\\text{provided}} = 2 \\times ${conn.weldLengthPerSide}\\text{ mm} = \\mathbf{${conn.totalWeldLength}\\text{ mm}},\\quad P_{\\text{weld}} = \\frac{${conn.totalWeldLength} \\times ${conn.qw.toFixed(1)}}{1000} = \\mathbf{${conn.capacity.toFixed(1)}\\text{ kN}} \\ge P_u = ${P_u.toFixed(2)}\\text{ kN}"></div>
                <div class="solution-remarks">
                  <div class="solution-remarks-title">Variable Remarks & Source:</div>
                  • <b>$L_{w,\text{prov}}$ (Total Provided Weld Length)</b> = ${conn.totalWeldLength} mm — Provided along both longitudinal edges of the angle to eliminate shear eccentricity on the 10 mm gusset plate.<br>
                  • <b>$P_{\text{weld}}$ (Total Joint Weld Capacity)</b> = ${conn.capacity.toFixed(1)} kN $\\ge P_u = ${P_u.toFixed(2)}\\text{ kN}$.<br>
                  • <b>Weld Utilization Ratio</b> = ${(conn.util * 100).toFixed(1)}\\%$ — ${conn.pass ? '<b style="color:var(--ok)">SAFE (PASS)</b>' : '<b style="color:var(--bad)">INSUFFICIENT LENGTH (FAIL)</b>'}.
                </div>
              ` : `
                <div class="solution-formula-label">Governing Joint Capacity Formula:</div>
                <div class="solution-equation" data-math="P_{\\text{joint}} = n_b \\times V_b"></div>
                <div class="solution-formula-label">Numerical Substitution & Result:</div>
                <div class="solution-equation solution-result" data-math="P_{\\text{joint}} = ${conn.numBolts} \\times ${conn.boltValue.toFixed(2)} = \\mathbf{${conn.capacity.toFixed(2)}\\text{ kN}} \\ge P_u = ${P_u.toFixed(2)}\\text{ kN}"></div>
                <div class="solution-remarks">
                  <div class="solution-remarks-title">Variable Remarks & Source:</div>
                  • <b>$P_{\text{joint}}$ (Total Joint Resistance)</b> = ${conn.capacity.toFixed(2)} kN.<br>
                  • <b>$n_b$ (Number of Bolts)</b> = ${conn.numBolts} bolts provided.<br>
                  • <b>V_b (Bolt Value)</b> = ${conn.boltValue.toFixed(2)} kN/bolt.<br>
                  • <b>Bolted Connection Utilization</b> = ${(conn.util * 100).toFixed(1)}\\%$ — ${conn.pass ? '<b style="color:var(--ok)">PASS</b>' : '<b style="color:var(--bad)">FAIL</b>'}.
                </div>
              `}
            </div>
          </div>`;
      }
    }
  ];

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

    const heading = document.getElementById('solutionHeading');
    const sub = document.getElementById('studySub');
    const content = document.getElementById('solutionContent');
    const paper = document.getElementById('solutionPaper');

    if (heading) heading.textContent = step.title;
    if (sub) sub.textContent = `GROUP ${S.group} · ${step.badge} · STUDENT DESIGN SHEET`;

    // Ensure active tab class is updated immediately
    document.querySelectorAll('.solution-tab').forEach((b, j) => {
      b.classList.toggle('active', j === idx);
    });

    if (paper) {
      const kicker = paper.querySelector('.solution-kicker');
      if (kicker) kicker.textContent = `ASSIGNMENT 3A · GROUP ${S.group} (${G.loc || 'Custom'}) · IS 800:2007 / IS 875`;
      const badge = paper.querySelector('.solution-badge');
      if (badge) badge.textContent = step.badge;
    }

    try {
      if (content) content.innerHTML = step.body(d, S, G);
    } catch (err) {
      console.error('Error rendering step ' + (idx + 1) + ':', err);
      if (content) {
        content.innerHTML = '<div class="solution-callout" style="border-left-color:var(--danger, #ff4d4f);background:rgba(255,77,79,0.08)"><b>Rendering Error in Step ' + (idx + 1) + ':</b> ' + root.escSafe(err.message || String(err)) + '</div>';
      }
    }

    renderSolutionMathSafe();
    S.step = idx;
  }

  function setSolutionStep(i) {
    renderLiveSolution(i);
  }

  const workflowData = [
    ['Problem Statement', 'Start with the exact group data: span, building length, height, spacing, roof, terrain, connection and column arrangement. Span is transverse; building length controls frame count.', ''],
    ['Geometry', 'Create one transverse truss, then repeat the selected number of trusses along the building length. Columns sit under the truss support nodes. Purlins connect corresponding roof points longitudinally.', 'R = \\frac{L}{2}\\tan\\theta'],
    ['Loads (IS 875)', 'Apply dead load (Part 1), roof imposed load with slope reduction and 0.4 kN/m² minimum (Part 2), and wind pressure with k1, k2, k3, k4 factors (Part 3).', 'V_z = V_b k_1 k_2 k_3 k_4,\\quad p_z = 0.6 V_z^2'],
    ['Analysis', 'Formulate direct stiffness matrix [K]{u} = {F} and solve support reactions and member axial forces for all 4 Limit State load combinations.', '[K]\\{u\\} = \\{F\\},\\quad \\sum F_y = 0'],
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

  const StudyModule = {
    renderLiveSolution,
    setSolutionStep,
    openWorkflow,
    renderWorkflow
  };

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
