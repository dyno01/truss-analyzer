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
    // Sheet weight (GI: ~130-150 N/m^2, AC: ~160-180 N/m^2) along slope
    const sheetWeight_N_m2 = S.roof === 'AC' ? 170 : 130;
    const dl_sheet = sheetWeight_N_m2 / Math.max(Math.cos(slopeRad), 0.001); // projected to plan
    const dl_purlins = 100; // N/m^2 approx
    const dl_truss = (span / 3 + 5) * 10; // N/m^2 self weight empirical
    const dl_bracing = 15; // N/m^2
    const dl_kN_m2 = (dl_sheet + dl_purlins + dl_truss + dl_bracing) / 1000;

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

      // Member Capacities per IS 800:
      const tensionRes = IS800.calcTensionCapacity(At, fy, fu, 1.10, 1.25);
      const compRes = IS800.calcCompressionCapacity(At, rmin, L_mm, Number(S.K) || 1.0, fy, E);

      const utilTension = maxTension / Math.max(0.001, tensionRes.Td);
      const utilCompression = maxCompression / Math.max(0.001, compRes.Pd);

      const isGovernedByCompression = utilCompression >= utilTension;
      const governingUtil = Math.max(utilTension, utilCompression);
      const governingForce = isGovernedByCompression ? -maxCompression : maxTension;
      const governingLC = isGovernedByCompression ? governingLC_C : governingLC_T;
      const governingCapacity = isGovernedByCompression ? compRes.Pd : tensionRes.Td;

      // Slenderness check per IS 800 Table 3:
      // Limit: 180 for gravity compression, 250 for wind combo, 350 for reversal tie
      const isReversal = role === 'bottom_chord' && maxCompression > 0;
      const lambdaLimit = isReversal ? 350 : (governingLC.includes('WL') ? 250 : 180);
      const slendernessPass = compRes.lambda <= lambdaLimit;

      return {
        idx,
        nodes: [q[0], q[1]],
        role,
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
      grade
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
      grade
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
        label: `Truss members (${sec.A * 2} mm² ${angleKey})`,
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
    const values = {};
    const items = [];

    // 1. Optimum Truss Member Sizing
    if (!d.governingMember.pass) {
      const gm = d.governingMember;
      const P_req = Math.abs(gm.governingForce);
      const L_mm = gm.length_m * 1000;
      const K = Number(S.K) || 1.0;
      const fy = (Standards.STEEL_GRADES[S.grade || 'E250'] || {}).fy || 250;
      const fu = (Standards.STEEL_GRADES[S.grade || 'E250'] || {}).fu || 410;
      const E = (Standards.STEEL_GRADES[S.grade || 'E250'] || {}).E || 200000;

      let bestAngle = S.section;
      let bestCap = gm.governingCapacity;
      let bestUtil = gm.util;
      let bestLambda = gm.lambda;

      for (const aKey of angleKeys) {
        const candidate = Standards.ANGLES[aKey];
        const At_cand = 2 * candidate.A;
        const compRes = IS800.calcCompressionCapacity(At_cand, candidate.rmin, L_mm, K, fy, E);
        const tensRes = IS800.calcTensionCapacity(At_cand, fy, fu);
        const isComp = gm.governingForce < 0;
        const cap = isComp ? compRes.Pd : tensRes.Td;
        const util = P_req / Math.max(0.001, cap);
        const slendernessOk = compRes.lambda <= gm.lambdaLimit;

        if (util <= 0.95 && slendernessOk) {
          bestAngle = aKey;
          bestCap = cap;
          bestUtil = util;
          bestLambda = compRes.lambda;
          break;
        } else if (util < bestUtil) {
          bestAngle = aKey;
          bestCap = cap;
          bestUtil = util;
          bestLambda = compRes.lambda;
        }
      }

      if (bestAngle !== S.section) {
        values.section = bestAngle;
        items.push({
          component: 'Truss Member',
          current: `2 × ${S.section} (Cap: ${gm.governingCapacity.toFixed(1)} kN, Util: ${(gm.util * 100).toFixed(1)}%)`,
          recommended: `2 × ${bestAngle}`,
          optimumValue: bestAngle,
          field: 'section',
          details: `Governing member M${gm.idx + 1} (${gm.role}) carries ${P_req.toFixed(1)} kN. Optimal section gives capacity ${bestCap.toFixed(1)} kN with safe ${(bestUtil * 100).toFixed(1)}% utilization (λ = ${bestLambda.toFixed(1)} ≤ ${gm.lambdaLimit}).`
        });
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

      for (const chKey of channelKeys) {
        const colCheck = IS800.checkLacedColumn(
          chKey,
          Number(S.height) || 12,
          c.demand,
          Number(S.K) || 1.0,
          Number(S.lacing) || 0.6,
          S.grade || 'E250'
        );
        if (colCheck.colPass && colCheck.colUtil <= 0.95) {
          bestCol = chKey;
          bestColUtil = colCheck.colUtil;
          bestColCap = colCheck.Pd;
          break;
        }
      }

      if (bestCol !== S.column) {
        values.column = bestCol;
        items.push({
          component: '2C Column',
          current: `2 × ${S.column} (Cap: ${c.Pd.toFixed(1)} kN, Util: ${(c.colUtil * 100).toFixed(1)}%)`,
          recommended: `2 × ${bestCol}`,
          optimumValue: bestCol,
          field: 'column',
          details: `Column axial demand ${c.demand.toFixed(1)} kN exceeds laced capacity. Optimal 2 × ${bestCol} increases capacity to ${bestColCap.toFixed(1)} kN (Util: ${(bestColUtil * 100).toFixed(1)}%).`
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
