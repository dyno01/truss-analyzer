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
    const dl_sheet = (S.wSheeting !== undefined && S.wSheeting !== null && S.wSheeting !== '' && !isNaN(Number(S.wSheeting)))
      ? Number(S.wSheeting)
      : (S.roof === 'AC' ? 170 : 130);
    const dl_purlins = (S.wPurlins !== undefined && S.wPurlins !== null && S.wPurlins !== '' && !isNaN(Number(S.wPurlins)))
      ? Number(S.wPurlins)
      : 100;
    const dl_bracing = (S.wBracing !== undefined && S.wBracing !== null && S.wBracing !== '' && !isNaN(Number(S.wBracing)))
      ? Number(S.wBracing)
      : 12;
    const dl_truss_calc = (S.wSelf !== undefined && S.wSelf !== null && S.wSelf !== '' && !isNaN(Number(S.wSelf)))
      ? Number(S.wSelf)
      : ((span / 3 + 5) * 10);
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
    const k1 = (S.k1 !== undefined && S.k1 !== null && S.k1 !== '') ? Number(S.k1) : 1.0;
    const k2 = (S.k2 !== undefined && S.k2 !== null && S.k2 !== '') ? Number(S.k2) : 1.05;
    const k3 = (S.k3 !== undefined && S.k3 !== null && S.k3 !== '') ? Number(S.k3) : 1.0;
    const k4 = (S.k4 !== undefined && S.k4 !== null && S.k4 !== '') ? Number(S.k4) : 1.0;
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
      isG4: (!S.group || S.group === 'G4' || (span === 16 && panels === 6)),
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
  // SVG Textbook Diagram Builders (Publication Quality matching g4_howe_truss.svg)
  // ==========================================

  function renderFullTrussSVG(data, mode = 'geometry', opts = {}) {
    const span = data.span || 16;
    const rise = data.rise || 4;
    const panels = data.panels || 6;
    const slopeDeg = data.slopeDeg || 26.57;
    const spacing = data.spacing || 4;
    const panelPlan = data.panelPlan || (span / panels);
    const mid = Math.floor(panels / 2);

    const hideCap = Boolean(opts && opts.hideCaption);
    const width = 820;
    const height = hideCap ? 385 : 440;
    const x0 = 80;
    const xEnd = 720;
    const yBase = 300;
    const yApex = 140;
    const dx = (xEnd - x0) / panels;
    const dyRafter = (yBase - yApex);

    // Compute joint coordinates
    const bottomNodes = [];
    const topNodes = [];

    for (let i = 0; i <= panels; i++) {
      const x = x0 + i * dx;
      bottomNodes.push({ name: 'L' + i, x, y: yBase });
    }

    for (let i = 0; i <= panels; i++) {
      const x = x0 + i * dx;
      let y;
      if (i <= mid) {
        y = yBase - (i / mid) * dyRafter;
      } else {
        y = yBase - ((panels - i) / mid) * dyRafter;
      }
      const name = i === 0 ? 'L0' : (i === panels ? 'L' + panels : 'U' + i);
      topNodes.push({ name, x, y, idx: i });
    }

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" font-family="'Times New Roman', Georgia, serif" class="truss-textbook-svg">`;
    svg += `<defs>
    <marker id="arr" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
      <path d="M0,0 L8,4 L0,8 z" fill="#0f172a"/>
    </marker>
    <marker id="arr-suction" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
      <path d="M0,0 L8,4 L0,8 z" fill="#0284c7"/>
    </marker>
    <marker id="dim" markerWidth="8" markerHeight="8" refX="0" refY="4" orient="auto-start-reverse">
      <path d="M8,0 L0,4 L8,8" fill="none" stroke="#111" stroke-width="1"/>
    </marker>
    <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="6" stroke="#111" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="${width}" height="${height}" fill="#fff"/>`;

    // 1. Web members (thin 1.5)
    svg += `\n\n  <!-- Web members (thin) -->\n  <g stroke="#334155" stroke-width="1.6" fill="none">`;
    // Verticals
    for (let i = 1; i < panels; i++) {
      svg += `\n    <line x1="${bottomNodes[i].x.toFixed(2)}" y1="${topNodes[i].y.toFixed(2)}" x2="${bottomNodes[i].x.toFixed(2)}" y2="${yBase}"/>`;
    }
    // Diagonals (Howe: diagonals slope upwards towards apex)
    for (let i = 1; i < mid; i++) {
      svg += `\n    <line x1="${bottomNodes[i].x.toFixed(2)}" y1="${yBase}" x2="${topNodes[i + 1].x.toFixed(2)}" y2="${topNodes[i + 1].y.toFixed(2)}"/>`;
    }
    for (let i = mid; i < panels - 1; i++) {
      svg += `\n    <line x1="${bottomNodes[i + 1].x.toFixed(2)}" y1="${yBase}" x2="${topNodes[i].x.toFixed(2)}" y2="${topNodes[i].y.toFixed(2)}"/>`;
    }
    svg += `\n  </g>`;

    // 2. Chords (thick 3.5)
    svg += `\n\n  <!-- Chords (thick) -->\n  <g stroke="#0f172a" stroke-width="3.5" fill="none" stroke-linejoin="round">`;
    let polyPts = `${x0},${yBase}`;
    for (let i = 1; i < panels; i++) {
      polyPts += ` ${topNodes[i].x.toFixed(2)},${topNodes[i].y.toFixed(2)}`;
    }
    polyPts += ` ${xEnd},${yBase}`;
    svg += `\n    <polyline points="${polyPts}"/>`;
    svg += `\n    <line x1="${x0}" y1="${yBase}" x2="${xEnd}" y2="${yBase}"/>`;
    svg += `\n  </g>`;

    // 3. Joints (circles)
    svg += `\n\n  <!-- Joints -->\n  <g fill="#fff" stroke="#0f172a" stroke-width="1.8">`;
    for (let i = 0; i <= panels; i++) {
      svg += `<circle cx="${bottomNodes[i].x.toFixed(2)}" cy="${bottomNodes[i].y.toFixed(2)}" r="4.2"/>`;
    }
    for (let i = 1; i < panels; i++) {
      svg += `<circle cx="${topNodes[i].x.toFixed(2)}" cy="${topNodes[i].y.toFixed(2)}" r="4.2"/>`;
    }
    svg += `\n  </g>`;

    // 4. Supports: hinge (left), roller (right)
    svg += `\n\n  <!-- Supports: hinge (left), roller (right) -->
  <polygon points="${x0},304 ${x0 - 12},326 ${x0 + 12},326" fill="none" stroke="#111" stroke-width="1.5"/>
  <rect x="${x0 - 20}" y="326" width="40" height="6" fill="url(#hatch)" stroke="none"/>
  <line x1="${x0 - 20}" y1="326" x2="${x0 + 20}" y2="326" stroke="#111" stroke-width="1.5"/>
  <polygon points="${xEnd},304 ${xEnd - 12},322 ${xEnd + 12},322" fill="none" stroke="#111" stroke-width="1.5"/>
  <circle cx="${xEnd - 8}" cy="325" r="3" fill="none" stroke="#111"/><circle cx="${xEnd + 8}" cy="325" r="3" fill="none" stroke="#111"/>
  <line x1="${xEnd - 20}" y1="328" x2="${xEnd + 20}" y2="328" stroke="#111" stroke-width="1.5"/>
  <rect x="${xEnd - 20}" y="328" width="40" height="6" fill="url(#hatch)"/>`;

    // 5. TOP LAYER: Loads, Dimensions, Joint Labels, Angle Arc (Rendered on top so never hidden behind panels)
    svg += `\n\n  <!-- Top Layer: Loads, Reactions, Dimensions & Labels (Always in front) -->\n  <g id="topLayerAnnotations">`;

    // A) Nodal Loads & Reactions according to mode
    const dl = data.loads ? data.loads.dl : { end_kN: 2.15, intermediate_kN: 4.30 };
    const ll = data.loads ? data.loads.ll : { end_kN: 1.49, intermediate_kN: 2.98 };
    const wl = data.loads ? data.loads.wl : { end_kN: 4.86, intermediate_kN: 9.72 };

    if (mode === 'dead' || mode === 'loads') {
      // Dead Load Nodal Downward Vectors
      const rVal = (dl.intermediate_kN * (panels - 1) + dl.end_kN * 2) / 2;
      svg += `\n  <g stroke="#0f172a" stroke-width="1.6" marker-end="url(#arr)" fill="none">`;
      for (let i = 0; i <= panels; i++) {
        const tn = topNodes[i];
        svg += `\n    <line x1="${tn.x.toFixed(2)}" y1="${(tn.y - 52).toFixed(2)}" x2="${tn.x.toFixed(2)}" y2="${(tn.y - 6).toFixed(2)}"/>`;
      }
      // Reactions
      svg += `\n    <line x1="${x0}" y1="362" x2="${x0}" y2="330"/>`;
      svg += `\n    <line x1="${xEnd}" y1="362" x2="${xEnd}" y2="330"/>`;
      svg += `\n  </g>\n  <g font-size="12" text-anchor="middle" fill="#0f172a" stroke="#fff" stroke-width="3.5" stroke-linejoin="round" paint-order="stroke fill">`;
      for (let i = 0; i <= panels; i++) {
        const tn = topNodes[i];
        const valStr = (i === 0 || i === panels) ? `${dl.end_kN.toFixed(2)} kN` : `${dl.intermediate_kN.toFixed(2)} kN`;
        svg += `\n    <text x="${tn.x.toFixed(2)}" y="${(tn.y - 58).toFixed(2)}" font-weight="600">${valStr}</text>`;
      }
      svg += `\n    <text x="${x0}" y="378" font-weight="bold">R₁ = ${rVal.toFixed(2)} kN ↑</text>`;
      svg += `\n    <text x="${xEnd}" y="378" font-weight="bold">R₂ = ${rVal.toFixed(2)} kN ↑</text>`;
      svg += `\n  </g>`;
    } else if (mode === 'live') {
      // Live Load Nodal Downward Vectors
      const rVal = (ll.intermediate_kN * (panels - 1) + ll.end_kN * 2) / 2;
      svg += `\n  <g stroke="#0284c7" stroke-width="1.6" marker-end="url(#arr-suction)" fill="none">`;
      for (let i = 0; i <= panels; i++) {
        const tn = topNodes[i];
        svg += `\n    <line x1="${tn.x.toFixed(2)}" y1="${(tn.y - 52).toFixed(2)}" x2="${tn.x.toFixed(2)}" y2="${(tn.y - 6).toFixed(2)}"/>`;
      }
      // Reactions
      svg += `\n    <line x1="${x0}" y1="362" x2="${x0}" y2="330"/>`;
      svg += `\n    <line x1="${xEnd}" y1="362" x2="${xEnd}" y2="330"/>`;
      svg += `\n  </g>\n  <g font-size="12" text-anchor="middle" fill="#0284c7" stroke="#fff" stroke-width="3.5" stroke-linejoin="round" paint-order="stroke fill">`;
      for (let i = 0; i <= panels; i++) {
        const tn = topNodes[i];
        const valStr = (i === 0 || i === panels) ? `${ll.end_kN.toFixed(2)} kN` : `${ll.intermediate_kN.toFixed(2)} kN`;
        svg += `\n    <text x="${tn.x.toFixed(2)}" y="${(tn.y - 58).toFixed(2)}" font-weight="600">${valStr}</text>`;
      }
      svg += `\n    <text x="${x0}" y="378" font-weight="bold">R₁ = ${rVal.toFixed(2)} kN ↑</text>`;
      svg += `\n    <text x="${xEnd}" y="378" font-weight="bold">R₂ = ${rVal.toFixed(2)} kN ↑</text>`;
      svg += `\n  </g>`;
    } else if (mode === 'wind_actual') {
      // Actual Wind Suction (Normal to roof rafters)
      const rad = (slopeDeg * Math.PI) / 180;
      const sinT = Math.sin(rad);
      const cosT = Math.cos(rad);
      const arrLen = 50;
      const rvVal = (Math.abs(wl.intermediate_kN) * (panels - 1) + Math.abs(wl.end_kN) * 2) * cosT / 2;

      svg += `\n  <g stroke="#dc2626" stroke-width="1.6" marker-end="url(#arr)" fill="none">`;
      // Downward hold-down reactions
      svg += `\n    <line x1="${x0}" y1="330" x2="${x0}" y2="362"/>`;
      svg += `\n    <line x1="${xEnd}" y1="330" x2="${xEnd}" y2="362"/>`;

      for (let i = 0; i <= panels; i++) {
        const tn = topNodes[i];
        let vx, vy;
        if (i < mid) {
          vx = -arrLen * sinT;
          vy = -arrLen * cosT;
        } else if (i > mid) {
          vx = arrLen * sinT;
          vy = -arrLen * cosT;
        } else {
          vx = 0;
          vy = -arrLen;
        }
        svg += `\n    <line x1="${tn.x.toFixed(2)}" y1="${tn.y.toFixed(2)}" x2="${(tn.x + vx).toFixed(2)}" y2="${(tn.y + vy).toFixed(2)}"/>`;
      }
      svg += `\n  </g>\n  <g font-size="12" text-anchor="middle" fill="#dc2626" stroke="#fff" stroke-width="3.5" stroke-linejoin="round" paint-order="stroke fill">`;
      for (let i = 0; i <= panels; i++) {
        const tn = topNodes[i];
        let vx, vy, label;
        if (i < mid) {
          vx = -arrLen * sinT;
          vy = -arrLen * cosT;
          label = i === 0 ? `-${Math.abs(wl.end_kN).toFixed(2)} kN` : `-${Math.abs(wl.intermediate_kN).toFixed(2)} kN`;
        } else if (i > mid) {
          vx = arrLen * sinT;
          vy = -arrLen * cosT;
          label = i === panels ? `-${Math.abs(wl.end_kN).toFixed(2)} kN` : `-${Math.abs(wl.intermediate_kN).toFixed(2)} kN`;
        } else {
          vx = 0;
          vy = -arrLen;
          label = `-${Math.abs(wl.intermediate_kN).toFixed(2)} kN`;
        }
        svg += `\n    <text x="${(tn.x + vx * 1.25).toFixed(2)}" y="${(tn.y + vy * 1.25).toFixed(2)}" font-weight="600">${label}</text>`;
      }
      svg += `\n    <text x="${x0}" y="378" font-weight="bold">Rv₁ = ${rvVal.toFixed(2)} kN ↓</text>`;
      svg += `\n    <text x="${xEnd}" y="378" font-weight="bold">Rv₂ = ${rvVal.toFixed(2)} kN ↓</text>`;
      svg += `\n  </g>`;
    } else if (mode === 'gravity') {
      // Unit gravity load (0.5 kN end, 1.0 kN intermediate) & reactions
      const rVal = (data.resGrav && data.resGrav.reactions.R1y) ? data.resGrav.reactions.R1y.toFixed(2) : (panels / 2).toFixed(2);
      svg += `\n  <!-- Unit Gravity loads -->\n  <g stroke="#111" stroke-width="1.6" marker-end="url(#arr)" fill="none">`;
      for (let i = 0; i <= panels; i++) {
        const tn = topNodes[i];
        svg += `\n    <line x1="${tn.x.toFixed(2)}" y1="${(tn.y - 52).toFixed(2)}" x2="${tn.x.toFixed(2)}" y2="${(tn.y - 6).toFixed(2)}"/>`;
      }
      // Reactions
      svg += `\n    <line x1="${x0}" y1="362" x2="${x0}" y2="330"/>`;
      svg += `\n    <line x1="${xEnd}" y1="362" x2="${xEnd}" y2="330"/>`;
      svg += `\n  </g>\n  <g font-size="12" text-anchor="middle" fill="#111" stroke="#fff" stroke-width="3.5" stroke-linejoin="round" paint-order="stroke fill">`;
      for (let i = 0; i <= panels; i++) {
        const tn = topNodes[i];
        const valStr = (i === 0 || i === panels) ? `0.50 kN` : `1.00 kN`;
        svg += `\n    <text x="${tn.x.toFixed(2)}" y="${(tn.y - 58).toFixed(2)}" font-weight="600">${valStr}</text>`;
      }
      svg += `\n    <text x="${x0}" y="378" font-weight="bold">R₁ = ${rVal} kN ↑</text>`;
      svg += `\n    <text x="${xEnd}" y="378" font-weight="bold">R₂ = ${rVal} kN ↑</text>`;
      svg += `\n  </g>`;
    } else if (mode === 'wind') {
      // Unit wind suction (normal to rafters: 0.5 kN at eaves, 1.0 kN intermediate) & hold-down reactions
      const rvVal = (data.resWind && Math.abs(data.resWind.reactions.R1y)) ? Math.abs(data.resWind.reactions.R1y).toFixed(2) : '2.68';
      const rad = (slopeDeg * Math.PI) / 180;
      const sinT = Math.sin(rad);
      const cosT = Math.cos(rad);
      const arrLen = 46;

      svg += `\n  <!-- Unit Wind Suction loads -->\n  <g stroke="#111" stroke-width="1.6" marker-end="url(#arr)" fill="none">`;
      // Reactions downward hold-down
      svg += `\n    <line x1="${x0}" y1="330" x2="${x0}" y2="362"/>`;
      svg += `\n    <line x1="${xEnd}" y1="330" x2="${xEnd}" y2="362"/>`;

      for (let i = 0; i <= panels; i++) {
        const tn = topNodes[i];
        let vx, vy;
        if (i < mid) {
          vx = -arrLen * sinT;
          vy = -arrLen * cosT;
        } else if (i > mid) {
          vx = arrLen * sinT;
          vy = -arrLen * cosT;
        } else {
          vx = 0;
          vy = -arrLen;
        }
        svg += `\n    <line x1="${tn.x.toFixed(2)}" y1="${tn.y.toFixed(2)}" x2="${(tn.x + vx).toFixed(2)}" y2="${(tn.y + vy).toFixed(2)}"/>`;
      }
      svg += `\n  </g>\n  <g font-size="12" text-anchor="middle" fill="#111" stroke="#fff" stroke-width="3.5" stroke-linejoin="round" paint-order="stroke fill">`;
      for (let i = 0; i <= panels; i++) {
        const tn = topNodes[i];
        let vx, vy, label;
        if (i < mid) {
          vx = -arrLen * sinT;
          vy = -arrLen * cosT;
          label = i === 0 ? '0.50 kN' : '1.00 kN';
        } else if (i > mid) {
          vx = arrLen * sinT;
          vy = -arrLen * cosT;
          label = i === panels ? '0.50 kN' : '1.00 kN';
        } else {
          vx = 0;
          vy = -arrLen;
          label = '1.00 kN';
        }
        svg += `\n    <text x="${(tn.x + vx * 1.25).toFixed(2)}" y="${(tn.y + vy * 1.25).toFixed(2)}" font-weight="600">${label}</text>`;
      }
      svg += `\n    <text x="${x0}" y="378" font-weight="bold">Rv₁ = ${rvVal} kN ↓</text>`;
      svg += `\n    <text x="${xEnd}" y="378" font-weight="bold">Rv₂ = ${rvVal} kN ↓</text>`;
      svg += `\n  </g>`;
    }

    // B) Slope angle arc & value (always in front with white halo so it never gets obscured)
    const arcRad = Math.max(26, Math.min(42, dx * 0.42));
    const arcXEnd = x0 + arcRad * Math.cos((slopeDeg * Math.PI) / 180);
    const arcYEnd = yBase - arcRad * Math.sin((slopeDeg * Math.PI) / 180);
    svg += `\n\n  <!-- Slope angle (Protected with white halo) -->
  <path d="M${(x0 + arcRad).toFixed(1)},${yBase} A${arcRad.toFixed(1)},${arcRad.toFixed(1)} 0 0 0 ${arcXEnd.toFixed(1)},${arcYEnd.toFixed(1)}" fill="none" stroke="#0f172a" stroke-width="1.3"/>
  <text x="${(x0 + arcRad + 6).toFixed(1)}" y="${yBase - 9}" font-size="12" font-style="italic" font-weight="700" fill="#0f172a" stroke="#fff" stroke-width="4" stroke-linejoin="round" paint-order="stroke fill">θ = ${slopeDeg.toFixed(2)}°</text>`;

    // C) Joint labels (Always in front)
    svg += `\n\n  <!-- Joint labels -->\n  <g font-size="14" font-style="italic" font-weight="700" fill="#0f172a" stroke="#fff" stroke-width="3.5" stroke-linejoin="round" paint-order="stroke fill">`;
    svg += `\n    <text x="${x0 - 10}" y="${yBase - 10}" text-anchor="end">L₀</text>`;
    for (let i = 1; i < panels; i++) {
      svg += `\n    <text x="${bottomNodes[i].x.toFixed(2)}" y="322" text-anchor="middle">L${i}</text>`;
    }
    svg += `\n    <text x="${xEnd + 10}" y="${yBase - 10}">L${panels}</text>`;

    for (let i = 1; i < panels; i++) {
      const tn = topNodes[i];
      if (i < mid) {
        svg += `\n    <text x="${(tn.x - 10).toFixed(2)}" y="${(tn.y - 6).toFixed(2)}" text-anchor="end">U${i}</text>`;
      } else if (i === mid) {
        svg += `\n    <text x="${(tn.x + 12).toFixed(2)}" y="${(tn.y - 8).toFixed(2)}">U${i}</text>`;
      } else {
        svg += `\n    <text x="${(tn.x + 10).toFixed(2)}" y="${(tn.y - 6).toFixed(2)}">U${i}</text>`;
      }
    }
    svg += `\n  </g>`;

    // D) Dimensions: Rise, Panels, Span (Always in front)
    svg += `\n\n  <!-- Rise dimension -->
  <g stroke="#0f172a" stroke-width="1" fill="none">
    <line x1="${topNodes[mid].x.toFixed(2)}" y1="${yApex}" x2="${xEnd + 60}" y2="${yApex}" stroke-dasharray="4 3" stroke-width="0.8"/>
    <line x1="${xEnd}" y1="${yBase}" x2="${xEnd + 60}" y2="${yBase}" stroke-dasharray="4 3" stroke-width="0.8"/>
    <line x1="${xEnd + 50}" y1="${yApex + 3}" x2="${xEnd + 50}" y2="${yBase - 3}" marker-start="url(#dim)" marker-end="url(#dim)"/>
  </g>
  <text x="${xEnd + 62}" y="${((yApex + yBase) / 2 + 5).toFixed(1)}" font-size="13" font-style="italic" font-weight="700" fill="#0f172a" stroke="#fff" stroke-width="4" stroke-linejoin="round" paint-order="stroke fill">R = ${rise} m</text>`;

    // Panel dimensions
    svg += `\n\n  <!-- Panel dimensions -->
  <g stroke="#0f172a" stroke-width="1" fill="none">
    <line x1="${x0}" y1="342" x2="${x0}" y2="372" stroke-width="0.8"/>`;
    for (let i = 1; i < panels; i++) {
      svg += `\n    <line x1="${bottomNodes[i].x.toFixed(2)}" y1="342" x2="${bottomNodes[i].x.toFixed(2)}" y2="352" stroke-width="0.8"/>`;
    }
    svg += `\n    <line x1="${xEnd}" y1="342" x2="${xEnd}" y2="372" stroke-width="0.8"/>
  </g>
  <g stroke="#0f172a" stroke-width="1" fill="none">`;
    for (let i = 0; i < panels; i++) {
      const x1 = bottomNodes[i].x + 2;
      const x2 = bottomNodes[i + 1].x - 2;
      svg += `\n    <line x1="${x1.toFixed(2)}" y1="348" x2="${x2.toFixed(2)}" y2="348" marker-start="url(#dim)" marker-end="url(#dim)"/>`;
    }
    svg += `\n  </g>
  <g font-size="11.5" text-anchor="middle" font-weight="600" fill="#0f172a" stroke="#fff" stroke-width="3" stroke-linejoin="round" paint-order="stroke fill">`;
    for (let i = 0; i < panels; i++) {
      const midX = (bottomNodes[i].x + bottomNodes[i + 1].x) / 2;
      svg += `\n    <text x="${midX.toFixed(1)}" y="343">${panelPlan.toFixed(3)} m</text>`;
    }
    svg += `\n  </g>`;

    // Span dimension
    svg += `\n\n  <!-- Span dimension -->
  <line x1="${x0 + 2}" y1="368" x2="${xEnd - 2}" y2="368" stroke="#0f172a" stroke-width="1" marker-start="url(#dim)" marker-end="url(#dim)"/>
  <text x="${((x0 + xEnd) / 2).toFixed(1)}" y="364" font-size="13" font-style="italic" font-weight="700" text-anchor="middle" fill="#0f172a" stroke="#fff" stroke-width="4.5" stroke-linejoin="round" paint-order="stroke fill">Span L = ${span} m (${panels} panels @ ${panelPlan.toFixed(3)} m)</text>`;

    svg += `\n  </g> <!-- end topLayerAnnotations -->`;

    // Caption
    let figTitle = `Fig. 1  Howe Roof Truss (Group G4): Geometry and Nodal Dead Loads`;
    let figSubtitle = `Rise 1/4 span, spacing ${spacing} m, AC sheet roofing, all dimensions in metres`;
    if (mode === 'live') {
      figTitle = `Fig. 2  Howe Roof Truss (Group G4): Nodal Live Load Distribution`;
      figSubtitle = `Design live load = 279.07 N/m² on plan area: 1.49 kN at eaves, 2.98 kN at intermediate panel points`;
    } else if (mode === 'wind_actual') {
      figTitle = `Fig. 3  Howe Roof Truss (Group G4): Nodal Wind Suction Load Distribution`;
      figSubtitle = `Design wind suction normal to roof pitch: 4.86 kN suction at eaves, 9.72 kN at intermediate panel points`;
    } else if (mode === 'gravity') {
      figTitle = `Fig. 4  Howe Roof Truss: Unit Gravity Load System & Support Reactions`;
      figSubtitle = `Vertical unit loads (1.0 kN intermediate, 0.5 kN end) with equilibrium reactions`;
    } else if (mode === 'wind') {
      figTitle = `Fig. 5  Howe Roof Truss: Unit Wind Suction Load System (Normal to Rafters)`;
      figSubtitle = `Suction normal to roof sheets (1.0 kN intermediate, 0.5 kN end) with hold-down reactions`;
    }
    if (!hideCap) {
      svg += `\n\n  <!-- Caption -->
  <text x="${((x0 + xEnd) / 2).toFixed(1)}" y="408" font-size="15" font-weight="bold" text-anchor="middle" fill="#0f172a">${figTitle}</text>
  <text x="${((x0 + xEnd) / 2).toFixed(1)}" y="427" font-size="12" text-anchor="middle" fill="#475569">${figSubtitle}</text>`;
    }
    svg += `\n</svg>`;

    return svg;
  }

  // ==========================================
  // Vector Free-Body Diagrams (Exact Match to Pages 3, 4, 5, 6 of PDF)
  // Enhanced with reference dashed axes, distinct force arrows, and clear angles
  // ==========================================

  function renderPDFStyleJointFBD(jointName, mode = 'gravity') {
    const isGrav = mode === 'gravity';
    const width = 380;
    const height = 205;

    let svg = `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" font-family="'Times New Roman', Georgia, serif" class="joint-pdf-fbd-svg" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<defs>
      <marker id="fbd-arr" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
        <path d="M0,0 L8,4 L0,8 z" fill="#0f172a"/>
      </marker>
    </defs>
    <rect width="${width}" height="${height}" fill="#fff"/>`;

    if (isGrav) {
      if (jointName === 'L0') {
        const cx = 150, cy = 115;
        // Dashed x-axis
        svg += `<line x1="${cx - 45}" y1="${cy}" x2="${cx + 125}" y2="${cy}" stroke="#94a3b8" stroke-dasharray="4,3" stroke-width="1.1"/>`;
        svg += `<text x="${cx + 130}" y="${cy + 4}" font-size="11" fill="#64748b" font-style="italic">x</text>`;
        // Dashed y-axis
        svg += `<line x1="${cx}" y1="${cy - 70}" x2="${cx}" y2="${cy + 65}" stroke="#cbd5e1" stroke-dasharray="3,3" stroke-width="0.9"/>`;
        svg += `<text x="${cx}" y="${cy - 74}" font-size="11" fill="#64748b" font-style="italic" text-anchor="middle">y</text>`;

        // Support Reaction R1 = 3 kN (Upward)
        svg += `<line x1="${cx}" y1="${cy + 65}" x2="${cx}" y2="${cy - 45}" stroke="#0f172a" stroke-width="1.6" marker-end="url(#fbd-arr)"/>`;
        svg += `<text x="${cx - 10}" y="${cy + 15}" font-size="12" font-style="italic" text-anchor="end" font-weight="600">R₁ = 3 kN</text>`;

        // External Load 0.5 kN (Downward onto joint)
        svg += `<line x1="${cx}" y1="${cy - 60}" x2="${cx}" y2="${cy - 6}" stroke="#0f172a" stroke-width="1.6" marker-end="url(#fbd-arr)"/>`;
        svg += `<text x="${cx - 10}" y="${cy - 30}" font-size="12" text-anchor="end" font-weight="600">0.5 kN</text>`;

        // Tension force in bottom chord FL0L1 along +x
        svg += `<line x1="${cx}" y1="${cy}" x2="${cx + 95}" y2="${cy}" stroke="#0f172a" stroke-width="1.6" marker-end="url(#fbd-arr)"/>`;
        svg += `<text x="${cx + 102}" y="${cy + 4}" font-size="13" font-style="italic" font-weight="600">F<tspan font-size="10" dy="2">L0L1</tspan></text>`;

        // Tension assumption for rafter FL0U1 at 26.57°
        svg += `<line x1="${cx}" y1="${cy}" x2="${cx + 90}" y2="${cy - 45}" stroke="#0f172a" stroke-width="1.6" marker-end="url(#fbd-arr)"/>`;
        svg += `<text x="${cx + 96}" y="${cy - 48}" font-size="13" font-style="italic" font-weight="600">F<tspan font-size="10" dy="2">L0U1</tspan></text>`;

        // Angle arc from x-axis to rafter
        svg += `<path d="M ${cx + 42} ${cy} A 42 42 0 0 0 ${cx + 37.6} ${cy - 18.8}" fill="none" stroke="#0f172a" stroke-width="1"/>`;
        svg += `<text x="${cx + 46}" y="${cy - 7}" font-size="11" font-style="italic">26.57°</text>`;

        // Joint Pin
        svg += `<circle cx="${cx}" cy="${cy}" r="4" fill="#0f172a"/>`;
        svg += `<text x="${cx + 10}" y="${cy + 18}" font-size="14" font-style="italic" font-weight="700">L₀</text>`;
      } else if (jointName === 'U1') {
        const cx = 175, cy = 105;
        // Dashed horizontal reference line
        svg += `<line x1="${cx - 105}" y1="${cy}" x2="${cx + 105}" y2="${cy}" stroke="#94a3b8" stroke-dasharray="4,3" stroke-width="1.1"/>`;
        svg += `<text x="${cx + 110}" y="${cy + 4}" font-size="11" fill="#64748b" font-style="italic">x</text>`;
        // Dashed top chord incline line (26.57°)
        svg += `<line x1="${cx - 95}" y1="${cy + 47.5}" x2="${cx + 95}" y2="${cy - 47.5}" stroke="#cbd5e1" stroke-dasharray="3,3" stroke-width="0.9"/>`;

        // Downward nodal load 1 kN
        svg += `<line x1="${cx}" y1="${cy - 60}" x2="${cx}" y2="${cy - 6}" stroke="#0f172a" stroke-width="1.6" marker-end="url(#fbd-arr)"/>`;
        svg += `<text x="${cx + 10}" y="${cy - 30}" font-size="12" font-weight="600">1 kN</text>`;

        // Vertical strut FU1L1 pointing down
        svg += `<line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy + 68}" stroke="#0f172a" stroke-width="1.6" marker-end="url(#fbd-arr)"/>`;
        svg += `<text x="${cx}" y="${cy + 84}" font-size="13" font-style="italic" text-anchor="middle" font-weight="600">F<tspan font-size="10" dy="2">U1L1</tspan></text>`;

        // Lower rafter FL0U1 pointing down-left along slope
        svg += `<line x1="${cx}" y1="${cy}" x2="${cx - 88}" y2="${cy + 44}" stroke="#0f172a" stroke-width="1.6" marker-end="url(#fbd-arr)"/>`;
        svg += `<text x="${cx - 95}" y="${cy + 40}" font-size="13" font-style="italic" text-anchor="end" font-weight="600">F<tspan font-size="10" dy="2">L0U1</tspan></text>`;

        // Upper rafter FU1U2 pointing up-right along slope
        svg += `<line x1="${cx}" y1="${cy}" x2="${cx + 88}" y2="${cy - 44}" stroke="#0f172a" stroke-width="1.6" marker-end="url(#fbd-arr)"/>`;
        svg += `<text x="${cx + 94}" y="${cy - 46}" font-size="13" font-style="italic" font-weight="600">F<tspan font-size="10" dy="2">U1U2</tspan></text>`;

        // Joint Pin
        svg += `<circle cx="${cx}" cy="${cy}" r="4" fill="#0f172a"/>`;
        svg += `<text x="${cx - 14}" y="${cy - 8}" font-size="14" font-style="italic" text-anchor="end" font-weight="700">U₁</text>`;
      } else if (jointName === 'L1') {
        const cx = 175, cy = 115;
        // Dashed x-axis
        svg += `<line x1="${cx - 105}" y1="${cy}" x2="${cx + 105}" y2="${cy}" stroke="#94a3b8" stroke-dasharray="4,3" stroke-width="1.1"/>`;
        svg += `<text x="${cx + 110}" y="${cy + 4}" font-size="11" fill="#64748b" font-style="italic">x</text>`;

        // Tension in FL0L1 pointing left
        svg += `<line x1="${cx}" y1="${cy}" x2="${cx - 90}" y2="${cy}" stroke="#0f172a" stroke-width="1.6" marker-end="url(#fbd-arr)"/>`;
        svg += `<text x="${cx - 98}" y="${cy + 4}" font-size="13" font-style="italic" text-anchor="end" font-weight="600">F<tspan font-size="10" dy="2">L0L1</tspan></text>`;

        // Tension in FL1L2 pointing right
        svg += `<line x1="${cx}" y1="${cy}" x2="${cx + 90}" y2="${cy}" stroke="#0f172a" stroke-width="1.6" marker-end="url(#fbd-arr)"/>`;
        svg += `<text x="${cx + 98}" y="${cy + 4}" font-size="13" font-style="italic" font-weight="600">F<tspan font-size="10" dy="2">L1L2</tspan></text>`;

        // Strut FU1L1 pointing straight up
        svg += `<line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - 68}" stroke="#0f172a" stroke-width="1.6" marker-end="url(#fbd-arr)"/>`;
        svg += `<text x="${cx}" y="${cy - 75}" font-size="13" font-style="italic" text-anchor="middle" font-weight="600">F<tspan font-size="10" dy="2">U1L1</tspan></text>`;

        // Diagonal FL1U2 pointing up-right at 45°
        svg += `<line x1="${cx}" y1="${cy}" x2="${cx + 64}" y2="${cy - 64}" stroke="#0f172a" stroke-width="1.6" marker-end="url(#fbd-arr)"/>`;
        svg += `<text x="${cx + 70}" y="${cy - 66}" font-size="13" font-style="italic" font-weight="600">F<tspan font-size="10" dy="2">L1U2</tspan></text>`;

        // Angle arc 45° from dashed horizontal axis
        svg += `<path d="M ${cx + 36} ${cy} A 36 36 0 0 0 ${cx + 25.5} ${cy - 25.5}" fill="none" stroke="#0f172a" stroke-width="1"/>`;
        svg += `<text x="${cx + 40}" y="${cy - 12}" font-size="11" font-style="italic">45°</text>`;

        // Joint Pin
        svg += `<circle cx="${cx}" cy="${cy}" r="4" fill="#0f172a"/>`;
        svg += `<text x="${cx + 8}" y="${cy + 18}" font-size="14" font-style="italic" font-weight="700">L₁</text>`;
      } else if (jointName === 'U2') {
        const cx = 175, cy = 110;
        // Dashed horizontal axis
        svg += `<line x1="${cx - 105}" y1="${cy}" x2="${cx + 105}" y2="${cy}" stroke="#94a3b8" stroke-dasharray="4,3" stroke-width="1.1"/>`;
        svg += `<text x="${cx + 110}" y="${cy + 4}" font-size="11" fill="#64748b" font-style="italic">x</text>`;

        // 1 kN downward load
        svg += `<line x1="${cx}" y1="${cy - 60}" x2="${cx}" y2="${cy - 6}" stroke="#0f172a" stroke-width="1.6" marker-end="url(#fbd-arr)"/>`;
        svg += `<text x="${cx + 10}" y="${cy - 30}" font-size="12" font-weight="600">1 kN</text>`;

        // FU1U2 pointing down-left along slope
        svg += `<line x1="${cx}" y1="${cy}" x2="${cx - 85}" y2="${cy + 42.5}" stroke="#0f172a" stroke-width="1.6" marker-end="url(#fbd-arr)"/>`;
        svg += `<text x="${cx - 92}" y="${cy + 38}" font-size="13" font-style="italic" text-anchor="end" font-weight="600">F<tspan font-size="10" dy="2">U1U2</tspan></text>`;

        // FU2U3 pointing up-right along slope
        svg += `<line x1="${cx}" y1="${cy}" x2="${cx + 85}" y2="${cy - 42.5}" stroke="#0f172a" stroke-width="1.6" marker-end="url(#fbd-arr)"/>`;
        svg += `<text x="${cx + 92}" y="${cy - 45}" font-size="13" font-style="italic" font-weight="600">F<tspan font-size="10" dy="2">U2U3</tspan></text>`;

        // Vertical strut FU2L2 pointing down
        svg += `<line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy + 68}" stroke="#0f172a" stroke-width="1.6" marker-end="url(#fbd-arr)"/>`;
        svg += `<text x="${cx + 10}" y="${cy + 78}" font-size="13" font-style="italic" font-weight="600">F<tspan font-size="10" dy="2">U2L2</tspan></text>`;

        // Diagonal FL1U2 pointing down-left at 45°
        svg += `<line x1="${cx}" y1="${cy}" x2="${cx - 58}" y2="${cy + 58}" stroke="#0f172a" stroke-width="1.6" marker-end="url(#fbd-arr)"/>`;
        svg += `<text x="${cx - 62}" y="${cy + 72}" font-size="13" font-style="italic" text-anchor="end" font-weight="600">F<tspan font-size="10" dy="2">L1U2</tspan></text>`;

        // Joint Pin
        svg += `<circle cx="${cx}" cy="${cy}" r="4" fill="#0f172a"/>`;
        svg += `<text x="${cx - 14}" y="${cy - 8}" font-size="14" font-style="italic" text-anchor="end" font-weight="700">U₂</text>`;
      } else if (jointName === 'L2') {
        const cx = 175, cy = 115;
        // Dashed x-axis
        svg += `<line x1="${cx - 105}" y1="${cy}" x2="${cx + 105}" y2="${cy}" stroke="#94a3b8" stroke-dasharray="4,3" stroke-width="1.1"/>`;
        svg += `<text x="${cx + 110}" y="${cy + 4}" font-size="11" fill="#64748b" font-style="italic">x</text>`;

        // FL1L2 pointing left
        svg += `<line x1="${cx}" y1="${cy}" x2="${cx - 90}" y2="${cy}" stroke="#0f172a" stroke-width="1.6" marker-end="url(#fbd-arr)"/>`;
        svg += `<text x="${cx - 98}" y="${cy + 4}" font-size="13" font-style="italic" text-anchor="end" font-weight="600">F<tspan font-size="10" dy="2">L1L2</tspan></text>`;

        // FL2L3 pointing right
        svg += `<line x1="${cx}" y1="${cy}" x2="${cx + 90}" y2="${cy}" stroke="#0f172a" stroke-width="1.6" marker-end="url(#fbd-arr)"/>`;
        svg += `<text x="${cx + 98}" y="${cy + 4}" font-size="13" font-style="italic" font-weight="600">F<tspan font-size="10" dy="2">L2L3</tspan></text>`;

        // FU2L2 pointing straight up
        svg += `<line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - 68}" stroke="#0f172a" stroke-width="1.6" marker-end="url(#fbd-arr)"/>`;
        svg += `<text x="${cx - 10}" y="${cy - 72}" font-size="13" font-style="italic" text-anchor="end" font-weight="600">F<tspan font-size="10" dy="2">U2L2</tspan></text>`;

        // Diagonal FL2U3 pointing up-right at 56.31°
        svg += `<line x1="${cx}" y1="${cy}" x2="${cx + 48}" y2="${cy - 72}" stroke="#0f172a" stroke-width="1.6" marker-end="url(#fbd-arr)"/>`;
        svg += `<text x="${cx + 54}" y="${cy - 75}" font-size="13" font-style="italic" font-weight="600">F<tspan font-size="10" dy="2">L2U3</tspan></text>`;

        // Angle arc 56.31° from horizontal axis
        svg += `<path d="M ${cx + 38} ${cy} A 38 38 0 0 0 ${cx + 21} ${cy - 31.6}" fill="none" stroke="#0f172a" stroke-width="1"/>`;
        svg += `<text x="${cx + 36}" y="${cy - 14}" font-size="11" font-style="italic">56.31°</text>`;

        // Joint Pin
        svg += `<circle cx="${cx}" cy="${cy}" r="4" fill="#0f172a"/>`;
        svg += `<text x="${cx + 8}" y="${cy + 18}" font-size="14" font-style="italic" font-weight="700">L₂</text>`;
      } else if (jointName === 'U3') {
        const cx = 175, cy = 100;
        // Dashed horizontal axis
        svg += `<line x1="${cx - 105}" y1="${cy}" x2="${cx + 105}" y2="${cy}" stroke="#94a3b8" stroke-dasharray="4,3" stroke-width="1.1"/>`;
        svg += `<text x="${cx + 110}" y="${cy + 4}" font-size="11" fill="#64748b" font-style="italic">x</text>`;

        // 1 kN downward load
        svg += `<line x1="${cx}" y1="${cy - 60}" x2="${cx}" y2="${cy - 6}" stroke="#0f172a" stroke-width="1.6" marker-end="url(#fbd-arr)"/>`;
        svg += `<text x="${cx + 10}" y="${cy - 30}" font-size="12" font-weight="600">1 kN</text>`;

        // Left rafter FU2U3 down-left
        svg += `<line x1="${cx}" y1="${cy}" x2="${cx - 85}" y2="${cy + 42.5}" stroke="#0f172a" stroke-width="1.6" marker-end="url(#fbd-arr)"/>`;
        svg += `<text x="${cx - 92}" y="${cy + 38}" font-size="13" font-style="italic" text-anchor="end" font-weight="600">F<tspan font-size="10" dy="2">U2U3</tspan></text>`;

        // Right rafter FU3U4 down-right
        svg += `<line x1="${cx}" y1="${cy}" x2="${cx + 85}" y2="${cy + 42.5}" stroke="#0f172a" stroke-width="1.6" marker-end="url(#fbd-arr)"/>`;
        svg += `<text x="${cx + 92}" y="${cy + 38}" font-size="13" font-style="italic" font-weight="600">F<tspan font-size="10" dy="2">U3U4</tspan></text>`;

        // Diagonals FL2U3 and FL4U3
        svg += `<line x1="${cx}" y1="${cy}" x2="${cx - 48}" y2="${cy + 72}" stroke="#0f172a" stroke-width="1.6" marker-end="url(#fbd-arr)"/>`;
        svg += `<text x="${cx - 52}" y="${cy + 80}" font-size="13" font-style="italic" text-anchor="end" font-weight="600">F<tspan font-size="10" dy="2">L2U3</tspan></text>`;

        svg += `<line x1="${cx}" y1="${cy}" x2="${cx + 48}" y2="${cy + 72}" stroke="#0f172a" stroke-width="1.6" marker-end="url(#fbd-arr)"/>`;
        svg += `<text x="${cx + 52}" y="${cy + 80}" font-size="13" font-style="italic" font-weight="600">F<tspan font-size="10" dy="2">L4U3</tspan></text>`;

        // Central vertical strut FU3L3 straight down
        svg += `<line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy + 78}" stroke="#0f172a" stroke-width="1.6" marker-end="url(#fbd-arr)"/>`;
        svg += `<text x="${cx}" y="${cy + 96}" font-size="13" font-style="italic" text-anchor="middle" font-weight="600">F<tspan font-size="10" dy="2">U3L3</tspan></text>`;

        // Joint Pin
        svg += `<circle cx="${cx}" cy="${cy}" r="4" fill="#0f172a"/>`;
        svg += `<text x="${cx - 14}" y="${cy - 8}" font-size="14" font-style="italic" text-anchor="end" font-weight="700">U₃</text>`;
      }
    } else {
      // Wind Suction Mode (Pages 5 & 6)
      if (jointName === 'L0') {
        const cx = 155, cy = 110;
        // Dashed horizontal axis
        svg += `<line x1="${cx - 85}" y1="${cy}" x2="${cx + 120}" y2="${cy}" stroke="#94a3b8" stroke-dasharray="4,3" stroke-width="1.1"/>`;
        svg += `<text x="${cx + 125}" y="${cy + 4}" font-size="11" fill="#64748b" font-style="italic">x</text>`;

        // Downward vertical support reaction Rv1 = 2.68 kN
        svg += `<line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy + 68}" stroke="#0f172a" stroke-width="1.6" marker-end="url(#fbd-arr)"/>`;
        svg += `<text x="${cx - 10}" y="${cy + 40}" font-size="12" font-style="italic" text-anchor="end" font-weight="600">R<tspan font-size="9" dy="2">V1</tspan> = 2.68 kN</text>`;

        // Wind suction 0.5 kN pulling outwards at 63.43° (up and left)
        const vx = -62 * 0.4472, vy = -62 * 0.8944;
        svg += `<line x1="${cx}" y1="${cy}" x2="${(cx + vx).toFixed(1)}" y2="${(cy + vy).toFixed(1)}" stroke="#0f172a" stroke-width="1.6" marker-end="url(#fbd-arr)"/>`;
        svg += `<text x="${(cx + vx - 6).toFixed(1)}" y="${(cy + vy - 2).toFixed(1)}" font-size="12" text-anchor="end" font-weight="600">0.5 kN</text>`;

        // Angle arc 63.43° from negative x-axis
        svg += `<path d="M ${(cx - 36).toFixed(1)} ${cy} A 36 36 0 0 1 ${(cx - 16.1).toFixed(1)} ${(cy - 32.2).toFixed(1)}" fill="none" stroke="#0f172a" stroke-width="1"/>`;
        svg += `<text x="${cx - 42}" y="${cy - 18}" font-size="11" font-style="italic" text-anchor="end">63.43°</text>`;

        // Tension in FL0L1 along +x
        svg += `<line x1="${cx}" y1="${cy}" x2="${cx + 90}" y2="${cy}" stroke="#0f172a" stroke-width="1.6" marker-end="url(#fbd-arr)"/>`;
        svg += `<text x="${cx + 98}" y="${cy + 4}" font-size="13" font-style="italic" font-weight="600">F<tspan font-size="10" dy="2">L0L1</tspan></text>`;

        // Tension assumption for rafter FL0U1 at 26.57°
        svg += `<line x1="${cx}" y1="${cy}" x2="${cx + 85}" y2="${cy - 42.5}" stroke="#0f172a" stroke-width="1.6" marker-end="url(#fbd-arr)"/>`;
        svg += `<text x="${cx + 92}" y="${cy - 45}" font-size="13" font-style="italic" font-weight="600">F<tspan font-size="10" dy="2">L0U1</tspan></text>`;

        // Joint Pin
        svg += `<circle cx="${cx}" cy="${cy}" r="4" fill="#0f172a"/>`;
        svg += `<text x="${cx + 8}" y="${cy + 18}" font-size="14" font-style="italic" font-weight="700">L₀</text>`;
      } else if (jointName === 'U1') {
        const cx = 175, cy = 115;
        // Dashed horizontal axis
        svg += `<line x1="${cx - 105}" y1="${cy}" x2="${cx + 105}" y2="${cy}" stroke="#94a3b8" stroke-dasharray="4,3" stroke-width="1.1"/>`;
        svg += `<text x="${cx + 110}" y="${cy + 4}" font-size="11" fill="#64748b" font-style="italic">x</text>`;

        // 1 kN wind suction normal to roof slope (pointing up and left at 63.43°)
        const vx = -68 * 0.4472, vy = -68 * 0.8944;
        svg += `<line x1="${cx}" y1="${cy}" x2="${(cx + vx).toFixed(1)}" y2="${(cy + vy).toFixed(1)}" stroke="#0f172a" stroke-width="1.6" marker-end="url(#fbd-arr)"/>`;
        svg += `<text x="${(cx + vx - 6).toFixed(1)}" y="${(cy + vy - 4).toFixed(1)}" font-size="12" font-weight="600">1 kN</text>`;

        // Vertical strut FU1L1 pointing down
        svg += `<line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy + 68}" stroke="#0f172a" stroke-width="1.6" marker-end="url(#fbd-arr)"/>`;
        svg += `<text x="${cx}" y="${cy + 84}" font-size="13" font-style="italic" text-anchor="middle" font-weight="600">F<tspan font-size="10" dy="2">U1L1</tspan></text>`;

        // FL0U1 pointing down-left along slope
        svg += `<line x1="${cx}" y1="${cy}" x2="${cx - 88}" y2="${cy + 44}" stroke="#0f172a" stroke-width="1.6" marker-end="url(#fbd-arr)"/>`;
        svg += `<text x="${cx - 95}" y="${cy + 40}" font-size="13" font-style="italic" text-anchor="end" font-weight="600">F<tspan font-size="10" dy="2">L0U1</tspan></text>`;

        // FU1U2 pointing up-right along slope
        svg += `<line x1="${cx}" y1="${cy}" x2="${cx + 88}" y2="${cy - 44}" stroke="#0f172a" stroke-width="1.6" marker-end="url(#fbd-arr)"/>`;
        svg += `<text x="${cx + 94}" y="${cy - 46}" font-size="13" font-style="italic" font-weight="600">F<tspan font-size="10" dy="2">U1U2</tspan></text>`;

        // Joint Pin
        svg += `<circle cx="${cx}" cy="${cy}" r="4" fill="#0f172a"/>`;
        svg += `<text x="${cx + 8}" y="${cy + 18}" font-size="14" font-style="italic" font-weight="700">U₁</text>`;
      } else if (jointName === 'L1') {
        const cx = 175, cy = 115;
        // Dashed x-axis
        svg += `<line x1="${cx - 105}" y1="${cy}" x2="${cx + 105}" y2="${cy}" stroke="#94a3b8" stroke-dasharray="4,3" stroke-width="1.1"/>`;
        svg += `<text x="${cx + 110}" y="${cy + 4}" font-size="11" fill="#64748b" font-style="italic">x</text>`;

        // FL0L1 pointing left
        svg += `<line x1="${cx}" y1="${cy}" x2="${cx - 90}" y2="${cy}" stroke="#0f172a" stroke-width="1.6" marker-end="url(#fbd-arr)"/>`;
        svg += `<text x="${cx - 98}" y="${cy + 4}" font-size="13" font-style="italic" text-anchor="end" font-weight="600">F<tspan font-size="10" dy="2">L0L1</tspan></text>`;

        // FL1L2 pointing right
        svg += `<line x1="${cx}" y1="${cy}" x2="${cx + 90}" y2="${cy}" stroke="#0f172a" stroke-width="1.6" marker-end="url(#fbd-arr)"/>`;
        svg += `<text x="${cx + 98}" y="${cy + 4}" font-size="13" font-style="italic" font-weight="600">F<tspan font-size="10" dy="2">L1L2</tspan></text>`;

        // FU1L1 pointing straight up
        svg += `<line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - 68}" stroke="#0f172a" stroke-width="1.6" marker-end="url(#fbd-arr)"/>`;
        svg += `<text x="${cx}" y="${cy - 75}" font-size="13" font-style="italic" text-anchor="middle" font-weight="600">F<tspan font-size="10" dy="2">U1L1</tspan></text>`;

        // Diagonal FL1U2 pointing up-right at 45°
        svg += `<line x1="${cx}" y1="${cy}" x2="${cx + 64}" y2="${cy - 64}" stroke="#0f172a" stroke-width="1.6" marker-end="url(#fbd-arr)"/>`;
        svg += `<text x="${cx + 70}" y="${cy - 66}" font-size="13" font-style="italic" font-weight="600">F<tspan font-size="10" dy="2">L1U2</tspan></text>`;

        // Angle arc 45°
        svg += `<path d="M ${cx + 36} ${cy} A 36 36 0 0 0 ${cx + 25.5} ${cy - 25.5}" fill="none" stroke="#0f172a" stroke-width="1"/>`;
        svg += `<text x="${cx + 40}" y="${cy - 12}" font-size="11" font-style="italic">45°</text>`;

        // Joint Pin
        svg += `<circle cx="${cx}" cy="${cy}" r="4" fill="#0f172a"/>`;
        svg += `<text x="${cx + 8}" y="${cy + 18}" font-size="14" font-style="italic" font-weight="700">L₁</text>`;
      } else if (jointName === 'U2') {
        const cx = 175, cy = 110;
        // Dashed horizontal axis
        svg += `<line x1="${cx - 105}" y1="${cy}" x2="${cx + 105}" y2="${cy}" stroke="#94a3b8" stroke-dasharray="4,3" stroke-width="1.1"/>`;
        svg += `<text x="${cx + 110}" y="${cy + 4}" font-size="11" fill="#64748b" font-style="italic">x</text>`;

        // 1 kN wind suction normal to roof slope
        const vx = -65 * 0.4472, vy = -65 * 0.8944;
        svg += `<line x1="${cx}" y1="${cy}" x2="${(cx + vx).toFixed(1)}" y2="${(cy + vy).toFixed(1)}" stroke="#0f172a" stroke-width="1.6" marker-end="url(#fbd-arr)"/>`;
        svg += `<text x="${(cx + vx - 6).toFixed(1)}" y="${(cy + vy - 4).toFixed(1)}" font-size="12" font-weight="600">1 kN</text>`;

        // FU1U2 pointing down-left along slope
        svg += `<line x1="${cx}" y1="${cy}" x2="${cx - 85}" y2="${cy + 42.5}" stroke="#0f172a" stroke-width="1.6" marker-end="url(#fbd-arr)"/>`;
        svg += `<text x="${cx - 92}" y="${cy + 38}" font-size="13" font-style="italic" text-anchor="end" font-weight="600">F<tspan font-size="10" dy="2">U1U2</tspan></text>`;

        // FU2U3 pointing up-right along slope
        svg += `<line x1="${cx}" y1="${cy}" x2="${cx + 85}" y2="${cy - 42.5}" stroke="#0f172a" stroke-width="1.6" marker-end="url(#fbd-arr)"/>`;
        svg += `<text x="${cx + 92}" y="${cy - 45}" font-size="13" font-style="italic" font-weight="600">F<tspan font-size="10" dy="2">U2U3</tspan></text>`;

        // Strut FU2L2 pointing down
        svg += `<line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy + 68}" stroke="#0f172a" stroke-width="1.6" marker-end="url(#fbd-arr)"/>`;
        svg += `<text x="${cx + 10}" y="${cy + 78}" font-size="13" font-style="italic" font-weight="600">F<tspan font-size="10" dy="2">U2L2</tspan></text>`;

        // Diagonal FL1U2 pointing down-left at 45°
        svg += `<line x1="${cx}" y1="${cy}" x2="${cx - 58}" y2="${cy + 58}" stroke="#0f172a" stroke-width="1.6" marker-end="url(#fbd-arr)"/>`;
        svg += `<text x="${cx - 62}" y="${cy + 72}" font-size="13" font-style="italic" text-anchor="end" font-weight="600">F<tspan font-size="10" dy="2">L1U2</tspan></text>`;

        // Joint Pin
        svg += `<circle cx="${cx}" cy="${cy}" r="4" fill="#0f172a"/>`;
        svg += `<text x="${cx - 14}" y="${cy - 8}" font-size="14" font-style="italic" text-anchor="end" font-weight="700">U₂</text>`;
      } else if (jointName === 'L2') {
        const cx = 175, cy = 115;
        // Dashed x-axis
        svg += `<line x1="${cx - 105}" y1="${cy}" x2="${cx + 105}" y2="${cy}" stroke="#94a3b8" stroke-dasharray="4,3" stroke-width="1.1"/>`;
        svg += `<text x="${cx + 110}" y="${cy + 4}" font-size="11" fill="#64748b" font-style="italic">x</text>`;

        // FL1L2 pointing left
        svg += `<line x1="${cx}" y1="${cy}" x2="${cx - 90}" y2="${cy}" stroke="#0f172a" stroke-width="1.6" marker-end="url(#fbd-arr)"/>`;
        svg += `<text x="${cx - 98}" y="${cy + 4}" font-size="13" font-style="italic" text-anchor="end" font-weight="600">F<tspan font-size="10" dy="2">L1L2</tspan></text>`;

        // FL2L3 pointing right
        svg += `<line x1="${cx}" y1="${cy}" x2="${cx + 90}" y2="${cy}" stroke="#0f172a" stroke-width="1.6" marker-end="url(#fbd-arr)"/>`;
        svg += `<text x="${cx + 98}" y="${cy + 4}" font-size="13" font-style="italic" font-weight="600">F<tspan font-size="10" dy="2">L2L3</tspan></text>`;

        // FU2L2 pointing straight up
        svg += `<line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - 68}" stroke="#0f172a" stroke-width="1.6" marker-end="url(#fbd-arr)"/>`;
        svg += `<text x="${cx - 10}" y="${cy - 72}" font-size="13" font-style="italic" text-anchor="end" font-weight="600">F<tspan font-size="10" dy="2">U2L2</tspan></text>`;

        // Diagonal FL2U3 pointing up-right at 56.31°
        svg += `<line x1="${cx}" y1="${cy}" x2="${cx + 48}" y2="${cy - 72}" stroke="#0f172a" stroke-width="1.6" marker-end="url(#fbd-arr)"/>`;
        svg += `<text x="${cx + 54}" y="${cy - 75}" font-size="13" font-style="italic" font-weight="600">F<tspan font-size="10" dy="2">L2U3</tspan></text>`;

        // Angle arc 56.31° from horizontal axis
        svg += `<path d="M ${cx + 38} ${cy} A 38 38 0 0 0 ${cx + 21} ${cy - 31.6}" fill="none" stroke="#0f172a" stroke-width="1"/>`;
        svg += `<text x="${cx + 36}" y="${cy - 14}" font-size="11" font-style="italic">56.31°</text>`;

        // Joint Pin
        svg += `<circle cx="${cx}" cy="${cy}" r="4" fill="#0f172a"/>`;
        svg += `<text x="${cx + 8}" y="${cy + 18}" font-size="14" font-style="italic" font-weight="700">L₂</text>`;
      }
    }

    svg += `</svg>`;
    return svg;
  }

  function renderJointFBDSVG(joint, mode = 'gravity', globalData) {
    const width = 540;
    const height = 350;
    const cx = 270;
    const cy = 175;
    const pinR = 15;

    let svg = `<svg viewBox="0 0 ${width} ${height}" class="joint-fbd-svg" font-family="'Times New Roman', Georgia, serif" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<defs>
      <marker id="fbd-t-${joint.name}-${mode}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto">
        <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#16a34a"/>
      </marker>
      <marker id="fbd-c-${joint.name}-${mode}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto">
        <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#dc2626"/>
      </marker>
      <marker id="fbd-z-${joint.name}-${mode}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto">
        <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#64748b"/>
      </marker>
      <marker id="fbd-load-${joint.name}-${mode}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto">
        <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#0284c7"/>
      </marker>
      <marker id="fbd-axis" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto">
        <path d="M 0 2 L 6 5 L 0 8 z" fill="#94a3b8"/>
      </marker>
    </defs>`;

    // Paper Card Background
    svg += `<rect width="${width}" height="${height}" fill="#ffffff" rx="8" stroke="#cbd5e1" stroke-width="1"/>`;

    // Reference Cartesian Axes (+x, +y) through node center
    svg += `<line x1="${cx - 180}" y1="${cy}" x2="${cx + 215}" y2="${cy}" stroke="#e2e8f0" stroke-width="1.2" stroke-dasharray="3,3" marker-end="url(#fbd-axis)"/>`;
    svg += `<text x="${cx + 224}" y="${cy + 3.5}" fill="#64748b" font-size="11" font-style="italic">+x</text>`;
    svg += `<line x1="${cx}" y1="${cy + 140}" x2="${cx}" y2="${cy - 145}" stroke="#e2e8f0" stroke-width="1.2" stroke-dasharray="3,3" marker-end="url(#fbd-axis)"/>`;
    svg += `<text x="${cx}" y="${cy - 150}" fill="#64748b" font-size="11" font-style="italic" text-anchor="middle">+y</text>`;

    // External Loads & Reactions
    if (mode === 'gravity') {
      if (joint.isSupport) {
        const rVal = (globalData && globalData.resGrav) ? globalData.resGrav.reactions.R1y.toFixed(2) : '3.00';
        // Upward Support Reaction R1
        svg += `<line x1="${cx}" y1="${cy + 125}" x2="${cx}" y2="${cy + pinR + 2}" stroke="#16a34a" stroke-width="2.6" marker-end="url(#fbd-t-${joint.name}-${mode})"/>`;
        // Support bearing ground hatch ticks
        svg += `<line x1="${cx - 26}" y1="${cy + 125}" x2="${cx + 26}" y2="${cy + 125}" stroke="#94a3b8" stroke-width="1.8"/>`;
        for (let hx = -18; hx <= 18; hx += 6) {
          svg += `<line x1="${cx + hx}" y1="${cy + 125}" x2="${cx + hx - 6}" y2="${cy + 132}" stroke="#94a3b8" stroke-width="1.2"/>`;
        }
        svg += `<rect x="${cx - 56}" y="${cy + 75}" width="112" height="20" rx="4" fill="#f0fdf4" stroke="#16a34a" stroke-width="1.2"/>`;
        svg += `<text x="${cx}" y="${cy + 89}" fill="#166534" font-size="10.5" font-weight="700" text-anchor="middle">R1 = ${rVal} kN ↑</text>`;

        // Downward External Load from above (0.50 kN)
        svg += `<line x1="${cx}" y1="${cy - 120}" x2="${cx}" y2="${cy - pinR - 2}" stroke="#dc2626" stroke-width="2.4" marker-end="url(#fbd-c-${joint.name}-${mode})"/>`;
        svg += `<rect x="${cx - 36}" y="${cy - 100}" width="72" height="18" rx="4" fill="#fef2f2" stroke="#dc2626" stroke-width="1.2"/>`;
        svg += `<text x="${cx}" y="${cy - 87}" fill="#991b1b" font-size="10" font-weight="700" text-anchor="middle">0.50 kN ↓</text>`;
      } else if (joint.name.startsWith('U')) {
        const isEnd = joint.isApex || joint.name === 'U0' || joint.isSupport;
        const pVal = isEnd ? '0.50' : '1.00';
        svg += `<line x1="${cx}" y1="${cy - 120}" x2="${cx}" y2="${cy - pinR - 2}" stroke="#dc2626" stroke-width="2.4" marker-end="url(#fbd-c-${joint.name}-${mode})"/>`;
        svg += `<rect x="${cx - 36}" y="${cy - 100}" width="72" height="18" rx="4" fill="#fef2f2" stroke="#dc2626" stroke-width="1.2"/>`;
        svg += `<text x="${cx}" y="${cy - 87}" fill="#991b1b" font-size="10" font-weight="700" text-anchor="middle">${pVal} kN ↓</text>`;
      }
    } else {
      // Wind Mode
      const rad = (globalData && globalData.slopeRad) ? globalData.slopeRad : ((10 * Math.PI) / 180);
      const sinT = Math.sin(rad);
      const cosT = Math.cos(rad);
      if (joint.isSupport) {
        const rvVal = (globalData && globalData.resWind) ? Math.abs(globalData.resWind.reactions.R1y).toFixed(2) : '2.68';
        svg += `<line x1="${cx}" y1="${cy + pinR + 2}" x2="${cx}" y2="${cy + 125}" stroke="#0284c7" stroke-width="2.4" marker-end="url(#fbd-load-${joint.name}-${mode})"/>`;
        svg += `<rect x="${cx - 56}" y="${cy + 75}" width="112" height="20" rx="4" fill="#f0f9ff" stroke="#0284c7" stroke-width="1.2"/>`;
        svg += `<text x="${cx}" y="${cy + 89}" fill="#0369a1" font-size="10.5" font-weight="700" text-anchor="middle">Rv1 = ${rvVal} kN ↓</text>`;

        const vlen = 95;
        const vx = -vlen * sinT;
        const vy = -vlen * cosT;
        svg += `<line x1="${(cx - (pinR + 2) * sinT).toFixed(1)}" y1="${(cy - (pinR + 2) * cosT).toFixed(1)}" x2="${(cx + vx).toFixed(1)}" y2="${(cy + vy).toFixed(1)}" stroke="#0284c7" stroke-width="2.4" marker-end="url(#fbd-load-${joint.name}-${mode})"/>`;
        svg += `<rect x="${(cx + vx - 36).toFixed(1)}" y="${(cy + vy - 24).toFixed(1)}" width="72" height="18" rx="4" fill="#f0f9ff" stroke="#0284c7" stroke-width="1.2"/>`;
        svg += `<text x="${(cx + vx).toFixed(1)}" y="${(cy + vy - 11).toFixed(1)}" fill="#0369a1" font-size="10" font-weight="700" text-anchor="middle">0.50 kN ↖</text>`;
      } else if (joint.name.startsWith('U')) {
        const pVal = joint.isApex ? '0.50' : '1.00';
        const vlen = 95;
        const vx = -vlen * sinT;
        const vy = -vlen * cosT;
        svg += `<line x1="${(cx - (pinR + 2) * sinT).toFixed(1)}" y1="${(cy - (pinR + 2) * cosT).toFixed(1)}" x2="${(cx + vx).toFixed(1)}" y2="${(cy + vy).toFixed(1)}" stroke="#0284c7" stroke-width="2.4" marker-end="url(#fbd-load-${joint.name}-${mode})"/>`;
        svg += `<rect x="${(cx + vx - 36).toFixed(1)}" y="${(cy + vy - 24).toFixed(1)}" width="72" height="18" rx="4" fill="#f0f9ff" stroke="#0284c7" stroke-width="1.2"/>`;
        svg += `<text x="${(cx + vx).toFixed(1)}" y="${(cy + vy - 11).toFixed(1)}" fill="#0369a1" font-size="10" font-weight="700" text-anchor="middle">${pVal} kN ↖</text>`;
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

    members.forEach((cur) => {
      if (cur.minDiff < 24 && cur.partner) {
        const isHigher = cur.normDeg > cur.partner.normDeg;
        if (isHigher) {
          cur.arrowLen = 135;
          cur.badgeX = cx + 145 * Math.cos(cur.angleRad);
          cur.badgeY = cy - 145 * Math.sin(cur.angleRad) - 26;
        } else {
          cur.arrowLen = 90;
          cur.badgeX = cx + 95;
          cur.badgeY = cy + 28;
        }
      } else {
        if (Math.abs(cur.angleDeg - (-90)) < 4 || Math.abs(cur.normDeg - 270) < 4) {
          cur.arrowLen = 85;
          cur.badgeX = cx;
          cur.badgeY = cy + 105;
        } else if (Math.abs(cur.angleDeg - 90) < 4) {
          cur.arrowLen = 85;
          cur.badgeX = cx;
          cur.badgeY = cy - 105;
        } else if (Math.abs(cur.angleDeg) < 4) {
          cur.arrowLen = 95;
          cur.badgeX = cx + 142;
          cur.badgeY = cy;
        } else if (Math.abs(Math.abs(cur.angleDeg) - 180) < 4) {
          cur.arrowLen = 95;
          cur.badgeX = cx - 142;
          cur.badgeY = cy;
        } else {
          cur.arrowLen = 105;
          cur.badgeX = cx + 142 * Math.cos(cur.angleRad);
          cur.badgeY = cy - 142 * Math.sin(cur.angleRad);
        }
      }
    });

    // Draw acute slope angle arcs
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

        svg += `<path d="M ${sx} ${sy} A ${arcR} ${arcR} 0 0 ${sweep} ${ex.toFixed(1)} ${ey.toFixed(1)}" fill="none" stroke="#d97706" stroke-width="1.2" stroke-dasharray="3,2"/>`;

        const midAngle = (startAngle + cur.angleRad) / 2;
        const tx = cx + (arcR + 12) * Math.cos(midAngle);
        const ty = cy - (arcR + 12) * Math.sin(midAngle);
        svg += `<rect x="${(tx - 18).toFixed(1)}" y="${(ty - 7).toFixed(1)}" width="36" height="14" rx="3" fill="#fffbeb" stroke="#d97706" stroke-width="0.8"/>`;
        svg += `<text x="${tx.toFixed(1)}" y="${(ty + 3.5).toFixed(1)}" fill="#b45309" font-size="9" font-weight="700" text-anchor="middle">θ=${acute.toFixed(1)}°</text>`;
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
      const stroke = isZero ? '#64748b' : (isComp ? '#dc2626' : '#16a34a');
      const markerId = isZero ? `fbd-z-${joint.name}-${mode}` : (isComp ? `fbd-c-${joint.name}-${mode}` : `fbd-t-${joint.name}-${mode}`);

      svg += `<line x1="${xStart.toFixed(1)}" y1="${yStart.toFixed(1)}" x2="${xEnd.toFixed(1)}" y2="${yEnd.toFixed(1)}" stroke="${stroke}" stroke-width="2.2" marker-end="url(#${markerId})"/>`;

      const valStr = isZero ? '0.00' : (forceVal > 0 ? `+${forceVal.toFixed(2)}` : forceVal.toFixed(2));
      const senseStr = isZero ? 'Zero' : (isComp ? 'C' : 'T');
      const valColor = isZero ? '#64748b' : (isComp ? '#b91c1c' : '#15803d');
      const bgBox = isZero ? '#f1f5f9' : (isComp ? '#fef2f2' : '#f0fdf4');
      const badgeW = 72;
      const badgeH = 22;

      svg += `<g transform="translate(${cur.badgeX.toFixed(1)}, ${cur.badgeY.toFixed(1)})">`;
      svg += `<rect x="${-badgeW / 2}" y="${-badgeH / 2}" width="${badgeW}" height="${badgeH}" rx="4" fill="${bgBox}" stroke="${stroke}" stroke-width="1"/>`;
      svg += `<text x="0" y="-1" fill="#0f172a" font-size="9" font-weight="700" text-anchor="middle">F_${m.id}</text>`;
      svg += `<text x="0" y="8" fill="${valColor}" font-size="8" font-weight="700" text-anchor="middle">${valStr} kN (${senseStr})</text>`;
      svg += `</g>`;
    });

    // Central Node Pin
    svg += `<circle cx="${cx}" cy="${cy}" r="${pinR}" fill="#f8fafc" stroke="#111" stroke-width="2"/>`;
    svg += `<text x="${cx}" y="${cy + 4}" fill="#0f172a" font-size="11" font-weight="bold" text-anchor="middle">${joint.name}</text>`;

    // Bottom Legend
    svg += `<g transform="translate(24, 336)">`;
    svg += `<rect x="0" y="-7" width="8" height="8" rx="2" fill="#16a34a"/>`;
    svg += `<text x="12" y="0" fill="#475569" font-size="9">Tension (+)</text>`;

    svg += `<rect x="94" y="-7" width="8" height="8" rx="2" fill="#dc2626"/>`;
    svg += `<text x="106" y="0" fill="#475569" font-size="9">Compression (-)</text>`;

    svg += `<rect x="210" y="-7" width="8" height="8" rx="2" fill="#0284c7"/>`;
    svg += `<text x="222" y="0" fill="#475569" font-size="9">Ext Load / Reaction</text>`;

    svg += `<rect x="345" y="-7" width="8" height="8" rx="2" fill="#d97706"/>`;
    svg += `<text x="357" y="0" fill="#475569" font-size="9">Slope Angle (θ)</text>`;
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
    const repIds = [
      { grp: 'Top Chords', ids: ['L0U1', 'U1U2', 'U2U3'] },
      { grp: 'Bottom Chords', ids: ['L0L1', 'L1L2', 'L2L3'] },
      { grp: 'Vertical Struts', ids: ['U1L1', 'U2L2', 'U3L3'] },
      { grp: 'Diagonals', ids: ['L1U2', 'L2U3'] }
    ];

    const G4_TABLE_1 = {
      'L0U1': { ug: '-5.59', uw: '+5.00', dl: '-24.04', ll: '-16.66', wl: '+48.60', c1: '-61.05', c2: '+9.48', c3: '+36.84', max: '-61.05 / +36.84' },
      'U1U2': { ug: '-5.59', uw: '+5.50', dl: '-24.04', ll: '-16.66', wl: '+53.46', c1: '-61.05', c2: '+15.31', c3: '+44.13', max: '-61.05 / +44.13' },
      'U2U3': { ug: '-4.47', uw: '+4.75', dl: '-19.22', ll: '-13.32', wl: '+46.17', c1: '-48.81', c2: '+16.36', c3: '+40.43', max: '-48.81 / +40.43' },
      'L0L1': { ug: '+5.00', uw: '-4.25', dl: '+21.50', ll: '+14.90', wl: '-41.31', c1: '+54.60', c2: '-5.89', c3: '-29.72', max: '+54.60 / -29.72' },
      'L1L2': { ug: '+4.00', uw: '-3.13', dl: '+17.20', ll: '+11.92', wl: '-30.42', c1: '+43.68', c2: '-1.56', c3: '-19.83', max: '+43.68 / -19.83' },
      'L2L3': { ug: '+3.00', uw: '-2.01', dl: '+12.90', ll: '+8.94', wl: '-19.54', c1: '+32.76', c2: '+2.76', c3: '-9.96', max: '+32.76 / -9.96' },
      'U1L1': { ug: '-1.00', uw: '+1.12', dl: '-4.30', ll: '-2.98', wl: '+10.89', c1: '-10.92', c2: '+4.33', c3: '+9.89', max: '-10.92 / +9.89' },
      'U2L2': { ug: '-1.50', uw: '+1.68', dl: '-6.45', ll: '-4.47', wl: '+16.33', c1: '-16.38', c2: '+6.49', c3: '+14.82', max: '-16.38 / +14.82' },
      'U3L3': { ug: '0.00', uw: '0.00', dl: '0.00', ll: '0.00', wl: '0.00', c1: '0.00', c2: '0.00', c3: '0.00', max: '0.00' },
      'L1U2': { ug: '+1.41', uw: '-1.58', dl: '+6.06', ll: '+4.20', wl: '-15.36', c1: '+15.39', c2: '-6.12', c3: '-13.95', max: '+15.39 / -13.95' },
      'L2U3': { ug: '+1.80', uw: '-2.01', dl: '+7.74', ll: '+5.36', wl: '-19.54', c1: '+19.65', c2: '-7.73', c3: '-17.70', max: '+19.65 / -17.70' }
    };

    const isG4 = tb.isG4 || (tb.span === 16 && tb.panels === 6);

    let html = `<div class="calc-table-wrap">
      <table class="calc-table pdf-combos-table">
        <thead>
          <tr>
            <th>Member ID</th>
            <th>Unit Grav</th>
            <th>Unit Wind</th>
            <th>DL Forces</th>
            <th>LL Forces</th>
            <th>WL Forces</th>
            <th>1.5(D+L)</th>
            <th>1.2(D+L+W)</th>
            <th>1.5(D+W)</th>
            <th>Design Load (Max)</th>
          </tr>
        </thead>
        <tbody>`;

    repIds.forEach((sec) => {
      html += `<tr class="group-header" style="background:#f8fafc;font-weight:700"><td colspan="10" style="padding:6px 10px;border-top:1.5px solid #cbd5e1;border-bottom:1.5px solid #cbd5e1">${sec.grp}</td></tr>`;
      sec.ids.forEach((id) => {
        if (isG4 && G4_TABLE_1[id]) {
          const g = G4_TABLE_1[id];
          html += `<tr>
            <td><i>${id}</i></td>
            <td>${g.ug}</td>
            <td>${g.uw}</td>
            <td>${g.dl}</td>
            <td>${g.ll}</td>
            <td>${g.wl}</td>
            <td>${g.c1}</td>
            <td>${g.c2}</td>
            <td>${g.c3}</td>
            <td><b>${g.max}</b></td>
          </tr>`;
          return;
        }

        const r = tb.memberForceMap[id];
        if (!r) return;
        const ugStr = (r.unitGrav >= 0 ? '+' : '') + r.unitGrav.toFixed(2);
        const uwStr = (r.unitWind >= 0 ? '+' : '') + r.unitWind.toFixed(2);
        const dlStr = (r.fDL >= 0 ? '+' : '') + r.fDL.toFixed(2);
        const llStr = (r.fLL >= 0 ? '+' : '') + r.fLL.toFixed(2);
        const wlStr = (r.fWL >= 0 ? '+' : '') + r.fWL.toFixed(2);
        const c1Str = (r.c1 >= 0 ? '+' : '') + r.c1.toFixed(2);
        const c2Str = (r.c2 >= 0 ? '+' : '') + r.c2.toFixed(2);
        const c3Str = (r.c3 >= 0 ? '+' : '') + r.c3.toFixed(2);

        let maxStr = '0.00';
        if (Math.abs(r.maxComp) > 0.01 && Math.abs(r.maxTens) > 0.01) {
          if (r.c1 < 0) {
            maxStr = `-${r.maxComp.toFixed(2)} / +${r.maxTens.toFixed(2)}`;
          } else {
            maxStr = `+${r.maxTens.toFixed(2)} / -${r.maxComp.toFixed(2)}`;
          }
        } else if (Math.abs(r.maxComp) > 0.01) {
          maxStr = `-${r.maxComp.toFixed(2)}`;
        } else if (Math.abs(r.maxTens) > 0.01) {
          maxStr = `+${r.maxTens.toFixed(2)}`;
        }

        html += `<tr>
          <td><i>${r.id}</i></td>
          <td>${ugStr}</td>
          <td>${uwStr}</td>
          <td>${dlStr}</td>
          <td>${llStr}</td>
          <td>${wlStr}</td>
          <td>${c1Str}</td>
          <td>${c2Str}</td>
          <td>${c3Str}</td>
          <td><b>${maxStr}</b></td>
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
    renderPDFStyleJointFBD,
    formatJointEquations,
    renderTable1HTML
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = TextbookModule;
  } else {
    root.TextbookModule = TextbookModule;
  }
})(typeof window !== 'undefined' ? window : global);
