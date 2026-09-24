/**
 * Structural Design Studio — Parametric 2D Truss Geometry Generator
 * Supports Howe, Pratt, Warren (with verticals), and Fink roof truss configurations.
 */

(function(root) {
  'use strict';

  function generateTruss(params) {
    const type = params.truss || 'Howe';
    const span = Math.max(0.1, Number(params.span) || 16);
    const n = Math.max(4, Math.round(Number(params.panels) || 8));
    const slopeDeg = Number(params.slope) || 10;
    const W = span / n;
    const rise = Math.max(0.30, (span / 2) * Math.tan(slopeDeg * Math.PI / 180));
    const eaveGap = 0.75; // Truss depth at eave for structural connection

    const nodes = [];
    // Bottom chord nodes: index 0 to n
    for (let i = 0; i <= n; i++) {
      nodes.push({ x: i * W, y: 0, tag: 'bottom' });
    }

    // Top chord nodes: index n+1 to 2n+1
    for (let i = 0; i <= n; i++) {
      const y = eaveGap + rise * (1 - Math.abs(i - n / 2) / (n / 2));
      nodes.push({ x: i * W, y: y, tag: 'top' });
    }

    const m = [];
    const T = (i) => n + 1 + i;

    // Chords
    for (let i = 0; i < n; i++) {
      m.push([i, i + 1, 'bottom_chord']);
      m.push([T(i), T(i + 1), 'top_chord']);
    }

    if (type === 'Pratt') {
      // Pratt: Verticals in compression, diagonals tension (sloping up towards apex)
      for (let i = 0; i <= n; i++) m.push([i, T(i), 'vertical']);
      for (let i = 0; i < n; i++) {
        if (i < n / 2) m.push([i, T(i + 1), 'diagonal']);
        else m.push([i + 1, T(i), 'diagonal']);
      }
    } else if (type === 'Howe') {
      // Howe: Diagonals in compression (sloping down towards center), verticals tension
      for (let i = 0; i <= n; i++) m.push([i, T(i), 'vertical']);
      for (let i = 0; i < n; i++) {
        if (i < n / 2) m.push([i + 1, T(i), 'diagonal']);
        else m.push([i, T(i + 1), 'diagonal']);
      }
    } else if (type === 'Warren') {
      // Warren with vertical panel posts
      for (let i = 0; i <= n; i++) m.push([i, T(i), 'vertical']);
      for (let i = 0; i < n; i++) {
        if (i % 2 === 0) m.push([i, T(i + 1), 'diagonal']);
        else m.push([T(i), i + 1, 'diagonal']);
      }
    } else {
      // Fink fan truss
      for (let i = 0; i <= n; i++) m.push([i, T(i), 'vertical']);
      const mid = Math.floor(n / 2);
      for (let i = 0; i < mid; i++) m.push([i, T(i + 1), 'diagonal']);
      for (let i = mid; i < n; i++) m.push([i + 1, T(i), 'diagonal']);
      for (let i = 0; i < mid - 1; i++) m.push([i, T(i + 2), 'diagonal']);
      for (let i = mid + 1; i < n; i++) m.push([i + 1, T(i - 1), 'diagonal']);
    }

    return {
      nodes: nodes,
      m: m,
      pin: 0,
      roller: n,
      span: span,
      rise: rise,
      panels: n
    };
  }

  function getV6Truss(state) {
    const t = generateTruss(state);
    const h = Number(state.height) || 0;
    return {
      nodes: t.nodes.map((n, i) => ({ x: n.x, y: n.y + h, i, tag: n.tag })),
      members: t.m.map((q, idx) => ({ a: q[0], b: q[1], type: q[2], idx })),
      pin: t.pin,
      roller: t.roller,
      span: t.span,
      rise: t.rise,
      names: t.nodes.map((_, i) => 'N' + (i + 1))
    };
  }

  const GeometryModule = {
    generateTruss,
    getV6Truss
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = GeometryModule;
  } else {
    root.GeometryModule = GeometryModule;
    root.truss = () => generateTruss(root.S || {});
    root.v6Truss = () => getV6Truss(root.S || {});
  }
})(typeof window !== 'undefined' ? window : global);
