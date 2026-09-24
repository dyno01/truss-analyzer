/**
 * Structural Design Studio — Direct Stiffness Matrix FEA Solver
 * Rigorous 2D Plane Truss Formulation:
 * - Local to global coordinate transformations
 * - Global stiffness assembly
 * - Exact Gaussian Elimination with partial pivoting
 * - Internal axial force recovery & support reaction equilibrium check
 */

(function(root) {
  'use strict';

  function linearSolve(A, b) {
    const n = b.length;
    const M = A.map((row, i) => row.slice().concat([b[i]]));

    for (let k = 0; k < n; k++) {
      let maxRow = k;
      for (let i = k + 1; i < n; i++) {
        if (Math.abs(M[i][k]) > Math.abs(M[maxRow][k])) maxRow = i;
      }
      if (Math.abs(M[maxRow][k]) < 1e-12) return null; // Singular matrix / mechanism

      const tmp = M[k];
      M[k] = M[maxRow];
      M[maxRow] = tmp;

      for (let i = k + 1; i < n; i++) {
        const factor = M[i][k] / M[k][k];
        for (let j = k; j <= n; j++) {
          M[i][j] -= factor * M[k][j];
        }
      }
    }

    const x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      let sum = M[i][n];
      for (let j = i + 1; j < n; j++) {
        sum -= M[i][j] * x[j];
      }
      x[i] = sum / M[i][i];
    }
    return x;
  }

  function solveTrussFEA(nodes, members, pinNode, rollerNode, nodalForces, E, A) {
    const numNodes = nodes.length;
    const dof = 2 * numNodes;
    const K = Array.from({ length: dof }, () => new Array(dof).fill(0));

    // Assemble global stiffness matrix
    members.forEach((m) => {
      const na = nodes[m[0]];
      const nb = nodes[m[1]];
      const dx = nb.x - na.x;
      const dy = nb.y - na.y;
      const L = Math.max(0.0001, Math.hypot(dx, dy));
      const c = dx / L;
      const s = dy / L;

      // k = E*A/L in kN/m (E in MPa = N/mm^2 = 1e3 kN/m^2, A in mm^2 = 1e-6 m^2 => E*A*1e-3 kN)
      // If E is in MPa (200000) and A in mm^2, E*A*1e-6 / L gives kN/m
      const k = (E * A * 1e-6) / L;

      const idx = [2 * m[0], 2 * m[0] + 1, 2 * m[1], 2 * m[1] + 1];
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

    // Boundary conditions:
    // Pin at pinNode: u_x = 0, u_y = 0 => dofs 2*pinNode, 2*pinNode+1
    // Roller at rollerNode: u_y = 0 => dof 2*rollerNode+1
    const fixedDofs = [2 * pinNode, 2 * pinNode + 1, 2 * rollerNode + 1];
    const freeDofs = [];
    for (let i = 0; i < dof; i++) {
      if (!fixedDofs.includes(i)) freeDofs.push(i);
    }

    const reducedK = freeDofs.map((i) => freeDofs.map((j) => K[i][j]));
    const reducedF = freeDofs.map((i) => nodalForces[i] || 0);

    const uFree = linearSolve(reducedK, reducedF);
    if (!uFree) {
      return { success: false, error: 'Structure forms a mechanism or is unstable under the applied constraints.' };
    }

    const u = new Array(dof).fill(0);
    freeDofs.forEach((d, i) => { u[d] = uFree[i]; });

    // Recover member axial forces: P = (EA/L) * [(ub - ua)·t]
    // Sign convention: Positive (+) = Tension, Negative (-) = Compression
    const memberForces = members.map((m) => {
      const na = nodes[m[0]];
      const nb = nodes[m[1]];
      const dx = nb.x - na.x;
      const dy = nb.y - na.y;
      const L = Math.max(0.0001, Math.hypot(dx, dy));
      const c = dx / L;
      const s = dy / L;

      const du_x = u[2 * m[1]] - u[2 * m[0]];
      const du_y = u[2 * m[1] + 1] - u[2 * m[0] + 1];
      const delta = du_x * c + du_y * s;
      const axialForce_kN = ((E * A * 1e-6) / L) * delta;
      return axialForce_kN;
    });

    // Support reactions: R = K*u - F
    const reactions = new Array(dof).fill(0);
    for (let i = 0; i < dof; i++) {
      let ku = 0;
      for (let j = 0; j < dof; j++) ku += K[i][j] * u[j];
      reactions[i] = ku - (nodalForces[i] || 0);
    }

    const pinRx = reactions[2 * pinNode];
    const pinRy = reactions[2 * pinNode + 1];
    const rollerRy = reactions[2 * rollerNode + 1];

    return {
      success: true,
      displacements: u,
      memberForces: memberForces,
      reactions: {
        pinRx,
        pinRy,
        rollerRy
      }
    };
  }

  const SolverModule = {
    linearSolve,
    solveTrussFEA
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SolverModule;
  } else {
    root.SolverModule = SolverModule;
    root.linearSolveStable = linearSolve;
  }
})(typeof window !== 'undefined' ? window : global);
