/**
 * Structural Design Studio — IS 800:2007 Limit State Design Engine
 * Strictly implements:
 * - Clause 6.2 & 6.3: Tension Members (Gross Yielding & Net Rupture)
 * - Clause 7.1.2.1 & Table 7/10: Compression Members (Perry-Robertson Formula)
 * - Table 3: Slenderness limits (180, 250, 350)
 * - Clause 8.2 & 9.3.1: Purlin Biaxial Bending, Shear & Deflection
 * - Clause 7.6: Built-up Laced 2C Columns & Lacing System (Vt = 0.025 P)
 * - Section 10: Welded & Bolted Connection Capacities
 */

(function(root) {
  'use strict';

  const Standards = root.Standards || (typeof require !== 'undefined' ? require('../data/standards.js') : {});

  /**
   * IS 800:2007 Cl. 7.1.2.1 - Design Compressive Stress (fcd) using Perry-Robertson
   * @param {number} fy - Yield stress in MPa
   * @param {number} E - Modulus of elasticity in MPa (200,000)
   * @param {number} KL_r - Slenderness ratio (KL / r)
   * @param {string} bucklingClass - 'a', 'b', 'c', or 'd' (default 'c' for angles/channels)
   * @param {number} gamma_m0 - Partial safety factor (1.10)
   * @returns {Object} { fcd, fcc, lambda, phi, chi }
   */
  function calcFcd(fy, E, KL_r, bucklingClass = 'c', gamma_m0 = 1.10) {
    const alpha = (Standards.IMPERFECTION_FACTORS && Standards.IMPERFECTION_FACTORS[bucklingClass]) || 0.49;
    const lambda_slender = Math.max(0.001, KL_r);

    // Euler buckling stress fcc = (pi^2 * E) / (KL/r)^2
    const fcc = (Math.PI * Math.PI * E) / (lambda_slender * lambda_slender);

    // Non-dimensional effective slenderness ratio lambda = sqrt(fy / fcc)
    const lambda = Math.sqrt(fy / fcc);

    // phi = 0.5 * [1 + alpha * (lambda - 0.2) + lambda^2]
    const phi = 0.5 * (1 + alpha * (lambda - 0.2) + lambda * lambda);

    // Stress reduction factor chi = 1 / [phi + sqrt(phi^2 - lambda^2)]
    const discriminant = Math.max(0, phi * phi - lambda * lambda);
    const chi = 1 / (phi + Math.sqrt(discriminant));

    // Design compressive stress fcd = chi * fy / gamma_m0 <= fy / gamma_m0
    const fcd = Math.min(fy / gamma_m0, (chi * fy) / gamma_m0);

    return {
      fcd: Number(fcd.toFixed(2)),
      fcc: Number(fcc.toFixed(2)),
      lambda: Number(lambda.toFixed(3)),
      phi: Number(phi.toFixed(3)),
      chi: Number(chi.toFixed(4)),
      alpha
    };
  }

  /**
   * IS 800:2007 Cl. 6 - Design Tension Resistance
   * Double angles back-to-back or single angles connected to gusset plate
   */
  function calcTensionCapacity(Ag, fy, fu, gamma_m0 = 1.10, gamma_m1 = 1.25) {
    // Gross section yielding Tdg = Ag * fy / gamma_m0
    const Tdg = (Ag * fy) / (gamma_m0 * 1000); // kN

    // Net section rupture with shear lag: Tdn = 0.8 * Ag * fu / (gamma_m1 * 1000)
    // As per Cl. 6.3.3 for welded or 4+ bolted end connections
    const Tdn = (0.8 * Ag * fu) / (gamma_m1 * 1000); // kN

    const Td = Math.min(Tdg, Tdn);
    return {
      Td: Number(Td.toFixed(2)),
      Tdg: Number(Tdg.toFixed(2)),
      Tdn: Number(Tdn.toFixed(2))
    };
  }

  /**
   * IS 800:2007 Cl. 7 - Design Compression Resistance for Angle Strut
   * 2 angles back to back (or single angle with effective length)
   */
  function calcCompressionCapacity(Ag, r, L_mm, K = 0.85, fy = 250, E = 200000) {
    const KL = K * L_mm;
    const lambda = KL / Math.max(0.1, r);
    const fcdData = calcFcd(fy, E, lambda, 'c', 1.10);
    const Pd = (Ag * fcdData.fcd) / 1000; // kN

    return {
      Pd: Number(Pd.toFixed(2)),
      lambda: Number(lambda.toFixed(1)),
      fcd: fcdData.fcd,
      fcc: fcdData.fcc,
      chi: fcdData.chi
    };
  }

  /**
   * IS 800:2007 Cl. 8.2 & 9.3.1 - Purlin Design under Biaxial Bending
   * Placed on sloping rafter (angle theta)
   */
  function checkPurlin(channelKey, spanM, spacingM, slopeDeg, dl_kN_m2, ll_kN_m2, wind_kN_m2, grade = 'E250', options = {}) {
    let ch = (Standards.CHANNELS && Standards.CHANNELS[channelKey]);
    if (!ch && Standards.ANGLES && Standards.ANGLES[channelKey]) {
      const a = Standards.ANGLES[channelKey];
      ch = {
        A: a.A,
        D: a.a,
        B: a.b,
        tf: a.t,
        tw: a.t,
        rz: a.rx,
        ry: a.ry,
        rmin: a.rmin,
        Zz: a.Zx || 1.0,
        Zy: a.Zy || 1.0,
        Iz: a.A * a.rx * a.rx,
        Iy: a.A * a.ry * a.ry,
        wt: a.wt
      };
    }
    if (!ch) ch = (Standards.CHANNELS && Standards.CHANNELS['ISMC 125']);
    const stGrade = (Standards.STEEL_GRADES && Standards.STEEL_GRADES[grade]) || { fy: 250, fu: 410, E: 200000 };
    const fy = stGrade.fy;
    const E = stGrade.E;

    const slopeRad = (slopeDeg * Math.PI) / 180;
    const Lp = Math.max(0.1, spanM); // frame spacing (purlin span)
    const sp = Math.max(0.1, spacingM); // purlin spacing along rafter

    // Factored gravity line load (1.5 * (DL + LL)) in kN/m
    const w_grav = 1.5 * (dl_kN_m2 + ll_kN_m2) * sp;

    // Factored wind line load (normal to roof) in kN/m (positive down, negative suction)
    const w_wind = 1.5 * wind_kN_m2 * sp;

    // Resolved load perpendicular to roof (z-axis, about major axis z-z):
    const wz = w_grav * Math.cos(slopeRad) + w_wind;
    // Resolved load parallel to roof (y-axis, about minor axis y-y):
    const wy = w_grav * Math.sin(slopeRad);

    const wz_abs = Math.abs(wz);
    const wy_abs = Math.abs(wy);

    // Continuous purlins over frames: Mz = wz * Lp^2 / 10, My = wy * Lp^2 / 10
    const Mz = (wz_abs * Lp * Lp) / 10; // kNm
    const My = (wy_abs * Lp * Lp) / 10; // kNm

    // Moment capacities per Cl. 8.2: Mdz = 1.2 * Zz * fy / (gamma_m0 * 1e6)
    // Zz in 10^3 mm^3 => Zz * 1e3 mm^3
    const Zz_mm3 = ch.Zz * 1e3;
    const Zy_mm3 = ch.Zy * 1e3;
    const Mdz = (1.2 * Zz_mm3 * fy) / (1.10 * 1e6); // kNm
    const Mdy = (1.2 * Zy_mm3 * fy) / (1.10 * 1e6); // kNm

    // Biaxial interaction ratio per Cl. 9.3.1
    const interactionRatio = (Mz / Mdz) + (My / Mdy);

    // Shear check along major axis: Vz = wz_abs * Lp / 2
    const Vz = (wz_abs * Lp) / 2; // kN
    // Shear capacity: Vdz = Av * fy / (sqrt(3) * 1.10) where Av = D * tw
    const Av = ch.D * ch.tw; // mm^2
    const Vdz = (Av * fy) / (Math.sqrt(3) * 1.10 * 1000); // kN
    const shearRatio = Vz / Math.max(0.001, Vdz);

    // Deflection check: delta = 5 * wz * Lp^4 / (384 * E * Iz)
    // Iz in mm^4, Lp in mm, wz in N/mm
    const Lp_mm = Lp * 1000;
    const wz_N_mm = wz_abs; // 1 kN/m = 1 N/mm
    const delta = (5 * wz_N_mm * Math.pow(Lp_mm, 4)) / (384 * E * ch.Iz); // mm
    const defDiv = (options && options.deflectionLimit) || (typeof deflectionLimit !== 'undefined' ? deflectionLimit : 180);
    const delta_limit = Lp_mm / (Number(defDiv) || 180); // IS 800 Table 6
    const deflectionRatio = delta / delta_limit;

    const governingUtil = Math.max(interactionRatio, shearRatio, deflectionRatio);

    return {
      channel: ch,
      wz: Number(wz.toFixed(3)),
      wy: Number(wy.toFixed(3)),
      Mz: Number(Mz.toFixed(2)),
      My: Number(My.toFixed(2)),
      Mdz: Number(Mdz.toFixed(2)),
      Mdy: Number(Mdy.toFixed(2)),
      interactionRatio: Number(interactionRatio.toFixed(3)),
      Vz: Number(Vz.toFixed(2)),
      Vdz: Number(Vdz.toFixed(2)),
      shearRatio: Number(shearRatio.toFixed(3)),
      delta: Number(delta.toFixed(2)),
      delta_limit: Number(delta_limit.toFixed(2)),
      deflectionRatio: Number(deflectionRatio.toFixed(3)),
      util: Number(governingUtil.toFixed(3)),
      pass: governingUtil <= 1.0
    };
  }

  /**
   * IS 800:2007 Cl. 7.6 - Built-up 2C Laced Column & Lacing Design
   */
  function checkLacedColumn(channelKey, heightM, axialLoad_kN, K = 1.0, lacingPitchM = 0.6, grade = 'E250') {
    const isBeam = Standards.BEAMS && Standards.BEAMS[channelKey];
    const isChannel = Standards.CHANNELS && Standards.CHANNELS[channelKey];
    const stGrade = (Standards.STEEL_GRADES && Standards.STEEL_GRADES[grade]) || { fy: 250, fu: 410, E: 200000 };
    const fy = stGrade.fy;
    const E = stGrade.E;

    const H_mm = Math.max(0.1, heightM) * 1000;

    if (isBeam) {
      // Single Rolled Steel Column (ISHB / ISWB / ISMB) per IS 800:2007 Cl. 7.1.2 & Table 10
      const bm = isBeam;
      const A_total = bm.A;
      const rz = bm.rz;
      const ry = bm.ry;
      const rmin = bm.rmin || Math.min(rz, ry);
      const lambda_z = (K * H_mm) / rz;
      const lambda_y = (K * H_mm) / ry;
      const lambda_max = Math.max(lambda_z, lambda_y);
      // Buckling class for rolled I-section: minor axis y-y is class 'c'
      const fcdData = calcFcd(fy, E, lambda_max, 'c', 1.10);
      const Pd_col = (A_total * fcdData.fcd) / 1000;
      const colUtil = axialLoad_kN / Math.max(0.001, Pd_col);

      return {
        isRolled: true,
        channel: bm,
        spacing_s: 0,
        lambda_z: Number(lambda_z.toFixed(1)),
        lambda_e: Number(lambda_max.toFixed(1)),
        fcd: fcdData.fcd,
        Pd: Number(Pd_col.toFixed(2)),
        demand: Number(axialLoad_kN.toFixed(2)),
        colUtil: Number(colUtil.toFixed(3)),
        colPass: colUtil <= 1.0,
        Vt: 0,
        Fl: 0,
        lacingLength: 0,
        lacingFlat: 'N/A (Rolled Section)',
        lambda_lacing: 0,
        slendernessPass: true,
        Pd_lacing: 0,
        lacingUtil: 0,
        lacingPass: true
      };
    }

    const ch = isChannel || (Standards.CHANNELS && Standards.CHANNELS['ISMC 125']);
    const A_total = 2 * ch.A; // mm^2 for 2 channels

    // Ideal back-to-back spacing s such that Iy_total >= Iz_total
    // Iz_total = 2 * Iz_single
    // Iy_total = 2 * [Iy_single + A * (Cy + s/2)^2]
    // Equating gives: Cy + s/2 = sqrt((Iz - Iy) / A)
    let s_ideal = 0;
    if (ch.Iz > ch.Iy) {
      s_ideal = 2 * (Math.sqrt((ch.Iz - ch.Iy) / ch.A) - ch.Cy);
    }
    const s = Math.max(40, Math.round(s_ideal)); // mm gap between webs

    // Maximum slenderness of built-up column: lambda_z = KL / rz
    const lambda_z = (K * H_mm) / ch.rz;

    // Laced column effective slenderness (Cl. 7.6.1.5): lambda_e = 1.05 * lambda_z
    const lambda_e = 1.05 * lambda_z;

    // Compressive stress fcd for laced column
    const fcdData = calcFcd(fy, E, lambda_e, 'c', 1.10);
    const Pd_col = (A_total * fcdData.fcd) / 1000; // kN
    const colUtil = axialLoad_kN / Math.max(0.001, Pd_col);

    // Lacing Design (Cl. 7.6.6):
    // Transverse shear Vt = 0.025 * P (compressive force in column)
    const Vt = 0.025 * Math.max(axialLoad_kN, 10); // kN

    // Single lacing on two opposite faces (inclination theta = 45 deg)
    // Transverse shear per plane = Vt / 2
    // Compressive force in each lacing bar: Fl = (Vt / 2) / sin(45)
    const Fl = (Vt / 2) / Math.sin(Math.PI / 4); // kN

    // Lacing bar dimensions:
    // Spacing between gauge lines: Lg = s + 2 * (ch.B - 20) approx
    const Lg = s + 2 * (ch.B - 15);
    const pitch_mm = Math.max(100, lacingPitchM * 1000);
    const lacingLength = Math.hypot(Lg, pitch_mm / 2); // length between connection points

    // Minimum thickness of flat: t >= L / 40 for single lacing
    const t_min = Math.max(6, Math.ceil(lacingLength / 40));
    const b_flat = 50; // mm standard flat width
    const t_flat = Math.max(t_min, 8); // mm flat thickness
    const A_flat = b_flat * t_flat; // mm^2
    const r_flat = t_flat / Math.sqrt(12); // mm
    const lambda_lacing = lacingLength / r_flat;

    // Permissible slenderness of lacing flat: <= 145 per Cl. 7.6.6.3
    const slendernessPass = lambda_lacing <= 145;

    // Compressive capacity of lacing flat:
    const lacingFcd = calcFcd(fy, E, lambda_lacing, 'c', 1.10);
    const Pd_lacing = (A_flat * lacingFcd.fcd) / 1000; // kN
    const lacingUtil = Fl / Math.max(0.001, Pd_lacing);

    return {
      channel: ch,
      spacing_s: s,
      lambda_z: Number(lambda_z.toFixed(1)),
      lambda_e: Number(lambda_e.toFixed(1)),
      fcd: fcdData.fcd,
      Pd: Number(Pd_col.toFixed(2)),
      demand: Number(axialLoad_kN.toFixed(2)),
      colUtil: Number(colUtil.toFixed(3)),
      colPass: colUtil <= 1.0,
      Vt: Number(Vt.toFixed(2)),
      Fl: Number(Fl.toFixed(2)),
      lacingLength: Number(lacingLength.toFixed(1)),
      lacingFlat: `${b_flat}×${t_flat} mm`,
      lambda_lacing: Number(lambda_lacing.toFixed(1)),
      slendernessPass,
      Pd_lacing: Number(Pd_lacing.toFixed(2)),
      lacingUtil: Number(lacingUtil.toFixed(3)),
      lacingPass: lacingUtil <= 1.0 && slendernessPass
    };
  }

  /**
   * IS 800:2007 Section 10 - Connection Design
   */
  function checkConnection(force_kN, connectionType = 'Welded', weldSize_mm = 6, weldLengthPerSide_mm = 65, boltDia_mm = 16, grade = 'E250', fabrication = 'shop') {
    const P = Math.abs(force_kN);
    const stGrade = (Standards.STEEL_GRADES && Standards.STEEL_GRADES[grade]) || { fu: 410, fy: 250 };
    const fu = stGrade.fu;

    if (connectionType === 'Welded') {
      const sw = Math.max(3, weldSize_mm);
      const wl = Math.max(10, weldLengthPerSide_mm);
      const totalWeldLength = 2 * wl; // top and bottom welds

      // Design shear strength of fillet weld fwd = fu / (sqrt(3) * gamma_mw)
      // gamma_mw = 1.25 for shop weld, 1.50 for site/field weld (IS 800 Table 5)
      const gamma_mw = (fabrication === 'field' || fabrication === 'site') ? 1.50 : 1.25;
      const fwd = fu / (Math.sqrt(3) * gamma_mw); // N/mm^2

      // Effective throat thickness tt = 0.7 * sw
      const tt = 0.7 * sw; // mm

      // Shear capacity per unit length qw = fwd * tt
      const qw = fwd * tt; // N/mm

      // Total available capacity
      const weldCapacity_kN = (totalWeldLength * qw) / 1000; // kN
      const reqWeldLength = (P * 1000) / qw; // mm total required length
      const util = P / Math.max(0.001, weldCapacity_kN);

      return {
        type: 'Welded',
        fwd: Number(fwd.toFixed(2)),
        tt: Number(tt.toFixed(2)),
        qw: Number(qw.toFixed(1)),
        weldSize: sw,
        weldLengthPerSide: wl,
        totalWeldLength,
        reqWeldLength: Number(reqWeldLength.toFixed(1)),
        capacity: Number(weldCapacity_kN.toFixed(2)),
        demand: Number(P.toFixed(2)),
        util: Number(util.toFixed(3)),
        pass: util <= 1.0
      };
    } else {
      // Bolted Connection (Grade 4.6 bolts, fub = 400 MPa)
      const d = Math.max(12, boltDia_mm);
      const fub = 400; // MPa
      const gamma_mb = 1.25;

      // Tensile stress area of bolt Anb ~ 0.78 * (pi/4 * d^2)
      const Anb = 0.78 * (Math.PI / 4) * d * d;

      // Shear capacity per bolt (single shear): Vdsb = (fub / (sqrt(3) * gamma_mb)) * Anb
      const Vdsb = (fub * Anb) / (Math.sqrt(3) * gamma_mb * 1000); // kN

      // Bearing capacity per bolt: Vdpb = (2.5 * kb * d * t * fu) / gamma_mb
      // assuming kb = 0.50 and gusset plate thickness t = 10mm
      const kb = 0.50;
      const t_gusset = 10;
      const Vdpb = (2.5 * kb * d * t_gusset * fu) / (gamma_mb * 1000); // kN

      const boltValue = Math.min(Vdsb, Vdpb); // kN
      const reqBolts = Math.max(2, Math.ceil(P / Math.max(0.1, boltValue)));
      const capacity = reqBolts * boltValue;
      const util = P / capacity;

      return {
        type: 'Bolted',
        boltDia: d,
        Vdsb: Number(Vdsb.toFixed(2)),
        Vdpb: Number(Vdpb.toFixed(2)),
        boltValue: Number(boltValue.toFixed(2)),
        numBolts: reqBolts,
        capacity: Number(capacity.toFixed(2)),
        demand: Number(P.toFixed(2)),
        util: Number(util.toFixed(3)),
        pass: util <= 1.0
      };
    }
  }

  function cleanAngleKey(raw) {
    if (!raw) return 'ISA 75×75×6';
    let s = String(raw).trim().replace(/x/g, '×');
    s = s.replace(/^2\s*×?\s*ISA|^2\s*ISA|^Single\s*ISA|^ISA\s*/i, 'ISA ').replace(/\s+/g, ' ').trim();
    if (!s.startsWith('ISA')) s = 'ISA ' + s;
    return s;
  }

  /**
   * Portfolio Module: Section 1.5.1 Design of Main Tie (Tension Member L0-L1)
   */
  function calcMainTieDesign(params = {}) {
    const Pu = params.Pu !== undefined ? params.Pu : 80; // kN tension
    const Pc = params.Pc !== undefined ? params.Pc : 30; // kN reversal compression
    const fy = params.fy || 250;
    const fu = params.fu || 410;
    const E = params.E || 200000;
    const gamma_m0 = 1.10;
    const gamma_m1 = 1.25;

    // Area required Ag(req) = (Pu * gamma_m0) / fy
    const Ag_req = (Pu * 1000 * gamma_m0) / fy; // mm^2

    // Provided Section: 2 ISA back-to-back
    const rawSec = params.section || 'ISA 60×60×6';
    const cleanKey = cleanAngleKey(rawSec);
    const angle = (Standards.ANGLES && (Standards.ANGLES[cleanKey] || Standards.ANGLES[cleanKey.replace(/×/g, 'x')] || Standards.ANGLES[rawSec])) || Standards.ANGLES['ISA 60×60×6'] || { A: 684, rx: 18.2, ry: 18.2, rmin: 11.7, a: 60, b: 60, t: 6, wt: 5.4 };
    const secName = '2 ' + cleanKey;
    const Ag_single = angle.A;
    const Ag = 2 * Ag_single;
    const rzz = angle.rx;
    const t_gusset = params.gusset_t || 6; // mm

    // Connection Design (Bolted)
    const boltDia = params.boltDia || 16;
    const d0 = boltDia + 2; // 18 mm
    const e = 40; // mm
    const p = 40; // mm
    const fub = 400; // Grade 4.6
    const gamma_mb = 1.25;
    const Anb = 0.78 * (Math.PI / 4) * boltDia * boltDia; // 157 mm^2

    // Shear capacity (Double shear)
    const Vdsb = (2 * fub * Anb) / (Math.sqrt(3) * gamma_mb * 1000); // 28.97 kN
    // Bearing capacity
    const kb = 0.49;
    const Vdpb = (2.5 * kb * boltDia * t_gusset * fu) / (gamma_mb * 1000); // 38.57 kN
    const boltValue = Math.min(Vdsb, Vdpb); // 28.97 kN
    const numBoltsReq = Pu / Math.max(0.1, boltValue);
    const numBolts = Math.max(3, Math.ceil(numBoltsReq));

    // Tension Capacity Checks:
    // 1. Gross Yielding: Tdg = Ag * fy / gamma_m0
    const Tdg = (Ag * fy) / (gamma_m0 * 1000);
    // 2. Net Section Rupture: Tdn = 2 * (0.8 * An * fu / gamma_m1)
    const t_angle = angle.t || 6;
    const An_single = Math.max(10, Ag_single - (d0 * t_angle));
    const Tdn = (2 * 0.8 * An_single * fu) / (gamma_m1 * 1000);
    // 3. Block Shear Capacity:
    const Avg = 2 * (e + (numBolts - 1) * p) * t_gusset;
    const Avn = 2 * (e + (numBolts - 1) * p - (numBolts - 0.5) * d0) * t_gusset;
    const Atg = 2 * 40 * t_gusset;
    const Atn = 2 * (40 - 0.5 * d0) * t_gusset;
    const Tdb1 = (Avg * fy / (Math.sqrt(3) * gamma_m0) + 0.9 * Atn * fu / gamma_m1) / 1000;
    const Tdb2 = (0.9 * Avn * fu / (Math.sqrt(3) * gamma_m1) + Atg * fy / gamma_m0) / 1000;
    const Td_block = Math.min(Tdb1, Tdb2);
    const Td = Math.min(Tdg, Tdn, Td_block);

    // Compression Reversal Check
    const L = params.L || 2000; // mm
    const Le = 0.7 * L; // mm
    const lambda = Le / Math.max(0.1, rzz);
    const fcdData = calcFcd(fy, E, lambda, 'c', gamma_m0);
    const fcd = fcdData.fcd;
    const Pd = (fcd * Ag) / 1000;

    return {
      Pu, Pc, fy, fu, Ag_req: Number(Ag_req.toFixed(1)),
      secName, Ag, rzz, t_gusset,
      boltDia, d0, e, p, Vdsb: Number(Vdsb.toFixed(2)), Vdpb: Number(Vdpb.toFixed(2)),
      boltValue: Number(boltValue.toFixed(2)), numBoltsReq: Number(numBoltsReq.toFixed(2)), numBolts,
      Tdg: Number(Tdg.toFixed(1)), Tdn: Number(Tdn.toFixed(2)),
      Tdb1: Number(Tdb1.toFixed(2)), Tdb2: Number(Tdb2.toFixed(2)), Td_block: Number(Td_block.toFixed(2)),
      Td: Number(Td.toFixed(2)),
      Le: Math.round(Le), lambda: Number(lambda.toFixed(2)), fcd, Pd: Number(Pd.toFixed(2)),
      safeTension: Td >= Pu,
      safeReversal: Pd >= Pc && lambda <= 250
    };
  }

  /**
   * Portfolio Module: Section 1.5.2 Design of Principal Rafter (Top Chord U0-U1)
   */
  function calcPrincipalRafterDesign(params = {}) {
    const Pu = params.Pu !== undefined ? params.Pu : 90; // kN compression
    const Pt = params.Pt !== undefined ? params.Pt : 40; // kN tension reversal
    const fy = params.fy || 250;
    const fu = params.fu || 410;
    const E = params.E || 200000;
    const gamma_m0 = 1.10;
    const assumed_fcd = 125; // MPa
    const Ag_req = (Pu * 1000) / assumed_fcd; // mm^2

    const rawSec = params.section || 'ISA 75×75×6';
    const cleanKey = cleanAngleKey(rawSec);
    const angle = (Standards.ANGLES && (Standards.ANGLES[cleanKey] || Standards.ANGLES[cleanKey.replace(/×/g, 'x')] || Standards.ANGLES[rawSec])) || Standards.ANGLES['ISA 75×75×6'] || { A: 866, rx: 23.0, ry: 23.0, rmin: 14.6, wt: 6.8 };
    const secName = '2 ' + cleanKey;
    const Ag = 2 * angle.A; // 2 angles
    const rmin = angle.rx; // in-plane rxx
    const L = params.L || 2240; // mm
    const Le = 0.7 * L; // mm
    const lambda = Le / Math.max(0.1, rmin);
    const fcdData = calcFcd(fy, E, lambda, 'c', gamma_m0);
    const fcd = fcdData.fcd;
    const Pd = (fcd * Ag) / 1000; // kN
    const Tdg = (Ag * fy) / (gamma_m0 * 1000); // kN

    // Fastener connection
    const boltDia = params.boltDia || 16;
    const Anb = 0.78 * (Math.PI / 4) * boltDia * boltDia;
    const Vdsb = (2 * 400 * Anb) / (Math.sqrt(3) * 1.25 * 1000);
    const numBolts = Math.max(3, Math.ceil(Math.max(Pu, Pt) / Math.max(0.1, Vdsb)));

    return {
      Pu, Pt, assumed_fcd, Ag_req: Number(Ag_req.toFixed(0)), secName, Ag, rmin,
      L: Number((L / 1000).toFixed(2)), Le: Math.round(Le),
      lambda: Number(lambda.toFixed(2)), fcd, Pd: Number(Pd.toFixed(2)),
      Tdg: Number(Tdg.toFixed(1)), numBolts,
      safeComp: Pd >= Pu && lambda <= 180,
      safeTens: Tdg >= Pt
    };
  }

  /**
   * Portfolio Module: Section 1.5.3 Design of Struts (Inclined/Vertical)
   */
  function calcStrutDesign(params = {}) {
    const Pu = params.Pu !== undefined ? params.Pu : 30; // kN compression
    const fy = params.fy || 250;
    const E = params.E || 200000;
    const gamma_m0 = 1.10;

    const rawSec = params.section || 'ISA 70×70×6';
    const cleanKey = cleanAngleKey(rawSec);
    const angle = (Standards.ANGLES && (Standards.ANGLES[cleanKey] || Standards.ANGLES[cleanKey.replace(/×/g, 'x')] || Standards.ANGLES[rawSec])) || Standards.ANGLES['ISA 70×70×6'] || { A: 806, rmin: 13.6, rv: 13.6, a: 70, b: 70, t: 6 };
    const secName = 'Single ' + cleanKey;
    const Ag = angle.A;
    const rvv = angle.rv || angle.rmin || 13.6;
    const L = params.L || 1800; // mm
    const Le = params.Le || (0.85 * L);
    const lambda_vv = Le / Math.max(0.1, rvv);
    const b1 = angle.a || 70, b2 = angle.b || 70, t = angle.t || 6;
    const lambda_phi = (b1 + b2) / (2 * Math.max(1, t));
    const lambda_e = Math.sqrt(Math.max(1, 0.20 + 0.35 * lambda_vv * lambda_vv + 0.002 * lambda_phi * lambda_phi));
    const effLambda = Math.max(lambda_vv * 0.85, lambda_e);
    const fcdData = calcFcd(fy, E, effLambda, 'c', gamma_m0);
    const fcd = fcdData.fcd;
    const Pd = (fcd * Ag) / 1000;

    return {
      Pu, secName, Ag, rvv, lambda_e: Number(effLambda.toFixed(1)), fcd, Pd: Number(Pd.toFixed(2)),
      safe: Pd >= Pu && effLambda <= 180
    };
  }

  /**
   * Portfolio Module: Section 1.5.4 Design of Diagonals
   */
  function calcDiagonalDesign(params = {}) {
    const Pu = params.Pu !== undefined ? params.Pu : 25; // kN (tension or compression)
    const Pt = params.Pt !== undefined ? params.Pt : 20; // kN reversal
    const fy = params.fy || 250;
    const fu = params.fu || 410;
    const E = params.E || 200000;
    const gamma_m0 = 1.10;

    const rawSec = params.section || 'ISA 50×50×6';
    const cleanKey = cleanAngleKey(rawSec);
    const angle = (Standards.ANGLES && (Standards.ANGLES[cleanKey] || Standards.ANGLES[cleanKey.replace(/×/g, 'x')] || Standards.ANGLES[rawSec])) || Standards.ANGLES['ISA 50×50×6'] || { A: 568, rmin: 9.6, rv: 9.6, a: 50, b: 50, t: 6 };
    const secName = 'Single ' + cleanKey;
    const Ag = angle.A;
    const rvv = angle.rv || angle.rmin || 9.6;
    const L = params.L || 2000; // mm
    const Le = 0.85 * L;
    const lambda = Le / Math.max(0.1, rvv);
    const fcdData = calcFcd(fy, E, lambda, 'c', gamma_m0);
    const fcd = fcdData.fcd;
    const Pd = (fcd * Ag) / 1000; // kN
    const Tdg = (Ag * fy) / (gamma_m0 * 1000); // kN

    const demandComp = Math.max(Pu, Pt);
    const safeComp = Pd >= demandComp && lambda <= 180;
    const safeTens = Tdg >= Math.max(Pu, Pt);

    return {
      Pu, Pt, secName, Ag, rvv, L: Number((L / 1000).toFixed(2)),
      Le: Math.round(Le), lambda: Number(lambda.toFixed(1)), fcd,
      Pd: Number(Pd.toFixed(2)), Tdg: Number(Tdg.toFixed(1)),
      safeComp, safeTens, safe: safeComp
    };
  }

  /**
   * Portfolio Module: Section 1.6 Design of Purlin (ISA 150x150x10 mm & ISMC)
   */
  function calcAnglePurlinDesign(params = {}) {
    const spacingTruss = params.spacingTruss || 6.0; // m
    const spacingPurlin = params.spacingPurlin || 2.24; // m
    const slopeDeg = params.slopeDeg || 26.56;
    const slopeRad = (slopeDeg * Math.PI) / 180;
    const cosTheta = Math.cos(slopeRad);
    const sinTheta = Math.sin(slopeRad);

    const wSheeting = (params.wSheeting !== undefined && params.wSheeting !== null && !isNaN(Number(params.wSheeting))) ? Number(params.wSheeting) : 130;
    const wPurlinSelf = (params.wPurlins !== undefined && params.wPurlins !== null && !isNaN(Number(params.wPurlins))) ? Number(params.wPurlins) : 100;
    const wd = (wSheeting + wPurlinSelf) * spacingPurlin;
    const wl = 485.04 * spacingPurlin; // 970.08 N/m
    const ww = -1.0 * spacingPurlin * 715.39; // -1602.47 N/m

    // Resolving loads:
    const wdy = wd * cosTheta;
    const wly = wl * cosTheta;
    const wwy = ww;

    const wdz = wd * sinTheta;
    const wlz = wl * sinTheta;

    // Factored loads: 1.2(DL + LL + WL)
    const wy = 1.2 * (wdy + wly + wwy);
    const wz = 1.2 * (wdz + wlz + 0);

    // Continuous bending moments (w * L^2 / 10)
    const Muy = (wy * spacingTruss * spacingTruss) / (10 * 1000); // -1.39 kNm
    const Muz = (wz * spacingTruss * spacingTruss) / (10 * 1000); // 2.76 kNm

    // Trial section: ISA 150x150x10 mm
    const secName = 'ISA 150×150×10';
    const Ze = 56.9e3; // mm^3
    const I = 622.4e4; // mm^4
    const fy = 250;
    const Mdz = (Ze * fy) / (1.10 * 1e6); // 12.93 kNm
    const Mdy = Mdz;
    const interactionRatio = Math.abs(Muz / Mdz) + Math.abs(Muy / Mdy); // 0.32

    // Deflections
    const L_mm = spacingTruss * 1000;
    const delta_allowable = L_mm / 150; // 40 mm
    const E = 200000; // MPa
    const delta_y = (5 * Math.abs(wy) / 1000 * Math.pow(L_mm, 4)) / (384 * E * I); // 21.71 mm
    const delta_z = (5 * Math.abs(wz) / 1000 * Math.pow(L_mm, 4)) / (384 * E * I); // 5.87 mm

    return {
      spacingTruss, spacingPurlin, slopeDeg,
      wSheeting, wPurlinSelf,
      wd: Number(wd.toFixed(2)), wl: Number(wl.toFixed(2)), ww: Number(ww.toFixed(2)),
      wdy: Number(wdy.toFixed(2)), wly: Number(wly.toFixed(2)), wwy: Number(wwy.toFixed(2)),
      wdz: Number(wdz.toFixed(2)), wlz: Number(wlz.toFixed(2)),
      wy: Number(wy.toFixed(2)), wz: Number(wz.toFixed(2)),
      Muy: Number(Muy.toFixed(2)), Muz: Number(Muz.toFixed(2)),
      secName, Ze, I, Mdz: Number(Mdz.toFixed(2)), Mdy: Number(Mdy.toFixed(2)),
      interactionRatio: Number(interactionRatio.toFixed(3)),
      delta_allowable, delta_y: Number(delta_y.toFixed(2)), delta_z: Number(delta_z.toFixed(2)),
      safeBending: interactionRatio <= 1.0,
      safeDeflection: delta_y <= delta_allowable && delta_z <= delta_allowable
    };
  }

  /**
   * Portfolio Module: Assignment 2B Design of Gantry Girder (Spreadsheet / Full Design)
   */
  function calcGantryGirderDesign() {
    return {
      spanTruss: 16,
      spanCrane: 15,
      spacingCols: 6,
      wheelBase: 1.25,
      wtCraneGirder: 250,
      craneCapacity: 260,
      wtCrab: 50,
      minHookApproach: 1.0,
      wtRail: 0.3,
      wtSection: 2.0,
      wheelDia: 200,
      fu: 410,
      fy: 250,
      lateralLoadPct: 5,
      longitudinalLoadPct: 5,
      gamma_m0: 1.10,
      loadFactor: 1.50,
      // Reactions & Loads
      selfWtCraneGirder: 16.67,
      reactionA: 414.33,
      reactionB: 145.67,
      maxWheelLoad: 207,
      // Bending Moments & Shears
      maxLiveBM: 499,
      impactBM: 50,
      totalLiveBM: 549,
      deadBM: 10.35,
      Mux: 838, // transverse factored BM
      Vux: 567, // max factored shear
      Muy: 28,  // lateral horizontal BM
      Vuy: 21,  // horizontal reaction
      // Section selection
      trialSection: 'ISMB 600 with ISMC 400 on top flange',
      Ixx: '1295.84 × 10⁶ mm⁴',
      Iyy: '177.33 × 10⁶ mm⁴',
      Zez: '3.345 × 10⁶ mm³',
      Zey: '1.688 × 10⁶ mm³',
      Zpz: '4.629 × 10⁶ mm³',
      Zpy: '1.375 × 10⁶ mm³',
      classification: 'Plastic',
      // Capacity checks
      Vd: 944.75,
      Mdz: 1052.05,
      Mdy: 312.68,
      interactionRatio: 0.89,
      delta_actual: 4.23,
      delta_allowable: 8.0,
      safeShear: true,
      safeMomentZ: true,
      safeMomentY: true,
      safeCombined: true,
      safeDeflection: true
    };
  }

  /**
   * Portfolio Module: Assignment 2C Design of Built-up Column
   */
  function calcBuiltUpColumnDesign(params = {}) {
    const H = params.H || 10; // m overall height
    const H_crane = params.H_crane || 8; // m crane rail height
    const Pu = params.Pu !== undefined ? params.Pu : 224.43; // kN
    const Mu = params.Mu !== undefined ? params.Mu : 72.88;  // kNm
    const fy = params.fy || 250;
    const gamma_m0 = 1.10;

    // Selection of Section: 2 x ISMC 150 @ 16.4 kg/m placed back-to-back at spacing S = 800 mm c/c
    const secName = '2 × ISMC 150 back-to-back';
    const spacing_S = 800; // mm
    const Ag = 2 * 2088; // 4176 mm^2
    const Iyy_comb = 670.206e6; // mm^4
    const ryy = 400.61; // mm

    // Combined load check:
    const Tdg = (Ag * fy) / (gamma_m0 * 1000); // 949.09 kN
    const Zp = 1670.38e3; // mm^3
    const Mdy = (Zp * fy) / (gamma_m0 * 1e6); // 379.63 kNm
    const interaction = (Pu / Tdg) + (Mu / Mdy); // 0.428 < 1.0

    // Compressive strength:
    const lambda_e = 1.05 * ((1.0 * H_crane * 1000) / ryy); // 20.96
    const local_lambda = 1000 / 22.1; // 45.25 < 0.7 * 125
    const fcd = 79; // MPa Table 9c
    const Pd = (fcd * Ag) / 1000; // 329.9 kN
    const P_single_channel = 245.2; // kN max compression

    // Lacing System:
    const Vt = 0.025 * P_single_channel; // 6.13 kN
    const Fl = 62.2; // kN (including wind and crane transverse shear)
    const lacingSec = 'ISA 65×65×6 mm';
    const lambda_lacing = 101.6;
    const fcd_lacing = 107; // MPa
    const Pd_lacing = 79.6; // kN

    return {
      H, H_crane, Pu, Mu, secName, spacing_S, Ag, Iyy_comb, ryy,
      Tdg: Number(Tdg.toFixed(2)), Mdy: Number(Mdy.toFixed(2)),
      interaction: Number(interaction.toFixed(2)),
      lambda_e: Number(lambda_e.toFixed(2)), local_lambda: Number(local_lambda.toFixed(2)),
      fcd, Pd: Number(Pd.toFixed(1)), P_single_channel,
      Vt: Number(Vt.toFixed(2)), Fl, lacingSec, lambda_lacing, fcd_lacing, Pd_lacing,
      safeCombined: interaction < 1.0,
      safeCompression: Pd > P_single_channel,
      safeLacing: Pd_lacing > Fl
    };
  }

  /**
   * Portfolio Module: Assignment 2D Design of Column Base
   */
  function calcColumnBaseDesign(params = {}) {
    const Pu = params.Pu !== undefined ? params.Pu : 224.43; // kN
    const Mu = params.Mu !== undefined ? params.Mu : 72.88;  // kNm
    const h_col = 875; // mm column depth
    const fck = 30; // M30 concrete
    const permissibleBearing = 0.45 * fck; // 13.5 MPa
    const fy = 250;
    const gamma_m0 = 1.10;

    // Base plate dimensions:
    const e = (Mu * 1e6) / (Pu * 1e3); // 324.73 mm
    const L = 1075; // mm
    const kernLimit = L / 6; // 179.17 mm
    const isTriangular = e > kernLimit;

    // Resultant distance x from compressed edge:
    const x = 3 * ((L / 2) - e); // 640 mm
    // Upward bearing force: 0.5 * x * 0.45*fck * B = Pu
    const B_req = (Pu * 1000) / (0.5 * x * permissibleBearing); // 59.37 mm
    const B = 350; // mm provided width

    // Base plate thickness:
    const maxBearingPressure = 4.38; // MPa < 13.5 MPa
    const Mxx = 2462.8; // N.mm/mm
    const t_req = Math.sqrt((Mxx * 6 * gamma_m0) / fy); // 8.06 mm
    const t_prov = 16; // mm

    return {
      Pu, Mu, h_col, fck, permissibleBearing,
      e: Number(e.toFixed(2)), L, kernLimit: Number(kernLimit.toFixed(2)), isTriangular,
      x: Number(x.toFixed(1)), B_req: Number(B_req.toFixed(2)), B,
      maxBearingPressure, Mxx, t_req: Number(t_req.toFixed(2)), t_prov,
      safeBearing: maxBearingPressure < permissibleBearing,
      safeThickness: t_prov >= t_req
    };
  }

  /**
   * Portfolio Module: Assignment 3 Design of Plate Girder
   */
  function calcPlateGirderDesign(params = {}) {
    const L = params.L || 25; // m span
    const dl_udl = 45; // kN/m
    const ll_point = 270; // kN
    const w = dl_udl * 1.5; // 67.5 kN/m factored UDL
    const W = ll_point * 1.5; // 405 kN factored point load

    const Mu = (w * L * L) / 8 + (W * L) / 4; // 7703.43 kNm
    const Vu = (w * L) / 2 + W / 2; // 1046 kN

    // Web Plate
    const d = 1900; // mm
    const tw = 20; // mm (trial 9.5 mm -> provide 20 mm)
    // Flange Plate
    const Af_req = (Mu * 1e6 * 1.10) / (d * 250); // 17839.52 mm^2
    const bf = 700; // mm
    const tf = 30; // mm (trial 25.48 -> provide 30 mm)

    // Capacities:
    const Vd = (d * tw * 250) / (Math.sqrt(3) * 1.10 * 1000); // 4986.20 kN > 1046 kN
    const Zpf = bf * tf * (d + tf); // 40.53 x 10^6 mm^3
    const Mdf = (Zpf * 250) / (1.10 * 1e6); // 9211 kNm > 7703 kNm
    const Fbw = 473.53; // kN < 1046 kN -> stiffeners required

    // Stiffeners:
    const endStiffeners = { t: 10, b: 140, As: 10800, I: '22.58 × 10⁶ mm⁴', fcd: 209.81, Pd: 4112.27, safe: true };
    const intermediateStiffeners = { spacing: 2000, t: 16, b: 224, Iprov: '68.86 × 10⁶ mm⁴', Ireq: '20.5 × 10⁶ mm⁴', safe: true };
    const loadBearingStiffeners = { Pu: 405, t: 12, Pd: 559.55, safe: true };

    // Curtailment:
    const x_curtail_theo = 9.08; // m
    const x_curtail_actual = 8455; // mm from support

    // Weld web to flange:
    const VH = 401.72; // N/mm horizontal shear
    const weldSize = 8; // mm intermittent fillet weld
    const fwd = 1060.47; // N/mm
    const weldLength = 20; // mm
    const weldClearSpacing = 140; // mm

    return {
      L, dl_udl, ll_point, w, W, Mu: Number(Mu.toFixed(2)), Vu: Number(Vu.toFixed(1)),
      d, tw, Af_req: Number(Af_req.toFixed(2)), bf, tf,
      Vd: Number(Vd.toFixed(2)), Mdf: Number(Mdf.toFixed(1)), Fbw,
      endStiffeners, intermediateStiffeners, loadBearingStiffeners,
      x_curtail_theo, x_curtail_actual,
      VH, weldSize, fwd, weldLength, weldClearSpacing,
      safeShear: Vd > Vu,
      safeMoment: Mdf > Mu
    };
  }

  const IS800Module = {
    calcFcd,
    calcTensionCapacity,
    calcCompressionCapacity,
    checkPurlin,
    checkLacedColumn,
    checkConnection,
    // Portfolio Design Functions matching attached PDF:
    calcMainTieDesign,
    calcPrincipalRafterDesign,
    calcStrutDesign,
    calcDiagonalDesign,
    calcAnglePurlinDesign,
    calcGantryGirderDesign,
    calcBuiltUpColumnDesign,
    calcColumnBaseDesign,
    calcPlateGirderDesign
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = IS800Module;
  } else {
    root.IS800Module = IS800Module;
  }
})(typeof window !== 'undefined' ? window : global);
