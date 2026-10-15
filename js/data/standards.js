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

  // Indian Standard Equal Angles (ISA) from Birla's Steel Tables (Table 1) / SP 6(1)
  // Dimensions in mm, Area in mm^2, r in mm, Z in 10^3 mm^3, weight in kg/m
  const ANGLES = {
    'ISA 20×20×3': { A: 112, a: 20, b: 20, t: 3, rx: 5.8, ry: 5.8, ru: 7.3, rv: 3.7, rmin: 3.7, Zx: 0.3, Zy: 0.3, wt: 0.9 },
    'ISA 20×20×4': { A: 145, a: 20, b: 20, t: 4, rx: 5.8, ry: 5.8, ru: 7.2, rv: 3.7, rmin: 3.7, Zx: 0.4, Zy: 0.4, wt: 1.1 },
    'ISA 25×25×3': { A: 141, a: 25, b: 25, t: 3, rx: 7.3, ry: 7.3, ru: 9.3, rv: 4.7, rmin: 4.7, Zx: 0.4, Zy: 0.4, wt: 1.1 },
    'ISA 25×25×4': { A: 184, a: 25, b: 25, t: 4, rx: 7.3, ry: 7.3, ru: 9.1, rv: 4.7, rmin: 4.7, Zx: 0.6, Zy: 0.6, wt: 1.4 },
    'ISA 25×25×5': { A: 225, a: 25, b: 25, t: 5, rx: 7.2, ry: 7.2, ru: 9.1, rv: 4.7, rmin: 4.7, Zx: 0.7, Zy: 0.7, wt: 1.8 },
    'ISA 30×30×3': { A: 173, a: 30, b: 30, t: 3, rx: 8.9, ry: 8.9, ru: 11.3, rv: 5.7, rmin: 5.7, Zx: 0.6, Zy: 0.6, wt: 1.4 },
    'ISA 30×30×4': { A: 226, a: 30, b: 30, t: 4, rx: 8.9, ry: 8.9, ru: 11.2, rv: 5.7, rmin: 5.7, Zx: 0.8, Zy: 0.8, wt: 1.8 },
    'ISA 30×30×5': { A: 277, a: 30, b: 30, t: 5, rx: 8.8, ry: 8.8, ru: 11.1, rv: 5.7, rmin: 5.7, Zx: 1.0, Zy: 1.0, wt: 2.2 },
    'ISA 35×35×3': { A: 203, a: 35, b: 35, t: 3, rx: 10.5, ry: 10.5, ru: 13.3, rv: 6.7, rmin: 6.7, Zx: 0.9, Zy: 0.9, wt: 1.6 },
    'ISA 35×35×4': { A: 268, a: 35, b: 35, t: 4, rx: 10.5, ry: 10.5, ru: 13.2, rv: 6.7, rmin: 6.7, Zx: 1.2, Zy: 1.2, wt: 2.1 },
    'ISA 35×35×5': { A: 327, a: 35, b: 35, t: 5, rx: 10.4, ry: 10.4, ru: 13.1, rv: 6.7, rmin: 6.7, Zx: 1.4, Zy: 1.4, wt: 2.6 },
    'ISA 35×35×6': { A: 386, a: 35, b: 35, t: 6, rx: 10.3, ry: 10.3, ru: 12.9, rv: 6.7, rmin: 6.7, Zx: 1.7, Zy: 1.7, wt: 3.0 },
    'ISA 40×40×3': { A: 234, a: 40, b: 40, t: 3, rx: 12.1, ry: 12.1, ru: 15.4, rv: 7.7, rmin: 7.7, Zx: 1.2, Zy: 1.2, wt: 1.8 },
    'ISA 40×40×4': { A: 307, a: 40, b: 40, t: 4, rx: 12.1, ry: 12.1, ru: 15.3, rv: 7.7, rmin: 7.7, Zx: 1.6, Zy: 1.6, wt: 2.4 },
    'ISA 40×40×5': { A: 378, a: 40, b: 40, t: 5, rx: 12.0, ry: 12.0, ru: 15.1, rv: 7.7, rmin: 7.7, Zx: 1.9, Zy: 1.9, wt: 3.0 },
    'ISA 40×40×6': { A: 447, a: 40, b: 40, t: 6, rx: 11.9, ry: 11.9, ru: 15.0, rv: 7.7, rmin: 7.7, Zx: 2.3, Zy: 2.3, wt: 3.5 },
    'ISA 45×45×3': { A: 264, a: 45, b: 45, t: 3, rx: 13.8, ry: 13.8, ru: 17.4, rv: 8.7, rmin: 8.7, Zx: 1.5, Zy: 1.5, wt: 2.1 },
    'ISA 45×45×4': { A: 347, a: 45, b: 45, t: 4, rx: 13.7, ry: 13.7, ru: 17.3, rv: 8.7, rmin: 8.7, Zx: 2.0, Zy: 2.0, wt: 2.7 },
    'ISA 45×45×5': { A: 428, a: 45, b: 45, t: 5, rx: 13.6, ry: 13.6, ru: 17.2, rv: 8.7, rmin: 8.7, Zx: 2.5, Zy: 2.5, wt: 3.4 },
    'ISA 45×45×6': { A: 507, a: 45, b: 45, t: 6, rx: 13.5, ry: 13.5, ru: 17.0, rv: 8.7, rmin: 8.7, Zx: 2.9, Zy: 2.9, wt: 4.0 },
    'ISA 50×50×3': { A: 295, a: 50, b: 50, t: 3, rx: 15.3, ry: 15.3, ru: 19.4, rv: 9.7, rmin: 9.7, Zx: 1.9, Zy: 1.9, wt: 2.3 },
    'ISA 50×50×4': { A: 388, a: 50, b: 50, t: 4, rx: 15.3, ry: 15.3, ru: 19.3, rv: 9.7, rmin: 9.7, Zx: 2.5, Zy: 2.5, wt: 3.0 },
    'ISA 50×50×5': { A: 479, a: 50, b: 50, t: 5, rx: 15.2, ry: 15.2, ru: 19.2, rv: 9.7, rmin: 9.7, Zx: 3.1, Zy: 3.1, wt: 3.8 },
    'ISA 50×50×6': { A: 568, a: 50, b: 50, t: 6, rx: 15.1, ry: 15.1, ru: 19.0, rv: 9.6, rmin: 9.6, Zx: 3.6, Zy: 3.6, wt: 4.5 },
    'ISA 55×55×5': { A: 527, a: 55, b: 55, t: 5, rx: 16.7, ry: 16.7, ru: 21.1, rv: 10.6, rmin: 10.6, Zx: 3.7, Zy: 3.7, wt: 4.1 },
    'ISA 55×55×6': { A: 626, a: 55, b: 55, t: 6, rx: 16.6, ry: 16.6, ru: 21.0, rv: 10.6, rmin: 10.6, Zx: 4.4, Zy: 4.4, wt: 4.9 },
    'ISA 55×55×8': { A: 818, a: 55, b: 55, t: 8, rx: 16.4, ry: 16.4, ru: 20.7, rv: 10.6, rmin: 10.6, Zx: 5.7, Zy: 5.7, wt: 6.4 },
    'ISA 55×55×10': { A: 1002, a: 55, b: 55, t: 10, rx: 16.2, ry: 16.2, ru: 20.3, rv: 10.6, rmin: 10.6, Zx: 7.0, Zy: 7.0, wt: 7.9 },
    'ISA 60×60×5': { A: 575, a: 60, b: 60, t: 5, rx: 18.2, ry: 18.2, ru: 23.1, rv: 11.6, rmin: 11.6, Zx: 4.4, Zy: 4.4, wt: 4.5 },
    'ISA 60×60×6': { A: 684, a: 60, b: 60, t: 6, rx: 18.2, ry: 18.2, ru: 22.9, rv: 11.5, rmin: 11.5, Zx: 5.2, Zy: 5.2, wt: 5.4 },
    'ISA 60×60×8': { A: 896, a: 60, b: 60, t: 8, rx: 18.0, ry: 18.0, ru: 22.7, rv: 11.5, rmin: 11.5, Zx: 6.8, Zy: 6.8, wt: 7.0 },
    'ISA 60×60×10': { A: 1100, a: 60, b: 60, t: 10, rx: 17.8, ry: 17.8, ru: 22.3, rv: 11.5, rmin: 11.5, Zx: 8.4, Zy: 8.4, wt: 8.6 },
    'ISA 65×65×5': { A: 625, a: 65, b: 65, t: 5, rx: 19.9, ry: 19.9, ru: 25.1, rv: 12.6, rmin: 12.6, Zx: 5.2, Zy: 5.2, wt: 4.9 },
    'ISA 65×65×6': { A: 744, a: 65, b: 65, t: 6, rx: 19.8, ry: 19.8, ru: 25.0, rv: 12.6, rmin: 12.6, Zx: 6.2, Zy: 6.2, wt: 5.8 },
    'ISA 65×65×8': { A: 976, a: 65, b: 65, t: 8, rx: 19.6, ry: 19.6, ru: 24.7, rv: 12.5, rmin: 12.5, Zx: 8.1, Zy: 8.1, wt: 7.7 },
    'ISA 65×65×10': { A: 1200, a: 65, b: 65, t: 10, rx: 19.4, ry: 19.4, ru: 24.4, rv: 12.5, rmin: 12.5, Zx: 9.9, Zy: 9.9, wt: 9.4 },
    'ISA 70×70×5': { A: 677, a: 70, b: 70, t: 5, rx: 21.5, ry: 21.5, ru: 27.1, rv: 13.6, rmin: 13.6, Zx: 6.1, Zy: 6.1, wt: 5.3 },
    'ISA 70×70×6': { A: 806, a: 70, b: 70, t: 6, rx: 21.4, ry: 21.4, ru: 27.0, rv: 13.6, rmin: 13.6, Zx: 7.3, Zy: 7.3, wt: 6.3 },
    'ISA 70×70×8': { A: 1058, a: 70, b: 70, t: 8, rx: 21.2, ry: 21.2, ru: 26.7, rv: 13.5, rmin: 13.5, Zx: 9.5, Zy: 9.5, wt: 8.3 },
    'ISA 70×70×10': { A: 1302, a: 70, b: 70, t: 10, rx: 21.0, ry: 21.0, ru: 26.4, rv: 13.5, rmin: 13.5, Zx: 11.7, Zy: 11.7, wt: 10.2 },
    'ISA 75×75×5': { A: 727, a: 75, b: 75, t: 5, rx: 23.1, ry: 23.1, ru: 29.2, rv: 14.6, rmin: 14.6, Zx: 7.1, Zy: 7.1, wt: 5.7 },
    'ISA 75×75×6': { A: 866, a: 75, b: 75, t: 6, rx: 23.0, ry: 23.0, ru: 29.1, rv: 14.6, rmin: 14.6, Zx: 8.4, Zy: 8.4, wt: 6.8 },
    'ISA 75×75×8': { A: 1138, a: 75, b: 75, t: 8, rx: 22.8, ry: 22.8, ru: 28.8, rv: 14.5, rmin: 14.5, Zx: 11.0, Zy: 11.0, wt: 8.9 },
    'ISA 75×75×10': { A: 1402, a: 75, b: 75, t: 10, rx: 22.6, ry: 22.6, ru: 28.4, rv: 14.5, rmin: 14.5, Zx: 13.5, Zy: 13.5, wt: 11.0 },
    'ISA 80×80×6': { A: 929, a: 80, b: 80, t: 6, rx: 24.6, ry: 24.6, ru: 31.1, rv: 15.6, rmin: 15.6, Zx: 9.6, Zy: 9.6, wt: 7.3 },
    'ISA 80×80×8': { A: 1221, a: 80, b: 80, t: 8, rx: 24.4, ry: 24.4, ru: 30.8, rv: 15.5, rmin: 15.5, Zx: 12.6, Zy: 12.6, wt: 9.6 },
    'ISA 80×80×10': { A: 1505, a: 80, b: 80, t: 10, rx: 24.1, ry: 24.1, ru: 30.4, rv: 15.5, rmin: 15.5, Zx: 15.5, Zy: 15.5, wt: 11.8 },
    'ISA 80×80×12': { A: 1781, a: 80, b: 80, t: 12, rx: 23.9, ry: 23.9, ru: 30.1, rv: 15.4, rmin: 15.4, Zx: 18.3, Zy: 18.3, wt: 14.0 },
    'ISA 90×90×6': { A: 1047, a: 90, b: 90, t: 6, rx: 27.7, ry: 27.7, ru: 35.0, rv: 17.5, rmin: 17.5, Zx: 12.2, Zy: 12.2, wt: 8.2 },
    'ISA 90×90×8': { A: 1379, a: 90, b: 90, t: 8, rx: 27.5, ry: 27.5, ru: 34.7, rv: 17.5, rmin: 17.5, Zx: 16.0, Zy: 16.0, wt: 10.8 },
    'ISA 90×90×10': { A: 1703, a: 90, b: 90, t: 10, rx: 27.3, ry: 27.3, ru: 34.4, rv: 17.4, rmin: 17.4, Zx: 19.8, Zy: 19.8, wt: 13.4 },
    'ISA 90×90×12': { A: 2019, a: 90, b: 90, t: 12, rx: 27.1, ry: 27.1, ru: 34.1, rv: 17.4, rmin: 17.4, Zx: 23.3, Zy: 23.3, wt: 15.8 },
    'ISA 100×100×6': { A: 1167, a: 100, b: 100, t: 6, rx: 30.9, ry: 30.9, ru: 39.1, rv: 19.5, rmin: 19.5, Zx: 15.2, Zy: 15.2, wt: 9.2 },
    'ISA 100×100×8': { A: 1539, a: 100, b: 100, t: 8, rx: 30.7, ry: 30.7, ru: 38.8, rv: 19.5, rmin: 19.5, Zx: 20.0, Zy: 20.0, wt: 12.1 },
    'ISA 100×100×10': { A: 1903, a: 100, b: 100, t: 10, rx: 30.5, ry: 30.5, ru: 38.5, rv: 19.4, rmin: 19.4, Zx: 24.7, Zy: 24.7, wt: 14.9 },
    'ISA 100×100×12': { A: 2259, a: 100, b: 100, t: 12, rx: 30.3, ry: 30.3, ru: 38.2, rv: 19.4, rmin: 19.4, Zx: 29.2, Zy: 29.2, wt: 17.7 },
    'ISA 110×110×8': { A: 1702, a: 110, b: 110, t: 8, rx: 33.8, ry: 33.8, ru: 42.8, rv: 21.4, rmin: 21.4, Zx: 24.4, Zy: 24.4, wt: 13.4 },
    'ISA 110×110×10': { A: 2106, a: 110, b: 110, t: 10, rx: 33.6, ry: 33.6, ru: 42.5, rv: 21.4, rmin: 21.4, Zx: 30.1, Zy: 30.1, wt: 16.5 },
    'ISA 110×110×12': { A: 2502, a: 110, b: 110, t: 12, rx: 33.4, ry: 33.4, ru: 42.2, rv: 21.3, rmin: 21.3, Zx: 35.7, Zy: 35.7, wt: 19.6 },
    'ISA 110×110×15': { A: 3081, a: 110, b: 110, t: 15, rx: 33.1, ry: 33.1, ru: 41.7, rv: 21.3, rmin: 21.3, Zx: 43.7, Zy: 43.7, wt: 24.2 },
    'ISA 130×130×8': { A: 2022, a: 130, b: 130, t: 8, rx: 40.3, ry: 40.3, ru: 51.0, rv: 25.5, rmin: 25.5, Zx: 34.5, Zy: 34.5, wt: 15.9 },
    'ISA 130×130×10': { A: 2506, a: 130, b: 130, t: 10, rx: 40.1, ry: 40.1, ru: 50.7, rv: 25.4, rmin: 25.4, Zx: 42.7, Zy: 42.7, wt: 19.7 },
    'ISA 130×130×12': { A: 2982, a: 130, b: 130, t: 12, rx: 39.9, ry: 39.9, ru: 50.3, rv: 25.4, rmin: 25.4, Zx: 50.7, Zy: 50.7, wt: 23.4 },
    'ISA 130×130×15': { A: 3681, a: 130, b: 130, t: 15, rx: 39.5, ry: 39.5, ru: 49.8, rv: 25.3, rmin: 25.3, Zx: 62.3, Zy: 62.3, wt: 28.9 },
    'ISA 150×150×10': { A: 2903, a: 150, b: 150, t: 10, rx: 46.3, ry: 46.3, ru: 58.6, rv: 29.3, rmin: 29.3, Zx: 56.9, Zy: 56.9, wt: 22.8 },
    'ISA 150×150×12': { A: 3459, a: 150, b: 150, t: 12, rx: 46.1, ry: 46.1, ru: 58.3, rv: 29.3, rmin: 29.3, Zx: 67.7, Zy: 67.7, wt: 27.2 },
    'ISA 150×150×15': { A: 4278, a: 150, b: 150, t: 15, rx: 45.8, ry: 45.8, ru: 57.8, rv: 29.2, rmin: 29.2, Zx: 83.5, Zy: 83.5, wt: 33.6 },
    'ISA 150×150×18': { A: 5079, a: 150, b: 150, t: 18, rx: 45.4, ry: 45.4, ru: 57.3, rv: 29.1, rmin: 29.1, Zx: 98.7, Zy: 98.7, wt: 39.9 },
    'ISA 200×200×12': { A: 4661, a: 200, b: 200, t: 12, rx: 62.0, ry: 62.0, ru: 78.4, rv: 39.2, rmin: 39.2, Zx: 122.2, Zy: 122.2, wt: 36.6 },
    'ISA 200×200×15': { A: 5780, a: 200, b: 200, t: 15, rx: 61.7, ry: 61.7, ru: 77.9, rv: 39.1, rmin: 39.1, Zx: 151.4, Zy: 151.4, wt: 45.4 },
    'ISA 200×200×18': { A: 6881, a: 200, b: 200, t: 18, rx: 61.3, ry: 61.3, ru: 77.5, rv: 39.0, rmin: 39.0, Zx: 179.9, Zy: 179.9, wt: 54.0 },
    'ISA 200×200×25': { A: 9380, a: 200, b: 200, t: 25, rx: 60.5, ry: 60.5, ru: 76.3, rv: 38.8, rmin: 38.8, Zx: 243.3, Zy: 243.3, wt: 73.6 }
  };

  // Indian Standard Channels (ISJC, ISLC, ISMC) from Birla's Steel Tables (Table 5) / SP 6(1)
  // Dimensions in mm, Area in mm^2, r in mm, Z in 10^3 mm^3, Cy in mm, weight in kg/m
  const CHANNELS = {
    // Junior Channels (ISJC)
    'ISJC 100': { A: 741, D: 100, B: 45, tf: 5.1, tw: 3.0, rz: 40.9, ry: 14.2, rmin: 14.2, Zz: 24.8, Zy: 4.8, Cy: 14.0, Iz: 123.8e4, Iy: 14.9e4, wt: 5.8 },
    'ISJC 125': { A: 1007, D: 125, B: 50, tf: 6.6, tw: 3.0, rz: 51.8, ry: 16.0, rmin: 16.0, Zz: 43.2, Zy: 7.6, Cy: 16.4, Iz: 270.0e4, Iy: 25.7e4, wt: 7.9 },
    'ISJC 150': { A: 1265, D: 150, B: 55, tf: 6.9, tw: 3.6, rz: 61.0, ry: 17.3, rmin: 17.3, Zz: 62.8, Zy: 9.9, Cy: 16.6, Iz: 471.1e4, Iy: 37.9e4, wt: 9.9 },
    'ISJC 175': { A: 1424, D: 175, B: 60, tf: 6.9, tw: 3.6, rz: 71.1, ry: 18.8, rmin: 18.8, Zz: 82.3, Zy: 11.9, Cy: 17.5, Iz: 719.9e4, Iy: 50.5e4, wt: 11.2 },
    'ISJC 200': { A: 1777, D: 200, B: 70, tf: 7.1, tw: 4.1, rz: 80.8, ry: 21.8, rmin: 21.8, Zz: 116.1, Zy: 16.7, Cy: 19.7, Iz: 1161.2e4, Iy: 84.2e4, wt: 13.9 },

    // Light Channels (ISLC)
    'ISLC 75': { A: 726, D: 75, B: 40, tf: 6.0, tw: 3.7, rz: 30.2, ry: 12.6, rmin: 12.6, Zz: 17.6, Zy: 4.3, Cy: 13.5, Iz: 66.1e4, Iy: 11.5e4, wt: 5.7 },
    'ISLC 100': { A: 1002, D: 100, B: 50, tf: 6.4, tw: 4.0, rz: 40.6, ry: 15.7, rmin: 15.7, Zz: 32.9, Zy: 7.3, Cy: 16.2, Iz: 164.7e4, Iy: 24.8e4, wt: 7.9 },
    'ISLC 125': { A: 1367, D: 125, B: 65, tf: 6.6, tw: 4.4, rz: 51.1, ry: 20.5, rmin: 20.5, Zz: 57.1, Zy: 12.8, Cy: 20.4, Iz: 356.8e4, Iy: 57.2e4, wt: 10.7 },
    'ISLC 150': { A: 1836, D: 150, B: 75, tf: 7.8, tw: 4.8, rz: 61.6, ry: 23.7, rmin: 23.7, Zz: 93.0, Zy: 20.2, Cy: 23.8, Iz: 697.2e4, Iy: 103.2e4, wt: 14.4 },
    'ISLC 175': { A: 2240, D: 175, B: 75, tf: 9.5, tw: 5.1, rz: 71.6, ry: 23.8, rmin: 23.8, Zz: 131.3, Zy: 24.8, Cy: 24.0, Iz: 1148.4e4, Iy: 126.5e4, wt: 17.6 },
    'ISLC 200': { A: 2622, D: 200, B: 75, tf: 10.8, tw: 5.5, rz: 81.1, ry: 23.7, rmin: 23.7, Zz: 172.6, Zy: 28.5, Cy: 23.5, Iz: 1725.5e4, Iy: 146.9e4, wt: 20.6 },
    'ISLC 225': { A: 3053, D: 225, B: 90, tf: 10.2, tw: 5.8, rz: 91.4, ry: 26.2, rmin: 26.2, Zz: 226.5, Zy: 32.0, Cy: 24.6, Iz: 2547.9e4, Iy: 209.5e4, wt: 24.0 },
    'ISLC 250': { A: 3565, D: 250, B: 100, tf: 10.7, tw: 6.1, rz: 101.7, ry: 28.9, rmin: 28.9, Zz: 295.0, Zy: 40.9, Cy: 27.0, Iz: 3687.9e4, Iy: 298.4e4, wt: 28.0 },
    'ISLC 300': { A: 4211, D: 300, B: 100, tf: 11.6, tw: 6.7, rz: 119.8, ry: 28.7, rmin: 28.7, Zz: 403.2, Zy: 46.4, Cy: 25.5, Iz: 6047.9e4, Iy: 346.0e4, wt: 33.1 },
    'ISLC 350': { A: 4947, D: 350, B: 100, tf: 12.5, tw: 7.4, rz: 137.2, ry: 28.2, rmin: 28.2, Zz: 532.1, Zy: 52.0, Cy: 24.1, Iz: 9312.6e4, Iy: 394.6e4, wt: 38.8 },
    'ISLC 400': { A: 5825, D: 400, B: 100, tf: 14.0, tw: 8.0, rz: 155.0, ry: 28.1, rmin: 28.1, Zz: 699.5, Zy: 60.2, Cy: 23.6, Iz: 13989.5e4, Iy: 460.4e4, wt: 45.7 },

    // Medium Weight Channels (ISMC)
    'ISMC 75': { A: 867, D: 75, B: 40, tf: 7.3, tw: 4.4, rz: 29.6, ry: 12.1, rmin: 12.1, Zz: 20.3, Zy: 4.7, Cy: 13.1, Iz: 76.0e4, Iy: 12.6e4, wt: 6.8 },
    'ISMC 100': { A: 1170, D: 100, B: 50, tf: 7.5, tw: 4.7, rz: 40.0, ry: 14.9, rmin: 14.9, Zz: 37.3, Zy: 7.5, Cy: 15.3, Iz: 186.7e4, Iy: 25.9e4, wt: 9.2 },
    'ISMC 125': { A: 1619, D: 125, B: 65, tf: 8.1, tw: 5.0, rz: 50.7, ry: 19.2, rmin: 19.2, Zz: 66.6, Zy: 13.1, Cy: 19.4, Iz: 416.4e4, Iy: 59.9e4, wt: 12.7 },
    'ISMC 150': { A: 2088, D: 150, B: 75, tf: 9.0, tw: 5.4, rz: 61.1, ry: 22.1, rmin: 22.1, Zz: 103.9, Zy: 19.4, Cy: 22.2, Iz: 779.4e4, Iy: 102.3e4, wt: 16.4 },
    'ISMC 175': { A: 2438, D: 175, B: 75, tf: 10.2, tw: 5.7, rz: 70.8, ry: 22.3, rmin: 22.3, Zz: 139.8, Zy: 22.8, Cy: 22.0, Iz: 1223.3e4, Iy: 121.0e4, wt: 19.1 },
    'ISMC 200': { A: 2821, D: 200, B: 75, tf: 11.4, tw: 6.1, rz: 80.3, ry: 22.3, rmin: 22.3, Zz: 181.9, Zy: 26.3, Cy: 21.7, Iz: 1819.3e4, Iy: 140.4e4, wt: 22.1 },
    'ISMC 225': { A: 3301, D: 225, B: 80, tf: 12.4, tw: 6.4, rz: 90.3, ry: 23.8, rmin: 23.8, Zz: 239.5, Zy: 32.8, Cy: 23.0, Iz: 2694.6e4, Iy: 187.2e4, wt: 25.9 },
    'ISMC 250': { A: 3867, D: 250, B: 80, tf: 14.1, tw: 7.1, rz: 99.4, ry: 23.8, rmin: 23.8, Zz: 305.3, Zy: 38.4, Cy: 23.0, Iz: 3816.8e4, Iy: 219.1e4, wt: 30.4 },
    'ISMC 300': { A: 4564, D: 300, B: 90, tf: 13.6, tw: 7.6, rz: 118.1, ry: 26.1, rmin: 26.1, Zz: 424.2, Zy: 46.8, Cy: 23.6, Iz: 6362.6e4, Iy: 310.8e4, wt: 35.8 },
    'ISMC 350': { A: 5366, D: 350, B: 100, tf: 13.5, tw: 8.1, rz: 136.6, ry: 28.3, rmin: 28.3, Zz: 571.9, Zy: 57.0, Cy: 24.4, Iz: 10008.0e4, Iy: 430.6e4, wt: 42.1 },
    'ISMC 400': { A: 6293, D: 400, B: 100, tf: 15.3, tw: 8.6, rz: 154.8, ry: 28.3, rmin: 28.3, Zz: 754.1, Zy: 66.6, Cy: 24.2, Iz: 15082.8e4, Iy: 504.8e4, wt: 49.4 }
  };

  // Indian Standard Rolled Steel Beams & Columns (ISHB, ISMB, ISWB) from Birla's Steel Tables (Table 4)
  // Dimensions in mm, Area in mm^2, r in mm, Z in 10^3 mm^3, weight in kg/m
  const BEAMS = {
    // Heavy Beams / Column Sections (ISHB)
    'ISHB 150': { A: 3448, D: 150, B: 150, tf: 9.0, tw: 5.4, rz: 65.0, ry: 35.4, rmin: 35.4, Zz: 194.1, Zy: 57.6, Iz: 1455.6e4, Iy: 431.7e4, wt: 27.1 },
    'ISHB 200': { A: 4754, D: 200, B: 200, tf: 9.0, tw: 6.1, rz: 87.1, ry: 45.1, rmin: 45.1, Zz: 360.8, Zy: 96.7, Iz: 3608.4e4, Iy: 967.1e4, wt: 37.3 },
    'ISHB 225': { A: 5494, D: 225, B: 225, tf: 9.1, tw: 6.5, rz: 98.0, ry: 49.6, rmin: 49.6, Zz: 469.3, Zy: 120.3, Iz: 5279.5e4, Iy: 1353.8e4, wt: 43.1 },
    'ISHB 250': { A: 6496, D: 250, B: 250, tf: 9.7, tw: 6.9, rz: 109.1, ry: 54.9, rmin: 54.9, Zz: 618.9, Zy: 156.9, Iz: 7736.5e4, Iy: 1961.3e4, wt: 51.0 },
    'ISHB 300': { A: 7485, D: 300, B: 250, tf: 10.6, tw: 7.6, rz: 129.5, ry: 54.1, rmin: 54.1, Zz: 836.3, Zy: 175.5, Iz: 12545.2e4, Iy: 2193.6e4, wt: 58.8 },
    'ISHB 350': { A: 8591, D: 350, B: 250, tf: 11.6, tw: 8.3, rz: 149.3, ry: 53.4, rmin: 53.4, Zz: 1094.8, Zy: 196.1, Iz: 19159.7e4, Iy: 2451.4e4, wt: 67.4 },
    'ISHB 400': { A: 9866, D: 400, B: 250, tf: 12.7, tw: 9.1, rz: 168.7, ry: 52.6, rmin: 52.6, Zz: 1404.2, Zy: 218.3, Iz: 28083.5e4, Iy: 2728.3e4, wt: 77.4 },
    'ISHB 450': { A: 11114, D: 450, B: 250, tf: 13.7, tw: 9.8, rz: 187.8, ry: 51.8, rmin: 51.8, Zz: 1742.7, Zy: 238.8, Iz: 39210.6e4, Iy: 2985.2e4, wt: 87.2 },

    // Medium Weight Beams (ISMB)
    'ISMB 100': { A: 1460, D: 100, B: 75, tf: 7.2, tw: 4.0, rz: 42.0, ry: 16.7, rmin: 16.7, Zz: 51.5, Zy: 10.9, Iz: 257.5e4, Iy: 40.8e4, wt: 11.5 },
    'ISMB 125': { A: 1660, D: 125, B: 75, tf: 7.6, tw: 4.4, rz: 52.0, ry: 16.2, rmin: 16.2, Zz: 71.8, Zy: 11.7, Iz: 449.0e4, Iy: 43.7e4, wt: 13.0 },
    'ISMB 150': { A: 1900, D: 150, B: 80, tf: 7.6, tw: 4.8, rz: 61.8, ry: 16.6, rmin: 16.6, Zz: 96.9, Zy: 13.1, Iz: 726.4e4, Iy: 52.6e4, wt: 14.9 },
    'ISMB 175': { A: 2462, D: 175, B: 90, tf: 8.6, tw: 5.5, rz: 71.9, ry: 18.6, rmin: 18.6, Zz: 145.4, Zy: 18.9, Iz: 1272.0e4, Iy: 85.0e4, wt: 19.3 },
    'ISMB 200': { A: 3233, D: 200, B: 100, tf: 10.8, tw: 5.7, rz: 83.2, ry: 21.5, rmin: 21.5, Zz: 223.5, Zy: 30.0, Iz: 2235.4e4, Iy: 150.0e4, wt: 25.4 },
    'ISMB 225': { A: 3972, D: 225, B: 110, tf: 11.8, tw: 6.5, rz: 93.1, ry: 23.4, rmin: 23.4, Zz: 305.9, Zy: 39.7, Iz: 3441.8e4, Iy: 218.3e4, wt: 31.2 },
    'ISMB 250': { A: 4755, D: 250, B: 125, tf: 12.5, tw: 6.9, rz: 103.9, ry: 26.5, rmin: 26.5, Zz: 410.5, Zy: 58.5, Iz: 5131.6e4, Iy: 334.5e4, wt: 37.3 },
    'ISMB 300': { A: 5626, D: 300, B: 140, tf: 12.4, tw: 7.5, rz: 123.7, ry: 28.4, rmin: 28.4, Zz: 573.6, Zy: 64.8, Iz: 8603.6e4, Iy: 453.9e4, wt: 44.2 },
    'ISMB 350': { A: 6671, D: 350, B: 140, tf: 14.2, tw: 8.1, rz: 142.9, ry: 28.4, rmin: 28.4, Zz: 778.9, Zy: 76.8, Iz: 13630.3e4, Iy: 537.7e4, wt: 52.4 },
    'ISMB 400': { A: 7846, D: 400, B: 140, tf: 16.0, tw: 8.9, rz: 161.5, ry: 28.2, rmin: 28.2, Zz: 1022.9, Zy: 88.9, Iz: 20458.4e4, Iy: 622.1e4, wt: 61.6 },
    'ISMB 450': { A: 9227, D: 450, B: 150, tf: 17.4, tw: 9.4, rz: 181.5, ry: 30.1, rmin: 30.1, Zz: 1350.7, Zy: 111.2, Iz: 30390.8e4, Iy: 834.0e4, wt: 72.4 },
    'ISMB 500': { A: 11074, D: 500, B: 180, tf: 17.2, tw: 10.2, rz: 202.1, ry: 35.2, rmin: 35.2, Zz: 1808.7, Zy: 152.2, Iz: 45218.3e4, Iy: 1369.8e4, wt: 86.9 },
    'ISMB 600': { A: 15621, D: 600, B: 210, tf: 20.8, tw: 12.0, rz: 242.4, ry: 41.2, rmin: 41.2, Zz: 3060.4, Zy: 252.5, Iz: 91813.0e4, Iy: 2651.0e4, wt: 122.6 },

    // Wide Flange Beams (ISWB)
    'ISWB 150': { A: 2167, D: 150, B: 100, tf: 7.0, tw: 5.4, rz: 62.2, ry: 20.9, rmin: 20.9, Zz: 111.9, Zy: 19.0, Iz: 839.1e4, Iy: 94.8e4, wt: 17.0 },
    'ISWB 200': { A: 3671, D: 200, B: 140, tf: 9.0, tw: 6.1, rz: 84.6, ry: 29.9, rmin: 29.9, Zz: 262.5, Zy: 47.0, Iz: 2624.5e4, Iy: 328.8e4, wt: 28.8 },
    'ISWB 250': { A: 5205, D: 250, B: 200, tf: 9.0, tw: 6.7, rz: 106.9, ry: 40.6, rmin: 40.6, Zz: 475.4, Zy: 85.7, Iz: 5943.1e4, Iy: 857.5e4, wt: 40.9 },
    'ISWB 300': { A: 6133, D: 300, B: 200, tf: 10.0, tw: 7.4, rz: 126.6, ry: 40.2, rmin: 40.2, Zz: 654.8, Zy: 99.0, Iz: 9821.6e4, Iy: 990.1e4, wt: 48.1 },
    'ISWB 350': { A: 7250, D: 350, B: 200, tf: 11.4, tw: 8.0, rz: 146.3, ry: 40.3, rmin: 40.3, Zz: 887.0, Zy: 117.6, Iz: 15521.7e4, Iy: 1175.9e4, wt: 56.9 },
    'ISWB 400': { A: 8501, D: 400, B: 200, tf: 13.0, tw: 8.6, rz: 166.0, ry: 40.4, rmin: 40.4, Zz: 1171.3, Zy: 138.8, Iz: 23426.7e4, Iy: 1388.0e4, wt: 66.7 },
    'ISWB 500': { A: 12122, D: 500, B: 250, tf: 14.7, tw: 9.9, rz: 207.7, ry: 49.6, rmin: 49.6, Zz: 2091.6, Zy: 239.0, Iz: 52290.9e4, Iy: 2987.8e4, wt: 95.2 },
    'ISWB 600': { A: 17038, D: 600, B: 250, tf: 21.3, tw: 11.2, rz: 249.7, ry: 52.5, rmin: 52.5, Zz: 3540.0, Zy: 376.2, Iz: 106198.5e4, Iy: 4702.5e4, wt: 133.7 }
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
    BEAMS,
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
    root.BEAMS = BEAMS;
  }
})(typeof window !== 'undefined' ? window : global);
