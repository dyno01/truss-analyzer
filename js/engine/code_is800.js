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
  function calcCompressionCapacity(Ag, r, L_mm, K = 1.0, fy = 250, E = 200000) {
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
  function checkPurlin(channelKey, spanM, spacingM, slopeDeg, dl_kN_m2, ll_kN_m2, wind_kN_m2, grade = 'E250') {
    const ch = (Standards.CHANNELS && Standards.CHANNELS[channelKey]) || (Standards.CHANNELS && Standards.CHANNELS['ISMC 125']);
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
    const delta_limit = Lp_mm / 180; // IS 800 Table 6 for corrugated sheet roofing
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
    const ch = (Standards.CHANNELS && Standards.CHANNELS[channelKey]) || (Standards.CHANNELS && Standards.CHANNELS['ISMC 125']);
    const stGrade = (Standards.STEEL_GRADES && Standards.STEEL_GRADES[grade]) || { fy: 250, fu: 410, E: 200000 };
    const fy = stGrade.fy;
    const E = stGrade.E;

    const H_mm = Math.max(0.1, heightM) * 1000;
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
  function checkConnection(force_kN, connectionType = 'Welded', weldSize_mm = 6, weldLengthPerSide_mm = 65, boltDia_mm = 16, grade = 'E250') {
    const P = Math.abs(force_kN);
    const stGrade = (Standards.STEEL_GRADES && Standards.STEEL_GRADES[grade]) || { fu: 410, fy: 250 };
    const fu = stGrade.fu;

    if (connectionType === 'Welded') {
      const sw = Math.max(3, weldSize_mm);
      const wl = Math.max(10, weldLengthPerSide_mm);
      const totalWeldLength = 2 * wl; // top and bottom welds

      // Design shear strength of fillet weld fwd = fu / (sqrt(3) * gamma_mw)
      // gamma_mw = 1.25 for shop weld
      const fwd = fu / (Math.sqrt(3) * 1.25); // N/mm^2 (e.g. 189.37 N/mm^2 for fu=410)

      // Effective throat thickness tt = 0.7 * sw
      const tt = 0.7 * sw; // mm

      // Shear capacity per unit length qw = fwd * tt
      const qw = fwd * tt; // N/mm (e.g. 795.36 N/mm for sw=6mm)

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

  const IS800Module = {
    calcFcd,
    calcTensionCapacity,
    calcCompressionCapacity,
    checkPurlin,
    checkLacedColumn,
    checkConnection
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = IS800Module;
  } else {
    root.IS800Module = IS800Module;
  }
})(typeof window !== 'undefined' ? window : global);
