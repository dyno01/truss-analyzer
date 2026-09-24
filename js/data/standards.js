/**
 * Structural Design Studio — Standards & Material Database
 * Strictly based on:
 * - SP 6 (Part 1): 1964 (ISI Handbook for Structural Engineers - Structural Steel Sections)
 * - IS 800:2007 (General Construction in Steel - Code of Practice)
 * - IS 875 (Part 3): 2015 (Design Loads for Buildings and Structures - Wind Loads)
 */

(function(root) {
  'use strict';

  // Steel Grade Properties (IS 2062 / IS 800 Table 1)
  const STEEL_GRADES = {
    'E250': { name: 'E250 (Fe 410)', fy: 250, fu: 410, E: 200000, gamma_m0: 1.10, gamma_m1: 1.25, gamma_mw: 1.25 },
    'E350': { name: 'E350 (Fe 490)', fy: 350, fu: 490, E: 200000, gamma_m0: 1.10, gamma_m1: 1.25, gamma_mw: 1.25 }
  };

  // Indian Standard Equal Angles (ISA) from SP 6(1)
  // Dimensions in mm, Area in mm^2, r in mm, Z in 10^3 mm^3, weight in kg/m
  const ANGLES = {
    'ISA 50×50×6': {
      A: 568, a: 50, b: 50, t: 6,
      rx: 15.1, ry: 15.1, ru: 19.1, rv: 9.6, rmin: 9.6,
      Zx: 5.2, Zy: 5.2,
      wt: 4.5
    },
    'ISA 65×65×6': {
      A: 744, a: 65, b: 65, t: 6,
      rx: 19.8, ry: 19.8, ru: 25.1, rv: 12.6, rmin: 12.6,
      Zx: 8.8, Zy: 8.8,
      wt: 5.8
    },
    'ISA 75×75×6': {
      A: 866, a: 75, b: 75, t: 6,
      rx: 23.0, ry: 23.0, ru: 29.1, rv: 14.6, rmin: 14.6,
      Zx: 11.9, Zy: 11.9,
      wt: 6.8
    },
    'ISA 90×90×6': {
      A: 1047, a: 90, b: 90, t: 6,
      rx: 27.7, ry: 27.7, ru: 35.1, rv: 17.6, rmin: 17.6,
      Zx: 17.5, Zy: 17.5,
      wt: 8.2
    },
    'ISA 100×100×8': {
      A: 1539, a: 100, b: 100, t: 8,
      rx: 30.7, ry: 30.7, ru: 38.9, rv: 19.5, rmin: 19.5,
      Zx: 29.9, Zy: 29.9,
      wt: 12.1
    },
    'ISA 130×130×10': {
      A: 2506, a: 130, b: 130, t: 10,
      rx: 40.2, ry: 40.2, ru: 51.0, rv: 25.5, rmin: 25.5,
      Zx: 61.9, Zy: 61.9,
      wt: 19.7
    },
    'ISA 150×150×12': {
      A: 3459, a: 150, b: 150, t: 12,
      rx: 46.4, ry: 46.4, ru: 58.8, rv: 29.3, rmin: 29.3,
      Zx: 99.4, Zy: 99.4,
      wt: 27.2
    }
  };

  // Indian Standard Medium Weight Channels (ISMC) from SP 6(1)
  // Dimensions in mm, Area in mm^2, r in mm, Z in 10^3 mm^3, Cy in mm, weight in kg/m
  const CHANNELS = {
    'ISMC 75': {
      A: 867, D: 75, B: 40, tf: 7.3, tw: 4.4,
      rz: 30.1, ry: 12.4, rmin: 12.4,
      Zz: 20.3, Zy: 4.7,
      Cy: 12.9,
      Iz: 76.6e4, Iy: 13.3e4, // mm^4
      wt: 6.8
    },
    'ISMC 100': {
      A: 1170, D: 100, B: 50, tf: 7.5, tw: 4.7,
      rz: 40.0, ry: 15.3, rmin: 15.3,
      Zz: 37.3, Zy: 7.5,
      Cy: 15.3,
      Iz: 186.7e4, Iy: 27.3e4,
      wt: 9.2
    },
    'ISMC 125': {
      A: 1619, D: 125, B: 65, tf: 8.1, tw: 5.0,
      rz: 50.4, ry: 19.4, rmin: 19.4,
      Zz: 66.6, Zy: 13.1,
      Cy: 19.4,
      Iz: 424.9e4, Iy: 59.9e4,
      wt: 12.7
    },
    'ISMC 150': {
      A: 2088, D: 150, B: 75, tf: 9.0, tw: 5.4,
      rz: 61.1, ry: 22.1, rmin: 22.1,
      Zz: 103.0, Zy: 19.4,
      Cy: 22.2,
      Iz: 779.4e4, Iy: 102.3e4,
      wt: 16.4
    },
    'ISMC 175': {
      A: 2438, D: 175, B: 75, tf: 10.2, tw: 5.7,
      rz: 70.0, ry: 22.0, rmin: 22.0,
      Zz: 140.0, Zy: 21.0,
      Cy: 22.0,
      Iz: 1222.0e4, Iy: 121.0e4,
      wt: 19.1
    },
    'ISMC 200': {
      A: 2821, D: 200, B: 75, tf: 11.4, tw: 6.1,
      rz: 79.5, ry: 21.7, rmin: 21.7,
      Zz: 181.9, Zy: 22.3,
      Cy: 21.7,
      Iz: 1819.0e4, Iy: 140.0e4,
      wt: 22.1
    },
    'ISMC 250': {
      A: 3867, D: 250, B: 80, tf: 14.1, tw: 7.1,
      rz: 99.4, ry: 23.8, rmin: 23.8,
      Zz: 297.0, Zy: 30.6,
      Cy: 23.0,
      Iz: 3830.0e4, Iy: 219.0e4,
      wt: 30.4
    }
  };

  // IS 875 (Part 3): 2015 Table 2 - k2 Terrain and Height Multipliers
  // Heights: [10, 15, 20, 30] meters
  const IS875_K2_TABLE = {
    heights: [10, 15, 20, 30],
    cat1: [1.05, 1.09, 1.12, 1.15],
    cat2: [1.00, 1.05, 1.07, 1.10],
    cat3: [0.91, 0.97, 1.01, 1.06],
    cat4: [0.80, 0.80, 0.80, 0.80]
  };

  // IS 800:2007 Table 7 - Imperfection Factors for Buckling Classes
  const IMPERFECTION_FACTORS = {
    'a': 0.21,
    'b': 0.34,
    'c': 0.49, // Governing class for angle struts & laced channel columns
    'd': 0.76
  };

  // Export to global or commonjs
  const Standards = {
    STEEL_GRADES,
    ANGLES,
    CHANNELS,
    IS875_K2_TABLE,
    IMPERFECTION_FACTORS
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Standards;
  } else {
    root.Standards = Standards;
    // Compatibility aliases for legacy bindings
    root.ANGLES = ANGLES;
    root.CH = CHANNELS;
  }
})(typeof window !== 'undefined' ? window : global);
