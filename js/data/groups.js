/**
 * Structural Design Studio — Assignment Problem Groups
 * 12 Standard Groups G1 to G12 with location, span, height, length, roof cladding,
 * connection type, age, terrain category, internal pressure Cpi, and basic wind speed Vb.
 */

(function(root) {
  'use strict';

  const GROUPS = {
    G1:  { loc: 'Dhule',     truss: 'Howe',  span: 18, height: 15, length: 70, roof: 'GI', conn: 'Welded', age: 30, terrain: 2, cpi: 0.2, Vb: 39 },
    G2:  { loc: 'Bhopal',    truss: 'Howe',  span: 16, height: 13, length: 80, roof: 'AC', conn: 'Bolted', age: 60, terrain: 3, cpi: 0.2, Vb: 39 },
    G3:  { loc: 'Raipur',    truss: 'Pratt', span: 16, height: 11, length: 54, roof: 'GI', conn: 'Welded', age: 50, terrain: 2, cpi: 0.2, Vb: 39 },
    G4:  { loc: 'Gaya',      truss: 'Howe',  span: 16, height: 12, length: 98, roof: 'AC', conn: 'Welded', age: 45, terrain: 2, cpi: 0.2, Vb: 39 },
    G5:  { loc: 'Nashik',    truss: 'Fink',  span: 16, height: 11, length: 54, roof: 'GI', conn: 'Welded', age: 50, terrain: 2, cpi: 0.2, Vb: 39 },
    G6:  { loc: 'Bangalore', truss: 'Howe',  span: 16, height: 10, length: 73, roof: 'GI', conn: 'Bolted', age: 40, terrain: 4, cpi: 0.2, Vb: 33 },
    G7:  { loc: 'Delhi',     truss: 'Pratt', span: 12, height: 14, length: 94, roof: 'GI', conn: 'Welded', age: 60, terrain: 4, cpi: 0.2, Vb: 47 },
    G8:  { loc: 'Satara',    truss: 'Howe',  span: 15, height: 10, length: 78, roof: 'GI', conn: 'Welded', age: 40, terrain: 4, cpi: 0.2, Vb: 39 },
    G9:  { loc: 'Hyderabad', truss: 'Howe',  span: 18, height: 12, length: 58, roof: 'AC', conn: 'Bolted', age: 45, terrain: 3, cpi: 0.2, Vb: 44 },
    G10: { loc: 'Dhule',     truss: 'Pratt', span: 18, height: 15, length: 70, roof: 'GI', conn: 'Welded', age: 30, terrain: 2, cpi: 0.2, Vb: 39 },
    G11: { loc: 'Palghar',   truss: 'Howe',  span: 15, height: 12, length: 58, roof: 'AC', conn: 'Welded', age: 45, terrain: 3, cpi: 0.2, Vb: 44 },
    G12: { loc: 'Beed',      truss: 'Pratt', span: 12, height: 10, length: 50, roof: 'GI', conn: 'Welded', age: 40, terrain: 2, cpi: 0.2, Vb: 39 }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = GROUPS;
  } else {
    root.GROUPS = GROUPS;
  }
})(typeof window !== 'undefined' ? window : global);
