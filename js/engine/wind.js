/**
 * Structural Design Studio — IS 875 (Part 3): 2015 Wind Load Engine
 * Strictly computes:
 * - k1: Probability factor / risk coefficient (Table 1)
 * - k2: Terrain & height factor (Table 2) with linear interpolation
 * - k3: Topography factor
 * - k4: Cyclonic factor
 * - Vz = Vb * k1 * k2 * k3 * k4
 * - pz = 0.6 * Vz^2 (N/m^2)
 * - Cpe (Table 5) & Cpi (Cl. 7.3.2)
 * - Net roof pressure & panel joint loads
 */

(function(root) {
  'use strict';

  const Standards = root.Standards || (typeof require !== 'undefined' ? require('../data/standards.js') : {});

  /**
   * Linear interpolation for k2 factor from IS 875:2015 Table 2
   */
  function getK2(heightM, terrainCat) {
    const table = Standards.IS875_K2_TABLE || {
      heights: [10, 15, 20, 30],
      cat1: [1.05, 1.09, 1.12, 1.15],
      cat2: [1.00, 1.05, 1.07, 1.10],
      cat3: [0.91, 0.97, 1.01, 1.06],
      cat4: [0.80, 0.80, 0.80, 0.80]
    };

    const catKey = 'cat' + Math.min(4, Math.max(1, Math.round(terrainCat || 2)));
    const vals = table[catKey];
    const heights = table.heights;

    const h = Math.max(1, heightM);
    if (h <= heights[0]) return vals[0];
    if (h >= heights[heights.length - 1]) return vals[vals.length - 1];

    for (let i = 0; i < heights.length - 1; i++) {
      if (h >= heights[i] && h <= heights[i + 1]) {
        const ratio = (h - heights[i]) / (heights[i + 1] - heights[i]);
        return vals[i] + ratio * (vals[i + 1] - vals[i]);
      }
    }
    return 1.0;
  }

  /**
   * Risk coefficient k1 (Table 1)
   */
  function getK1(designLifeYears, Vb) {
    if (designLifeYears >= 100) return 1.05;
    if (designLifeYears <= 25) return 0.90;
    return 1.0; // 50 years design life for normal industrial building
  }

  /**
   * Standard Cpe for pitched roofs per IS 875 (Part 3) Table 5 (h/w <= 0.5, theta = 0)
   * slope in degrees
   */
  function getStandardCpe(slopeDeg) {
    const s = Math.max(0, slopeDeg);
    if (s <= 5) return { windward: -0.7, leeward: -0.5 };
    if (s <= 10) return { windward: -0.7, leeward: -0.5 };
    if (s <= 20) {
      // Transition from suction to lesser suction
      const frac = (s - 10) / 10;
      return { windward: -0.7 + frac * 0.3, leeward: -0.5 }; // -0.7 to -0.4
    }
    if (s <= 30) {
      const frac = (s - 20) / 10;
      return { windward: -0.4 + frac * 0.4, leeward: -0.5 }; // -0.4 to 0.0
    }
    return { windward: 0.0, leeward: -0.5 };
  }

  /**
   * Complete Wind Analysis
   */
  function computeWindAnalysis(params) {
    const Vb = Math.max(10, Number(params.Vb) || 39);
    const height = Math.max(1, Number(params.height) || 12);
    const terrain = Number(params.terrain) || 2;
    const slope = Number(params.slope) || 10;
    const cpiChoice = Number(params.cpi) !== undefined ? Number(params.cpi) : 0.2;

    const k1 = getK1(params.age || 50, Vb);
    const k2 = getK2(height, terrain);
    const k3 = 1.0; // Flat topography
    const k4 = 1.0; // Non-cyclonic industrial

    const Vz = Vb * k1 * k2 * k3 * k4;
    const pz = 0.6 * Vz * Vz; // N/m^2
    const pz_kN = pz / 1000;  // kN/m^2

    const stdCpe = getStandardCpe(slope);
    const cpe = Number.isFinite(Number(params.cpe)) ? Number(params.cpe) : stdCpe.windward;

    // Governing net pressure coefficient cases:
    // Case A: Cpe - (+Cpi) = Cpe - 0.2 (Max uplift/suction if Cpe is negative)
    // Case B: Cpe - (-Cpi) = Cpe + 0.2
    const netCp_suction = cpe - Math.abs(cpiChoice);
    const netCp_pressure = cpe + Math.abs(cpiChoice);

    // Maximum suction pressure normal to roof
    const p_net_suction = pz_kN * netCp_suction;   // typically negative (uplift)
    const p_net_pressure = pz_kN * netCp_pressure;

    return {
      Vb,
      k1: Number(k1.toFixed(3)),
      k2: Number(k2.toFixed(3)),
      k3,
      k4,
      Vz: Number(Vz.toFixed(2)),
      pz: Number(pz.toFixed(1)),         // N/m^2
      pz_kN: Number(pz_kN.toFixed(4)),   // kN/m^2
      cpe: Number(cpe.toFixed(2)),
      cpi: Number(cpiChoice.toFixed(2)),
      netCp_suction: Number(netCp_suction.toFixed(3)),
      netCp_pressure: Number(netCp_pressure.toFixed(3)),
      p_net_suction: Number(p_net_suction.toFixed(4)),
      p_net_pressure: Number(p_net_pressure.toFixed(4))
    };
  }

  const WindModule = {
    getK1,
    getK2,
    getStandardCpe,
    computeWindAnalysis
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = WindModule;
  } else {
    root.WindModule = WindModule;
  }
})(typeof window !== 'undefined' ? window : global);
