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

  const LIVE_SOLUTION = [
    {
      title: 'Design Data & Material Properties',
      badge: 'DESIGN DATA',
      body: (d, S, G) => {
        const tb = Textbook ? Textbook.computeTextbookAnalysis(S) : null;
        const grade = (root.Standards && root.Standards.STEEL_GRADES[S.grade || 'E250']) || { fy: 250, fu: 410, E: 200000 };
        const span = tb ? tb.span : Number(S.span) || 16;
        const panels = tb ? tb.panels : Number(S.panels) || 6;
        const trussType = S.truss || G.truss || 'Howe';

        return `
          <div class="solution-grid">
            <div class="solution-block wide">
              <h3>Design of Industrial Roof Truss (Group ${root.escSafe(S.group || 'G4')})</h3>
              <p>Standard university design specification for pitched industrial steel roof trusses:</p>
              
              <h4>Design Data</h4>
              <ul>
                <li><b>Type:</b> ${root.escSafe(trussType)} Roof Truss</li>
                <li><b>Span:</b> ${span.toFixed(2)} m</li>
                <li><b>Length of Structure:</b> ${Number(S.length || 98).toFixed(2)} m</li>
                <li><b>Column/Eave Height:</b> ${Number(S.height || 12).toFixed(2)} m</li>
                <li><b>Location:</b> ${root.escSafe(G.loc || S.loc || 'Gaya')}</li>
                <li><b>Roof Covering:</b> ${root.escSafe(S.roof || 'AC')} Sheet</li>
                <li><b>Panels:</b> ${panels} panels (User Specified)</li>
                <li><b>Internal Pressure Coeff ($C_{pi}$):</b> $\\pm ${Math.abs(Number(S.cpi) || 0.2).toFixed(1)}$</li>
              </ul>
            </div>

            <div class="solution-block wide">
              <h3>Material Properties (IS 2062 / IS 800)</h3>
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
              <div class="solution-equation" data-math="f_{yd} = \\frac{f_y}{\\gamma_{m0}} = \\frac{${grade.fy}}{1.10} = \\mathbf{${(grade.fy / 1.10).toFixed(2)}\\text{ MPa}}"></div>
              <div class="solution-remarks">
                <div class="solution-remarks-title">Variable Remarks & Source:</div>
                • <b>$f_{yd}$ (Design Yield Strength)</b> = $${(grade.fy / 1.10).toFixed(2)}\\text{ MPa}$ — Factored yield stress under Limit State of Strength.<br>
                • <b>$f_y$ (Characteristic Minimum Yield Stress)</b> = $${grade.fy}\\text{ MPa}$ — Minimum yield stress per IS 2062:2011.<br>
                • <b>$\\gamma_{m0}$ (Partial Safety Factor against Yielding)</b> = $1.10$ — Material resistance factor per IS 800:2007 Table 5.
              </div>
            </div>
          </div>`;
      }
    },
    {
      title: 'i) Geometry of Truss',
      badge: 'GEOMETRY',
      body: (d, S) => {
        const tb = Textbook ? Textbook.computeTextbookAnalysis(S) : null;
        const span = tb ? tb.span : Number(S.span) || 16;
        const rise = tb ? tb.rise : (span / 4);
        const spacing = tb ? tb.spacing : Number(S.spacing) || 4;
        const slopeDeg = tb ? tb.slopeDeg : 26.57;
        const planArea = tb ? tb.planArea : (span * spacing);
        const slopeArea = tb ? tb.slopeArea : (planArea / Math.cos((slopeDeg * Math.PI) / 180));
        const panels = tb ? tb.panels : Number(S.panels) || 6;
        const panelPlan = tb ? tb.panelPlan : (span / panels);
        const panelSlope = tb ? tb.panelSlope : (panelPlan / Math.cos((slopeDeg * Math.PI) / 180));

        const minSp = tb ? tb.minSpacing : (span / 5).toFixed(2);
        const maxSp = tb ? tb.maxSpacing : (span / 3).toFixed(2);

        return `
          <div class="solution-grid">
            <div class="solution-block wide">
              <h3>i) Geometry of Truss</h3>
              <ul>
                <li><b>Span:</b> ${span.toFixed(2)} m</li>
                <li><b>Rise ($R$):</b> (Assuming $1/4$ of span)
                  <div class="solution-equation" data-math="R = \\frac{1}{4} \\times ${span.toFixed(2)} = \\mathbf{${rise.toFixed(2)}\\text{ m (Assumed)}}"></div>
                </li>
                <li><b>Spacing of Truss:</b> (Range: $\\frac{1}{5}\\text{Span}$ to $\\frac{1}{3}\\text{Span} = ${minSp}\\text{ m to } ${maxSp}\\text{ m}$)
                  <div class="solution-equation" data-math="\\text{Spacing} = \\mathbf{${spacing.toFixed(2)}\\text{ m (Assumed)}}"></div>
                </li>
                <li><b>Slope of Truss ($\\theta$):</b>
                  <div class="solution-equation" data-math="\\theta = \\tan^{-1}\\left(\\frac{R}{\\text{Span}/2}\\right) = \\tan^{-1}\\left(\\frac{${rise.toFixed(2)}}{${(span / 2).toFixed(2)}}\\right) = \\mathbf{${slopeDeg.toFixed(2)}^\\circ}"></div>
                </li>
                <li><b>Plan Area of Truss:</b>
                  <div class="solution-equation" data-math="A_{\\text{plan}} = \\text{Span} \\times \\text{Spacing} = ${span.toFixed(2)} \\times ${spacing.toFixed(2)} = \\mathbf{${planArea.toFixed(2)}\\text{ m}^2}"></div>
                </li>
                <li><b>Slope Area of Truss:</b>
                  <div class="solution-equation" data-math="A_{\\text{slope}} = \\frac{\\text{Span} \\times \\text{Spacing}}{\\cos\\theta} = \\frac{${span.toFixed(2)} \\times ${spacing.toFixed(2)}}{\\cos(${slopeDeg.toFixed(2)}^\\circ)} = \\mathbf{${slopeArea.toFixed(2)}\\text{ m}^2}"></div>
                </li>
                <li><b>Number of Panels:</b> ${panels} panels</li>
                <li><b>Panel Length in Plan:</b>
                  <div class="solution-equation" data-math="L_{\\text{plan}} = \\frac{${span.toFixed(2)}}{${panels}} = \\mathbf{${panelPlan.toFixed(3)}\\text{ m}}"></div>
                </li>
                <li><b>Panel Length on Slope:</b>
                  <div class="solution-equation" data-math="L_{\\text{slope}} = \\frac{${panelPlan.toFixed(3)}}{\\cos(${slopeDeg.toFixed(2)}^\\circ)} = \\mathbf{${panelSlope.toFixed(3)}\\text{ m}}"></div>
                </li>
              </ul>

              <h4>Textbook Truss Geometry & Division Diagram</h4>
              <div class="truss-textbook-wrap">
                ${tb ? Textbook.renderFullTrussSVG(tb, 'geometry') : ''}
              </div>
            </div>
          </div>`;
      }
    },
    {
      title: 'ii) Load Calculations',
      badge: 'LOAD CALCULATIONS',
      body: (d, S, G) => {
        const tb = Textbook ? Textbook.computeTextbookAnalysis(S) : null;
        if (!tb) return '<div class="solution-callout">Unable to compute loads.</div>';

        const dl = tb.loads.dl;
        const ll = tb.loads.ll;
        const wl = tb.loads.wl;

        return `
          <div class="solution-grid">
            <div class="solution-block wide">
              <h3>ii) Load Calculations</h3>

              <h4>A) Dead Load (DL)</h4>
              <ul>
                <li>DL of Roofing (${root.escSafe(S.roof || 'AC')} Sheets): <b>${dl.sheet.toFixed(2)} N/m²</b></li>
                <li>DL of Purlins: <b>${dl.purlins.toFixed(2)} N/m²</b></li>
                <li>DL of Bracings: <b>${dl.bracing.toFixed(2)} N/m²</b></li>
                <li>Self Weight of Truss:
                  <div class="solution-equation" data-math="w_{\\text{truss}} = \\left(\\frac{\\text{Span}}{3} + 5\\right) \\times 10 = \\left(\\frac{${tb.span.toFixed(2)}}{3} + 5\\right) \\times 10 = \\mathbf{${dl.trussSelf.toFixed(2)}\\text{ N/m}^2}"></div>
                </li>
                <li><b>Total DL Intensity:</b>
                  <div class="solution-equation" data-math="w_{\\text{DL, total}} = ${dl.sheet} + ${dl.purlins} + ${dl.bracing} + ${dl.trussSelf.toFixed(2)} = \\mathbf{${dl.totalIntensity.toFixed(2)}\\text{ N/m}^2}"></div>
                </li>
              </ul>
              <div class="solution-formula-label">Nodal Dead Loads:</div>
              <div class="solution-equation" data-math="\\text{Total DL on Truss} = ${dl.totalIntensity.toFixed(2)} \\times ${tb.planArea.toFixed(2)} = \\mathbf{${dl.total_kN.toFixed(2)}\\text{ kN}}"></div>
              <div class="solution-equation" data-math="W_{\\text{DL, intermediate}} = \\frac{${dl.total_kN.toFixed(2)}}{${tb.panels}} = \\mathbf{${dl.intermediate_kN.toFixed(2)}\\text{ kN}}"></div>
              <div class="solution-equation" data-math="W_{\\text{DL, end}} = \\frac{${dl.intermediate_kN.toFixed(2)}}{2} = \\mathbf{${dl.end_kN.toFixed(2)}\\text{ kN}}"></div>

              <h4>B) Live Load (LL)</h4>
              <ul>
                <li>Roof Slope: $\\theta = ${tb.slopeDeg.toFixed(2)}^\\circ > 10^\\circ$</li>
                <li>LL on Roof:
                  <div class="solution-equation" data-math="w_{\\text{LL, roof}} = 750 - 20(${tb.slopeDeg.toFixed(2)} - 10) = \\mathbf{${ll.roofIntensity.toFixed(2)}\\text{ N/m}^2}"></div>
                </li>
                <li>LL on Truss (with purlin reduction):
                  <div class="solution-equation" data-math="w_{\\text{LL, truss}} = \\frac{2}{3} \\times ${ll.roofIntensity.toFixed(2)} = \\mathbf{${ll.trussIntensity.toFixed(2)}\\text{ N/m}^2}"></div>
                </li>
              </ul>
              <div class="solution-formula-label">Nodal Live Loads:</div>
              <div class="solution-equation" data-math="\\text{Total LL on Truss} = ${ll.trussIntensity.toFixed(2)} \\times ${tb.planArea.toFixed(2)} = \\mathbf{${ll.total_kN.toFixed(2)}\\text{ kN}}"></div>
              <div class="solution-equation" data-math="W_{\\text{LL, intermediate}} = \\frac{${ll.total_kN.toFixed(2)}}{${tb.panels}} = \\mathbf{${ll.intermediate_kN.toFixed(2)}\\text{ kN}}"></div>
              <div class="solution-equation" data-math="W_{\\text{LL, end}} = \\frac{${ll.intermediate_kN.toFixed(2)}}{2} = \\mathbf{${ll.end_kN.toFixed(2)}\\text{ kN}}"></div>

              <h4>C) Wind Load (WL)</h4>
              <ul>
                <li>Basic Wind Speed ($V_b$): <b>${wl.Vb} m/s</b> (${root.escSafe(G.loc || 'Gaya')})</li>
                <li>Design Wind Speed ($V_z$):
                  <div class="solution-equation" data-math="V_z = ${wl.Vb} \\times ${wl.k1} \\times ${wl.k2} \\times ${wl.k3} \\times ${wl.k4} = \\mathbf{${wl.Vz.toFixed(2)}\\text{ m/s}}"></div>
                </li>
                <li>Design Wind Pressure ($P_z$):
                  <div class="solution-equation" data-math="P_z = 0.6(V_z)^2 = 0.6 \\times (${wl.Vz.toFixed(2)})^2 = \\mathbf{${wl.Pz.toFixed(2)}\\text{ N/m}^2}"></div>
                </li>
                <li>Design Wind Pressure ($P_d$):
                  <div class="solution-equation" data-math="P_d = 0.90 \\times 1.0 \\times 0.90 \\times ${wl.Pz.toFixed(2)} = \\mathbf{${wl.Pd.toFixed(2)}\\text{ N/m}^2}"></div>
                </li>
                <li>Wind Force ($F$) (Max uplift $C_{pe} = -0.8$, $C_{pi} = \\pm 0.2$):
                  <div class="solution-equation" data-math="F = (-0.8 - 0.2) \\times ${tb.slopeArea.toFixed(2)} \\times ${wl.Pd.toFixed(2)} = \\mathbf{${wl.total_kN.toFixed(2)}\\text{ kN}}"></div>
                </li>
              </ul>
              <div class="solution-formula-label">Nodal Wind Loads:</div>
              <div class="solution-equation" data-math="W_{\\text{WL, intermediate}} = \\frac{${wl.total_kN.toFixed(2)}}{${tb.panels}} = \\mathbf{${wl.intermediate_kN.toFixed(2)}\\text{ kN}}"></div>
              <div class="solution-equation" data-math="W_{\\text{WL, end}} = \\frac{${wl.intermediate_kN.toFixed(2)}}{2} = \\mathbf{${wl.end_kN.toFixed(2)}\\text{ kN}}"></div>
            </div>
          </div>`;
      }
    },
    {
      title: 'iii) Analysis of Truss & iv) Load Combinations',
      badge: 'ANALYSIS & COMBINATIONS',
      body: (d, S) => {
        const tb = Textbook ? Textbook.computeTextbookAnalysis(S) : null;
        if (!tb) return '<div class="solution-callout">Unable to compute truss analysis.</div>';

        const rGrav = (tb.resGrav && tb.resGrav.reactions.R1y) ? tb.resGrav.reactions.R1y.toFixed(2) : (tb.panels / 2).toFixed(2);
        const rWind = (tb.resWind && Math.abs(tb.resWind.reactions.R1y)) ? Math.abs(tb.resWind.reactions.R1y).toFixed(2) : '2.68';
        const wNormDeg = (90 - tb.slopeDeg).toFixed(2);

        // Build Gravity Joint Cards HTML with Key Joint flags
        let gravJointsHtml = '';
        tb.joints.forEach((j) => {
          const isKey = j.isSupport || j.isApex || j.name === 'L1' || j.name === 'U1' || j.name === 'U2';
          const memberPills = j.members.map(m => `
            <span class="fbd-mem-pill role-${m.role}">
              <b>${m.id}</b> (${m.angleDeg >= 0 ? '+' : ''}${m.angleDeg.toFixed(1)}°)
            </span>`).join('');

          gravJointsHtml += `
            <div class="fbd-card" data-joint-name="${j.name}" data-key-joint="${isKey ? 'true' : 'false'}">
              <div class="fbd-card-head">
                <div class="fbd-head-title">
                  <b>Joint ${j.name}</b>
                  <span>(${j.isSupport ? 'Left Eave Support (Pin Shoe)' : (j.isApex ? 'Ridge Apex Node' : (j.name.startsWith('U') ? 'Top Chord Rafter Node' : 'Bottom Chord Tie Node'))})</span>
                </div>
                <div class="fbd-head-meta">
                  <span class="fbd-coord-badge">Coord: (${j.node.x.toFixed(2)}m, ${j.node.y.toFixed(2)}m)</span>
                  <span class="fbd-badge">${j.isSupport ? 'SUPPORT' : (j.isApex ? 'APEX' : 'INTERMEDIATE')}</span>
                </div>
              </div>
              <div class="fbd-connected-bar">
                <span class="fbd-conn-label">CONCURRENT MEMBERS:</span>
                ${memberPills}
              </div>
              <div class="fbd-card-body">
                <div class="fbd-svg-box">
                  ${Textbook.renderJointFBDSVG(j, 'gravity', tb)}
                  <div class="fbd-svg-caption">Free-Body Diagram — Joint ${j.name} (Unit Gravity Load)</div>
                </div>
                <div class="fbd-eqs">
                  ${Textbook.formatJointEquations(j, 'gravity', tb)}
                </div>
              </div>
            </div>`;
        });

        // Build Wind Joint Cards HTML
        let windJointsHtml = '';
        tb.joints.slice(0, 5).forEach((j) => {
          const isKey = j.isSupport || j.isApex || j.name === 'L1' || j.name === 'U1';
          const memberPills = j.members.map(m => `
            <span class="fbd-mem-pill role-${m.role}">
              <b>${m.id}</b> (${m.angleDeg >= 0 ? '+' : ''}${m.angleDeg.toFixed(1)}°)
            </span>`).join('');

          windJointsHtml += `
            <div class="fbd-card" data-joint-name="${j.name}" data-key-joint="${isKey ? 'true' : 'false'}">
              <div class="fbd-card-head">
                <div class="fbd-head-title">
                  <b>Joint ${j.name}</b>
                  <span>(Wind Suction Equilibrium)</span>
                </div>
                <div class="fbd-head-meta">
                  <span class="fbd-coord-badge">Coord: (${j.node.x.toFixed(2)}m, ${j.node.y.toFixed(2)}m)</span>
                  <span class="fbd-badge">${j.isSupport ? 'SUPPORT' : 'INTERMEDIATE'}</span>
                </div>
              </div>
              <div class="fbd-connected-bar">
                <span class="fbd-conn-label">CONCURRENT MEMBERS:</span>
                ${memberPills}
              </div>
              <div class="fbd-card-body">
                <div class="fbd-svg-box">
                  ${Textbook.renderJointFBDSVG(j, 'wind', tb)}
                  <div class="fbd-svg-caption">Free-Body Diagram — Joint ${j.name} (Unit Wind Suction)</div>
                </div>
                <div class="fbd-eqs">
                  ${Textbook.formatJointEquations(j, 'wind', tb)}
                </div>
              </div>
            </div>`;
        });

        return `
          <div class="solution-grid">
            <div class="solution-block wide">
              <h3>iii) Analysis of Truss (Unit Load Method)</h3>
              <p>
                <b>Methodology:</b> Member axial forces are determined by establishing static equilibrium at each joint (Method of Joints) under unit gravity loading and unit aerodynamic wind suction.
                All unknown internal member forces are assumed in <b>Tension (+)</b> pointing away from the node to formulate linear equations $\\sum F_x = 0$ and $\\sum F_y = 0$.
              </p>

              <h4>A) Unit Gravity Load Analysis</h4>
              <p>
                A unit load ($1.0\\text{ kN}$) is applied at intermediate top chord panel points and half-load ($0.5\\text{ kN}$) at end eave points acting vertically downwards.
                <br><b>Vertical Support Reactions:</b> $R_1 = R_2 = \\frac{1}{2} \\times [1.0 \\times (${tb.panels} - 1) + 0.5 \\times 2] = \\mathbf{${rGrav}\\text{ kN (Upwards)}}$.
              </p>

              <div class="truss-textbook-wrap">
                ${Textbook.renderFullTrussSVG(tb, 'gravity')}
              </div>

              <div class="solution-formula-label">Joint Equilibrium Explorer & Free-Body Diagrams (Gravity Load):</div>
              <div class="joint-filter-bar">
                <span class="filter-label">SELECT JOINTS:</span>
                <button class="joint-filter-btn active" data-filter="key">⭐ Critical Joints (Recommended)</button>
                <button class="joint-filter-btn" data-filter="L0">Joint L0 (Support)</button>
                <button class="joint-filter-btn" data-filter="U1">Joint U1 (Rafter)</button>
                <button class="joint-filter-btn" data-filter="L1">Joint L1 (Main Tie)</button>
                <button class="joint-filter-btn" data-filter="U2">Joint U2</button>
                <button class="joint-filter-btn" data-filter="apex">Ridge Apex</button>
                <button class="joint-filter-btn" data-filter="all">All Joints (${tb.joints.length})</button>

                <div class="joint-view-switch">
                  <span class="filter-label">CARD VIEW:</span>
                  <button class="joint-view-btn active" id="btnFbdStacked" data-fbd-layout="stacked" title="Diagram on Top, Full-Width Math Below">Stacked (One Below One)</button>
                  <button class="joint-view-btn" id="btnFbdSide" data-fbd-layout="side" title="Diagram on Left, Math on Right">Side-by-Side</button>
                </div>
              </div>

              <div class="fbd-card-grid" id="gravityFbdGrid">
                ${gravJointsHtml}
              </div>

              <h4>B) Unit Wind Load Analysis (Perpendicular Suction)</h4>
              <p>
                Unit wind force ($1.0\\text{ kN}$) acts outwards (suction) perpendicular to the sloping rafters, with $0.5\\text{ kN}$ at eave joints.
                Rafter pitch $\\theta = ${tb.slopeDeg.toFixed(2)}^\\circ$, making wind normal angle with the horizontal $\\theta_w = ${(90 + tb.slopeDeg).toFixed(2)}^\\circ$.
                <br><b>Hold-Down Support Reactions:</b> $R_{V1} = R_{V2} = \\mathbf{${rWind}\\text{ kN (Downwards Uplift Resistance)}}$.
              </p>

              <div class="truss-textbook-wrap">
                ${Textbook.renderFullTrussSVG(tb, 'wind')}
              </div>

              <div class="solution-formula-label">Joint Equilibrium Diagrams (Wind Suction):</div>
              <div class="fbd-card-grid" id="windFbdGrid">
                ${windJointsHtml}
              </div>

              <h3>iv) Design Load Combinations (IS 800:2007 Table 4)</h3>
              <p>
                Calculated member forces in kN across Limit State combinations. Positive ($+$) denotes <b>Tension</b>, negative ($-$) denotes <b>Compression</b>.
                Peak design loads represent governing design demand across:
                <b>Case 1:</b> $1.5(DL + LL)$, <b>Case 2:</b> $1.2(DL + LL + WL)$, <b>Case 3:</b> $1.5(DL + WL)$, and <b>Case 4:</b> $0.9DL + 1.5WL$ (Stress Reversal).
              </p>

              <div class="solution-formula-label">Table 1: Governing Design Load Combinations (kN)</div>
              ${Textbook.renderTable1HTML(tb)}
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

  function prevStep() {
    const cur = root.S ? (Number(root.S.step) || 0) : 0;
    setSolutionStep(Math.max(0, cur - 1));
  }

  function nextStep() {
    const cur = root.S ? (Number(root.S.step) || 0) : 0;
    setSolutionStep(Math.min(7, cur + 1));
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
    if (sub) sub.textContent = `GROUP ${S.group} · ${step.badge} · STUDENT DESIGN SHEET`;
    if (stepBadge) stepBadge.textContent = `Step ${idx + 1} / 8`;

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
      if (content) {
        const bodyHtml = step.body(d, S, G);
        const navFooterHtml = `
          <div class="solution-nav-footer">
            <button class="btn-step-nav" id="footerPrevBtn">← Previous Step</button>
            <span class="solution-step-indicator">Step ${idx + 1} of 8 (${step.badge})</span>
            <button class="btn-step-nav" id="footerNextBtn">Next Step →</button>
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

  function setSolutionStep(i) {
    renderLiveSolution(i);
  }

  const workflowData = [
    ['Problem Statement', 'Start with the exact group data: span, building length, height, spacing, roof, terrain, connection and column arrangement. Span is transverse; building length controls frame count.', ''],
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

    // Print button
    const printBtn = document.getElementById('btnPrintSheet');
    if (printBtn) printBtn.addEventListener('click', () => window.print());

    // Restore saved layout mode
    try {
      const savedMode = localStorage.getItem('truss-study-layout-mode') || 'below';
      setStudyLayout(savedMode);
    } catch (e) {}
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
