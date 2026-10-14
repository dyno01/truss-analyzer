/**
 * Structural Design Studio — Application State & Utilities
 */

(function(root) {
  'use strict';

  // Default design configuration (Group G4 Howe Roof Truss assignment)
  const defaultState = {
    group: 'G4',
    loc: 'Gaya',
    truss: 'Howe',
    span: 16,
    length: 98,
    height: 12,
    spacing: 4,
    panels: 6,
    slope: 26.57,
    overhang: 0.6,
    section: 'ISA 75×75×6',
    grade: 'E250',
    purlin: 'ISMC 125',
    purlinSpacing: 1.4,
    column: 'ISMC 125',
    K: 1.0,
    lacing: 0.6,
    connection: 'Welded',
    weldSize: 6,
    weldLength: 65,
    boltDia: 16,
    roof: 'AC',
    cpi: 0.2,
    Vb: 39,
    cpe: -0.8,
    terrain: 2,
    buildingType: 'industrial',
    deflectionLimit: 180,
    fabrication: 'shop',
    k3: 1.0,
    k4: 1.0,
    stabilitySystem: 'not_specified',
    step: 0,
    view: '3d',
    selected: null,
    frameCountManual: null,
    panelsOpen: true,
    workflowOpen: false,
    layers: {
      frames: true,
      purlins: true,
      roof: true,
      columns: true,
      lacing: true,
      bracing: true,
      labels: true,
      loads: true,
      grid: true
    }
  };

  const S = Object.assign({}, defaultState);

  function frameCount() {
    if (Number.isFinite(S.frameCountManual) && S.frameCountManual >= 2) {
      return Math.min(80, Math.round(S.frameCountManual));
    }
    return Math.max(2, Math.ceil((Number(S.length) || 54) / (Number(S.spacing) || 4)) + 1);
  }

  function escSafe(v) {
    return String(v ?? '').replace(/[&<>"']/g, function(m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }

  function stabilityText() {
    const map = {
      not_specified: 'Not specified / assess separately',
      single_diagonal: 'Single diagonal',
      x_bracing: 'X-bracing',
      k_bracing: 'K-bracing',
      portalised_bay: 'Portalised / moment-resisting bay'
    };
    return map[S.stabilitySystem] || 'Not specified / assess separately';
  }

  const StateModule = {
    S,
    defaultState,
    frameCount,
    escSafe,
    stabilityText
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = StateModule;
  } else {
    root.StateModule = StateModule;
    root.S = S;
    root.frameCount = frameCount;
    root.escSafe = escSafe;
    root.stabilityText = stabilityText;
  }
})(typeof window !== 'undefined' ? window : global);
