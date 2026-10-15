/**
 * Structural Design Studio — Main Application Controller
 * Handles DOM bindings, input synchronization, and refresh orchestration.
 * Updated for exact Figma UI interactions and synchronization.
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
    if (el('loc')) el('loc').value = S.loc !== undefined ? S.loc : (G.loc || 'Nashik');
    if (el('terrain')) el('terrain').value = String(S.terrain || G.terrain || 2);

    if (el('span')) el('span').value = S.span;
    if (el('length')) el('length').value = S.length;
    if (el('height')) el('height').value = S.height;
    if (el('spacing')) el('spacing').value = S.spacing;
    if (el('frames')) el('frames').value = root.frameCount ? root.frameCount() : 15;

    if (el('truss')) el('truss').value = S.truss;
    if (el('panels')) el('panels').value = S.panels;
    if (el('slope')) el('slope').value = S.slope;
    if (el('overhang')) el('overhang').value = S.overhang;

    if (el('rafterSection')) el('rafterSection').value = S.rafterSection || S.section || 'ISA 75×75×6';
    if (el('tieSection')) el('tieSection').value = S.tieSection || S.section || 'ISA 60×60×6';
    if (el('strutSection')) el('strutSection').value = S.strutSection || S.section || 'ISA 70×70×6';
    if (el('diagonalSection')) el('diagonalSection').value = S.diagonalSection || S.section || 'ISA 50×50×6';
    if (el('section')) el('section').value = S.rafterSection || S.section || 'ISA 75×75×6';

    if (el('mInpRafterSection')) el('mInpRafterSection').value = S.rafterSection || S.section || 'ISA 75×75×6';
    if (el('mInpTieSection')) el('mInpTieSection').value = S.tieSection || S.section || 'ISA 60×60×6';
    if (el('mInpStrutSection')) el('mInpStrutSection').value = S.strutSection || S.section || 'ISA 70×70×6';
    if (el('mInpDiagonalSection')) el('mInpDiagonalSection').value = S.diagonalSection || S.section || 'ISA 50×50×6';
    if (el('mInpPurlinSection')) el('mInpPurlinSection').value = S.purlin;
    if (el('mInpColSection')) el('mInpColSection').value = S.column;
    if (el('mInpTrussSection')) el('mInpTrussSection').value = S.rafterSection || S.section || 'ISA 75×75×6';

    if (el('purlin')) el('purlin').value = S.purlin;
    if (el('purlinSpacing')) el('purlinSpacing').value = S.purlinSpacing;
    if (el('column')) el('column').value = S.column;

    if (el('K')) {
      el('K').value = String(S.K);
      if (!el('K').value) el('K').value = Number(S.K).toFixed(1);
    }
    if (el('lacing')) el('lacing').value = S.lacing;
    if (el('weldSize')) el('weldSize').value = S.weldSize;
    if (el('weldLength')) el('weldLength').value = S.weldLength;

    const stab = el('stabilitySystem');
    if (stab) stab.value = S.stabilitySystem || 'not_specified';

    if (el('roof')) el('roof').value = S.roof;
    if (el('cpi')) el('cpi').value = S.cpi;
    if (el('Vb')) el('Vb').value = S.Vb;
    if (el('cpe')) el('cpe').value = S.cpe;

    // Dead load components breakdown
    const wSheet = (S.wSheeting !== undefined && S.wSheeting !== null && S.wSheeting !== '') ? Number(S.wSheeting) : (S.roof === 'AC' ? 170 : 130);
    const wPurl = (S.wPurlins !== undefined && S.wPurlins !== null && S.wPurlins !== '') ? Number(S.wPurlins) : 100;
    const wBrace = (S.wBracing !== undefined && S.wBracing !== null && S.wBracing !== '') ? Number(S.wBracing) : 12;
    const wTrussAuto = ((Number(S.span) || 16) / 3 + 5) * 10;
    const wTruss = (S.wSelf !== null && S.wSelf !== undefined && S.wSelf !== '' && !isNaN(Number(S.wSelf))) ? Number(S.wSelf) : wTrussAuto;

    if (el('wSheeting')) el('wSheeting').value = wSheet;
    if (el('wPurlins')) el('wPurlins').value = wPurl;
    if (el('wBracing')) el('wBracing').value = wBrace;
    if (el('wSelf')) {
      el('wSelf').value = (S.wSelf !== null && S.wSelf !== undefined && S.wSelf !== '') ? S.wSelf : '';
      el('wSelf').placeholder = `Auto (${wTrussAuto.toFixed(1)})`;
    }

    const dlSumBadge = el('dlSumBadge');
    if (dlSumBadge) {
      const sumDL = wSheet + wPurl + wBrace + wTruss;
      dlSumBadge.textContent = `wDL = ${sumDL.toFixed(1)} N/m²`;
    }

    if (el('buildingType')) el('buildingType').value = S.buildingType || 'industrial';
    if (el('deflectionLimit')) el('deflectionLimit').value = String(S.deflectionLimit || 180);
    if (el('fabrication')) el('fabrication').value = S.fabrication || 'shop';
    if (el('k1')) el('k1').value = String(S.k1 !== undefined ? S.k1 : 1.0);
    if (el('k2')) el('k2').value = String(S.k2 !== undefined ? S.k2 : 1.05);

    if (el('k3')) {
      const val = Number(S.k3 !== undefined ? S.k3 : 1.0);
      const match = Array.from(el('k3').options).find(o => Math.abs(parseFloat(o.value) - val) < 0.001);
      if (match) el('k3').value = match.value;
      else el('k3').value = '1.0';
    }
    if (el('k4')) {
      const val = Number(S.k4 !== undefined ? S.k4 : 1.0);
      const match = Array.from(el('k4').options).find(o => Math.abs(parseFloat(o.value) - val) < 0.001);
      if (match) el('k4').value = match.value;
      else el('k4').value = '1.0';
    }
    if (el('kd')) el('kd').value = String(S.kd !== undefined ? S.kd : 0.90);
    if (el('ka')) el('ka').value = String(S.ka !== undefined ? S.ka : 1.00);
    if (el('kc')) el('kc').value = String(S.kc !== undefined ? S.kc : 0.90);

    // Synchronize visual badges & overlays
    const grpAvatar = el('groupAvatar');
    if (grpAvatar) grpAvatar.textContent = S.group === 'Custom' ? 'CUSTOM' : S.group;

    const grpTag = el('groupTag');
    if (grpTag) grpTag.textContent = S.group === 'Custom' ? 'CUSTOM DESIGN' : 'PRESET ' + S.group;

    const metaTitle = el('modelMetaTitle');
    if (metaTitle) metaTitle.textContent = S.group === 'Custom' ? `${S.loc || 'Custom'} · Industrial roof truss` : `${S.group} · Industrial roof truss`;

    const metaSub = el('modelMetaSub');
    if (metaSub) metaSub.textContent = `${S.truss}   /   ${Number(S.span).toFixed(0)} m span   /   ${root.frameCount ? root.frameCount() : 15} frames`;

    const cube = el('cubeViewLabel');
    if (cube) {
      if (root.isUserCameraMoved && root.isUserCameraMoved()) {
        cube.textContent = 'ORBIT';
      } else {
        cube.textContent = (S.view || '3D').toUpperCase();
      }
    }

    if (root.isUserCameraMoved && root.isUserCameraMoved()) {
      document.querySelectorAll('[data-view]').forEach((b) => b.classList.remove('active'));
    } else {
      document.querySelectorAll('[data-view]').forEach((b) => {
        b.classList.toggle('active', b.dataset.view === S.view);
      });
    }

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
      statusBadge.className = 'status ' + (passes ? 'ok' : '');
    }

    if (typeof window !== 'undefined' && window.syncCustomSelects) window.syncCustomSelects();
    else if (root.syncCustomSelects) root.syncCustomSelects();
    if (root.updateUnitPositions) root.updateUnitPositions();
  }

  function refresh() {
    syncInputs();
    if (root.build) root.build();
    if (root.updateSelectionHighlight) root.updateSelectionHighlight();
    if (root.InspectorModule) {
      root.InspectorModule.renderInspector();
      root.InspectorModule.refreshAssignmentSnapshot();
      root.InspectorModule.refreshRecommendedInputs();
    }
    if (root.refreshStudy) root.refreshStudy();
    if (root.syncCustomSelects) root.syncCustomSelects();
    if (root.MobileUI && root.MobileUI.sync) root.MobileUI.sync();
    window.dispatchEvent(new CustomEvent('analysisUpdated'));
  }

  function bindUI() {
    const S = root.S;

    // Helper to transition state to Custom whenever user tweaks any parameter
    function markCustom() {
      if (S.group !== 'Custom') {
        S.group = 'Custom';
        if (el('group')) el('group').value = 'Custom';
        const grpAvatar = el('groupAvatar');
        if (grpAvatar) grpAvatar.textContent = 'CUSTOM';
        const grpTag = el('groupTag');
        if (grpTag) grpTag.textContent = 'CUSTOM DESIGN';
        const metaTitle = el('modelMetaTitle');
        if (metaTitle) metaTitle.textContent = `${S.loc || 'Custom'} · Industrial roof truss`;
        if (root.syncCustomSelects && el('group')) root.syncCustomSelects(el('group'));
      }
    }
    root.markCustom = markCustom;

    // Populate design presets
    if (el('group') && root.GROUPS) {
      el('group').innerHTML = '';
      const customOpt = document.createElement('option');
      customOpt.value = 'Custom';
      customOpt.textContent = 'Custom Configuration';
      el('group').appendChild(customOpt);

      Object.keys(root.GROUPS).forEach((k) => {
        if (k === 'Custom') return;
        const opt = document.createElement('option');
        opt.value = k;
        opt.textContent = `Preset ${k} · ${root.GROUPS[k].loc} (${root.GROUPS[k].span}m ${root.GROUPS[k].truss})`;
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
    const angleElemIds = ['section', 'rafterSection', 'tieSection', 'strutSection', 'diagonalSection'];
    if (root.Standards && root.Standards.ANGLES) {
      const angleKeys = Object.keys(root.Standards.ANGLES);
      angleElemIds.forEach((id) => {
        const selectElem = el(id);
        if (selectElem) {
          selectElem.innerHTML = '';
          angleKeys.forEach((x) => {
            const opt = document.createElement('option');
            opt.value = x;
            opt.textContent = x;
            selectElem.appendChild(opt);
          });
        }
      });
    }

    // Populate comprehensive sections for column and purlin from Steel Tables
    if (root.Standards) {
      if (el('purlin')) {
        el('purlin').innerHTML = '';

        // Group 1: ISMC Channels
        const grpISMC = document.createElement('optgroup');
        grpISMC.label = 'Medium Channels (ISMC) — Standard Purlin';
        Object.keys(root.Standards.CHANNELS || {}).filter(k => k.startsWith('ISMC')).forEach(k => {
          const opt = document.createElement('option');
          opt.value = k;
          opt.textContent = `${k} (${root.Standards.CHANNELS[k].wt} kg/m)`;
          grpISMC.appendChild(opt);
        });
        el('purlin').appendChild(grpISMC);

        // Group 2: ISLC Channels
        const grpISLC = document.createElement('optgroup');
        grpISLC.label = 'Light Channels (ISLC) — Economical Purlin';
        Object.keys(root.Standards.CHANNELS || {}).filter(k => k.startsWith('ISLC')).forEach(k => {
          const opt = document.createElement('option');
          opt.value = k;
          opt.textContent = `${k} (${root.Standards.CHANNELS[k].wt} kg/m)`;
          grpISLC.appendChild(opt);
        });
        el('purlin').appendChild(grpISLC);

        // Group 3: ISJC Channels
        const grpISJC = document.createElement('optgroup');
        grpISJC.label = 'Junior Channels (ISJC) — Lightweight Purlin';
        Object.keys(root.Standards.CHANNELS || {}).filter(k => k.startsWith('ISJC')).forEach(k => {
          const opt = document.createElement('option');
          opt.value = k;
          opt.textContent = `${k} (${root.Standards.CHANNELS[k].wt} kg/m)`;
          grpISJC.appendChild(opt);
        });
        el('purlin').appendChild(grpISJC);

        // Group 4: Angle Sections (ISA)
        if (root.Standards.ANGLES) {
          const grpISA = document.createElement('optgroup');
          grpISA.label = 'Equal Angles (ISA) — Angle Purlin';
          Object.keys(root.Standards.ANGLES).forEach(k => {
            const opt = document.createElement('option');
            opt.value = k;
            opt.textContent = `${k} (${root.Standards.ANGLES[k].wt} kg/m)`;
            grpISA.appendChild(opt);
          });
          el('purlin').appendChild(grpISA);
        }
      }

      if (el('column')) {
        el('column').innerHTML = '';

        // Group 1: Built-up 2× ISMC
        const grpColISMC = document.createElement('optgroup');
        grpColISMC.label = 'Built-up 2× ISMC (Medium Channels)';
        Object.keys(root.Standards.CHANNELS || {}).filter(k => k.startsWith('ISMC')).forEach(k => {
          const opt = document.createElement('option');
          opt.value = k;
          opt.textContent = `2 × ${k} (${(root.Standards.CHANNELS[k].wt * 2).toFixed(1)} kg/m)`;
          grpColISMC.appendChild(opt);
        });
        el('column').appendChild(grpColISMC);

        // Group 2: Built-up 2× ISLC
        const grpColISLC = document.createElement('optgroup');
        grpColISLC.label = 'Built-up 2× ISLC (Light Channels)';
        Object.keys(root.Standards.CHANNELS || {}).filter(k => k.startsWith('ISLC')).forEach(k => {
          const opt = document.createElement('option');
          opt.value = k;
          opt.textContent = `2 × ${k} (${(root.Standards.CHANNELS[k].wt * 2).toFixed(1)} kg/m)`;
          grpColISLC.appendChild(opt);
        });
        el('column').appendChild(grpColISLC);

        // Group 3: Built-up 2× ISJC
        const grpColISJC = document.createElement('optgroup');
        grpColISJC.label = 'Built-up 2× ISJC (Junior Channels)';
        Object.keys(root.Standards.CHANNELS || {}).filter(k => k.startsWith('ISJC')).forEach(k => {
          const opt = document.createElement('option');
          opt.value = k;
          opt.textContent = `2 × ${k} (${(root.Standards.CHANNELS[k].wt * 2).toFixed(1)} kg/m)`;
          grpColISJC.appendChild(opt);
        });
        el('column').appendChild(grpColISJC);

        // Group 4: Rolled Heavy Columns & Beams (ISHB)
        if (root.Standards.BEAMS) {
          const grpISHB = document.createElement('optgroup');
          grpISHB.label = 'Heavy Columns & Beams (ISHB)';
          Object.keys(root.Standards.BEAMS).filter(k => k.startsWith('ISHB')).forEach(k => {
            const opt = document.createElement('option');
            opt.value = k;
            opt.textContent = `${k} (${root.Standards.BEAMS[k].wt} kg/m)`;
            grpISHB.appendChild(opt);
          });
          el('column').appendChild(grpISHB);

          // Group 5: Wide Flange Beams & Columns (ISWB)
          const grpISWB = document.createElement('optgroup');
          grpISWB.label = 'Wide Flange Beams & Columns (ISWB)';
          Object.keys(root.Standards.BEAMS).filter(k => k.startsWith('ISWB')).forEach(k => {
            const opt = document.createElement('option');
            opt.value = k;
            opt.textContent = `${k} (${root.Standards.BEAMS[k].wt} kg/m)`;
            grpISWB.appendChild(opt);
          });
          el('column').appendChild(grpISWB);

          // Group 6: Medium Beams (ISMB)
          const grpISMB = document.createElement('optgroup');
          grpISMB.label = 'Medium Weight Beams (ISMB)';
          Object.keys(root.Standards.BEAMS).filter(k => k.startsWith('ISMB')).forEach(k => {
            const opt = document.createElement('option');
            opt.value = k;
            opt.textContent = `${k} (${root.Standards.BEAMS[k].wt} kg/m)`;
            grpISMB.appendChild(opt);
          });
          el('column').appendChild(grpISMB);
        }
      }
    }

    // Design Preset switch
    if (el('group')) {
      el('group').onchange = (e) => {
        S.group = e.target.value;
        if (S.group !== 'Custom') {
          const g = (root.GROUPS && root.GROUPS[S.group]) || {};
          Object.assign(S, {
            loc: g.loc,
            truss: g.truss,
            span: g.span,
            length: g.length,
            height: g.height,
            spacing: g.spacing !== undefined ? g.spacing : S.spacing,
            panels: g.panels !== undefined ? g.panels : S.panels,
            roof: g.roof,
            connection: g.conn,
            cpi: g.cpi,
            Vb: g.Vb,
            terrain: g.terrain,
            frameCountManual: null,
            selected: null
          });
        }
        refresh();
      };
    }

    // Location and Terrain inputs
    if (el('loc')) {
      const handleLoc = (e) => {
        S.loc = e.target.value;
        markCustom();
        refresh();
      };
      el('loc').addEventListener('input', handleLoc);
      el('loc').addEventListener('change', handleLoc);
    }

    if (el('terrain')) {
      el('terrain').addEventListener('change', (e) => {
        S.terrain = Number(e.target.value) || 2;
        markCustom();
        refresh();
      });
    }

    // Numeric inputs
    const numBindings = [
      ['span', 'span'], ['length', 'length'], ['height', 'height'], ['spacing', 'spacing'],
      ['panels', 'panels'], ['slope', 'slope'], ['overhang', 'overhang'],
      ['frames', 'frameCountManual'], ['purlinSpacing', 'purlinSpacing'],
      ['lacing', 'lacing'], ['weldSize', 'weldSize'], ['weldLength', 'weldLength'],
      ['cpi', 'cpi'], ['Vb', 'Vb'], ['cpe', 'cpe'],
      ['wSheeting', 'wSheeting'], ['wPurlins', 'wPurlins'], ['wBracing', 'wBracing'],
      ['k1', 'k1'], ['k2', 'k2'], ['kd', 'kd'], ['ka', 'ka'], ['kc', 'kc']
    ];

    numBindings.forEach(([elemId, key]) => {
      const input = el(elemId);
      if (!input) return;
      input.addEventListener('change', (e) => {
        S[key] = Number(e.target.value);
        markCustom();
        refresh();
      });
    });

    const inpSelf = el('wSelf');
    if (inpSelf) {
      inpSelf.addEventListener('change', (e) => {
        const val = e.target.value.trim();
        S.wSelf = val === '' ? null : Number(val);
        markCustom();
        refresh();
      });
    }

    // Real-time dynamic updates for Dead Load breakdown card badge
    function updateLiveDeadLoadSum() {
      const ws = el('wSheeting') ? Number(el('wSheeting').value) || 0 : (S.roof === 'AC' ? 170 : 130);
      const wp = el('wPurlins') ? Number(el('wPurlins').value) || 0 : 100;
      const wb = el('wBracing') ? Number(el('wBracing').value) || 0 : 12;
      const wSelfInp = el('wSelf');
      const wSelfVal = (wSelfInp && wSelfInp.value.trim() !== '') ? Number(wSelfInp.value) : (((Number(S.span) || 16) / 3 + 5) * 10);
      const total = ws + wp + wb + wSelfVal;
      const badge = el('dlSumBadge');
      if (badge) badge.textContent = `wDL = ${total.toFixed(1)} N/m²`;
    }

    ['wSheeting', 'wPurlins', 'wBracing', 'wSelf'].forEach((id) => {
      const inp = el(id);
      if (inp) {
        inp.addEventListener('input', updateLiveDeadLoadSum);
      }
    });

    // Measure canvas for dynamically positioning inline units snug to the typed value
    const measureCanvas = document.createElement('canvas');
    const measureCtx = measureCanvas.getContext('2d');

    function updateUnitPositions() {
      document.querySelectorAll('.input-with-unit').forEach((wrapper) => {
        const input = wrapper.querySelector('input');
        const unit = wrapper.querySelector('.unit');
        if (!input || !unit) return;

        const rawVal = input.value !== undefined && input.value !== null ? String(input.value) : '';
        const displayVal = rawVal !== '' ? rawVal : (input.placeholder || '');
        if (!displayVal) {
          unit.style.opacity = '0';
          return;
        }
        unit.style.opacity = '1';

        try {
          const cs = window.getComputedStyle(input);
          const font = `${cs.fontWeight || '400'} ${cs.fontSize || '13px'} ${cs.fontFamily || 'Inter, sans-serif'}`;
          measureCtx.font = font;
          const textWidth = measureCtx.measureText(displayVal).width;
          const padLeft = parseFloat(cs.paddingLeft) || 10;
          const leftPos = Math.round(padLeft + textWidth + 4);
          const wrapperW = wrapper.clientWidth || 160;
          const unitW = unit.offsetWidth || 20;
          const maxLeft = Math.max(padLeft, wrapperW - unitW - 24);
          unit.style.left = Math.min(leftPos, maxLeft) + 'px';
        } catch (err) {
          unit.style.left = '60px';
        }
      });
    }
    root.updateUnitPositions = updateUnitPositions;

    // Custom Increase / Decrease Stepper Spinners
    function setupInputSpinners() {
      // Prevent parent .field from ever having .input-with-unit styling
      document.querySelectorAll('.field.input-with-unit').forEach((f) => f.classList.remove('input-with-unit'));

      document.querySelectorAll('.field input[type="number"], .input-with-unit input[type="number"]').forEach((input) => {
        if (input.disabled) return;

        let container = input.closest('.input-with-unit');
        if (!container) {
          container = document.createElement('div');
          container.className = 'input-with-unit';
          input.parentNode.insertBefore(container, input);
          container.appendChild(input);
        }

        if (container.querySelector('.spin-btns')) return;

        const spinDiv = document.createElement('div');
        spinDiv.className = 'spin-btns';
        spinDiv.innerHTML = `
          <button type="button" class="spin-btn spin-up" title="Increase value" tabindex="-1">▲</button>
          <button type="button" class="spin-btn spin-down" title="Decrease value" tabindex="-1">▼</button>
        `;

        const upBtn = spinDiv.querySelector('.spin-up');
        const downBtn = spinDiv.querySelector('.spin-down');

        const getStep = () => {
          const s = parseFloat(input.step);
          return (!isNaN(s) && s > 0) ? s : 1;
        };

        const changeVal = (delta) => {
          const step = getStep();
          const min = input.min !== '' ? parseFloat(input.min) : -Infinity;
          const max = input.max !== '' ? parseFloat(input.max) : Infinity;
          let cur = parseFloat(input.value) || 0;
          let next = cur + delta * step;
          next = Math.max(min, Math.min(max, +next.toFixed(4)));
          input.value = next;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          updateUnitPositions();
        };

        upBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          changeVal(1);
        });

        downBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          changeVal(-1);
        });

        container.appendChild(spinDiv);

        input.addEventListener('input', updateUnitPositions);
        input.addEventListener('change', updateUnitPositions);
      });
    }

    setupInputSpinners();

    // Custom Styled Dropdown (Replaces stock/macOS native selects)
    function syncCustomSelect(select) {
      if (!select || !select.classList.contains('has-custom-select')) return;
      const customSelect = select.nextElementSibling;
      if (!customSelect || !customSelect.classList.contains('custom-select')) return;

      const labelSpan = customSelect.querySelector('.custom-select-label');
      const menu = customSelect.querySelector('.custom-select-menu');
      if (!labelSpan || !menu) return;

      const hasOptgroups = select.querySelector('optgroup') !== null;
      const currentOptValues = (hasOptgroups ? 'OG:' : '') + Array.from(select.options).map(o => o.value + '::' + o.textContent).join('|');
      if (customSelect.dataset.cachedOpts !== currentOptValues) {
        customSelect.dataset.cachedOpts = currentOptValues;
        menu.innerHTML = '';

        const createOptionDiv = (opt, inGroup) => {
          const optDiv = document.createElement('div');
          optDiv.className = 'custom-select-option' + (inGroup ? ' in-group' : '') + (opt.selected ? ' selected' : '');
          optDiv.dataset.value = opt.value;
          optDiv.textContent = opt.textContent;
          optDiv.addEventListener('click', (e) => {
            e.stopPropagation();
            select.value = opt.value;
            select.dispatchEvent(new Event('input', { bubbles: true }));
            select.dispatchEvent(new Event('change', { bubbles: true }));
            customSelect.classList.remove('open');
            if (customSelect.closest('.field')) customSelect.closest('.field').style.zIndex = '';
            syncCustomSelect(select);
          });
          return optDiv;
        };

        if (hasOptgroups) {
          Array.from(select.children).forEach((child) => {
            if (child.tagName === 'OPTGROUP') {
              const grpHeader = document.createElement('div');
              grpHeader.className = 'custom-select-optgroup-label';
              grpHeader.textContent = child.label;
              menu.appendChild(grpHeader);
              Array.from(child.children).forEach((opt) => {
                menu.appendChild(createOptionDiv(opt, true));
              });
            } else if (child.tagName === 'OPTION') {
              menu.appendChild(createOptionDiv(child, false));
            }
          });
        } else {
          Array.from(select.options).forEach((opt) => {
            menu.appendChild(createOptionDiv(opt, false));
          });
        }
      }

      let selOpt = select.selectedOptions && select.selectedOptions[0];
      if (!selOpt && select.options.length > 0) {
        const numVal = parseFloat(select.value);
        if (!isNaN(numVal)) {
          selOpt = Array.from(select.options).find(o => Math.abs(parseFloat(o.value) - numVal) < 0.001);
          if (selOpt) select.value = selOpt.value;
        }
        if (!selOpt) {
          selOpt = select.options[0];
          select.selectedIndex = 0;
        }
      }
      labelSpan.textContent = selOpt ? selOpt.textContent : (select.value || (select.options[0] ? select.options[0].textContent : ''));
      menu.querySelectorAll('.custom-select-option').forEach((div) => {
        const isMatch = div.dataset.value === String(select.value) ||
          (!isNaN(parseFloat(div.dataset.value)) && !isNaN(parseFloat(select.value)) && Math.abs(parseFloat(div.dataset.value) - parseFloat(select.value)) < 0.001);
        div.classList.toggle('selected', isMatch);
      });
    }

    function setupCustomSelects() {
      document.querySelectorAll('select').forEach((select) => {
        if (select.style.display === 'none' || select.hasAttribute('hidden') || select.type === 'hidden') return;
        if (select.classList.contains('has-custom-select')) {
          syncCustomSelect(select);
          return;
        }

        select.classList.add('has-custom-select');

        const customSelect = document.createElement('div');
        customSelect.className = 'custom-select';

        const trigger = document.createElement('div');
        trigger.className = 'custom-select-trigger';
        trigger.tabIndex = 0;

        const labelSpan = document.createElement('span');
        labelSpan.className = 'custom-select-label';

        const arrowSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        arrowSvg.setAttribute('class', 'custom-select-arrow');
        arrowSvg.setAttribute('viewBox', '0 0 24 24');
        arrowSvg.setAttribute('fill', 'none');
        arrowSvg.setAttribute('stroke', 'currentColor');
        arrowSvg.setAttribute('stroke-width', '2');
        arrowSvg.setAttribute('stroke-linecap', 'round');
        arrowSvg.setAttribute('stroke-linejoin', 'round');
        const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        polyline.setAttribute('points', '6 9 12 15 18 9');
        arrowSvg.appendChild(polyline);

        trigger.appendChild(labelSpan);
        trigger.appendChild(arrowSvg);

        const menu = document.createElement('div');
        menu.className = 'custom-select-menu';

        customSelect.appendChild(trigger);
        customSelect.appendChild(menu);

        select.parentNode.insertBefore(customSelect, select.nextSibling);

        trigger.addEventListener('click', (e) => {
          e.stopPropagation();
          const wasOpen = customSelect.classList.contains('open');
          document.querySelectorAll('.custom-select.open').forEach((el) => {
            if (el !== customSelect) {
              el.classList.remove('open');
              el.classList.remove('open-upward');
              const pf = el.closest('.field, .m-field, .m-insp-member-select-row, .m-step-selector-row');
              if (pf) pf.style.zIndex = '';
              const pa = el.closest('.m-accordion');
              if (pa) pa.style.zIndex = '';
              const pc = el.closest('.m-card, .m-inspector-card');
              if (pc) pc.style.zIndex = '';
            }
          });

          const willOpen = !wasOpen;
          customSelect.classList.toggle('open', willOpen);

          const pf = customSelect.closest('.field, .m-field, .m-insp-member-select-row, .m-step-selector-row');
          const pa = customSelect.closest('.m-accordion');
          const pc = customSelect.closest('.m-card, .m-inspector-card');

          if (willOpen) {
            // Measure available space: if space below is tight (<220px) and space above is larger, open upward
            const rect = trigger.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            const shouldOpenUp = (spaceBelow < 220 && spaceAbove > 160) || (spaceBelow < 180 && spaceAbove > spaceBelow);
            customSelect.classList.toggle('open-upward', shouldOpenUp);

            if (pf) pf.style.zIndex = '120';
            if (pa) pa.style.zIndex = '110';
            if (pc) pc.style.zIndex = '110';

            const selItem = menu.querySelector('.custom-select-option.selected');
            if (selItem) selItem.scrollIntoView({ block: 'nearest' });
          } else {
            customSelect.classList.remove('open-upward');
            if (pf) pf.style.zIndex = '';
            if (pa) pa.style.zIndex = '';
            if (pc) pc.style.zIndex = '';
          }
        });

        trigger.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            trigger.click();
          } else if (e.key === 'Escape') {
            customSelect.classList.remove('open');
            customSelect.classList.remove('open-upward');
            const pf = customSelect.closest('.field, .m-field, .m-insp-member-select-row, .m-step-selector-row');
            if (pf) pf.style.zIndex = '';
            const pa = customSelect.closest('.m-accordion');
            if (pa) pa.style.zIndex = '';
            const pc = customSelect.closest('.m-card, .m-inspector-card');
            if (pc) pc.style.zIndex = '';
          }
        });

        select.addEventListener('change', () => {
          syncCustomSelect(select);
        });

        syncCustomSelect(select);
      });
    }

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.custom-select')) {
        document.querySelectorAll('.custom-select.open').forEach((el) => {
          el.classList.remove('open');
          el.classList.remove('open-upward');
          const pf = el.closest('.field, .m-field, .m-insp-member-select-row, .m-step-selector-row');
          if (pf) pf.style.zIndex = '';
          const pa = el.closest('.m-accordion');
          if (pa) pa.style.zIndex = '';
          const pc = el.closest('.m-card, .m-inspector-card');
          if (pc) pc.style.zIndex = '';
        });
      }
    });

    window.syncCustomSelects = function(targetSelect) {
      if (targetSelect) {
        if (!targetSelect.classList.contains('has-custom-select')) {
          setupCustomSelects();
        } else {
          syncCustomSelect(targetSelect);
        }
      } else {
        setupCustomSelects();
        document.querySelectorAll('select.has-custom-select').forEach(syncCustomSelect);
      }
    };
    root.syncCustomSelects = window.syncCustomSelects;
    root.setupCustomSelects = setupCustomSelects;

    // Select inputs
    const selectBindings = [
      ['truss', 'truss'], ['section', 'section'],
      ['rafterSection', 'rafterSection'], ['tieSection', 'tieSection'],
      ['strutSection', 'strutSection'], ['diagonalSection', 'diagonalSection'],
      ['purlin', 'purlin'],
      ['column', 'column'], ['roof', 'roof'], ['K', 'K'],
      ['buildingType', 'buildingType'], ['deflectionLimit', 'deflectionLimit'],
      ['fabrication', 'fabrication'], ['k3', 'k3'], ['k4', 'k4']
    ];
    selectBindings.forEach(([elemId, key]) => {
      const input = el(elemId);
      if (!input) return;
      input.addEventListener('change', (e) => {
        if (key === 'K' || key === 'deflectionLimit' || key === 'k3' || key === 'k4') {
          S[key] = Number(e.target.value);
        } else {
          S[key] = e.target.value;
          if (key === 'rafterSection') {
            S.section = e.target.value;
            if (el('section')) el('section').value = e.target.value;
          }
          if (key === 'roof') {
            if (e.target.value === 'GI') {
              if (!S.wSheeting || S.wSheeting === 170 || S.wSheeting === 180) S.wSheeting = 130;
            } else if (e.target.value === 'AC') {
              if (!S.wSheeting || S.wSheeting === 130) S.wSheeting = 170;
            }
          }
        }
        markCustom();
        refresh();
      });
    });

    const stab = el('stabilitySystem');
    if (stab) {
      stab.onchange = (e) => {
        S.stabilitySystem = e.target.value;
        markCustom();
        refresh();
      };
    }

    const applyRecBtn = el('applyRecommendedInputs');
    if (applyRecBtn) {
      applyRecBtn.onclick = () => {
        if (root.InspectorModule) root.InspectorModule.applyRecommendedInputs();
        markCustom();
      };
    }

    if (el('weld')) el('weld').onclick = () => { S.connection = 'Welded'; markCustom(); refresh(); };
    if (el('bolt')) el('bolt').onclick = () => { S.connection = 'Bolted'; markCustom(); refresh(); };

    document.querySelectorAll('[data-grade]').forEach((b) => {
      b.onclick = () => { S.grade = b.dataset.grade; markCustom(); refresh(); };
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
        const cube = el('cubeViewLabel');
        if (cube) cube.textContent = b.dataset.view.toUpperCase();
        if (root.resetUserCameraMoved) root.resetUserCameraMoved();
        if (root.fit) root.fit(S.view);
      };
    });

    document.querySelectorAll('.solution-tab').forEach((b) => {
      b.onclick = () => {
        if (root.setSolutionStep) root.setSolutionStep(Number(b.dataset.solutionStep) || 0);
      };
    });

    const handleFitClick = () => {
      if (root.resetUserCameraMoved) root.resetUserCameraMoved();
      if (root.fit) root.fit();
    };
    if (el('fit')) el('fit').onclick = handleFitClick;
    if (el('btnFitModel')) el('btnFitModel').onclick = handleFitClick;
    if (el('orientationCube')) el('orientationCube').onclick = handleFitClick;
    if (el('mFit')) el('mFit').onclick = handleFitClick;
    if (el('reset')) el('reset').onclick = () => location.reload();

    if (el('mLeft')) el('mLeft').onclick = () => el('left')?.classList.toggle('collapsed');
    if (el('mRight')) el('mRight').onclick = () => el('right')?.classList.toggle('collapsed');

    // Panel toggling with active class sync on header buttons
    if (el('toggleLeft')) {
      el('toggleLeft').onclick = () => {
        const isHidden = el('left')?.classList.toggle('panel-hidden');
        el('toggleLeft').classList.toggle('active', !isHidden);
      };
    }

    if (el('toggleRight')) {
      el('toggleRight').onclick = () => {
        const isHidden = el('right')?.classList.toggle('panel-hidden');
        el('toggleRight').classList.toggle('active', !isHidden);
      };
    }

    if (el('toggleRightClose')) {
      el('toggleRightClose').onclick = () => {
        el('right')?.classList.add('panel-hidden');
        el('toggleRight')?.classList.remove('active');
      };
    }

    if (el('toggleStudy')) el('toggleStudy').onclick = () => root.openWorkflow && root.openWorkflow();
    if (el('closeWorkflow')) el('closeWorkflow').onclick = () => el('workflowOverlay')?.classList.remove('open');

    // Accordion headers in left panel
    document.querySelectorAll('.section-head').forEach((head) => {
      head.onclick = () => {
        const sec = head.closest('.section');
        if (sec) sec.classList.toggle('collapsed');
      };
    });

    // Navigation tools in viewport
    const toolSelect = el('toolSelect');
    const toolPan = el('toolPan');
    if (toolSelect && toolPan) {
      toolSelect.onclick = () => {
        toolSelect.classList.add('active');
        toolPan.classList.remove('active');
        if (root.setHudMode) root.setHudMode('select');
      };
      toolPan.onclick = () => {
        toolPan.classList.add('active');
        toolSelect.classList.remove('active');
        if (root.setHudMode) root.setHudMode('pan');
      };
    }

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

  function applyTheme(theme) {
    const isDark = theme === 'dark';
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      if (el('themeIconSun')) el('themeIconSun').style.display = 'none';
      if (el('themeIconMoon')) el('themeIconMoon').style.display = 'inline-block';
      if (el('themeLabel')) el('themeLabel').textContent = 'Light';
    } else {
      document.documentElement.removeAttribute('data-theme');
      if (el('themeIconSun')) el('themeIconSun').style.display = 'inline-block';
      if (el('themeIconMoon')) el('themeIconMoon').style.display = 'none';
      if (el('themeLabel')) el('themeLabel').textContent = 'Dark';
    }
    if (root.Scene && root.Scene.setTheme) {
      root.Scene.setTheme(isDark);
    }
  }

  function initTheme() {
    const savedTheme = localStorage.getItem('truss-theme') ||
      (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(savedTheme);

    const btn = el('btnThemeToggle');
    if (btn) {
      btn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        localStorage.setItem('truss-theme', next);
      });
    }
  }

  function initApp() {
    initTheme();
    if (root.SceneModule) root.SceneModule.initScene();
    bindUI();
    if (root.ResizerModule) root.ResizerModule.initResizer();
    if (root.setupCustomSelects) root.setupCustomSelects();
    refresh();
    if (root.updateUnitPositions) {
      root.updateUnitPositions();
      window.addEventListener('resize', root.updateUnitPositions);
    }
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
