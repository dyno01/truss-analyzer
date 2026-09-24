/**
 * Structural Design Studio — Main Application Controller
 * Handles DOM bindings, input synchronization, and refresh orchestration.
 */

(function(root) {
  'use strict';

  function el(id) {
    return document.getElementById(id);
  }

  function syncInputs() {
    const S = root.S;
    const G = (root.GROUPS && root.GROUPS[S.group]) || {};

    if (el('group')) el('group').value = S.group;
    if (el('loc')) el('loc').value = G.loc || 'Custom';
    if (el('terrain')) el('terrain').value = 'Cat ' + (S.terrain || G.terrain || 2);

    if (el('span')) el('span').value = S.span;
    if (el('length')) el('length').value = S.length;
    if (el('height')) el('height').value = S.height;
    if (el('spacing')) el('spacing').value = S.spacing;
    if (el('frames')) el('frames').value = root.frameCount();

    if (el('truss')) el('truss').value = S.truss;
    if (el('panels')) el('panels').value = S.panels;
    if (el('slope')) el('slope').value = S.slope;
    if (el('overhang')) el('overhang').value = S.overhang;

    if (el('section')) el('section').value = S.section;
    if (el('purlin')) el('purlin').value = S.purlin;
    if (el('purlinSpacing')) el('purlinSpacing').value = S.purlinSpacing;
    if (el('column')) el('column').value = S.column;

    if (el('K')) el('K').value = S.K;
    if (el('lacing')) el('lacing').value = S.lacing;
    if (el('weldSize')) el('weldSize').value = S.weldSize;
    if (el('weldLength')) el('weldLength').value = S.weldLength;

    const stab = el('stabilitySystem');
    if (stab) stab.value = S.stabilitySystem || 'not_specified';

    if (el('roof')) el('roof').value = S.roof;
    if (el('cpi')) el('cpi').value = S.cpi;
    if (el('Vb')) el('Vb').value = S.Vb;
    if (el('cpe')) el('cpe').value = S.cpe;

    ['weld', 'bolt'].forEach((id) => {
      const btn = el(id);
      if (btn) btn.classList.toggle('active', S.connection === (id === 'weld' ? 'Welded' : 'Bolted'));
    });

    document.querySelectorAll('[data-grade]').forEach((b) => {
      b.classList.toggle('active', b.dataset.grade === S.grade);
    });

    document.querySelectorAll('[data-layer]').forEach((c) => {
      c.checked = !!S.layers[c.dataset.layer];
    });

    const statusBadge = el('status');
    if (statusBadge && root.stableAnalysis) {
      const res = root.stableAnalysis();
      const passes = !res.mechanism && res.checks && res.checks.every(x => x.pass);
      statusBadge.textContent = passes ? 'IS 800 PASS' : 'CHECK NEEDED';
      statusBadge.style.borderColor = passes ? 'var(--ok)' : 'var(--bad)';
      statusBadge.style.color = passes ? 'var(--ok)' : 'var(--bad)';
    }
  }

  function refresh() {
    syncInputs();
    if (root.build) root.build();
    if (root.InspectorModule) {
      root.InspectorModule.renderInspector();
      root.InspectorModule.refreshAssignmentSnapshot();
      root.InspectorModule.refreshRecommendedInputs();
    }
    if (root.refreshStudy) root.refreshStudy();
  }

  function bindUI() {
    const S = root.S;

    // Populate problem groups
    if (el('group') && root.GROUPS) {
      el('group').innerHTML = '';
      Object.keys(root.GROUPS).forEach((k) => {
        const opt = document.createElement('option');
        opt.value = k;
        opt.textContent = `${k} · ${root.GROUPS[k].loc} (${root.GROUPS[k].span}m ${root.GROUPS[k].truss})`;
        el('group').appendChild(opt);
      });
    }

    // Populate truss types
    if (el('truss')) {
      el('truss').innerHTML = '';
      ['Warren', 'Pratt', 'Howe', 'Fink'].forEach((x) => {
        const opt = document.createElement('option');
        opt.textContent = x;
        el('truss').appendChild(opt);
      });
    }

    // Populate angle sections
    if (el('section') && root.Standards && root.Standards.ANGLES) {
      el('section').innerHTML = '';
      Object.keys(root.Standards.ANGLES).forEach((x) => {
        const opt = document.createElement('option');
        opt.textContent = x;
        el('section').appendChild(opt);
      });
    }

    // Populate channel sections for column and purlin
    if (root.Standards && root.Standards.CHANNELS) {
      if (el('column')) {
        el('column').innerHTML = '';
        Object.keys(root.Standards.CHANNELS).forEach((x) => {
          const opt = document.createElement('option');
          opt.textContent = x;
          el('column').appendChild(opt);
        });
      }
      if (el('purlin')) {
        el('purlin').innerHTML = '';
        Object.keys(root.Standards.CHANNELS).forEach((x) => {
          const opt = document.createElement('option');
          opt.textContent = x;
          el('purlin').appendChild(opt);
        });
      }
    }

    // Problem Group switch
    if (el('group')) {
      el('group').onchange = (e) => {
        S.group = e.target.value;
        const g = (root.GROUPS && root.GROUPS[S.group]) || {};
        Object.assign(S, {
          truss: g.truss,
          span: g.span,
          length: g.length,
          height: g.height,
          roof: g.roof,
          connection: g.conn,
          cpi: g.cpi,
          Vb: g.Vb,
          terrain: g.terrain,
          frameCountManual: null,
          selected: null
        });
        refresh();
      };
    }

    // Numeric inputs
    const numBindings = [
      ['span', 'span'], ['length', 'length'], ['height', 'height'], ['spacing', 'spacing'],
      ['panels', 'panels'], ['slope', 'slope'], ['overhang', 'overhang'],
      ['frames', 'frameCountManual'], ['purlinSpacing', 'purlinSpacing'],
      ['lacing', 'lacing'], ['weldSize', 'weldSize'], ['weldLength', 'weldLength'],
      ['cpi', 'cpi'], ['Vb', 'Vb'], ['cpe', 'cpe']
    ];

    numBindings.forEach(([elemId, key]) => {
      const input = el(elemId);
      if (!input) return;
      input.addEventListener('change', (e) => {
        S[key] = Number(e.target.value);
        refresh();
      });
    });

    // Select inputs
    const selectBindings = [
      ['truss', 'truss'], ['section', 'section'], ['purlin', 'purlin'],
      ['column', 'column'], ['roof', 'roof'], ['K', 'K']
    ];
    selectBindings.forEach(([elemId, key]) => {
      const input = el(elemId);
      if (!input) return;
      input.addEventListener('change', (e) => {
        S[key] = key === 'K' ? Number(e.target.value) : e.target.value;
        refresh();
      });
    });

    const stab = el('stabilitySystem');
    if (stab) {
      stab.onchange = (e) => {
        S.stabilitySystem = e.target.value;
        refresh();
      };
    }

    const applyRecBtn = el('applyRecommendedInputs');
    if (applyRecBtn) {
      applyRecBtn.onclick = () => {
        if (root.InspectorModule) root.InspectorModule.applyRecommendedInputs();
      };
    }

    if (el('weld')) el('weld').onclick = () => { S.connection = 'Welded'; refresh(); };
    if (el('bolt')) el('bolt').onclick = () => { S.connection = 'Bolted'; refresh(); };

    document.querySelectorAll('[data-grade]').forEach((b) => {
      b.onclick = () => { S.grade = b.dataset.grade; refresh(); };
    });

    document.querySelectorAll('[data-layer]').forEach((c) => {
      c.onchange = (e) => {
        S.layers[e.target.dataset.layer] = e.target.checked;
        refresh();
      };
    });

    document.querySelectorAll('[data-view]').forEach((b) => {
      b.onclick = () => {
        S.view = b.dataset.view;
        document.querySelectorAll('[data-view]').forEach((x) => x.classList.toggle('active', x === b));
        if (root.fit) root.fit(S.view);
      };
    });

    document.querySelectorAll('.solution-tab').forEach((b) => {
      b.onclick = () => {
        if (root.setSolutionStep) root.setSolutionStep(Number(b.dataset.solutionStep) || 0);
      };
    });

    if (el('fit') && root.fit) el('fit').onclick = () => root.fit();
    if (el('reset')) el('reset').onclick = () => location.reload();
    if (el('mFit') && root.fit) el('mFit').onclick = () => root.fit();

    if (el('mLeft')) el('mLeft').onclick = () => el('left')?.classList.toggle('collapsed');
    if (el('mRight')) el('mRight').onclick = () => el('right')?.classList.toggle('collapsed');

    if (el('toggleLeft')) el('toggleLeft').onclick = () => el('left')?.classList.toggle('panel-hidden');
    if (el('toggleRight')) el('toggleRight').onclick = () => el('right')?.classList.toggle('panel-hidden');

    if (el('toggleStudy')) el('toggleStudy').onclick = () => root.openWorkflow && root.openWorkflow();
    if (el('closeWorkflow')) el('closeWorkflow').onclick = () => el('workflowOverlay')?.classList.remove('open');

    document.querySelectorAll('.workflow-step').forEach((b) => {
      b.onclick = () => root.renderWorkflow && root.renderWorkflow(Number(b.dataset.step) || 0);
    });

    const overlay = el('workflowOverlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('open');
      });
    }
  }

  function initApp() {
    if (root.SceneModule) root.SceneModule.initScene();
    bindUI();
    if (root.ResizerModule) root.ResizerModule.initResizer();
    refresh();
  }

  root.refresh = refresh;
  root.syncInputs = syncInputs;
  root.initApp = initApp;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})(typeof window !== 'undefined' ? window : global);
