/**
 * Automated Verification Suite for IS 800:2007 & IS 875:2015 Structural Engine
 * Run: node test/test_runner.js
 */

const Standards = require('../js/data/standards.js');
const Geometry = require('../js/engine/geometry.js');
const Wind = require('../js/engine/wind.js');
const Solver = require('../js/engine/solver.js');
const IS800 = require('../js/engine/code_is800.js');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

function assertClose(actual, expected, tolerance = 0.05, message = '') {
  const diff = Math.abs(actual - expected);
  const relError = expected !== 0 ? diff / Math.abs(expected) : diff;
  const ok = relError <= tolerance;
  assert(ok, `${message} (Actual: ${actual}, Expected: ${expected}, RelError: ${(relError * 100).toFixed(2)}%)`);
}

console.log('================================================================');
console.log('RUNNING STRUCTURAL DESIGN STUDIO IS CODE VERIFICATION SUITE');
console.log('================================================================\n');

// -------------------------------------------------------------
// Test 1: IS 800:2007 Table 9(c) Perry-Robertson fcd Values (fy = 250 MPa)
// -------------------------------------------------------------
console.log('[TEST 1] IS 800:2007 Table 9(c) Compressive Stress fcd (Buckling Class c, fy = 250 MPa):');
// Official Table 9(c) values for fy = 250 MPa:
// KL/r = 50  => fcd = 183 MPa
// KL/r = 80  => fcd = 136 MPa
// KL/r = 100 => fcd = 107 MPa
// KL/r = 130 => fcd = 74.3 MPa
// KL/r = 160 => fcd = 53.3 MPa
const fcd_50  = IS800.calcFcd(250, 200000, 50, 'c').fcd;
const fcd_80  = IS800.calcFcd(250, 200000, 80, 'c').fcd;
const fcd_100 = IS800.calcFcd(250, 200000, 100, 'c').fcd;
const fcd_130 = IS800.calcFcd(250, 200000, 130, 'c').fcd;
const fcd_160 = IS800.calcFcd(250, 200000, 160, 'c').fcd;

assertClose(fcd_50, 183, 0.03, 'fcd for KL/r = 50');
assertClose(fcd_80, 136, 0.03, 'fcd for KL/r = 80');
assertClose(fcd_100, 107, 0.03, 'fcd for KL/r = 100');
assertClose(fcd_130, 74.3, 0.03, 'fcd for KL/r = 130');
assertClose(fcd_160, 53.3, 0.03, 'fcd for KL/r = 160');

// -------------------------------------------------------------
// Test 2: IS 875:2015 Wind Speed Vz and Design Pressure pz
// -------------------------------------------------------------
console.log('\n[TEST 2] IS 875 (Part 3): 2015 Wind Speed & Pressure Calculation:');
// Vb = 39 m/s, Category 2, height = 12m, 50 years design life
// At height 12m in Cat 2: between 10m (k2=1.00) and 15m (k2=1.05) => k2 = 1.00 + (2/5)*0.05 = 1.02
// Vz = 39 * 1.0 * 1.02 = 39.78 m/s
// pz = 0.6 * (39.78)^2 = 0.6 * 1582.45 = 949.47 N/m^2 = 0.949 kN/m^2
const windRes = Wind.computeWindAnalysis({ Vb: 39, height: 12, terrain: 2, age: 50, slope: 10, cpi: 0.2 });
assertClose(windRes.k2, 1.02, 0.01, 'Terrain factor k2 at 12m Cat 2');
assertClose(windRes.Vz, 39.78, 0.01, 'Design wind speed Vz');
assertClose(windRes.pz, 949.5, 0.02, 'Design wind pressure pz (N/m^2)');

// -------------------------------------------------------------
// Test 3: Direct Stiffness Matrix FEA Solver & Equilibrium
// -------------------------------------------------------------
console.log('\n[TEST 3] Direct Stiffness Matrix FEA Formulation & Static Equilibrium:');
// Create a symmetric 8-panel Howe truss: Span = 16m, Rise = 2m
const trussGeom = Geometry.generateTruss({ truss: 'Howe', span: 16, panels: 8, slope: 14.04 });
const dof = 2 * trussGeom.nodes.length;
const nodalForces = new Array(dof).fill(0);

// Apply downward vertical load of 10 kN at each of the 7 interior top chord nodes
const totalAppliedLoad_kN = 7 * 10;
for (let i = 1; i < 8; i++) {
  const topNodeIdx = 9 + i; // top chord nodes
  nodalForces[2 * topNodeIdx + 1] = -10; // downward
}

const feaResult = Solver.solveTrussFEA(
  trussGeom.nodes,
  trussGeom.m,
  trussGeom.pin,
  trussGeom.roller,
  nodalForces,
  200000,
  2 * 866 // ISA 75x75x6 back to back area
);

assert(feaResult.success, 'FEA solver executes successfully with non-singular matrix');
// By symmetry, support reactions should be totalAppliedLoad / 2 = 35 kN each
assertClose(feaResult.reactions.pinRy, 35, 0.01, 'Left pin reaction Ry = 35 kN');
assertClose(feaResult.reactions.rollerRy, 35, 0.01, 'Right roller reaction Ry = 35 kN');
assertClose(feaResult.reactions.pinRx, 0, 0.01, 'Horizontal reaction Rx = 0 kN (symmetric vertical loading)');

// Check static equilibrium: sum of reactions + sum of applied loads == 0
const sumRy = feaResult.reactions.pinRy + feaResult.reactions.rollerRy - totalAppliedLoad_kN;
assert(Math.abs(sumRy) < 1e-4, 'Global vertical equilibrium sum(Ry) - P_total = 0');

// Top chord members should be in compression (negative axial force)
const topChordForces = feaResult.memberForces.filter((_, idx) => trussGeom.m[idx][2] === 'top_chord');
const allTopChordInCompression = topChordForces.every(f => f < 0);
assert(allTopChordInCompression, 'All top chord members in compression under downward gravity load');

// Bottom chord members should be in tension (positive axial force)
const bottomChordForces = feaResult.memberForces.filter((_, idx) => trussGeom.m[idx][2] === 'bottom_chord');
const allBottomChordInTension = bottomChordForces.every(f => f > 0);
assert(allBottomChordInTension, 'All bottom chord members in tension under downward gravity load');

// -------------------------------------------------------------
// Test 4: IS 800 Purlin Biaxial Bending Interaction Check
// -------------------------------------------------------------
console.log('\n[TEST 4] IS 800:2007 Cl. 8.2 & 9.3.1 Purlin Biaxial Bending:');
const purlinCheck = IS800.checkPurlin('ISMC 125', 4.0, 1.4, 10, 0.35, 0.50, 0.95, 'E250');
assert(purlinCheck.Mz > 0 && purlinCheck.My > 0, 'Purlin experiences both Mz and My on sloping roof');
assert(purlinCheck.Mdz > 0 && purlinCheck.Mdy > 0, 'Valid major and minor moment capacities');
assert(purlinCheck.interactionRatio > 0, 'Calculated biaxial interaction ratio (Mz/Mdz + My/Mdy)');
assert(purlinCheck.delta_limit > 0, 'Purlin deflection limit evaluated (L/180)');

// -------------------------------------------------------------
// Test 5: IS 800 Built-up 2C Column & Lacing Transverse Shear
// -------------------------------------------------------------
console.log('\n[TEST 5] IS 800:2007 Cl. 7.6 Built-Up 2C Column & Lacing Shear:');
const colCheck = IS800.checkLacedColumn('ISMC 125', 12.0, 150.0, 1.0, 0.6, 'E250');
assert(colCheck.spacing_s >= 40, `Required channel spacing for Iy >= Iz: ${colCheck.spacing_s} mm`);
assertClose(colCheck.lambda_e, 1.05 * colCheck.lambda_z, 0.001, 'Laced column effective slenderness lambda_e = 1.05 * lambda_z');
assertClose(colCheck.Vt, 0.025 * 150.0, 0.001, 'Transverse shear Vt = 0.025 * P');
assert(colCheck.lambda_lacing <= 145, `Lacing flat slenderness (${colCheck.lambda_lacing}) within code limit 145`);

// -------------------------------------------------------------
// Test 6: IS 800 Fillet Weld Connection Capacity
// -------------------------------------------------------------
console.log('\n[TEST 6] IS 800:2007 Section 10 Fillet Weld Capacity:');
// 6mm weld, fu = 410 MPa, gamma_mw = 1.25
// fwd = 410 / (sqrt(3) * 1.25) = 189.37 N/mm^2
// qw = 0.7 * 6 * 189.37 = 795.36 N/mm
// For 50 kN force: reqWeldLength = 50000 / 795.36 = 62.86 mm
const weldCheck = IS800.checkConnection(50.0, 'Welded', 6, 65, 16, 'E250');
assertClose(weldCheck.fwd, 189.37, 0.01, 'Design weld strength fwd = 189.37 N/mm^2');
assertClose(weldCheck.qw, 795.4, 0.01, 'Weld capacity per mm qw = 795.4 N/mm');
assertClose(weldCheck.reqWeldLength, 62.9, 0.02, 'Required weld length ~ 62.9 mm for 50 kN');
assert(weldCheck.pass, '65 mm per side (130 mm total) weld passes for 50 kN force');

// -------------------------------------------------------------
// Test 7: Multi-Load Combination Analysis & Recommendations
// -------------------------------------------------------------
console.log('\n[TEST 7] Multi-Load Combination Analysis & Recommendation Engine:');
const Analysis = require('../js/engine/analysis.js');
const defaultState = require('../js/state.js').defaultState;

const fullAnalysis = Analysis.runCompleteAnalysis(defaultState);
assert(!fullAnalysis.mechanism, 'Truss is stable across all 4 load combinations');
assert(fullAnalysis.members.length > 0, `Analyzed ${fullAnalysis.members.length} members across all load combinations`);
assert(fullAnalysis.checks.length === 6, 'Generated 6 structural screening checks');
assert(fullAnalysis.maxReaction > 0, `Calculated maximum support reaction: ${fullAnalysis.maxReaction} kN`);

const recs = Analysis.getRecommendationValues(fullAnalysis, defaultState);
assert(Array.isArray(recs.items), 'Recommendation items generated');

console.log('\n================================================================');
console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('================================================================');

if (failed > 0) process.exit(1);

