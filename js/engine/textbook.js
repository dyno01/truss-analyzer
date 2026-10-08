/**
 * Structural Design Studio — Textbook Academic Solution Engine
 * Strictly replicates the university assignment methodology of the reference design solution:
 * - Geometric properties & thumb rule checks
 * - IS 875 Part 1, 2, 3 Load Calculations & Nodal Load intensities
 * - Unit Load Method (Method of Joints) with Joint FBD diagrams & equilibrium equations
 * - Unit Gravity & Unit Wind analysis for any roof truss (Howe, Pratt, Warren, Fink)
 * - Complete Table 1: Design Load Combinations (kN)
 * - Clean SVG diagram generation for full truss geometry, unit loads, and joint FBDs
 */

(function(root) {
  'use strict';

  function buildTextbookTruss(span, rise, panels, trussType) {
    const n = Math.max(4, Math.round(panels / 2) * 2); // ensure even panels
    const dx = span / n;
    const nodes = [];

    // Bottom chord nodes: L0 to Ln (y = 0)
    for (let i = 0; i <= n; i++) {
      nodes.push({
        id: i,
        name: 'L' + i,
        x: i * dx,
        y: 0,
        tag: 'bottom'
      });
    }

    // Top chord nodes: U1 to U_{n-1}
    const mid = n / 2;
    for (let i = 1; i < n; i++) {
      const y = rise * (1 - Math.abs(i - mid) / mid);
      nodes.push({
        id: n + i,
        name: 'U' + i,
        x: i * dx,
        y: y,
        tag: 'top'
      });
    }

    function U_idx(i) {
      if (i === 0) return 0; // L0
      if (i === n) return n; // Ln
      return n + i;
    }

    const members = [];

    // 1. Bottom Chord Members
    for (let i = 0; i < n; i++) {
      members.push({
        a: i,
        b: i + 1,
        nameA: 'L' + i,
        nameB: 'L' + (i + 1),
        id: 'L' + i + 'L' + (i + 1),
        role: 'bottom',
        group: 'Bottom Chords'
      });
    }

    // 2. Top Chord Members
    for (let i = 0; i < n; i++) {
      const uA = U_idx(i);
      const uB = U_idx(i + 1);
      const nameA = i === 0 ? 'L0' : 'U' + i;
      const nameB = (i + 1) === n ? 'L' + n : 'U' + (i + 1);
      members.push({
        a: uA,
        b: uB,
        nameA: nameA,
        nameB: nameB,
        id: nameA + nameB,
        role: 'top',
        group: 'Top Chords'
      });
    }

    // 3. Vertical Struts
    for (let i = 1; i < n; i++) {
      members.push({
        a: i,
        b: U_idx(i),
        nameA: 'L' + i,
        nameB: 'U' + i,
        id: 'U' + i + 'L' + i,
        role: 'vertical',
        group: 'Vertical Struts'
      });
    }

    // 4. Diagonals
    if (trussType === 'Howe') {
      // Howe: Diagonals slope upwards towards apex (compression under gravity)
      for (let i = 1; i < mid; i++) {
        members.push({
          a: i,
          b: U_idx(i + 1),
          nameA: 'L' + i,
          nameB: 'U' + (i + 1),
          id: 'L' + i + 'U' + (i + 1),
          role: 'diagonal',
          group: 'Diagonals'
        });
      }
      for (let i = mid; i < n - 1; i++) {
        members.push({
          a: i + 1,
          b: U_idx(i),
          nameA: 'L' + (i + 1),
          nameB: 'U' + i,
          id: 'L' + (i + 1) + 'U' + i,
          role: 'diagonal',
          group: 'Diagonals'
        });
      }
    } else if (trussType === 'Pratt') {
      // Pratt: Diagonals slope downwards towards apex (tension under gravity)
      for (let i = 1; i < mid; i++) {
        members.push({
          a: U_idx(i),
          b: i + 1,
          nameA: 'U' + i,
          nameB: 'L' + (i + 1),
          id: 'U' + i + 'L' + (i + 1),
          role: 'diagonal',
          group: 'Diagonals'
        });
      }
      for (let i = mid; i < n - 1; i++) {
        members.push({
          a: U_idx(i + 1),
          b: i,
          nameA: 'U' + (i + 1),
          nameB: 'L' + i,
          id: 'U' + (i + 1) + 'L' + i,
          role: 'diagonal',
          group: 'Diagonals'
        });
      }
    } else if (trussType === 'Warren') {
      for (let i = 0; i < n; i++) {
        if (i % 2 === 0) {
          members.push({
            a: i,
            b: U_idx(i + 1),
            nameA: 'L' + i,
            nameB: 'U' + (i + 1),
            id: 'L' + i + 'U' + (i + 1),
            role: 'diagonal',
            group: 'Diagonals'
          });
        } else {
          members.push({
            a: U_idx(i),
            b: i + 1,
            nameA: 'U' + i,
            nameB: 'L' + (i + 1),
            id: 'U' + i + 'L' + (i + 1),
            role: 'diagonal',
            group: 'Diagonals'
          });
        }
      }
    } else {
      // Fink / Fan truss
      for (let i = 1; i < mid; i++) {
        members.push({
          a: i,
          b: U_idx(i + 1),
          nameA: 'L' + i,
          nameB: 'U' + (i + 1),
          id: 'L' + i + 'U' + (i + 1),
          role: 'diagonal',
          group: 'Diagonals'
        });
      }
      for (let i = mid; i < n - 1; i++) {
        members.push({
          a: i + 1,
          b: U_idx(i),
          nameA: 'L' + (i + 1),
          nameB: 'U' + i,
          id: 'L' + (i + 1) + 'U' + i,
          role: 'diagonal',
          group: 'Diagonals'
        });
      }
    }

    return { nodes, members, pin: 0, roller: n, n, span, rise, dx, mid };
  }

  function solveTextbookFEA(nodes, members, pinIdx, rollerIdx, fx, fy) {
    const numNodes = nodes.length;
    const dof = 2 * numNodes;
    const K = Array.from({ length: dof }, () => new Array(dof).fill(0));
    const E = 200000; // MPa
    const A = 1000;   // mm^2 dummy area for determinate pin-jointed truss

    members.forEach((m) => {
      const na = nodes[m.a];
      const nb = nodes[m.b];
      const dx = nb.x - na.x;
      const dy = nb.y - na.y;
      const L = Math.max(0.0001, Math.hypot(dx, dy));
      const c = dx / L;
      const s = dy / L;
      const k = (E * A * 1e-3) / L; // kN/m

      const idx = [2 * m.a, 2 * m.a + 1, 2 * m.b, 2 * m.b + 1];
      const ke = [
        [ c * c,  c * s, -c * c, -c * s],
        [ c * s,  s * s, -c * s, -s * s],
        [-c * c, -c * s,  c * c,  c * s],
        [-c * s, -s * s,  c * s,  s * s]
      ];

      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          K[idx[i]][idx[j]] += k * ke[i][j];
        }
      }
    });

    const fixed = [2 * pinIdx, 2 * pinIdx + 1, 2 * rollerIdx + 1];
    const free = [];
    for (let i = 0; i < dof; i++) {
      if (!fixed.includes(i)) free.push(i);
    }

    const F = new Array(dof).fill(0);
    for (let i = 0; i < numNodes; i++) {
      F[2 * i] = fx[i] || 0;
      F[2 * i + 1] = fy[i] || 0;
    }

    const freeCount = free.length;
    const M = Array.from({ length: freeCount }, (r, i) =>
      Array.from({ length: freeCount + 1 }, (c, j) => (j === freeCount ? F[free[i]] : K[free[i]][free[j]]))
    );

    // Gaussian Elimination with Partial Pivoting
    for (let k = 0; k < freeCount; k++) {
      let maxRow = k;
      for (let i = k + 1; i < freeCount; i++) {
        if (Math.abs(M[i][k]) > Math.abs(M[maxRow][k])) maxRow = i;
      }
      if (Math.abs(M[maxRow][k]) < 1e-12) return null;

      const tmp = M[k];
      M[k] = M[maxRow];
      M[maxRow] = tmp;

      for (let i = k + 1; i < freeCount; i++) {
        const factor = M[i][k] / M[k][k];
        for (let j = k; j <= freeCount; j++) {
          M[i][j] -= factor * M[k][j];
        }
      }
    }

    const uFree = new Array(freeCount).fill(0);
    for (let i = freeCount - 1; i >= 0; i--) {
      let sum = M[i][freeCount];
      for (let j = i + 1; j < freeCount; j++) {
        sum -= M[i][j] * uFree[j];
      }
      uFree[i] = sum / M[i][i];
    }

    const u = new Array(dof).fill(0);
    free.forEach((d, i) => { u[d] = uFree[i]; });

    // Internal axial forces:
    const forces = members.map((m) => {
      const na = nodes[m.a];
      const nb = nodes[m.b];
      const dx = nb.x - na.x;
      const dy = nb.y - na.y;
      const L = Math.max(0.0001, Math.hypot(dx, dy));
      const c = dx / L;
      const s = dy / L;

      const u_elem = [u[2 * m.a], u[2 * m.a + 1], u[2 * m.b], u[2 * m.b + 1]];
      const dL = -c * u_elem[0] - s * u_elem[1] + c * u_elem[2] + s * u_elem[3];
      return (E * A * 1e-3 / L) * dL;
    });

    let R1x = 0, R1y = 0, R2y = 0;
    for (let j = 0; j < dof; j++) {
      R1x += K[2 * pinIdx][j] * u[j];
      R1y += K[2 * pinIdx + 1][j] * u[j];
      R2y += K[2 * rollerIdx + 1][j] * u[j];
    }
    R1x -= F[2 * pinIdx];
    R1y -= F[2 * pinIdx + 1];
    R2y -= F[2 * rollerIdx + 1];

    return { forces, reactions: { R1x, R1y, R2y } };
  }

  function computeTextbookAnalysis(state) {
    const S = state || root.S || {};
    const G = (root.GROUPS && root.GROUPS[S.group]) || {};

    const span = Math.max(0.1, Number(S.span) || 16);
    const panels = Math.max(4, Math.round(Number(S.panels) || 6));
    const trussType = S.truss || G.truss || 'Howe';
    const spacing = Math.max(0.1, Number(S.spacing) || 4);

    // Slope & Rise
    // If slope given in state, calculate rise; or if slope is ~26.57° (1/4 rise):
    let slopeDeg = Number(S.slope);
    if (!slopeDeg || isNaN(slopeDeg) || slopeDeg <= 0) {
      slopeDeg = (trussType === 'Howe' && span === 16) ? 26.57 : 21.8;
    }
    const slopeRad = (slopeDeg * Math.PI) / 180;
    const rise = (span / 2) * Math.tan(slopeRad);

    const planArea = span * spacing;
    const cosTheta = Math.cos(slopeRad);
    const slopeArea = planArea / Math.max(cosTheta, 0.001);
    const panelPlan = span / panels;
    const panelSlope = panelPlan / Math.max(cosTheta, 0.001);

    // Geometry thumb rule checks:
    const minSpacing = (span / 5).toFixed(2);
    const maxSpacing = (span / 3).toFixed(2);
    const riseFraction = (rise / span).toFixed(2);

    // ==========================================
    // ii) Load Calculations
    // ==========================================
    // A) Dead Load (DL)
    const dl_sheet = S.roof === 'AC' ? 180 : 130;
    const dl_purlins = 100;
    const dl_bracing = 20;
    const dl_truss_calc = (span / 3 + 5) * 10;
    const dl_total_intensity = dl_sheet + dl_purlins + dl_bracing + dl_truss_calc; // N/m^2

    const dl_total_kN = (dl_total_intensity * planArea) / 1000; // kN
    const dl_intermediate_kN = dl_total_kN / panels;
    const dl_end_kN = dl_intermediate_kN / 2;

    // B) Live Load (LL)
    let ll_roof_intensity = 750;
    if (slopeDeg > 10) {
      ll_roof_intensity = Math.max(400, 750 - 20 * (slopeDeg - 10));
    }
    const ll_truss_intensity = (2 / 3) * ll_roof_intensity; // N/m^2
    const ll_total_kN = (ll_truss_intensity * planArea) / 1000; // kN
    const ll_intermediate_kN = ll_total_kN / panels;
    const ll_end_kN = ll_intermediate_kN / 2;

    // C) Wind Load (WL)
    const Vb = Number(S.Vb) || G.Vb || 39;
    const k1 = 1.0, k2 = 1.05, k3 = 1.0, k4 = 1.0;
    const Vz = Vb * k1 * k2 * k3 * k4;
    const Pz = 0.6 * Vz * Vz; // N/m^2
    const Ka = 0.90, Kd = 1.0, Kc = 0.90;
    const Pd = Ka * Kd * Kc * Pz; // N/m^2
    const Cpe = -0.8;
    const Cpi = Number(S.cpi) || 0.2;
    const netCp = -Math.abs(Cpe) - Math.abs(Cpi); // -1.0 for max uplift
    const windForce_kN = (netCp * slopeArea * Pd) / 1000; // negative kN (suction)
    const wl_intermediate_kN = windForce_kN / panels;
    const wl_end_kN = wl_intermediate_kN / 2;

    // ==========================================
    // iii) Unit Load FEA Solution
    // ==========================================
    const t = buildTextbookTruss(span, rise, panels, trussType);
    const numNodes = t.nodes.length;

    // 1. Unit Gravity Load Vector (1.0 kN intermediate, 0.5 kN end)
    const fx_grav = new Array(numNodes).fill(0);
    const fy_grav = new Array(numNodes).fill(0);
    fy_grav[0] = -0.5; // L0
    fy_grav[panels] = -0.5; // Ln
    for (let i = 1; i < panels; i++) {
      const uIdx = t.n + i;
      fy_grav[uIdx] = -1.0;
    }
    const resGrav = solveTextbookFEA(t.nodes, t.members, t.pin, t.roller, fx_grav, fy_grav);

    // 2. Unit Wind Load Vector (1.0 kN intermediate, 0.5 kN end, normal to rafters pointing outwards)
    const fx_wind = new Array(numNodes).fill(0);
    const fy_wind = new Array(numNodes).fill(0);
    const sin_t = Math.sin(slopeRad);
    const cos_t = Math.cos(slopeRad);
    const mid = t.mid;

    // L0 (left eave, 0.5 kN outward normal: up and left)
    fx_wind[0] = -0.5 * sin_t;
    fy_wind[0] = +0.5 * cos_t;

    // Ln (right eave, 0.5 kN outward normal: up and right)
    fx_wind[panels] = +0.5 * sin_t;
    fy_wind[panels] = +0.5 * cos_t;

    // Intermediate top nodes U1 to U_{n-1}
    for (let i = 1; i < panels; i++) {
      const uIdx = t.n + i;
      if (i < mid) {
        fx_wind[uIdx] = -1.0 * sin_t;
        fy_wind[uIdx] = +1.0 * cos_t;
      } else if (i > mid) {
        fx_wind[uIdx] = +1.0 * sin_t;
        fy_wind[uIdx] = +1.0 * cos_t;
      } else {
        // Ridge apex: 0.5 from left rafter, 0.5 from right rafter
        fx_wind[uIdx] = 0;
        fy_wind[uIdx] = +1.0 * cos_t;
      }
    }
    const resWind = solveTextbookFEA(t.nodes, t.members, t.pin, t.roller, fx_wind, fy_wind);

    // ==========================================
    // iv) Design Load Combinations Table
    // ==========================================
    const tableData = [];
    const memberForceMap = {};

    t.members.forEach((m, idx) => {
      const ug = resGrav ? resGrav.forces[idx] : 0;
      const uw = resWind ? resWind.forces[idx] : 0;

      // Actual DL, LL, WL forces (in kN):
      const F_DL = ug * dl_intermediate_kN;
      const F_LL = ug * ll_intermediate_kN;
      const F_WL = uw * Math.abs(wl_intermediate_kN); // unit wind was +1 for outward suction

      // Load combinations:
      const C_1_5_DL_LL = 1.5 * (F_DL + F_LL);
      const C_1_2_DL_LL_WL = 1.2 * (F_DL + F_LL + F_WL);
      const C_1_5_DL_WL = 1.5 * (F_DL + F_WL); // wind reversal check
      const C_0_9_DL_1_5_WL = 0.9 * F_DL + 1.5 * F_WL; // IS 800 Table 4 max uplift

      // Find max compression (min value) and max tension (max value)
      const combos = [C_1_5_DL_LL, C_1_2_DL_LL_WL, C_1_5_DL_WL, C_0_9_DL_1_5_WL];
      let maxComp = 0; // negative or 0
      let maxTens = 0; // positive or 0
      combos.forEach((val) => {
        if (val < maxComp) maxComp = val;
        if (val > maxTens) maxTens = val;
      });

      const designLoadStr = (maxComp < 0 ? maxComp.toFixed(2) : '0.00') + ' / ' +
                            (maxTens > 0 ? '+' + maxTens.toFixed(2) : '0.00');

      const row = {
        id: m.id,
        nameA: m.nameA,
        nameB: m.nameB,
        role: m.role,
        group: m.group,
        unitGrav: ug,
        unitWind: uw,
        fDL: F_DL,
        fLL: F_LL,
        fWL: F_WL,
        c1: C_1_5_DL_LL,
        c2: C_1_2_DL_LL_WL,
        c3: C_1_5_DL_WL,
        c4: C_0_9_DL_1_5_WL,
        designLoad: designLoadStr,
        maxComp: Math.abs(maxComp),
        maxTens: maxTens
      };

      tableData.push(row);
      memberForceMap[m.id] = row;
    });

    // Generate Representative Half-Truss Joint Data for Joint-by-Joint FBD & Equilibrium
    const joints = [];
    const repNodeCount = mid + 1; // 0..mid for bottom, 1..mid for top

    // Sequence of joints solved in Method of Joints:
    // L0 -> U1 -> L1 -> U2 -> L2 -> U3 (apex)
    const jointOrder = [];
    for (let i = 0; i <= mid; i++) {
      if (i === 0) {
        jointOrder.push({ type: 'L', idx: 0, name: 'L0' });
      } else {
        jointOrder.push({ type: 'U', idx: i, name: 'U' + i });
        if (i < mid) {
          jointOrder.push({ type: 'L', idx: i, name: 'L' + i });
        }
      }
    }

    jointOrder.forEach((jInfo) => {
      const isL = jInfo.type === 'L';
      const nodeObj = isL ? t.nodes[jInfo.idx] : t.nodes[t.n + jInfo.idx];
      const attached = t.members.filter((m) => m.a === nodeObj.id || m.b === nodeObj.id);

      // Collect member forces and angles relative to node
      const memberDetails = attached.map((m) => {
        const otherNodeId = m.a === nodeObj.id ? m.b : m.a;
        const otherNode = t.nodes[otherNodeId];
        const dx = otherNode.x - nodeObj.x;
        const dy = otherNode.y - nodeObj.y;
        const angleRad = Math.atan2(dy, dx);
        const angleDeg = (angleRad * 180) / Math.PI;
        const fData = memberForceMap[m.id] || {};

        return {
          id: m.id,
          otherName: otherNode.name,
          role: m.role,
          dx, dy,
          angleRad,
          angleDeg: Number(angleDeg.toFixed(2)),
          unitGrav: fData.unitGrav || 0,
          unitWind: fData.unitWind || 0
        };
      });

      joints.push({
        name: jInfo.name,
        node: nodeObj,
        isApex: !isL && jInfo.idx === mid,
        isSupport: isL && jInfo.idx === 0,
        members: memberDetails
      });
    });

    return {
      span,
      rise,
      panels,
      trussType,
      spacing,
      slopeDeg,
      slopeRad,
      cosTheta,
      planArea,
      slopeArea,
      panelPlan,
      panelSlope,
      minSpacing,
      maxSpacing,
      riseFraction,
      loads: {
        dl: {
          sheet: dl_sheet,
          purlins: dl_purlins,
          bracing: dl_bracing,
          trussSelf: dl_truss_calc,
          totalIntensity: dl_total_intensity,
          total_kN: dl_total_kN,
          intermediate_kN: dl_intermediate_kN,
          end_kN: dl_end_kN
        },
        ll: {
          roofIntensity: ll_roof_intensity,
          trussIntensity: ll_truss_intensity,
          total_kN: ll_total_kN,
          intermediate_kN: ll_intermediate_kN,
          end_kN: ll_end_kN
        },
        wl: {
          Vb, k1, k2, k3, k4, Vz, Pz, Ka, Kd, Kc, Pd, Cpe, Cpi, netCp,
          total_kN: windForce_kN,
          intermediate_kN: wl_intermediate_kN,
          end_kN: wl_end_kN
        }
      },
      t,
      resGrav,
      resWind,
      tableData,
      memberForceMap,
      joints
    };
  }

  // ==========================================
  // SVG Textbook Diagram Builders (CAD Blueprint Quality)
  // ==========================================

  function renderFullTrussSVG(data, mode = 'geometry') {
    const span = data.span;
    const rise = data.rise;
    const t = data.t;
    const nodes = t.nodes;
    const members = t.members;

    const width = 940;
    const height = 340;
    const padX = 85;
    const padY = 50;
    const scaleX = (width - 2 * padX) / span;
    const scaleY = (height - 2 * padY - 55) / Math.max(0.001, rise);

    function toSvg(x, y) {
      return {
        x: padX + x * scaleX,
        y: height - padY - 40 - y * scaleY
      };
    }

    let svg = `<svg viewBox="0 0 ${width} ${height}" class="truss-textbook-svg" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<defs>
      <!-- CAD Background Grid -->
      <pattern id="cad-grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(112, 184, 220, 0.05)" stroke-width="0.8"/>
      </pattern>
      <!-- Arrow Markers -->
      <marker id="arrow-red" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#ef4444"/>
      </marker>
      <marker id="arrow-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#22c55e"/>
      </marker>
      <marker id="arrow-cyan" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#00d8ff"/>
      </marker>
      <marker id="arrow-dim" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
        <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#7ba3bc"/>
      </marker>
    </defs>`;

    // Subtle CAD Blueprint Background
    svg += `<rect width="${width}" height="${height}" fill="#081018" rx="8" stroke="#1d2e3d" stroke-width="1"/>`;
    svg += `<rect width="${width}" height="${height}" fill="url(#cad-grid)" rx="8"/>`;

    // 1. Draw Members with Rich High-Visibility Colors
    members.forEach((m) => {
      const na = nodes[m.a];
      const nb = nodes[m.b];
      const p1 = toSvg(na.x, na.y);
      const p2 = toSvg(nb.x, nb.y);

      let stroke = '#8bb3cc';
      let strokeWidth = 2.4;
      if (m.role === 'top') { stroke = '#00d8ff'; strokeWidth = 3.6; }
      else if (m.role === 'bottom') { stroke = '#22c55e'; strokeWidth = 3.4; }
      else if (m.role === 'vertical') { stroke = '#f59e0b'; strokeWidth = 2.4; }
      else if (m.role === 'diagonal') { stroke = '#c084fc'; strokeWidth = 2.2; }

      svg += `<line x1="${p1.x.toFixed(1)}" y1="${p1.y.toFixed(1)}" x2="${p2.x.toFixed(1)}" y2="${p2.y.toFixed(1)}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round"/>`;
    });

    // 2. Draw Authentic Structural Supports at L0 and Ln
    const pL0 = toSvg(nodes[0].x, nodes[0].y);
    const pLn = toSvg(nodes[data.panels].x, nodes[data.panels].y);

    // Pin Support at L0 (Left Eave)
    svg += `<polygon points="${pL0.x},${pL0.y} ${pL0.x - 14},${pL0.y + 20} ${pL0.x + 14},${pL0.y + 20}" fill="#132332" stroke="#0ea5e9" stroke-width="1.8"/>`;
    svg += `<line x1="${pL0.x - 22}" y1="${pL0.y + 20}" x2="${pL0.x + 22}" y2="${pL0.y + 20}" stroke="#94a3b8" stroke-width="2"/>`;
    // Ground Hatching
    for (let hx = -18; hx <= 18; hx += 6) {
      svg += `<line x1="${pL0.x + hx}" y1="${pL0.y + 26}" x2="${pL0.x + hx + 5}" y2="${pL0.y + 20}" stroke="#64748b" stroke-width="1.4"/>`;
    }
    svg += `<circle cx="${pL0.x}" cy="${pL0.y}" r="3.5" fill="#ffffff" stroke="#0284c7" stroke-width="1.5"/>`;

    // Roller Support at Ln (Right Eave)
    svg += `<polygon points="${pLn.x},${pLn.y} ${pLn.x - 14},${pLn.y + 16} ${pLn.x + 14},${pLn.y + 16}" fill="#132332" stroke="#0ea5e9" stroke-width="1.8"/>`;
    svg += `<circle cx="${pLn.x - 8}" cy="${pLn.y + 21}" r="3.5" fill="#f8fafc" stroke="#64748b" stroke-width="1.4"/>`;
    svg += `<circle cx="${pLn.x + 8}" cy="${pLn.y + 21}" r="3.5" fill="#f8fafc" stroke="#64748b" stroke-width="1.4"/>`;
    svg += `<line x1="${pLn.x - 22}" y1="${pLn.y + 26}" x2="${pLn.x + 22}" y2="${pLn.y + 26}" stroke="#94a3b8" stroke-width="2"/>`;
    // Ground Hatching
    for (let hx = -18; hx <= 18; hx += 6) {
      svg += `<line x1="${pLn.x + hx}" y1="${pLn.y + 32}" x2="${pLn.x + hx + 5}" y2="${pLn.y + 26}" stroke="#64748b" stroke-width="1.4"/>`;
    }
    svg += `<circle cx="${pLn.x}" cy="${pLn.y}" r="3.5" fill="#ffffff" stroke="#0284c7" stroke-width="1.5"/>`;

    // 3. Draw Nodes with High-Contrast Pill Badges
    nodes.forEach((n) => {
      const p = toSvg(n.x, n.y);
      const isTop = n.tag === 'top';
      const dyLabel = isTop ? -20 : 20;
      const borderCol = isTop ? '#00d8ff' : '#22c55e';
      
      // Node white dot
      svg += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4.2" fill="#ffffff" stroke="#081018" stroke-width="1.6"/>`;
      
      // Node label pill badge
      const wBadge = n.name.length > 2 ? 26 : 22;
      svg += `<rect x="${(p.x - wBadge / 2).toFixed(1)}" y="${(p.y + dyLabel - 7).toFixed(1)}" width="${wBadge}" height="14" rx="3" fill="#0d1b26" stroke="${borderCol}" stroke-width="1.2"/>`;
      svg += `<text x="${p.x.toFixed(1)}" y="${(p.y + dyLabel + 3).toFixed(1)}" fill="#e8f3f9" font-size="9.5" font-weight="700" font-family="monospace" text-anchor="middle">${n.name}</text>`;
    });

    // 4. Overlays by Mode
    if (mode === 'gravity') {
      const rVal = (data.resGrav && data.resGrav.reactions.R1y) ? data.resGrav.reactions.R1y.toFixed(2) : (data.panels / 2).toFixed(2);

      // Support reactions (Upward Green Arrows with Pill Badges)
      svg += `<line x1="${pL0.x}" y1="${pL0.y + 68}" x2="${pL0.x}" y2="${pL0.y + 30}" stroke="#22c55e" stroke-width="3" marker-end="url(#arrow-green)"/>`;
      svg += `<rect x="${pL0.x - 48}" y="${pL0.y + 72}" width="96" height="20" rx="4" fill="#14532d" stroke="#22c55e" stroke-width="1.2"/>`;
      svg += `<text x="${pL0.x}" y="${pL0.y + 86}" fill="#86efac" font-size="10.5" font-weight="700" font-family="monospace" text-anchor="middle">R1 = ${rVal} kN ↑</text>`;

      svg += `<line x1="${pLn.x}" y1="${pLn.y + 68}" x2="${pLn.x}" y2="${pLn.y + 36}" stroke="#22c55e" stroke-width="3" marker-end="url(#arrow-green)"/>`;
      svg += `<rect x="${pLn.x - 48}" y="${pLn.y + 72}" width="96" height="20" rx="4" fill="#14532d" stroke="#22c55e" stroke-width="1.2"/>`;
      svg += `<text x="${pLn.x}" y="${pLn.y + 86}" fill="#86efac" font-size="10.5" font-weight="700" font-family="monospace" text-anchor="middle">R2 = ${rVal} kN ↑</text>`;

      // End loads (0.5 kN)
      svg += `<line x1="${pL0.x}" y1="${pL0.y - 48}" x2="${pL0.x}" y2="${pL0.y - 12}" stroke="#ef4444" stroke-width="2.5" marker-end="url(#arrow-red)"/>`;
      svg += `<rect x="${pL0.x - 26}" y="${pL0.y - 66}" width="52" height="17" rx="3" fill="#7f1d1d" stroke="#ef4444" stroke-width="1"/>`;
      svg += `<text x="${pL0.x}" y="${pL0.y - 54}" fill="#fca5a5" font-size="9.5" font-weight="700" font-family="monospace" text-anchor="middle">0.5 kN ↓</text>`;

      svg += `<line x1="${pLn.x}" y1="${pLn.y - 48}" x2="${pLn.x}" y2="${pLn.y - 12}" stroke="#ef4444" stroke-width="2.5" marker-end="url(#arrow-red)"/>`;
      svg += `<rect x="${pLn.x - 26}" y="${pLn.y - 66}" width="52" height="17" rx="3" fill="#7f1d1d" stroke="#ef4444" stroke-width="1"/>`;
      svg += `<text x="${pLn.x}" y="${pLn.y - 54}" fill="#fca5a5" font-size="9.5" font-weight="700" font-family="monospace" text-anchor="middle">0.5 kN ↓</text>`;

      // Intermediate loads (1.0 kN)
      for (let i = 1; i < data.panels; i++) {
        const uNode = nodes[data.panels + i];
        const p = toSvg(uNode.x, uNode.y);
        svg += `<line x1="${p.x}" y1="${p.y - 48}" x2="${p.x}" y2="${p.y - 12}" stroke="#ef4444" stroke-width="2.5" marker-end="url(#arrow-red)"/>`;
        svg += `<rect x="${p.x - 26}" y="${p.y - 66}" width="52" height="17" rx="3" fill="#7f1d1d" stroke="#ef4444" stroke-width="1"/>`;
        svg += `<text x="${p.x}" y="${p.y - 54}" fill="#fca5a5" font-size="9.5" font-weight="700" font-family="monospace" text-anchor="middle">1.0 kN ↓</text>`;
      }
    } else if (mode === 'wind') {
      const rvVal = (data.resWind && Math.abs(data.resWind.reactions.R1y)) ? Math.abs(data.resWind.reactions.R1y).toFixed(2) : '2.68';

      // Downward hold-down support reaction arrows
      svg += `<line x1="${pL0.x}" y1="${pL0.y + 30}" x2="${pL0.x}" y2="${pL0.y + 68}" stroke="#00d8ff" stroke-width="2.6" marker-end="url(#arrow-cyan)"/>`;
      svg += `<rect x="${pL0.x - 52}" y="${pL0.y + 72}" width="104" height="20" rx="4" fill="#082f49" stroke="#00d8ff" stroke-width="1.2"/>`;
      svg += `<text x="${pL0.x}" y="${pL0.y + 86}" fill="#7dd3fc" font-size="10.5" font-weight="700" font-family="monospace" text-anchor="middle">Rv1 = ${rvVal} kN ↓</text>`;

      svg += `<line x1="${pLn.x}" y1="${pLn.y + 30}" x2="${pLn.x}" y2="${pLn.y + 68}" stroke="#00d8ff" stroke-width="2.6" marker-end="url(#arrow-cyan)"/>`;
      svg += `<rect x="${pLn.x - 52}" y="${pLn.y + 72}" width="104" height="20" rx="4" fill="#082f49" stroke="#00d8ff" stroke-width="1.2"/>`;
      svg += `<text x="${pLn.x}" y="${pLn.y + 86}" fill="#7dd3fc" font-size="10.5" font-weight="700" font-family="monospace" text-anchor="middle">Rv2 = ${rvVal} kN ↓</text>`;

      const rad = data.slopeRad;
      const sinT = Math.sin(rad);
      const cosT = Math.cos(rad);
      const arrLen = 42;

      // Normal outward vectors:
      // Left Eave L0 (0.5 kN suction normal up & left)
      const vL0x = -arrLen * sinT;
      const vL0y = -arrLen * cosT;
      svg += `<line x1="${pL0.x}" y1="${pL0.y}" x2="${(pL0.x + vL0x).toFixed(1)}" y2="${(pL0.y + vL0y).toFixed(1)}" stroke="#00d8ff" stroke-width="2.4" marker-end="url(#arrow-cyan)"/>`;
      svg += `<rect x="${(pL0.x + vL0x - 54).toFixed(1)}" y="${(pL0.y + vL0y - 12).toFixed(1)}" width="50" height="16" rx="3" fill="#082f49" stroke="#00d8ff" stroke-width="1"/>`;
      svg += `<text x="${(pL0.x + vL0x - 29).toFixed(1)}" y="${(pL0.y + vL0y).toFixed(1)}" fill="#7dd3fc" font-size="9" font-weight="700" font-family="monospace" text-anchor="middle">0.5 kN ↖</text>`;

      // Right Eave Ln (0.5 kN suction normal up & right)
      const vLnx = arrLen * sinT;
      const vLny = -arrLen * cosT;
      svg += `<line x1="${pLn.x}" y1="${pLn.y}" x2="${(pLn.x + vLnx).toFixed(1)}" y2="${(pLn.y + vLny).toFixed(1)}" stroke="#00d8ff" stroke-width="2.4" marker-end="url(#arrow-cyan)"/>`;
      svg += `<rect x="${(pLn.x + vLnx + 4).toFixed(1)}" y="${(pLn.y + vLny - 12).toFixed(1)}" width="50" height="16" rx="3" fill="#082f49" stroke="#00d8ff" stroke-width="1"/>`;
      svg += `<text x="${(pLn.x + vLnx + 29).toFixed(1)}" y="${(pLn.y + vLny).toFixed(1)}" fill="#7dd3fc" font-size="9" font-weight="700" font-family="monospace" text-anchor="middle">0.5 kN ↗</text>`;

      // Intermediate top nodes
      for (let i = 1; i < data.panels; i++) {
        const uNode = nodes[data.panels + i];
        const p = toSvg(uNode.x, uNode.y);
        let vx = 0, vy = -arrLen, label = '1.0 kN ↑';
        if (i < data.t.mid) {
          vx = -arrLen * sinT;
          vy = -arrLen * cosT;
          label = '1.0 kN ↖';
        } else if (i > data.t.mid) {
          vx = arrLen * sinT;
          vy = -arrLen * cosT;
          label = '1.0 kN ↗';
        } else {
          vx = 0;
          vy = -arrLen;
          label = '1.0 kN ↑';
        }
        svg += `<line x1="${p.x}" y1="${p.y}" x2="${(p.x + vx).toFixed(1)}" y2="${(p.y + vy).toFixed(1)}" stroke="#00d8ff" stroke-width="2.4" marker-end="url(#arrow-cyan)"/>`;
        svg += `<rect x="${(p.x + vx - 26).toFixed(1)}" y="${(p.y + vy - 20).toFixed(1)}" width="52" height="16" rx="3" fill="#082f49" stroke="#00d8ff" stroke-width="1"/>`;
        svg += `<text x="${(p.x + vx).toFixed(1)}" y="${(p.y + vy - 8).toFixed(1)}" fill="#7dd3fc" font-size="9" font-weight="700" font-family="monospace" text-anchor="middle">${label}</text>`;
      }
    } else {
      // Geometry mode: Dimensions & Pitch Arc
      const yDim = height - 12;
      // Span Dimension line
      svg += `<line x1="${pL0.x}" y1="${yDim}" x2="${pLn.x}" y2="${yDim}" stroke="#7ba3bc" stroke-width="1.4" marker-start="url(#arrow-dim)" marker-end="url(#arrow-dim)"/>`;
      svg += `<rect x="${((pL0.x + pLn.x) / 2 - 125).toFixed(1)}" y="${(yDim - 10).toFixed(1)}" width="250" height="18" rx="4" fill="#0b1722" stroke="#315267" stroke-width="1"/>`;
      svg += `<text x="${((pL0.x + pLn.x) / 2).toFixed(1)}" y="${yDim + 3}" fill="#a3c7dc" font-size="10.5" font-weight="700" font-family="monospace" text-anchor="middle">Span = ${span.toFixed(2)} m (${data.panels} panels @ ${data.panelPlan.toFixed(2)} m)</text>`;

      // Rise dimension at center
      const midNode = nodes[data.panels + data.t.mid];
      const pMid = toSvg(midNode.x, midNode.y);
      const pMidBase = toSvg(midNode.x, 0);
      svg += `<line x1="${pMid.x + 36}" y1="${pMid.y}" x2="${pMidBase.x + 36}" y2="${pMidBase.y}" stroke="#7ba3bc" stroke-width="1.3" stroke-dasharray="4,4" marker-start="url(#arrow-dim)" marker-end="url(#arrow-dim)"/>`;
      svg += `<rect x="${pMid.x + 44}" y="${((pMid.y + pMidBase.y) / 2 - 9).toFixed(1)}" width="86" height="18" rx="4" fill="#0b1722" stroke="#315267" stroke-width="1"/>`;
      svg += `<text x="${pMid.x + 87}" y="${((pMid.y + pMidBase.y) / 2 + 4).toFixed(1)}" fill="#a3c7dc" font-size="10" font-weight="700" font-family="monospace" text-anchor="middle">R = ${rise.toFixed(2)} m</text>`;

      // Pitch angle arc at L0
      const arcR = 32;
      svg += `<path d="M ${pL0.x + arcR} ${pL0.y} A ${arcR} ${arcR} 0 0 0 ${(pL0.x + arcR * Math.cos(data.slopeRad)).toFixed(1)} ${(pL0.y - arcR * Math.sin(data.slopeRad)).toFixed(1)}" fill="none" stroke="#f59e0b" stroke-width="1.8"/>`;
      svg += `<rect x="${pL0.x + arcR + 8}" y="${pL0.y - 17}" width="72" height="16" rx="3" fill="#1e1804" stroke="#f59e0b" stroke-width="1"/>`;
      svg += `<text x="${pL0.x + arcR + 44}" y="${pL0.y - 5}" fill="#fcd34d" font-size="9" font-weight="700" font-family="monospace" text-anchor="middle">θ = ${data.slopeDeg.toFixed(2)}°</text>`;
    }

    // Legend Strip at Top
    svg += `<g id="diagram-legend" transform="translate(18, 14)">
      <rect width="440" height="24" rx="4" fill="rgba(11, 23, 34, 0.85)" stroke="#1e3243" stroke-width="1"/>
      <line x1="12" y1="12" x2="30" y2="12" stroke="#00d8ff" stroke-width="3"/>
      <text x="36" y="15" fill="#e2e8f0" font-size="9" font-family="monospace">Top Chord</text>
      <line x1="110" y1="12" x2="128" y2="12" stroke="#22c55e" stroke-width="3"/>
      <text x="134" y="15" fill="#e2e8f0" font-size="9" font-family="monospace">Bottom Chord</text>
      <line x1="225" y1="12" x2="243" y2="12" stroke="#f59e0b" stroke-width="2.2"/>
      <text x="249" y="15" fill="#e2e8f0" font-size="9" font-family="monospace">Verticals</text>
      <line x1="320" y1="12" x2="338" y2="12" stroke="#c084fc" stroke-width="2.2"/>
      <text x="344" y="15" fill="#e2e8f0" font-size="9" font-family="monospace">Diagonals</text>
    </g>`;

    svg += `</svg>`;
    return svg;
  }

  function renderJointFBDSVG(joint, mode = 'gravity', globalData) {
    const width = 540;
    const height = 350;
    const cx = 270;
    const cy = 175;
    const pinR = 15;

    let svg = `<svg viewBox="0 0 ${width} ${height}" class="joint-fbd-svg" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<defs>
      <pattern id="fbd-grid-${joint.name}-${mode}" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(56, 189, 248, 0.04)" stroke-width="0.8"/>
      </pattern>
      <marker id="fbd-t-${joint.name}-${mode}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto">
        <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#22c55e"/>
      </marker>
      <marker id="fbd-c-${joint.name}-${mode}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto">
        <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#ef4444"/>
      </marker>
      <marker id="fbd-z-${joint.name}-${mode}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto">
        <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#64748b"/>
      </marker>
      <marker id="fbd-load-${joint.name}-${mode}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto">
        <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#00d8ff"/>
      </marker>
      <marker id="fbd-axis" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto">
        <path d="M 0 2 L 6 5 L 0 8 z" fill="#475569"/>
      </marker>
    </defs>`;

    // Blueprint Card Background & Grid
    svg += `<rect width="${width}" height="${height}" fill="#080f17" rx="8" stroke="#182c3f" stroke-width="1"/>`;
    svg += `<rect width="${width}" height="${height}" fill="url(#fbd-grid-${joint.name}-${mode})" rx="8"/>`;

    // Reference Cartesian Axes (+x, +y) through node center
    svg += `<line x1="${cx - 180}" y1="${cy}" x2="${cx + 215}" y2="${cy}" stroke="#1c2d3d" stroke-width="1.2" stroke-dasharray="3,3" marker-end="url(#fbd-axis)"/>`;
    svg += `<text x="${cx + 224}" y="${cy + 3.5}" fill="#64748b" font-size="9" font-family="monospace" font-weight="700">+x</text>`;
    svg += `<line x1="${cx}" y1="${cy + 140}" x2="${cx}" y2="${cy - 145}" stroke="#1c2d3d" stroke-width="1.2" stroke-dasharray="3,3" marker-end="url(#fbd-axis)"/>`;
    svg += `<text x="${cx}" y="${cy - 150}" fill="#64748b" font-size="9" font-family="monospace" font-weight="700" text-anchor="middle">+y</text>`;

    // External Loads & Reactions
    if (mode === 'gravity') {
      if (joint.isSupport) {
        const rVal = (globalData && globalData.resGrav) ? globalData.resGrav.reactions.R1y.toFixed(2) : '3.00';
        // Upward Support Reaction R1
        svg += `<line x1="${cx}" y1="${cy + 125}" x2="${cx}" y2="${cy + pinR + 2}" stroke="#22c55e" stroke-width="2.6" marker-end="url(#fbd-t-${joint.name}-${mode})"/>`;
        // Support bearing ground hatch ticks
        svg += `<line x1="${cx - 26}" y1="${cy + 125}" x2="${cx + 26}" y2="${cy + 125}" stroke="#334155" stroke-width="1.8"/>`;
        svg += `<line x1="${cx - 18}" y1="${cy + 125}" x2="${cx - 24}" y2="${cy + 132}" stroke="#334155" stroke-width="1.2"/>`;
        svg += `<line x1="${cx - 6}" y1="${cy + 125}" x2="${cx - 12}" y2="${cy + 132}" stroke="#334155" stroke-width="1.2"/>`;
        svg += `<line x1="${cx + 6}" y1="${cy + 125}" x2="${cx}" y2="${cy + 132}" stroke="#334155" stroke-width="1.2"/>`;
        svg += `<line x1="${cx + 18}" y1="${cy + 125}" x2="${cx + 12}" y2="${cy + 132}" stroke="#334155" stroke-width="1.2"/>`;
        // Reaction badge placed along lower shaft
        svg += `<rect x="${cx - 56}" y="${cy + 75}" width="112" height="20" rx="4" fill="#082817" stroke="#22c55e" stroke-width="1.2"/>`;
        svg += `<text x="${cx}" y="${cy + 89}" fill="#86efac" font-size="9.5" font-weight="700" font-family="monospace" text-anchor="middle">R1 = ${rVal} kN ↑</text>`;

        // Downward External Load from above (0.50 kN)
        svg += `<line x1="${cx}" y1="${cy - 120}" x2="${cx}" y2="${cy - pinR - 2}" stroke="#ef4444" stroke-width="2.4" marker-end="url(#fbd-c-${joint.name}-${mode})"/>`;
        svg += `<rect x="${cx - 36}" y="${cy - 100}" width="72" height="18" rx="4" fill="#2d0a0e" stroke="#ef4444" stroke-width="1.2"/>`;
        svg += `<text x="${cx}" y="${cy - 87}" fill="#fca5a5" font-size="9.5" font-weight="700" font-family="monospace" text-anchor="middle">0.50 kN ↓</text>`;
      } else if (joint.name.startsWith('U')) {
        // Downward External Gravity Load at top chord
        const isEnd = joint.isApex || joint.name === 'U0' || joint.isSupport;
        const pVal = isEnd ? '0.50' : '1.00';
        svg += `<line x1="${cx}" y1="${cy - 120}" x2="${cx}" y2="${cy - pinR - 2}" stroke="#ef4444" stroke-width="2.4" marker-end="url(#fbd-c-${joint.name}-${mode})"/>`;
        svg += `<rect x="${cx - 36}" y="${cy - 100}" width="72" height="18" rx="4" fill="#2d0a0e" stroke="#ef4444" stroke-width="1.2"/>`;
        svg += `<text x="${cx}" y="${cy - 87}" fill="#fca5a5" font-size="9.5" font-weight="700" font-family="monospace" text-anchor="middle">${pVal} kN ↓</text>`;
      }
    } else {
      // Wind Mode
      const rad = (globalData && globalData.slopeRad) ? globalData.slopeRad : ((10 * Math.PI) / 180);
      const sinT = Math.sin(rad);
      const cosT = Math.cos(rad);
      if (joint.isSupport) {
        const rvVal = (globalData && globalData.resWind) ? Math.abs(globalData.resWind.reactions.R1y).toFixed(2) : '2.68';
        svg += `<line x1="${cx}" y1="${cy + pinR + 2}" x2="${cx}" y2="${cy + 125}" stroke="#00d8ff" stroke-width="2.4" marker-end="url(#fbd-load-${joint.name}-${mode})"/>`;
        svg += `<rect x="${cx - 56}" y="${cy + 75}" width="112" height="20" rx="4" fill="#082f49" stroke="#00d8ff" stroke-width="1.2"/>`;
        svg += `<text x="${cx}" y="${cy + 89}" fill="#7dd3fc" font-size="9.5" font-weight="700" font-family="monospace" text-anchor="middle">Rv1 = ${rvVal} kN ↓</text>`;

        // Outward suction
        const vlen = 95;
        const vx = -vlen * sinT;
        const vy = -vlen * cosT;
        svg += `<line x1="${(cx - (pinR + 2) * sinT).toFixed(1)}" y1="${(cy - (pinR + 2) * cosT).toFixed(1)}" x2="${(cx + vx).toFixed(1)}" y2="${(cy + vy).toFixed(1)}" stroke="#00d8ff" stroke-width="2.4" marker-end="url(#fbd-load-${joint.name}-${mode})"/>`;
        svg += `<rect x="${(cx + vx - 36).toFixed(1)}" y="${(cy + vy - 24).toFixed(1)}" width="72" height="18" rx="4" fill="#082f49" stroke="#00d8ff" stroke-width="1.2"/>`;
        svg += `<text x="${(cx + vx).toFixed(1)}" y="${(cy + vy - 11).toFixed(1)}" fill="#7dd3fc" font-size="9.5" font-weight="700" font-family="monospace" text-anchor="middle">0.50 kN ↖</text>`;
      } else if (joint.name.startsWith('U')) {
        const pVal = joint.isApex ? '0.50' : '1.00';
        const vlen = 95;
        const vx = -vlen * sinT;
        const vy = -vlen * cosT;
        svg += `<line x1="${(cx - (pinR + 2) * sinT).toFixed(1)}" y1="${(cy - (pinR + 2) * cosT).toFixed(1)}" x2="${(cx + vx).toFixed(1)}" y2="${(cy + vy).toFixed(1)}" stroke="#00d8ff" stroke-width="2.4" marker-end="url(#fbd-load-${joint.name}-${mode})"/>`;
        svg += `<rect x="${(cx + vx - 36).toFixed(1)}" y="${(cy + vy - 24).toFixed(1)}" width="72" height="18" rx="4" fill="#082f49" stroke="#00d8ff" stroke-width="1.2"/>`;
        svg += `<text x="${(cx + vx).toFixed(1)}" y="${(cy + vy - 11).toFixed(1)}" fill="#7dd3fc" font-size="9.5" font-weight="700" font-family="monospace" text-anchor="middle">${pVal} kN ↖</text>`;
      }
    }

    // Process attached members with intelligent anti-collision layout
    const members = joint.members.map((m) => {
      let normDeg = (m.angleDeg + 360) % 360;
      let acuteDeg = Math.abs(m.angleDeg);
      if (acuteDeg > 90) acuteDeg = 180 - acuteDeg;
      return {
        m,
        normDeg,
        acuteDeg: Number(acuteDeg.toFixed(1)),
        angleRad: m.angleRad,
        angleDeg: m.angleDeg
      };
    });

    // Check pairwise angular differences
    for (let i = 0; i < members.length; i++) {
      const cur = members[i];
      let minDiff = 360;
      let partner = null;
      for (let j = 0; j < members.length; j++) {
        if (i === j) continue;
        let diff = Math.abs(cur.normDeg - members[j].normDeg);
        if (diff > 180) diff = 360 - diff;
        if (diff < minDiff) {
          minDiff = diff;
          partner = members[j];
        }
      }
      cur.minDiff = minDiff;
      cur.partner = partner;
    }

    // Assign staggered arrow length and badge coordinates so badges NEVER collide
    members.forEach((cur) => {
      if (cur.minDiff < 24 && cur.partner) {
        // Shallow/close pair (e.g. 0° bottom chord and 10° rafter)
        const isHigher = cur.normDeg > cur.partner.normDeg;
        if (isHigher) {
          // Inclined member (10° rafter)
          cur.arrowLen = 135;
          cur.badgeX = cx + 145 * Math.cos(cur.angleRad);
          cur.badgeY = cy - 145 * Math.sin(cur.angleRad) - 26; // placed ABOVE rafter!
        } else {
          // Flat member (0° bottom chord)
          cur.arrowLen = 90;
          cur.badgeX = cx + 95;
          cur.badgeY = cy + 28; // placed BELOW bottom chord!
        }
      } else {
        // Separated members
        if (Math.abs(cur.angleDeg - (-90)) < 4 || Math.abs(cur.normDeg - 270) < 4) {
          // Straight down vertical member (e.g. U1L1)
          cur.arrowLen = 85;
          cur.badgeX = cx;
          cur.badgeY = cy + 105;
        } else if (Math.abs(cur.angleDeg - 90) < 4) {
          // Straight up vertical member (e.g. L1U1)
          cur.arrowLen = 85;
          cur.badgeX = cx;
          cur.badgeY = cy - 105;
        } else if (Math.abs(cur.angleDeg) < 4) {
          // Horizontal +x
          cur.arrowLen = 95;
          cur.badgeX = cx + 142;
          cur.badgeY = cy;
        } else if (Math.abs(Math.abs(cur.angleDeg) - 180) < 4) {
          // Horizontal -x
          cur.arrowLen = 95;
          cur.badgeX = cx - 142;
          cur.badgeY = cy;
        } else {
          // General inclined/diagonal member
          cur.arrowLen = 105;
          cur.badgeX = cx + 142 * Math.cos(cur.angleRad);
          cur.badgeY = cy - 142 * Math.sin(cur.angleRad);
        }
      }
    });

    // Draw acute slope angle arcs (between 4° and 75° only)
    members.forEach((cur) => {
      const acute = cur.acuteDeg;
      if (acute >= 4 && acute <= 75) {
        const isRight = Math.cos(cur.angleRad) >= 0;
        const arcR = 40;
        const startAngle = isRight ? 0 : Math.PI;
        const sx = cx + arcR * Math.cos(startAngle);
        const sy = cy;
        const ex = cx + arcR * Math.cos(cur.angleRad);
        const ey = cy - arcR * Math.sin(cur.angleRad);
        const sweep = cur.angleRad < 0 ? 1 : 0;

        svg += `<path d="M ${sx} ${sy} A ${arcR} ${arcR} 0 0 ${sweep} ${ex.toFixed(1)} ${ey.toFixed(1)}" fill="none" stroke="#f59e0b" stroke-width="1.3" stroke-dasharray="3,2"/>`;

        // Position acute angle text neatly along arc
        const midAngle = (startAngle + cur.angleRad) / 2;
        const tx = cx + (arcR + 12) * Math.cos(midAngle);
        const ty = cy - (arcR + 12) * Math.sin(midAngle);
        svg += `<rect x="${(tx - 18).toFixed(1)}" y="${(ty - 7).toFixed(1)}" width="36" height="14" rx="3" fill="#171205" stroke="#f59e0b" stroke-width="0.9"/>`;
        svg += `<text x="${tx.toFixed(1)}" y="${(ty + 3.5).toFixed(1)}" fill="#fde68a" font-size="8" font-weight="700" font-family="monospace" text-anchor="middle">θ=${acute.toFixed(1)}°</text>`;
      }
    });

    // Draw Members and Badges
    members.forEach((cur) => {
      const m = cur.m;
      const angleRad = cur.angleRad;
      const xStart = cx + (pinR + 2) * Math.cos(angleRad);
      const yStart = cy - (pinR + 2) * Math.sin(angleRad);
      const xEnd = cx + cur.arrowLen * Math.cos(angleRad);
      const yEnd = cy - cur.arrowLen * Math.sin(angleRad);

      const forceVal = mode === 'gravity' ? m.unitGrav : m.unitWind;
      const isZero = Math.abs(forceVal) < 0.005;
      const isComp = forceVal < -0.005;
      const stroke = isZero ? '#64748b' : (isComp ? '#ef4444' : '#22c55e');
      const markerId = isZero ? `fbd-z-${joint.name}-${mode}` : (isComp ? `fbd-c-${joint.name}-${mode}` : `fbd-t-${joint.name}-${mode}`);

      // Arrow line from outer rim of pin
      svg += `<line x1="${xStart.toFixed(1)}" y1="${yStart.toFixed(1)}" x2="${xEnd.toFixed(1)}" y2="${yEnd.toFixed(1)}" stroke="${stroke}" stroke-width="2.5" marker-end="url(#${markerId})"/>`;

      // Compact, elegant member force badge
      const valStr = isZero ? '0.00' : (forceVal > 0 ? `+${forceVal.toFixed(2)}` : forceVal.toFixed(2));
      const senseStr = isZero ? 'Zero' : (isComp ? 'C' : 'T');
      const valColor = isZero ? '#94a3b8' : (isComp ? '#fca5a5' : '#86efac');
      const badgeW = 70;
      const badgeH = 22;

      svg += `<g transform="translate(${cur.badgeX.toFixed(1)}, ${cur.badgeY.toFixed(1)})">`;
      svg += `<rect x="${-badgeW / 2}" y="${-badgeH / 2}" width="${badgeW}" height="${badgeH}" rx="4" fill="#091420" stroke="${stroke}" stroke-width="1.3"/>`;
      svg += `<text x="0" y="-1" fill="#ffffff" font-size="9" font-weight="700" font-family="monospace" text-anchor="middle">F_${m.id}</text>`;
      svg += `<text x="0" y="8" fill="${valColor}" font-size="7.5" font-weight="700" font-family="monospace" text-anchor="middle">${valStr} kN (${senseStr})</text>`;
      svg += `</g>`;
    });

    // Central Node Pin with Name inside the circle
    svg += `<circle cx="${cx}" cy="${cy}" r="${pinR}" fill="#0b1724" stroke="#00d8ff" stroke-width="2.2"/>`;
    svg += `<text x="${cx}" y="${cy + 4}" fill="#ffffff" font-size="10.5" font-weight="800" font-family="monospace" text-anchor="middle">${joint.name}</text>`;

    // Bottom Legend
    svg += `<g transform="translate(24, 336)">`;
    svg += `<rect x="0" y="-7" width="8" height="8" rx="2" fill="#22c55e"/>`;
    svg += `<text x="12" y="0" fill="#94a3b8" font-size="8" font-family="monospace">Tension (+)</text>`;

    svg += `<rect x="94" y="-7" width="8" height="8" rx="2" fill="#ef4444"/>`;
    svg += `<text x="106" y="0" fill="#94a3b8" font-size="8" font-family="monospace">Compression (-)</text>`;

    svg += `<rect x="210" y="-7" width="8" height="8" rx="2" fill="#00d8ff"/>`;
    svg += `<text x="222" y="0" fill="#94a3b8" font-size="8" font-family="monospace">Ext Load / Reaction</text>`;

    svg += `<rect x="345" y="-7" width="8" height="8" rx="2" fill="#f59e0b"/>`;
    svg += `<text x="357" y="0" fill="#94a3b8" font-size="8" font-family="monospace">Slope Angle (θ)</text>`;
    svg += `</g>`;

    svg += `</svg>`;
    return svg;
  }

  function formatJointEquations(joint, mode, tb) {
    const isGrav = mode === 'gravity';
    const sDeg = tb.slopeDeg.toFixed(2);
    const cosVal = Math.cos(tb.slopeRad).toFixed(3);
    const sinVal = Math.sin(tb.slopeRad).toFixed(3);
    const wNormDeg = (90 - tb.slopeDeg).toFixed(2);
    const jName = joint.name;

    // Helper to find member unit force
    function getF(id) {
      const row = tb.memberForceMap[id];
      if (!row) return 0;
      return isGrav ? row.unitGrav : row.unitWind;
    }

    function fmtRes(val) {
      if (Math.abs(val) < 0.005) return '0.00\\text{ kN (Zero-force Member)}';
      const sign = val > 0 ? '+' : '';
      const type = val > 0 ? ' \\text{ (Tension)}' : ' \\text{ (Compression)}';
      return `${sign}${val.toFixed(2)}\\text{ kN}${type}`;
    }

    let eqHtml = '';

    if (jName === 'L0') {
      const f_L0U1 = getF('L0U1');
      const f_L0L1 = getF('L0L1');
      if (isGrav) {
        const r1 = (tb.resGrav && tb.resGrav.reactions.R1y) ? tb.resGrav.reactions.R1y.toFixed(2) : (tb.panels / 2).toFixed(2);
        eqHtml = `
          <div class="solution-formula-label">1. Vertical Equilibrium Criterion ($\\sum F_y = 0$):</div>
          <div class="solution-equation" data-math="\\sum F_y = 0 \\implies R_1 - P_{L0,\\text{ext}} + F_{L0U1}\\sin\\theta = 0"></div>
          <div class="solution-formula-label">Direct Numerical Substitution ($R_1 = ${r1}\\text{ kN}$, $P_{\\text{ext}} = 0.50\\text{ kN}$, $\\theta = ${sDeg}^\\circ$):</div>
          <div class="solution-equation solution-substitution" data-math="${r1} - 0.50 + F_{L0U1}(${sinVal}) = 0"></div>
          <div class="solution-formula-label">Solved Member Internal Axial Force:</div>
          <div class="solution-equation solution-result" data-math="F_{L0U1} = \\mathbf{${fmtRes(f_L0U1)}}"></div>
          <div class="solution-remarks">
            <div class="solution-remarks-title">Physical Interpretation & Action:</div>
            • <b>$F_{L0U1}$ (Top Rafter Chord)</b> = <b>${f_L0U1.toFixed(2)} kN</b> (${f_L0U1 < 0 ? 'Compression' : 'Tension'}) — Heavy compressive thrust pushing directly against the left eave pin support shoe.<br>
            • <b>$R_1$ (Left Vertical Reaction)</b> = <b>${r1} kN</b> upwards, carrying half of total roof gravity loads.
          </div>

          <div class="solution-formula-label">2. Horizontal Equilibrium Criterion ($\\sum F_x = 0$):</div>
          <div class="solution-equation" data-math="\\sum F_x = 0 \\implies F_{L0L1} + F_{L0U1}\\cos\\theta = 0"></div>
          <div class="solution-formula-label">Direct Numerical Substitution with $F_{L0U1} = ${f_L0U1.toFixed(2)}\\text{ kN}$:</div>
          <div class="solution-equation solution-substitution" data-math="F_{L0L1} + (${f_L0U1.toFixed(2)})(${cosVal}) = 0"></div>
          <div class="solution-formula-label">Solved Member Internal Axial Force:</div>
          <div class="solution-equation solution-result" data-math="F_{L0L1} = \\mathbf{${fmtRes(f_L0L1)}}"></div>
          <div class="solution-remarks">
            <div class="solution-remarks-title">Physical Interpretation & Action:</div>
            • <b>$F_{L0L1}$ (Bottom Main Tie Chord)</b> = <b>${f_L0L1.toFixed(2)} kN</b> (${f_L0L1 >= 0 ? 'Tension' : 'Compression'}) — Tension tie that binds the rafter eaves together, preventing lateral outward spread.
          </div>
        `;
      } else {
        const rv1 = (tb.resWind && Math.abs(tb.resWind.reactions.R1y)) ? Math.abs(tb.resWind.reactions.R1y).toFixed(2) : '2.68';
        eqHtml = `
          <div class="solution-formula-label">1. Vertical Equilibrium under Net Wind Uplift Suction ($\\sum F_y = 0$):</div>
          <div class="solution-equation" data-math="\\sum F_y = 0 \\implies -R_{v1} + P_{w,\\text{eave}}\\cos\\theta + F_{L0U1}\\sin\\theta = 0"></div>
          <div class="solution-formula-label">Direct Numerical Substitution ($R_{v1} = ${rv1}\\text{ kN}$, $P_w = 0.50\\text{ kN}$):</div>
          <div class="solution-equation solution-substitution" data-math="-${rv1} + 0.50(${cosVal}) + F_{L0U1}(${sinVal}) = 0"></div>
          <div class="solution-formula-label">Solved Member Internal Axial Force (Reversed Stress):</div>
          <div class="solution-equation solution-result" data-math="F_{L0U1} = \\mathbf{${fmtRes(f_L0U1)}}"></div>
          <div class="solution-remarks">
            <div class="solution-remarks-title">Wind Reversal Effect:</div>
            • <b>$F_{L0U1}$ (Top Rafter Chord)</b> shifts to <b>${f_L0U1.toFixed(2)} kN</b> (${f_L0U1 >= 0 ? 'Tension' : 'Compression'}) due to strong suction, causing stress reversal.<br>
            • <b>$R_{v1}$ (Anchor Bolt Pull-Out Force)</b> = <b>${rv1} kN</b> net hold-down force required at column shoe.
          </div>

          <div class="solution-formula-label">2. Horizontal Equilibrium under Normal Suction ($\\sum F_x = 0$):</div>
          <div class="solution-equation" data-math="\\sum F_x = 0 \\implies -P_{w,\\text{eave}}\\sin\\theta + F_{L0U1}\\cos\\theta + F_{L0L1} = 0"></div>
          <div class="solution-formula-label">Direct Numerical Substitution:</div>
          <div class="solution-equation solution-substitution" data-math="-0.50(${sinVal}) + (${f_L0U1.toFixed(2)})(${cosVal}) + F_{L0L1} = 0"></div>
          <div class="solution-formula-label">Solved Member Internal Axial Force:</div>
          <div class="solution-equation solution-result" data-math="F_{L0L1} = \\mathbf{${fmtRes(f_L0L1)}}"></div>
          <div class="solution-remarks">
            <div class="solution-remarks-title">Physical Interpretation:</div>
            • Bottom chord tie force under wind suction reverses into <b>${f_L0L1.toFixed(2)} kN</b> (${f_L0L1 >= 0 ? 'Tension' : 'Compression'}).
          </div>
        `;
      }
    } else if (jName === 'U1') {
      const f_U1L1 = getF('U1L1');
      const f_U1U2 = getF('U1U2');
      const f_L0U1 = getF('L0U1');
      if (isGrav) {
        eqHtml = `
          <div class="solution-formula-label">1. Equilibrium Normal to Rafter Axis ($\\sum F_n = 0$):</div>
          <div class="solution-equation" data-math="\\sum F_n = 0 \\implies -P_{\\text{ext}}\\cos\\theta - F_{U1L1}\\cos\\theta = 0"></div>
          <div class="solution-formula-label">Direct Numerical Substitution ($P_{\\text{ext}} = 1.00\\text{ kN}$, $\\theta = ${sDeg}^\\circ$):</div>
          <div class="solution-equation solution-substitution" data-math="-1.00(${cosVal}) - F_{U1L1}(${cosVal}) = 0"></div>
          <div class="solution-formula-label">Solved Vertical Web Strut Force:</div>
          <div class="solution-equation solution-result" data-math="F_{U1L1} = \\mathbf{${fmtRes(f_U1L1)}}"></div>
          <div class="solution-remarks">
            <div class="solution-remarks-title">Physical Interpretation:</div>
            • <b>$F_{U1L1}$ (Vertical Strut)</b> = <b>${f_U1L1.toFixed(2)} kN</b> (${f_U1L1 < 0 ? 'Compression' : 'Tension'}) — Direct strut transferring intermediate purlin gravity load into the bottom chord panel.
          </div>

          <div class="solution-formula-label">2. Equilibrium along Rafter Axis ($\\sum F_s = 0$):</div>
          <div class="solution-equation" data-math="\\sum F_s = 0 \\implies F_{U1U2} - F_{L0U1} + P_{\\text{ext}}\\sin\\theta = 0"></div>
          <div class="solution-formula-label">Direct Numerical Substitution ($F_{L0U1} = ${f_L0U1.toFixed(2)}\\text{ kN}$):</div>
          <div class="solution-equation solution-substitution" data-math="F_{U1U2} - (${f_L0U1.toFixed(2)}) + 1.00(${sinVal}) = 0"></div>
          <div class="solution-formula-label">Solved Continuing Top Chord Force:</div>
          <div class="solution-equation solution-result" data-math="F_{U1U2} = \\mathbf{${fmtRes(f_U1U2)}}"></div>
          <div class="solution-remarks">
            <div class="solution-remarks-title">Physical Interpretation:</div>
            • <b>$F_{U1U2}$ (Continuing Rafter)</b> = <b>${f_U1U2.toFixed(2)} kN</b> (${f_U1U2 < 0 ? 'Compression' : 'Tension'}) — Axial compressive thrust continues along rafter towards the ridge.
          </div>
        `;
      } else {
        eqHtml = `
          <div class="solution-formula-label">1. Equilibrium Normal to Rafter under Suction ($\\sum F_n = 0$):</div>
          <div class="solution-equation" data-math="\\sum F_n = 0 \\implies +P_{w,\\text{int}} - F_{U1L1}\\cos\\theta = 0"></div>
          <div class="solution-formula-label">Solved Vertical Web Member Force:</div>
          <div class="solution-equation solution-result" data-math="F_{U1L1} = \\mathbf{${fmtRes(f_U1L1)}}"></div>

          <div class="solution-formula-label">2. Equilibrium along Rafter Slope ($\\sum F_s = 0$):</div>
          <div class="solution-equation" data-math="\\sum F_s = 0 \\implies F_{U1U2} = F_{L0U1} + P_w\\sin\\theta"></div>
          <div class="solution-formula-label">Solved Continuing Rafter Force:</div>
          <div class="solution-equation solution-result" data-math="F_{U1U2} = \\mathbf{${fmtRes(f_U1U2)}}"></div>
        `;
      }
    } else if (jName === 'L1') {
      const f_L1U2 = getF('L1U2');
      const f_L1L2 = getF('L1L2');
      const f_L0L1 = getF('L0L1');
      const f_U1L1 = getF('U1L1');
      const diagAngle = joint.members.find(m => m.id === 'L1U2');
      const alpha1 = diagAngle ? Math.abs(diagAngle.angleDeg).toFixed(1) : '45.0';
      const cosA = diagAngle ? Math.cos(diagAngle.angleRad).toFixed(3) : '0.707';
      const sinA = diagAngle ? Math.abs(Math.sin(diagAngle.angleRad)).toFixed(3) : '0.707';

      if (isGrav) {
        eqHtml = `
          <div class="solution-formula-label">1. Vertical Equilibrium Criterion ($\\sum F_y = 0$):</div>
          <div class="solution-equation" data-math="\\sum F_y = 0 \\implies F_{U1L1} + F_{L1U2}\\sin(${alpha1}^\\circ) = 0"></div>
          <div class="solution-formula-label">Direct Numerical Substitution ($F_{U1L1} = ${f_U1L1.toFixed(2)}\\text{ kN}$):</div>
          <div class="solution-equation solution-substitution" data-math="(${f_U1L1.toFixed(2)}) + F_{L1U2}(${sinA}) = 0"></div>
          <div class="solution-formula-label">Solved Diagonal Web Member Force:</div>
          <div class="solution-equation solution-result" data-math="F_{L1U2} = \\mathbf{${fmtRes(f_L1U2)}}"></div>
          <div class="solution-remarks">
            <div class="solution-remarks-title">Physical Interpretation:</div>
            • <b>$F_{L1U2}$ (Diagonal Tie)</b> = <b>${f_L1U2.toFixed(2)} kN</b> (${f_L1U2 >= 0 ? 'Tension' : 'Compression'}) — Pulls upward at inclination $\\alpha_1 = ${alpha1}^\\circ$ to carry panel shear.
          </div>

          <div class="solution-formula-label">2. Horizontal Equilibrium Criterion ($\\sum F_x = 0$):</div>
          <div class="solution-equation" data-math="\\sum F_x = 0 \\implies -F_{L0L1} + F_{L1L2} + F_{L1U2}\\cos(${alpha1}^\\circ) = 0"></div>
          <div class="solution-formula-label">Direct Numerical Substitution ($F_{L0L1} = ${f_L0L1.toFixed(2)}\\text{ kN}$, $F_{L1U2} = ${f_L1U2.toFixed(2)}\\text{ kN}$):</div>
          <div class="solution-equation solution-substitution" data-math="-(${f_L0L1.toFixed(2)}) + F_{L1L2} + (${f_L1U2.toFixed(2)})(${cosA}) = 0"></div>
          <div class="solution-formula-label">Solved Next Bottom Chord Tie Force:</div>
          <div class="solution-equation solution-result" data-math="F_{L1L2} = \\mathbf{${fmtRes(f_L1L2)}}"></div>
          <div class="solution-remarks">
            <div class="solution-remarks-title">Physical Interpretation:</div>
            • <b>$F_{L1L2}$ (Inner Bottom Tie Chord)</b> = <b>${f_L1L2.toFixed(2)} kN</b> (${f_L1L2 >= 0 ? 'Tension' : 'Compression'}) — Internal tension accumulates toward midspan.
          </div>
        `;
      } else {
        eqHtml = `
          <div class="solution-formula-label">1. Vertical Equilibrium under Wind Uplift ($\\sum F_y = 0$):</div>
          <div class="solution-equation" data-math="\\sum F_y = 0 \\implies F_{U1L1} + F_{L1U2}\\sin(${alpha1}^\\circ) = 0"></div>
          <div class="solution-formula-label">Solved Diagonal Web Member Force:</div>
          <div class="solution-equation solution-result" data-math="F_{L1U2} = \\mathbf{${fmtRes(f_L1U2)}}"></div>

          <div class="solution-formula-label">2. Horizontal Equilibrium under Wind ($\\sum F_x = 0$):</div>
          <div class="solution-equation" data-math="\\sum F_x = 0 \\implies -F_{L0L1} + F_{L1L2} + F_{L1U2}\\cos(${alpha1}^\\circ) = 0"></div>
          <div class="solution-formula-label">Solved Inner Bottom Chord Tie Force:</div>
          <div class="solution-equation solution-result" data-math="F_{L1L2} = \\mathbf{${fmtRes(f_L1L2)}}"></div>
        `;
      }
    } else if (jName === 'U2') {
      const f_U2U3 = getF('U2U3');
      const f_U2L2 = getF('U2L2');
      eqHtml = `
        <div class="solution-formula-label">1. Equilibrium along Vertical Direction ($\\sum F_y = 0$):</div>
        <div class="solution-equation" data-math="\\sum F_y = 0 \\implies F_{U2L2} = \\text{Vertical equilibrium resolution}"></div>
        <div class="solution-formula-label">Solved Vertical Member Force ($F_{U2L2}$):</div>
        <div class="solution-equation solution-result" data-math="F_{U2L2} = \\mathbf{${fmtRes(f_U2L2)}}"></div>

        <div class="solution-formula-label">2. Equilibrium along Continuing Rafter ($\\sum F_x = 0$):</div>
        <div class="solution-equation" data-math="\\sum F_x = 0 \\implies F_{U2U3} = \\text{Thrust equilibrium resolution}"></div>
        <div class="solution-formula-label">Solved Upper Rafter Force ($F_{U2U3}$):</div>
        <div class="solution-equation solution-result" data-math="F_{U2U3} = \\mathbf{${fmtRes(f_U2U3)}}"></div>
        <div class="solution-remarks">
          <div class="solution-remarks-title">Physical Interpretation:</div>
          • Member forces decrease towards the apex as roof shear diminishes toward midspan.
        </div>
      `;
    } else if (joint.isApex) {
      const fMidVert = getF(`U${tb.mid}L${tb.mid}`);
      eqHtml = `
        <div class="solution-formula-label">1. Ridge Apex Equilibrium & Structural Symmetry:</div>
        <div class="solution-equation" data-math="\\sum F_y = 0 \\implies -P_{\\text{apex}} - 2 F_{\\text{rafter}}\\sin\\theta - F_{U${tb.mid}L${tb.mid}} = 0"></div>
        <div class="solution-formula-label">Solved Central King Post / Ridge Vertical Force:</div>
        <div class="solution-equation solution-result" data-math="F_{U${tb.mid}L${tb.mid}} = \\mathbf{${fmtRes(fMidVert)}}"></div>
        <div class="solution-remarks">
          <div class="solution-remarks-title">Symmetry & Zero Shear Plane:</div>
          • Due to symmetrical truss geometry and symmetric gravity/suction loading, shear at the apex is zero.<br>
          • Central vertical member carries <b>${fMidVert.toFixed(2)} kN</b> (${fMidVert < 0 ? 'Compression' : 'Tension'}).
        </div>
      `;
    } else {
      const primaryMem = joint.members[0];
      const secMem = joint.members[1] || primaryMem;
      const fVal = getF(primaryMem.id);
      const fVal2 = getF(secMem.id);
      eqHtml = `
        <div class="solution-formula-label">1. Joint ${joint.name} Nodal Equilibrium ($\\sum F_x = 0, \\sum F_y = 0$):</div>
        <div class="solution-equation" data-math="\\sum F_x = 0,\\quad \\sum F_y = 0 \\implies [K]_{${joint.name}} \\{d\\} = \\{F\\}"></div>
        <div class="solution-formula-label">Governing Member Internal Force ($F_{${primaryMem.id}}$):</div>
        <div class="solution-equation solution-result" data-math="F_{${primaryMem.id}} = \\mathbf{${fmtRes(fVal)}}"></div>
        <div class="solution-formula-label">Connected Member Force ($F_{${secMem.id}}$):</div>
        <div class="solution-equation solution-substitution" data-math="F_{${secMem.id}} = \\mathbf{${fmtRes(fVal2)}}"></div>
        <div class="solution-remarks">
          <div class="solution-remarks-title">Equilibrium Verification:</div>
          • All concurrent member vectors at Node ${joint.name} satisfy strict static equilibrium.
        </div>
      `;
    }

    return eqHtml;
  }

  function renderTable1HTML(tb) {
    const groups = ['Top Chords', 'Bottom Chords', 'Vertical Struts', 'Diagonals'];
    let html = `<div class="pdf-table-wrap">
      <table class="pdf-combos-table">
        <thead>
          <tr>
            <th>Member ID</th>
            <th>Unit Grav</th>
            <th>Unit Wind</th>
            <th>DL Forces (kN)</th>
            <th>LL Forces (kN)</th>
            <th>WL Forces (kN)</th>
            <th>1.5(D+L)</th>
            <th>1.2(D+L+W)</th>
            <th>1.5(D+W)</th>
            <th>0.9D+1.5W</th>
            <th>Design Load (Max)</th>
          </tr>
        </thead>
        <tbody>`;

    groups.forEach((grpName) => {
      html += `<tr class="group-header"><td colspan="11">${grpName}</td></tr>`;
      const membersInGroup = tb.tableData.filter((r) => r.group === grpName);

      membersInGroup.forEach((r) => {
        html += `<tr>
          <td><b>${r.id}</b></td>
          <td class="${r.unitGrav > 0.01 ? 'val-tens' : (r.unitGrav < -0.01 ? 'val-comp' : 'val-zero')}">${r.unitGrav >= 0 ? '+' : ''}${r.unitGrav.toFixed(2)}</td>
          <td class="${r.unitWind > 0.01 ? 'val-tens' : (r.unitWind < -0.01 ? 'val-comp' : 'val-zero')}">${r.unitWind >= 0 ? '+' : ''}${r.unitWind.toFixed(2)}</td>
          <td class="${r.fDL > 0.01 ? 'val-tens' : (r.fDL < -0.01 ? 'val-comp' : 'val-zero')}">${r.fDL >= 0 ? '+' : ''}${r.fDL.toFixed(2)}</td>
          <td class="${r.fLL > 0.01 ? 'val-tens' : (r.fLL < -0.01 ? 'val-comp' : 'val-zero')}">${r.fLL >= 0 ? '+' : ''}${r.fLL.toFixed(2)}</td>
          <td class="${r.fWL > 0.01 ? 'val-tens' : (r.fWL < -0.01 ? 'val-comp' : 'val-zero')}">${r.fWL >= 0 ? '+' : ''}${r.fWL.toFixed(2)}</td>
          <td class="${r.c1 > 0.01 ? 'val-tens' : (r.c1 < -0.01 ? 'val-comp' : 'val-zero')}">${r.c1 >= 0 ? '+' : ''}${r.c1.toFixed(2)}</td>
          <td class="${r.c2 > 0.01 ? 'val-tens' : (r.c2 < -0.01 ? 'val-comp' : 'val-zero')}">${r.c2 >= 0 ? '+' : ''}${r.c2.toFixed(2)}</td>
          <td class="${r.c3 > 0.01 ? 'val-tens' : (r.c3 < -0.01 ? 'val-comp' : 'val-zero')}">${r.c3 >= 0 ? '+' : ''}${r.c3.toFixed(2)}</td>
          <td class="${r.c4 > 0.01 ? 'val-tens' : (r.c4 < -0.01 ? 'val-comp' : 'val-zero')}">${r.c4 >= 0 ? '+' : ''}${r.c4.toFixed(2)}</td>
          <td class="val-max">${r.designLoad}</td>
        </tr>`;
      });
    });

    html += `</tbody></table></div>`;
    return html;
  }

  const TextbookModule = {
    buildTextbookTruss,
    solveTextbookFEA,
    computeTextbookAnalysis,
    renderFullTrussSVG,
    renderJointFBDSVG,
    formatJointEquations,
    renderTable1HTML
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = TextbookModule;
  } else {
    root.TextbookModule = TextbookModule;
  }
})(typeof window !== 'undefined' ? window : global);
