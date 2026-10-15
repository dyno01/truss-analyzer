/**
 * Structural Design Studio — Multi-Load Combination Analysis & Code Verification
 * Solves:
 * - Load Case 1: 1.5 * (DL + LL)
 * - Load Case 2: 1.5 * (DL + WL_down)
 * - Load Case 3: 1.2 * (DL + LL + WL)
 * - Load Case 4: 0.9 * DL + 1.5 * WL_up (Wind Reversal & Suction)
 * Extracts governing envelope forces and evaluates IS 800:2007 limit state checks.
 */

(function(root) {
  'use strict';

  const Standards = root.Standards || (typeof require !== 'undefined' ? require('../data/standards.js') : {});
  const Geometry = root.GeometryModule || (typeof require !== 'undefined' ? require('./geometry.js') : {});
  const Wind = root.WindModule || (typeof require !== 'undefined' ? require('./wind.js') : {});
  const Solver = root.SolverModule || (typeof require !== 'undefined' ? require('./solver.js') : {});
  const IS800 = root.IS800Module || (typeof require !== 'undefined' ? require('./code_is800.js') : {});

  function runCompleteAnalysis(state) {
    const S = state || root.S || {};
    const t = Geometry.generateTruss(S);
    const span = t.span;
    const panels = t.panels;
    const spacing = Math.max(0.1, Number(S.spacing) || 4);
    const slopeDeg = Math.max(0.1, Number(S.slope) || 10);
    const slopeRad = (slopeDeg * Math.PI) / 180;
    const grade = S.grade || 'E250';
    const stGrade = Standards.STEEL_GRADES[grade] || Standards.STEEL_GRADES['E250'];
    const fy = stGrade.fy;
    const fu = stGrade.fu;
    const E = stGrade.E;

    // Active Sections
    const angleKey = S.section || 'ISA 75×75×6';
    const sec = Standards.ANGLES[angleKey] || Standards.ANGLES['ISA 75×75×6'];
    const At = 2 * sec.A; // 2 angles back-to-back
    const rmin = sec.rmin;

    // 1. IS 875 Part 1: Dead Loads (kN/m^2 on plan area)
    // Custom values allowed from state (wSheeting, wPurlins, wBracing, wSelf)
    const dl_sheet = (S.wSheeting !== undefined && S.wSheeting !== null && S.wSheeting !== '' && !isNaN(Number(S.wSheeting)))
      ? Number(S.wSheeting)
      : (S.roof === 'AC' ? 170 : 130);
    const dl_purlins = (S.wPurlins !== undefined && S.wPurlins !== null && S.wPurlins !== '' && !isNaN(Number(S.wPurlins)))
      ? Number(S.wPurlins)
      : 100;
    const dl_bracing = (S.wBracing !== undefined && S.wBracing !== null && S.wBracing !== '' && !isNaN(Number(S.wBracing)))
      ? Number(S.wBracing)
      : 12;
    const dl_truss = (S.wSelf !== undefined && S.wSelf !== null && S.wSelf !== '' && !isNaN(Number(S.wSelf)))
      ? Number(S.wSelf)
      : ((span / 3 + 5) * 10);
    const dl_total_int = dl_sheet + dl_purlins + dl_bracing + dl_truss; // N/m^2
    const dl_kN_m2 = dl_total_int / 1000;

    // 2. IS 875 Part 2: Imposed Loads (Live Loads on roof)
    // Table 2: 0.75 kN/m^2 less 0.02 kN/m^2 for each degree increase in slope over 10 deg
    // Minimum 0.40 kN/m^2
    let ll_kN_m2 = 0.75;
    if (slopeDeg > 10) {
      ll_kN_m2 = Math.max(0.40, 0.75 - (slopeDeg - 10) * 0.02);
    }

    // 3. IS 875 Part 3: Wind Loads
    const windAnalysis = Wind.computeWindAnalysis(S);
    const pz_kN = windAnalysis.pz_kN;
    const windUplift_kN_m2 = windAnalysis.p_net_suction; // negative (suction)
    const windDown_kN_m2 = Math.max(0, windAnalysis.p_net_pressure); // positive

    // Direct Stiffness FEA Nodal Load Vector Assembly
    const numNodes = t.nodes.length;
    const dof = 2 * numNodes;

    // Function to generate vertical and horizontal loads on roof top nodes
    // Top chord nodes are at index panels + 1 to 2*panels + 1
    function buildNodalLoads(q_vert_plan, q_wind_normal) {
      const F = new Array(dof).fill(0);
      const topStart = panels + 1;
      const panelWidthPlan = span / panels;

      for (let i = 0; i <= panels; i++) {
        const tribPlan = (i === 0 || i === panels) ? panelWidthPlan / 2 : panelWidthPlan;
        const tribArea = tribPlan * spacing; // m^2 plan

        // Vertical gravity force (downward = negative FY)
        const fy_grav = -q_vert_plan * tribArea;

        // Wind force normal to slope:
        // Resolved into FX and FY components
        const tribSlope = tribArea / Math.cos(slopeRad);
        const f_normal = q_wind_normal * tribSlope;
        // For windward (left half, i <= panels/2): normal points up and right
        // For leeward (right half, i > panels/2): normal points up and left
        const signX = i <= panels / 2 ? Math.sin(slopeRad) : -Math.sin(slopeRad);
        const signY = Math.cos(slopeRad);

        const fx_wind = f_normal * signX;
        const fy_wind = f_normal * signY;

        const nodeIdx = topStart + i;
        F[2 * nodeIdx] += fx_wind;
        F[2 * nodeIdx + 1] += (fy_grav + fy_wind);
      }
      return F;
    }

    // Solve 4 Limit State Load Combinations:
    const loadCases = [
      { name: '1.5(DL + LL)', F: buildNodalLoads(1.5 * (dl_kN_m2 + ll_kN_m2), 0) },
      { name: '1.5(DL + WL)', F: buildNodalLoads(1.5 * dl_kN_m2, 1.5 * windDown_kN_m2) },
      { name: '1.2(DL + LL + WL)', F: buildNodalLoads(1.2 * (dl_kN_m2 + ll_kN_m2), 1.2 * windDown_kN_m2) },
      { name: '0.9DL + 1.5WL(Uplift)', F: buildNodalLoads(0.9 * dl_kN_m2, 1.5 * windUplift_kN_m2) }
    ];

    const results = [];
    for (const lc of loadCases) {
      const res = Solver.solveTrussFEA(t.nodes, t.m, t.pin, t.roller, lc.F, E, At);
      if (!res.success) {
        return { mechanism: true, reason: res.error || 'Truss geometry or supports are unstable.' };
      }
      results.push({ name: lc.name, forces: res.memberForces, reactions: res.reactions });
    }

    // Extract governing axial forces (max tension and max compression) per member
    const memberSummary = t.m.map((q, idx) => {
      const na = t.nodes[q[0]];
      const nb = t.nodes[q[1]];
      const L_m = Math.hypot(nb.x - na.x, nb.y - na.y);
      const L_mm = L_m * 1000;
      const role = q[2];

      let maxTension = 0;
      let maxCompression = 0; // stored as positive magnitude
      let governingLC_T = '';
      let governingLC_C = '';

      results.forEach((r) => {
        const f = r.forces[idx];
        if (f > maxTension) {
          maxTension = f;
          governingLC_T = r.name;
        }
        if (f < -maxCompression) {
          maxCompression = -f;
          governingLC_C = r.name;
        }
      });

      // Resolve member-specific section and properties based on structural role
      let memSecKey = S.rafterSection || S.section || 'ISA 75×75×6';
      let isDouble = true;
      if (role === 'top_chord') {
        memSecKey = S.rafterSection || S.section || 'ISA 75×75×6';
        isDouble = true;
      } else if (role === 'bottom_chord') {
        memSecKey = S.tieSection || S.section || 'ISA 60×60×6';
        isDouble = true;
      } else if (role === 'vertical') {
        memSecKey = S.strutSection || S.section || 'ISA 70×70×6';
        isDouble = false;
      } else if (role === 'diagonal') {
        memSecKey = S.diagonalSection || S.section || 'ISA 50×50×6';
        isDouble = false;
      }

      let cleanKey = String(memSecKey || '').trim().replace(/x/g, '×');
      cleanKey = cleanKey.replace(/^2\s*×?\s*ISA|^2\s*ISA|^Single\s*ISA|^ISA\s*/i, 'ISA ').replace(/\s+/g, ' ').trim();
      if (!cleanKey.startsWith('ISA')) cleanKey = 'ISA ' + cleanKey;
      const memSec = (Standards.ANGLES && (Standards.ANGLES[cleanKey] || Standards.ANGLES[cleanKey.replace(/×/g, 'x')] || Standards.ANGLES[memSecKey])) || Standards.ANGLES['ISA 75×75×6'] || { A: 866, rx: 23.0, rmin: 14.6, rv: 14.6 };
      const At_mem = isDouble ? (2 * memSec.A) : memSec.A;
      const r_mem = isDouble ? memSec.rx : (memSec.rv || memSec.rmin || 14.6);
      const K_factor = (role === 'top_chord' || role === 'bottom_chord') ? 0.70 : 0.85;

      // Member Capacities per IS 800:
      const tensionRes = IS800.calcTensionCapacity(At_mem, fy, fu, 1.10, 1.25);
      const compRes = IS800.calcCompressionCapacity(At_mem, r_mem, L_mm, K_factor, fy, E);

      const utilTension = maxTension / Math.max(0.001, tensionRes.Td);
      const utilCompression = maxCompression / Math.max(0.001, compRes.Pd);

      const isGovernedByCompression = utilCompression >= utilTension;
      const governingUtil = Math.max(utilTension, utilCompression);
      const governingForce = isGovernedByCompression ? -maxCompression : maxTension;
      const governingLC = isGovernedByCompression ? governingLC_C : governingLC_T;
      const governingCapacity = isGovernedByCompression ? compRes.Pd : tensionRes.Td;

      // Slenderness check strictly per IS 800:2007 Table 3:
      // (i) Member carrying compressive loads resulting from dead & imposed loads: 180
      // (ii) Member carrying compressive loads resulting from wind/earthquake loads: 250
      // (iv) Member acting as a tie in a roof truss subject to reversal from wind: 350
      // (vi) Members always in tension (or nominal zero force): 400
      const isReversal = role === 'bottom_chord' && maxCompression > 0;
      let lambdaLimit = 180;
      if (maxCompression <= 0.05) {
        lambdaLimit = isDouble ? 350 : 400;
      } else if (isReversal) {
        lambdaLimit = 350;
      } else if (governingLC.includes('WL') || governingLC.includes('Uplift')) {
        lambdaLimit = 250;
      } else {
        lambdaLimit = 180;
      }
      const slendernessPass = compRes.lambda <= lambdaLimit;

      return {
        idx,
        nodes: [q[0], q[1]],
        role,
        sectionName: (isDouble ? '2× ' : 'Single ') + cleanKey,
        length_m: Number(L_m.toFixed(2)),
        maxTension: Number(maxTension.toFixed(2)),
        maxCompression: Number(maxCompression.toFixed(2)),
        governingForce: Number(governingForce.toFixed(2)),
        governingLC,
        governingCapacity: Number(governingCapacity.toFixed(2)),
        util: Number(governingUtil.toFixed(3)),
        lambda: compRes.lambda,
        lambdaLimit,
        slendernessPass,
        pass: governingUtil <= 1.0 && slendernessPass,
        isReversal
      };
    });

    // Governing member overall
    const governingMember = memberSummary.reduce((prev, curr) => curr.util > prev.util ? curr : prev, memberSummary[0]);

    // Maximum support reactions for column design
    let maxVerticalReaction = 0;
    results.forEach(r => {
      const maxR = Math.max(Math.abs(r.reactions.pinRy), Math.abs(r.reactions.rollerRy));
      if (maxR > maxVerticalReaction) maxVerticalReaction = maxR;
    });

    // Purlin Design Check
    const purlinCheck = IS800.checkPurlin(
      S.purlin || 'ISMC 125',
      spacing,
      Number(S.purlinSpacing) || 1.4,
      slopeDeg,
      dl_kN_m2,
      ll_kN_m2,
      Math.abs(windAnalysis.p_net_suction),
      grade,
      Number(S.deflectionLimit) || 180
    );

    // Built-up Column & Lacing Check
    const columnCheck = IS800.checkLacedColumn(
      S.column || 'ISMC 125',
      Number(S.height) || 12,
      maxVerticalReaction,
      Number(S.K) || 1.0,
      Number(S.lacing) || 0.6,
      grade
    );

    // Connection Check (governing joint axial demand)
    const maxJointForce = Math.max(...memberSummary.map(m => Math.abs(m.governingForce)));
    const connCheck = IS800.checkConnection(
      maxJointForce,
      S.connection || 'Welded',
      Number(S.weldSize) || 6,
      Number(S.weldLength) || 65,
      Number(S.boltDia) || 16,
      grade,
      S.fabrication || 'shop'
    );

    // Structural Checklist
    const checks = [
      {
        id: 'geometry',
        label: 'Geometry & Span',
        pass: span > 0 && Number(S.height) > 0 && panels >= 4 && slopeDeg > 0 && slopeDeg <= 45
      },
      {
        id: 'members',
        label: `Truss members (${S.rafterSection || 'ISA 75×75×6'} / ${S.tieSection || 'ISA 60×60×6'})`,
        pass: governingMember.pass,
        util: governingMember.util
      },
      {
        id: 'purlins',
        label: `Purlin (${purlinCheck.channel.D}mm ISMC biaxial)`,
        pass: purlinCheck.pass,
        util: purlinCheck.util
      },
      {
        id: 'column',
        label: `2C Column (${columnCheck.channel.D}mm laced)`,
        pass: columnCheck.colPass,
        util: columnCheck.colUtil
      },
      {
        id: 'lacing',
        label: `Lacing system (${columnCheck.lacingFlat})`,
        pass: columnCheck.lacingPass,
        util: columnCheck.lacingUtil
      },
      {
        id: 'connection',
        label: `Joint connection (${connCheck.type})`,
        pass: connCheck.pass,
        util: connCheck.util
      }
    ];

    return {
      mechanism: false,
      span,
      panels,
      spacing,
      slopeDeg,
      loads: {
        dl_sheet: Number(dl_sheet.toFixed(2)),
        dl_purlins: Number(dl_purlins.toFixed(2)),
        dl_bracing: Number(dl_bracing.toFixed(2)),
        dl_truss: Number(dl_truss.toFixed(2)),
        dl_total_int: Number(dl_total_int.toFixed(2)),
        dl_kN_m2: Number(dl_kN_m2.toFixed(3)),
        ll_kN_m2: Number(ll_kN_m2.toFixed(3)),
        wind: windAnalysis
      },
      members: memberSummary,
      governingMember,
      purlin: purlinCheck,
      column: columnCheck,
      connection: connCheck,
      maxReaction: Number(maxVerticalReaction.toFixed(2)),
      checks
    };
  }

  function getRecommendationValues(analysisData, state) {
    const S = state || root.S || {};
    const d = analysisData;
    if (!d || d.mechanism) return { items: [], values: {} };

    const angleKeys = Object.keys(Standards.ANGLES);
    const channelKeys = Object.keys(Standards.CHANNELS);
    const beamKeys = Object.keys(Standards.BEAMS || {});
    const values = {};
    const items = [];

    // 1. Optimum Truss Member Sizing across all 4 Member Roles
    const fy = (Standards.STEEL_GRADES[S.grade || 'E250'] || {}).fy || 250;
    const fu = (Standards.STEEL_GRADES[S.grade || 'E250'] || {}).fu || 410;
    const E = (Standards.STEEL_GRADES[S.grade || 'E250'] || {}).E || 200000;

    // 1.1 Principal Rafter (Top Chord)
    const rafterMembers = (d.members || []).filter(m => m.role === 'top_chord');
    if (rafterMembers.length) {
      const gm_rafter = rafterMembers.reduce((prev, curr) => curr.util > prev.util ? curr : prev, rafterMembers[0]);
      const P_req = Math.abs(gm_rafter.governingForce);
      const L_mm = gm_rafter.length_m * 1000;
      const curSec = S.rafterSection || S.section || 'ISA 75×75×6';

      let bestAngle = curSec;
      let bestCap = gm_rafter.governingCapacity;
      let bestUtil = gm_rafter.util;
      let bestLambda = gm_rafter.lambda;

      for (const aKey of angleKeys) {
        const candidate = Standards.ANGLES[aKey];
        const At_cand = 2 * candidate.A;
        const compRes = IS800.calcCompressionCapacity(At_cand, candidate.rx, L_mm, 0.70, fy, E);
        const tensRes = IS800.calcTensionCapacity(At_cand, fy, fu);
        const cap = gm_rafter.governingForce < 0 ? compRes.Pd : tensRes.Td;
        const util = P_req / Math.max(0.001, cap);
        const slendernessOk = compRes.lambda <= 180;

        if (util <= 0.95 && slendernessOk) {
          bestAngle = aKey;
          bestCap = cap;
          bestUtil = util;
          bestLambda = compRes.lambda;
          break;
        }
      }

      if (!gm_rafter.pass || bestAngle !== curSec) {
        values.rafterSection = bestAngle;
        values.section = bestAngle;
        if (!gm_rafter.pass) {
          items.push({
            component: 'Principal Rafter (Top Chord)',
            current: `2 × ${curSec} (Cap: ${gm_rafter.governingCapacity.toFixed(1)} kN, Util: ${(gm_rafter.util * 100).toFixed(1)}%, λ: ${gm_rafter.lambda.toFixed(1)})`,
            recommended: `2 × ${bestAngle}`,
            optimumValue: bestAngle,
            field: 'rafterSection',
            details: `Rafter carries ${P_req.toFixed(1)} kN compression. Optimal 2 × ${bestAngle} provides capacity ${bestCap.toFixed(1)} kN (λ = ${bestLambda.toFixed(1)} ≤ 180, Util: ${(bestUtil * 100).toFixed(1)}%).`
          });
        }
      }
    }

    // 1.2 Main Tie (Bottom Chord)
    const tieMembers = (d.members || []).filter(m => m.role === 'bottom_chord');
    if (tieMembers.length) {
      const gm_tie = tieMembers.reduce((prev, curr) => curr.util > prev.util ? curr : prev, tieMembers[0]);
      const P_tens = Math.abs(gm_tie.maxTension);
      const P_comp = Math.abs(gm_tie.maxCompression);
      const L_mm = gm_tie.length_m * 1000;
      const curSec = S.tieSection || S.section || 'ISA 60×60×6';

      let bestAngle = curSec;
      let bestCap = gm_tie.governingCapacity;
      let bestUtil = gm_tie.util;
      let bestLambda = gm_tie.lambda;

      for (const aKey of angleKeys) {
        const candidate = Standards.ANGLES[aKey];
        const At_cand = 2 * candidate.A;
        const tensRes = IS800.calcTensionCapacity(At_cand, fy, fu);
        const compRes = IS800.calcCompressionCapacity(At_cand, candidate.rx, L_mm, 0.70, fy, E);
        const utilT = P_tens / Math.max(0.001, tensRes.Td);
        const utilC = P_comp / Math.max(0.001, compRes.Pd);
        const maxU = Math.max(utilT, utilC);
        const lambdaLimit = gm_tie.isReversal ? 350 : 350;
        const slendernessOk = compRes.lambda <= lambdaLimit;

        if (maxU <= 0.95 && slendernessOk) {
          bestAngle = aKey;
          bestCap = tensRes.Td;
          bestUtil = maxU;
          bestLambda = compRes.lambda;
          break;
        }
      }

      if (!gm_tie.pass || bestAngle !== curSec) {
        values.tieSection = bestAngle;
        if (!gm_tie.pass) {
          items.push({
            component: 'Main Tie (Bottom Chord)',
            current: `2 × ${curSec} (Cap: ${gm_tie.governingCapacity.toFixed(1)} kN, Util: ${(gm_tie.util * 100).toFixed(1)}%, λ: ${gm_tie.lambda.toFixed(1)})`,
            recommended: `2 × ${bestAngle}`,
            optimumValue: bestAngle,
            field: 'tieSection',
            details: `Tension demand ${P_tens.toFixed(1)} kN / Reversal compression ${P_comp.toFixed(1)} kN. Optimal 2 × ${bestAngle} provides capacity ${bestCap.toFixed(1)} kN (λ = ${bestLambda.toFixed(1)} ≤ ${gm_tie.isReversal ? 350 : 350}).`
          });
        }
      }
    }

    // 1.3 Vertical Struts (Internal Web Members)
    const strutMembers = (d.members || []).filter(m => m.role === 'vertical');
    if (strutMembers.length) {
      const gm_strut = strutMembers.reduce((prev, curr) => curr.util > prev.util ? curr : prev, strutMembers[0]);
      const P_req = Math.abs(gm_strut.governingForce);
      const L_mm = gm_strut.length_m * 1000;
      const curSec = S.strutSection || S.section || 'ISA 70×70×6';

      let bestAngle = curSec;
      let bestCap = gm_strut.governingCapacity;
      let bestUtil = gm_strut.util;
      let bestLambda = gm_strut.lambda;

      for (const aKey of angleKeys) {
        const candidate = Standards.ANGLES[aKey];
        const At_cand = candidate.A;
        const rvv = candidate.rv || candidate.rmin || 10;
        const compRes = IS800.calcCompressionCapacity(At_cand, rvv, L_mm, 0.85, fy, E);
        const tensRes = IS800.calcTensionCapacity(At_cand, fy, fu);
        const cap = gm_strut.governingForce < 0 ? compRes.Pd : tensRes.Td;
        const util = P_req / Math.max(0.001, cap);
        let lambdaLim = 180;
        if (gm_strut.maxCompression <= 0.05) lambdaLim = 400;
        else if (gm_strut.isReversal) lambdaLim = 350;
        else if (gm_strut.governingLC.includes('WL') || gm_strut.governingLC.includes('Uplift')) lambdaLim = 250;
        const slendernessOk = compRes.lambda <= lambdaLim;

        if (util <= 0.95 && slendernessOk) {
          bestAngle = aKey;
          bestCap = cap;
          bestUtil = util;
          bestLambda = compRes.lambda;
          break;
        }
      }

      if (!gm_strut.pass || bestAngle !== curSec) {
        values.strutSection = bestAngle;
        if (!gm_strut.pass) {
          items.push({
            component: 'Vertical Struts',
            current: `Single ${curSec} (Cap: ${gm_strut.governingCapacity.toFixed(1)} kN, Util: ${(gm_strut.util * 100).toFixed(1)}%, λ: ${gm_strut.lambda.toFixed(1)})`,
            recommended: `Single ${bestAngle}`,
            optimumValue: bestAngle,
            field: 'strutSection',
            details: `Strut compression ${P_req.toFixed(1)} kN. Optimal Single ${bestAngle} provides capacity ${bestCap.toFixed(1)} kN (λ = ${bestLambda.toFixed(1)} ≤ 180).`
          });
        }
      }
    }

    // 1.4 Diagonals (Web Members)
    const diagMembers = (d.members || []).filter(m => m.role === 'diagonal');
    if (diagMembers.length) {
      const gm_diag = diagMembers.reduce((prev, curr) => curr.util > prev.util ? curr : prev, diagMembers[0]);
      const P_req = Math.abs(gm_diag.governingForce);
      const L_mm = gm_diag.length_m * 1000;
      const curSec = S.diagonalSection || S.section || 'ISA 50×50×6';

      let bestAngle = curSec;
      let bestCap = gm_diag.governingCapacity;
      let bestUtil = gm_diag.util;
      let bestLambda = gm_diag.lambda;

      for (const aKey of angleKeys) {
        const candidate = Standards.ANGLES[aKey];
        const At_cand = candidate.A;
        const rvv = candidate.rv || candidate.rmin || 10;
        const compRes = IS800.calcCompressionCapacity(At_cand, rvv, L_mm, 0.85, fy, E);
        const tensRes = IS800.calcTensionCapacity(At_cand, fy, fu);
        const cap = gm_diag.governingForce < 0 ? compRes.Pd : tensRes.Td;
        const util = P_req / Math.max(0.001, cap);
        let lambdaLim = 180;
        if (gm_diag.maxCompression <= 0.05) lambdaLim = 400;
        else if (gm_diag.isReversal) lambdaLim = 350;
        else if (gm_diag.governingLC.includes('WL') || gm_diag.governingLC.includes('Uplift')) lambdaLim = 250;
        const slendernessOk = compRes.lambda <= lambdaLim;

        if (util <= 0.95 && slendernessOk) {
          bestAngle = aKey;
          bestCap = cap;
          bestUtil = util;
          bestLambda = compRes.lambda;
          break;
        }
      }

      if (!gm_diag.pass || bestAngle !== curSec) {
        values.diagonalSection = bestAngle;
        if (!gm_diag.pass) {
          items.push({
            component: 'Diagonals',
            current: `Single ${curSec} (Cap: ${gm_diag.governingCapacity.toFixed(1)} kN, Util: ${(gm_diag.util * 100).toFixed(1)}%, λ: ${gm_diag.lambda.toFixed(1)})`,
            recommended: `Single ${bestAngle}`,
            optimumValue: bestAngle,
            field: 'diagonalSection',
            details: `Diagonal force ${P_req.toFixed(1)} kN. Optimal Single ${bestAngle} provides capacity ${bestCap.toFixed(1)} kN (λ = ${bestLambda.toFixed(1)} ≤ 180).`
          });
        }
      }
    }

    // 2. Optimum Purlin Sizing
    if (!d.purlin.pass) {
      const p = d.purlin;
      let bestPurlin = S.purlin;
      let bestPurlinSp = Number(S.purlinSpacing) || 1.4;
      let bestPurlinUtil = p.util;

      for (const chKey of channelKeys) {
        const pCheck = IS800.checkPurlin(
          chKey,
          d.spacing,
          bestPurlinSp,
          d.slopeDeg,
          d.loads.dl_kN_m2,
          d.loads.ll_kN_m2,
          Math.abs(d.loads.wind.p_net_suction),
          S.grade || 'E250'
        );
        if (pCheck.pass && pCheck.util <= 0.95) {
          bestPurlin = chKey;
          bestPurlinUtil = pCheck.util;
          break;
        }
      }

      // If still fails with largest channel, reduce purlin spacing
      if (bestPurlinUtil > 1.0) {
        bestPurlinSp = Math.max(0.8, Number((bestPurlinSp * 0.85).toFixed(2)));
        const pCheck = IS800.checkPurlin(
          bestPurlin,
          d.spacing,
          bestPurlinSp,
          d.slopeDeg,
          d.loads.dl_kN_m2,
          d.loads.ll_kN_m2,
          Math.abs(d.loads.wind.p_net_suction),
          S.grade || 'E250'
        );
        bestPurlinUtil = pCheck.util;
      }

      if (bestPurlin !== S.purlin || bestPurlinSp !== Number(S.purlinSpacing)) {
        values.purlin = bestPurlin;
        values.purlinSpacing = bestPurlinSp;
        items.push({
          component: 'Roof Purlin',
          current: `${S.purlin} @ ${Number(S.purlinSpacing).toFixed(2)} m (Util: ${(p.util * 100).toFixed(1)}%)`,
          recommended: `${bestPurlin} @ ${bestPurlinSp.toFixed(2)} m`,
          optimumValue: bestPurlin,
          field: 'purlin',
          details: `Biaxial bending ratio (${(p.interactionRatio * 100).toFixed(1)}%) or deflection (${p.delta.toFixed(1)} mm) exceeded. Optimal sizing achieves safe ${(bestPurlinUtil * 100).toFixed(1)}% utilization.`
        });
      }
    }

    // 3. Optimum Column Sizing
    if (!d.column.colPass) {
      const c = d.column;
      let bestCol = S.column;
      let bestColUtil = c.colUtil;
      let bestColCap = c.Pd;

      const candidates = [...channelKeys, ...beamKeys];
      for (const colKey of candidates) {
        const colCheck = IS800.checkLacedColumn(
          colKey,
          Number(S.height) || 12,
          c.demand,
          Number(S.K) || 1.0,
          Number(S.lacing) || 0.6,
          S.grade || 'E250'
        );
        if (colCheck.colPass && colCheck.colUtil <= 0.95) {
          bestCol = colKey;
          bestColUtil = colCheck.colUtil;
          bestColCap = colCheck.Pd;
          break;
        }
      }

      if (bestCol !== S.column) {
        values.column = bestCol;
        const isBm = Standards.BEAMS && Standards.BEAMS[bestCol];
        const isCurBm = Standards.BEAMS && Standards.BEAMS[S.column];
        const recLabel = isBm ? bestCol : `2 × ${bestCol}`;
        const curLabel = isCurBm ? S.column : `2 × ${S.column}`;
        items.push({
          component: isBm ? 'Rolled Column' : '2C Column',
          current: `${curLabel} (Cap: ${c.Pd.toFixed(1)} kN, Util: ${(c.colUtil * 100).toFixed(1)}%)`,
          recommended: recLabel,
          optimumValue: bestCol,
          field: 'column',
          details: `Column axial demand ${c.demand.toFixed(1)} kN exceeds capacity. Optimal ${recLabel} increases capacity to ${bestColCap.toFixed(1)} kN (Util: ${(bestColUtil * 100).toFixed(1)}%).`
        });
      }
    }

    // 4. Optimum Lacing Pitch
    if (!d.column.lacingPass) {
      const currentPitch = Number(S.lacing) || 0.6;
      let bestPitch = currentPitch;
      for (let p = currentPitch - 0.05; p >= 0.25; p -= 0.05) {
        const colCheck = IS800.checkLacedColumn(
          values.column || S.column,
          Number(S.height) || 12,
          d.column.demand,
          Number(S.K) || 1.0,
          p,
          S.grade || 'E250'
        );
        if (colCheck.lacingPass) {
          bestPitch = Number(p.toFixed(2));
          break;
        }
      }

      if (bestPitch < currentPitch) {
        values.lacing = bestPitch;
        items.push({
          component: 'Lacing Pitch',
          current: `${currentPitch.toFixed(2)} m (λ = ${d.column.lambda_lacing.toFixed(1)} > 145)`,
          recommended: `${bestPitch.toFixed(2)} m`,
          optimumValue: bestPitch,
          field: 'lacing',
          details: `Lacing flat slenderness or shear force exceeded limit. Reducing pitch to ${bestPitch.toFixed(2)} m brings slenderness within code limit 145.`
        });
      }
    }

    // 5. Optimum Connection Sizing
    if (!d.connection.pass) {
      if (d.connection.type === 'Welded') {
        const reqTotal = d.connection.reqWeldLength;
        const optWeldSide = Math.max(25, Math.ceil((reqTotal / 2) / 5) * 5);
        if (optWeldSide > Number(S.weldLength)) {
          values.weldLength = optWeldSide;
          items.push({
            component: 'Fillet Weld',
            current: `${S.weldLength} mm / side (Cap: ${d.connection.capacity.toFixed(1)} kN, Req: ${reqTotal.toFixed(1)} mm)`,
            recommended: `${optWeldSide} mm / side`,
            optimumValue: optWeldSide,
            field: 'weldLength',
            details: `Required total weld length is ${reqTotal.toFixed(1)} mm for governing force ${d.connection.demand.toFixed(1)} kN. Optimal length is ${optWeldSide} mm per side (${2 * optWeldSide} mm total).`
          });
        }
      } else {
        const nextBoltDia = Number(S.boltDia) < 20 ? 20 : 24;
        values.boltDia = nextBoltDia;
        items.push({
          component: 'Bolt Diameter',
          current: `M${S.boltDia} (Req: ${d.connection.numBolts} bolts)`,
          recommended: `M${nextBoltDia}`,
          optimumValue: nextBoltDia,
          field: 'boltDia',
          details: `Increases single shear bolt capacity to reduce required fastener count and gusset footprint.`
        });
      }
    }

    return { items, values };
  }

  const AnalysisModule = {
    runCompleteAnalysis,
    getRecommendationValues
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalysisModule;
  } else {
    root.AnalysisModule = AnalysisModule;
    root.stableAnalysis = () => runCompleteAnalysis(root.S);
    root.stableRecommendationValues = () => getRecommendationValues(runCompleteAnalysis(root.S), root.S);
  }
})(typeof window !== 'undefined' ? window : global);
