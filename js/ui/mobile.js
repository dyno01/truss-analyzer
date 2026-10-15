/**
 * Structural Design Studio — Mobile UI Controller
 * Faithfully implements the 4 Figma designs:
 * - 4:4862 (Overview Tab)
 * - 4:4943 (Inputs Tab)
 * - 4:5036 (Model Tab)
 * - 4:5129 (Sheet Tab)
 * with a persistent 4-tab bottom navigation bar.
 */

(function(root) {
  'use strict';

  let activeTab = 'overview';
  let activeMobileMember = 'L0U1';

  function initMobileUI() {
    setupNavListeners();
    setupOverviewActions();
    setupInputsActions();
    setupModelActions();
    setupInspectorActions();
    setupSheetActions();

    // Check if we are on mobile screen
    if (window.innerWidth <= 860) {
      ensureSceneMountedInMobile();
    }

    // Initial render
    syncAllMobileViews();

    // Listen to global analysis updates
    if (root.addEventListener) {
      window.addEventListener('analysisUpdated', syncAllMobileViews);
      window.addEventListener('resize', handleWindowResize);
    }
  }

  function handleWindowResize() {
    if (window.innerWidth <= 860) {
      ensureSceneMountedInMobile();
      if (activeTab === 'model' && root.Scene) {
        if (typeof root.Scene.resizeRenderer === 'function') root.Scene.resizeRenderer();
        else if (typeof root.Scene.resize === 'function') root.Scene.resize();
      }
    } else {
      unmountSceneFromMobileModel();
      if (root.Scene) {
        if (typeof root.Scene.resizeRenderer === 'function') root.Scene.resizeRenderer();
        else if (typeof root.Scene.resize === 'function') root.Scene.resize();
      }
    }
  }

  function setMobileTab(tabName) {
    activeTab = tabName;

    // Update bottom nav active classes
    const navButtons = document.querySelectorAll('.mobile-nav-btn');
    navButtons.forEach(btn => {
      if (btn.getAttribute('data-mobile-tab') === tabName) {
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
      }
    });

    // Update tab view visibility
    const views = document.querySelectorAll('.mobile-tab-view');
    views.forEach(v => {
      if (v.id === `mTab_${tabName}`) {
        v.classList.add('active');
      } else {
        v.classList.remove('active');
      }
    });

    // Tab specific activation logic
    if (tabName === 'model') {
      ensureSceneMountedInMobile();
      requestAnimationFrame(() => {
        if (root.Scene) {
          // Use correct SceneModule API method names
          if (typeof root.Scene.resizeRenderer === 'function') root.Scene.resizeRenderer();
          else if (typeof root.Scene.resize === 'function') root.Scene.resize();
          if (typeof root.Scene.fitCamera === 'function') root.Scene.fitCamera('3d');
          else if (typeof root.Scene.fitAll === 'function') root.Scene.fitAll();
        }
      });
    } else if (tabName === 'inspector') {
      updateInspectorTab(activeMobileMember);
    } else if (tabName === 'sheet') {
      renderMobileSheet();
    } else if (tabName === 'overview') {
      renderMobileOverview();
    } else if (tabName === 'inputs') {
      populateMobileInputs();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function setupNavListeners() {
    const navButtons = document.querySelectorAll('.mobile-nav-btn');
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-mobile-tab');
        if (tab) setMobileTab(tab);
      });
    });
  }

  /* ----------------------------------------------------
   * 1. OVERVIEW TAB CONTROLLER (Figma 4:4862)
   * ---------------------------------------------------- */
  function renderMobileOverview() {
    const S = root.S || {};
    const d = root.stableAnalysis ? root.stableAnalysis() : null;
    const G = (root.GROUPS && root.GROUPS[S.group]) || {};
    const Textbook = root.TextbookModule;
    const tb = Textbook ? Textbook.computeTextbookAnalysis(S) : null;

    const groupName = S.group || 'G4';
    const loc = S.loc || G.loc || 'Gaya';
    const trussType = S.truss || G.truss || 'Howe';
    const span = tb ? tb.span : Number(S.span) || 16;
    const length = Number(S.length) || 98;
    const height = Number(S.height) || 12;
    const spacing = tb ? tb.spacing : Number(S.spacing) || 4;
    const panels = tb ? tb.panels : Number(S.panels) || 6;
    const bays = Math.round(length / spacing);

    // Update Project Given Card
    const tagEl = document.getElementById('mOverviewProjectTag');
    const titleEl = document.getElementById('mOverviewProjectTitle');
    const descEl = document.getElementById('mOverviewProjectDesc');
    const thumbWrap = document.getElementById('mOverviewThumb');

    if (tagEl) tagEl.textContent = `${groupName} · ${trussType.toUpperCase()} ROOF TRUSS`;
    if (titleEl) titleEl.textContent = `${trussType} Roof Truss (${loc})`;
    if (descEl) descEl.textContent = `Span: ${span} m · Spacing: ${spacing} m · Panels: ${panels}`;

    if (thumbWrap && tb && Textbook) {
      // Get SVG and clean background for dark mode theme
      let svgMarkup = Textbook.renderFullTrussSVG(tb, 'geometry', { hideCaption: true });
      // Replace white rectangle background if present so it blends into dark/light mode
      svgMarkup = svgMarkup.replace(/fill="#fff"/gi, 'fill="transparent"').replace(/fill="#ffffff"/gi, 'fill="transparent"');
      thumbWrap.innerHTML = svgMarkup;
    }

    // Update 3 KPIs
    const kpiLen = document.getElementById('mKpiLength');
    const kpiLenSub = document.getElementById('mKpiLengthSub');
    const kpiHt = document.getElementById('mKpiHeight');
    const kpiSp = document.getElementById('mKpiSpacing');

    if (kpiLen) kpiLen.textContent = `${length} m`;
    if (kpiLenSub) kpiLenSub.textContent = `${bays} bays`;
    if (kpiHt) kpiHt.textContent = `${height} m`;
    if (kpiSp) kpiSp.textContent = `${spacing} m`;

    // Update Status Banner
    const isAllPass = d && d.checks && d.checks.every(chk => chk.pass);
    const failedChecks = (d && d.checks) ? d.checks.filter(chk => !chk.pass) : [];
    const statusBanner = document.getElementById('mOverviewStatusBanner');

    if (statusBanner) {
      if (isAllPass) {
        statusBanner.className = 'overview-status-banner pass';
        statusBanner.innerHTML = `
          <div class="overview-status-title">
            <svg style="width:16px;height:16px;color:#16a34a" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <span>ALL CHECKS SATISFIED · IS 800:2007</span>
          </div>
          <div>All primary truss chords, purlins, laced columns, and welded connections meet limit state strength and serviceability requirements.</div>
        `;
      } else {
        const failLabels = failedChecks.map(c => c.label).join(', ');
        statusBanner.className = 'overview-status-banner action';
        statusBanner.innerHTML = `
          <div class="overview-status-title">
            <svg style="width:16px;height:16px;color:#dc2626" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>CHECK NEEDED: ${failedChecks.length} limit state requires resizing</span>
          </div>
          <div>Exceeding criteria: <b>${failLabels}</b>. Column effective slenderness exceeds allowable 180 limit per IS 800:2007.</div>
        `;
      }
    }
  }

  function setupOverviewActions() {
    const btnReviewInputs = document.getElementById('mBtnReviewInputs');
    if (btnReviewInputs) {
      btnReviewInputs.addEventListener('click', () => setMobileTab('inputs'));
    }

    const taskModel = document.getElementById('mTaskExploreModel');
    if (taskModel) {
      taskModel.addEventListener('click', () => setMobileTab('model'));
    }

    const taskSheet = document.getElementById('mTaskReadSheet');
    if (taskSheet) {
      taskSheet.addEventListener('click', () => setMobileTab('sheet'));
    }

    const taskBasis = document.getElementById('mTaskDesignBasis');
    if (taskBasis) {
      taskBasis.addEventListener('click', () => {
        const wf = document.getElementById('workflowOverlay');
        if (wf) wf.classList.add('open');
      });
    }
  }

  /* ----------------------------------------------------
   * 2. INPUTS TAB CONTROLLER (Figma 4:4943)
   * ---------------------------------------------------- */
  function initMobileSectionOptions() {
    if (root.Standards) {
      const populateAngleSelect = (id, curVal, prefix = '') => {
        const select = document.getElementById(id);
        if (select && root.Standards.ANGLES) {
          select.innerHTML = '';
          Object.keys(root.Standards.ANGLES).forEach((k) => {
            const opt = document.createElement('option');
            opt.value = k;
            opt.textContent = prefix ? `${prefix} ${k}` : k;
            if (k === curVal) opt.selected = true;
            select.appendChild(opt);
          });
        }
      };
      const curRafter = (root.S && (root.S.rafterSection || root.S.section)) || 'ISA 75×75×6';
      const curTie = (root.S && (root.S.tieSection || root.S.section)) || 'ISA 60×60×6';
      const curStrut = (root.S && (root.S.strutSection || root.S.section)) || 'ISA 70×70×6';
      const curDiag = (root.S && (root.S.diagonalSection || root.S.section)) || 'ISA 50×50×6';

      populateAngleSelect('mInpRafterSection', curRafter, '2×');
      populateAngleSelect('mInpTieSection', curTie, '2×');
      populateAngleSelect('mInpStrutSection', curStrut, 'Single');
      populateAngleSelect('mInpDiagonalSection', curDiag, 'Single');
      populateAngleSelect('mInpTrussSection', curRafter, '2×');
      const purlinSelect = document.getElementById('mInpPurlinSection');
      if (purlinSelect && root.Standards) {
        const cur = (root.S && (root.S.purlin || root.S.purlinSection)) || 'ISMC 125';
        purlinSelect.innerHTML = '';

        const addPurlinGrp = (label, keys) => {
          if (!keys || !keys.length) return;
          const grp = document.createElement('optgroup');
          grp.label = label;
          keys.forEach(k => {
            const opt = document.createElement('option');
            opt.value = k;
            opt.textContent = k;
            if (k === cur) opt.selected = true;
            grp.appendChild(opt);
          });
          purlinSelect.appendChild(grp);
        };

        const chKeys = Object.keys(root.Standards.CHANNELS || {});
        addPurlinGrp('Medium Channels (ISMC)', chKeys.filter(k => k.startsWith('ISMC')));
        addPurlinGrp('Light Channels (ISLC)', chKeys.filter(k => k.startsWith('ISLC')));
        addPurlinGrp('Junior Channels (ISJC)', chKeys.filter(k => k.startsWith('ISJC')));
        if (root.Standards.ANGLES) {
          addPurlinGrp('Equal Angles (ISA)', Object.keys(root.Standards.ANGLES));
        }
      }
      const colSelect = document.getElementById('mInpColSection');
      if (colSelect && root.Standards) {
        const cur = (root.S && (root.S.column || root.S.colSection)) || 'ISMC 200';
        colSelect.innerHTML = '';

        const addColGrp = (label, keys, isRolled) => {
          if (!keys || !keys.length) return;
          const grp = document.createElement('optgroup');
          grp.label = label;
          keys.forEach(k => {
            const opt = document.createElement('option');
            opt.value = k;
            opt.textContent = isRolled ? k : `2× ${k} (Built-up)`;
            if (k === cur) opt.selected = true;
            grp.appendChild(opt);
          });
          colSelect.appendChild(grp);
        };

        const chKeys = Object.keys(root.Standards.CHANNELS || {});
        addColGrp('Built-up 2× ISMC', chKeys.filter(k => k.startsWith('ISMC')), false);
        addColGrp('Built-up 2× ISLC', chKeys.filter(k => k.startsWith('ISLC')), false);
        addColGrp('Built-up 2× ISJC', chKeys.filter(k => k.startsWith('ISJC')), false);

        if (root.Standards.BEAMS) {
          const bmKeys = Object.keys(root.Standards.BEAMS);
          addColGrp('Heavy Columns (ISHB)', bmKeys.filter(k => k.startsWith('ISHB')), true);
          addColGrp('Wide Flange (ISWB)', bmKeys.filter(k => k.startsWith('ISWB')), true);
          addColGrp('Medium Beams (ISMB)', bmKeys.filter(k => k.startsWith('ISMB')), true);
        }
      }
    }
  }

  function populateMobileInputs() {
    const S = root.S || {};

    const syncField = (id, val) => {
      const el = document.getElementById(id);
      if (el && val !== undefined) el.value = val;
    };

    syncField('mInpGroup', S.group || 'G4');
    syncField('mInpLoc', S.loc || 'Gaya');
    syncField('mInpLength', S.length || 98);
    syncField('mInpHeight', S.height || 12);
    syncField('mInpSpacing', S.spacing || 4);

    syncField('mInpTruss', S.truss || 'Howe');
    syncField('mInpSpan', S.span || 16);
    syncField('mInpPanels', S.panels || 6);
    syncField('mInpSlopeDeg', S.slopeDeg || (S.slope ? Math.round(Math.atan(S.slope) * 180 / Math.PI * 100) / 100 : 26.57));
    syncField('mInpOverhang', S.overhang || 0.5);

    syncField('mInpGrade', S.grade || 'E250');
    syncField('mInpRafterSection', S.rafterSection || S.section || 'ISA 75×75×6');
    syncField('mInpTieSection', S.tieSection || S.section || 'ISA 60×60×6');
    syncField('mInpStrutSection', S.strutSection || S.section || 'ISA 70×70×6');
    syncField('mInpDiagonalSection', S.diagonalSection || S.section || 'ISA 50×50×6');
    syncField('mInpTrussSection', S.rafterSection || S.section || 'ISA 75×75×6');
    syncField('mInpPurlinSection', S.purlin || S.purlinSection || 'ISMC 125');
    syncField('mInpColSection', S.column || S.colSection || 'ISMC 200');

    syncField('mInpVb', S.Vb || 39);
    syncField('mInpRoof', S.roof || 'AC');
    syncField('mInpCpi', S.cpi || 0.2);
    syncField('mInpK1', S.k1 !== undefined ? S.k1 : 1.0);
    syncField('mInpK2', S.k2 !== undefined ? S.k2 : 1.05);
    syncField('mInpK3', S.k3 || 1.0);
    syncField('mInpK4', S.k4 || 1.0);
    syncField('mInpKd', S.kd !== undefined ? S.kd : 0.90);
    syncField('mInpKa', S.ka !== undefined ? S.ka : 1.00);
    syncField('mInpKc', S.kc !== undefined ? S.kc : 0.90);

    syncField('mInpWSheeting', (S.wSheeting !== undefined && S.wSheeting !== null) ? S.wSheeting : (S.roof === 'AC' ? 170 : 130));
    syncField('mInpWPurlins', (S.wPurlins !== undefined && S.wPurlins !== null) ? S.wPurlins : 100);
    syncField('mInpWBracing', (S.wBracing !== undefined && S.wBracing !== null) ? S.wBracing : 12);
    syncField('mInpWSelf', (S.wSelf !== undefined && S.wSelf !== null && S.wSelf !== '') ? S.wSelf : '');

    // Connection toggle
    const connVal = S.connection || S.connectionType || 'Welded';
    const btnWeld = document.getElementById('mConnWeld');
    const btnBolt = document.getElementById('mConnBolt');
    if (btnWeld && btnBolt) {
      if (connVal === 'Welded') {
        btnWeld.classList.add('active');
        btnBolt.classList.remove('active');
      } else {
        btnBolt.classList.add('active');
        btnWeld.classList.remove('active');
      }
    }

    if (root.syncCustomSelects) root.syncCustomSelects();
  }

  function setupInputsActions() {
    initMobileSectionOptions();

    // Accordion expand/collapse
    const accordions = document.querySelectorAll('.m-accordion-head');
    accordions.forEach(head => {
      head.addEventListener('click', () => {
        const parent = head.closest('.m-accordion');
        if (parent) {
          parent.classList.toggle('open');
          const isOpen = parent.classList.contains('open');
          head.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        }
      });
    });

    // Connection segmented toggle
    const btnWeld = document.getElementById('mConnWeld');
    const btnBolt = document.getElementById('mConnBolt');
    if (btnWeld && btnBolt) {
      btnWeld.addEventListener('click', () => {
        btnWeld.classList.add('active');
        btnBolt.classList.remove('active');
        handleLiveInputChange();
      });
      btnBolt.addEventListener('click', () => {
        btnBolt.classList.add('active');
        btnWeld.classList.remove('active');
        handleLiveInputChange();
      });
    }

    // Preset selection change in mobile
    const groupSel = document.getElementById('mInpGroup');
    if (groupSel) {
      groupSel.addEventListener('change', () => {
        const gKey = groupSel.value;
        if (root.GROUPS && root.GROUPS[gKey] && root.applyGroupPreset) {
          root.applyGroupPreset(gKey);
          populateMobileInputs();
          syncAllMobileViews();
        }
      });
    }

    // Attach live change listeners to all mobile inputs for instant responsiveness
    const inputIds = [
      'mInpLoc', 'mInpLength', 'mInpHeight', 'mInpSpacing',
      'mInpTruss', 'mInpSpan', 'mInpPanels', 'mInpSlopeDeg', 'mInpOverhang',
      'mInpGrade', 'mInpTrussSection', 'mInpPurlinSection', 'mInpColSection',
      'mInpVb', 'mInpRoof', 'mInpCpi', 'mInpK1', 'mInpK2', 'mInpK3', 'mInpK4',
      'mInpKd', 'mInpKa', 'mInpKc',
      'mInpWSheeting', 'mInpWPurlins', 'mInpWBracing', 'mInpWSelf'
    ];
    inputIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', handleLiveInputChange);
        el.addEventListener('input', handleLiveInputChange);
      }
    });

    // Save project inputs button
    const btnSave = document.getElementById('mBtnSaveInputs');
    if (btnSave) {
      btnSave.addEventListener('click', () => {
        saveMobileInputsToState();
        if (root.markCustom) root.markCustom();
        if (root.refresh) root.refresh();
        syncAllMobileViews();

        // Visual confirmation feedback
        const origText = btnSave.innerHTML;
        btnSave.style.background = '#16a34a';
        btnSave.innerHTML = `
          <svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          <span>Saved & Updated!</span>
        `;
        setTimeout(() => {
          btnSave.style.background = '';
          btnSave.innerHTML = origText;
          setMobileTab('overview');
        }, 600);
      });
    }

    // Cancel button
    const btnCancel = document.getElementById('mBtnCancelInputs');
    if (btnCancel) {
      btnCancel.addEventListener('click', () => {
        populateMobileInputs();
        setMobileTab('overview');
      });
    }
  }

  function handleLiveInputChange() {
    saveMobileInputsToState();
    if (root.markCustom) root.markCustom();
    if (root.refresh) root.refresh();
    renderMobileOverview();
    updateInspectorTab(activeMobileMember);
  }

  function saveMobileInputsToState() {
    const S = root.S || {};

    const readNum = (id, fallback) => {
      const el = document.getElementById(id);
      return el ? (parseFloat(el.value) || fallback) : fallback;
    };
    const readStr = (id, fallback) => {
      const el = document.getElementById(id);
      return el ? (el.value || fallback) : fallback;
    };

    S.group = readStr('mInpGroup', S.group);
    S.loc = readStr('mInpLoc', S.loc);
    S.length = readNum('mInpLength', S.length);
    S.height = readNum('mInpHeight', S.height);
    S.spacing = readNum('mInpSpacing', S.spacing);

    S.truss = readStr('mInpTruss', S.truss);
    S.span = readNum('mInpSpan', S.span);
    S.panels = readNum('mInpPanels', S.panels);
    S.slopeDeg = readNum('mInpSlopeDeg', S.slopeDeg);
    if (S.slopeDeg !== undefined) {
      S.slope = Number(Math.tan((S.slopeDeg * Math.PI) / 180).toFixed(4));
    }
    S.overhang = readNum('mInpOverhang', S.overhang);

    S.grade = readStr('mInpGrade', S.grade);
    S.rafterSection = readStr('mInpRafterSection', S.rafterSection || S.section || 'ISA 75×75×6');
    S.tieSection = readStr('mInpTieSection', S.tieSection || 'ISA 60×60×6');
    S.strutSection = readStr('mInpStrutSection', S.strutSection || 'ISA 70×70×6');
    S.diagonalSection = readStr('mInpDiagonalSection', S.diagonalSection || 'ISA 50×50×6');
    S.section = S.rafterSection;
    const purlinStr = readStr('mInpPurlinSection', S.purlin || S.purlinSection);
    S.purlin = purlinStr;
    S.purlinSection = purlinStr;
    const colStr = readStr('mInpColSection', S.column || S.colSection);
    S.column = colStr;
    S.colSection = colStr;

    S.Vb = readNum('mInpVb', S.Vb);
    S.roof = readStr('mInpRoof', S.roof);
    S.cpi = readNum('mInpCpi', S.cpi);
    S.k1 = readNum('mInpK1', S.k1 || 1.0);
    S.k2 = readNum('mInpK2', S.k2 || 1.05);
    S.k3 = readNum('mInpK3', S.k3);
    S.k4 = readNum('mInpK4', S.k4);
    S.kd = readNum('mInpKd', S.kd || 0.90);
    S.ka = readNum('mInpKa', S.ka || 1.00);
    S.kc = readNum('mInpKc', S.kc || 0.90);

    S.wSheeting = readNum('mInpWSheeting', S.roof === 'AC' ? 170 : 130);
    S.wPurlins = readNum('mInpWPurlins', 100);
    S.wBracing = readNum('mInpWBracing', 12);
    const mSelfVal = document.getElementById('mInpWSelf') ? document.getElementById('mInpWSelf').value.trim() : '';
    S.wSelf = mSelfVal === '' ? null : parseFloat(mSelfVal);

    const btnWeld = document.getElementById('mConnWeld');
    const connType = (btnWeld && btnWeld.classList.contains('active')) ? 'Welded' : 'Bolted';
    S.connection = connType;
    S.connectionType = connType;
  }

  /* ----------------------------------------------------
   * 3. MODEL TAB CONTROLLER (Figma 4:5036)
   * ---------------------------------------------------- */
  function ensureSceneMountedInMobile() {
    const sceneEl = document.getElementById('sceneViewport');
    const targetWrap = document.getElementById('mViewportWrap');
    if (!sceneEl || !targetWrap) return;

    if (sceneEl.parentElement !== targetWrap) {
      targetWrap.insertBefore(sceneEl, targetWrap.firstChild);
    }

    sceneEl.style.display = 'flex';
    sceneEl.style.flexDirection = 'column';
    sceneEl.style.width = '100%';
    sceneEl.style.height = '100%';

    const vwrap = sceneEl.querySelector('.scene-viewport-wrap');
    if (vwrap) {
      vwrap.style.width = '100%';
      vwrap.style.height = '100%';
      vwrap.style.flex = '1 1 auto';
      vwrap.style.minHeight = '270px';
    }
  }

  function unmountSceneFromMobileModel() {
    const sceneEl = document.getElementById('sceneViewport');
    const appEl = document.querySelector('.app');
    const rightPanel = document.getElementById('right');
    if (sceneEl && appEl && rightPanel && sceneEl.parentElement !== appEl) {
      appEl.insertBefore(sceneEl, rightPanel);
      sceneEl.style.display = '';
      sceneEl.style.height = '';
    }
  }

  function setupModelActions() {
    // Segmented view toggle: 3D, Front, Plan
    const segButtons = document.querySelectorAll('.m-view-segmented button');
    segButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        segButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const view = btn.getAttribute('data-view');
        if (root.Scene && typeof root.Scene.setView === 'function') {
          root.Scene.setView(view);
        }
      });
    });

    // Floating Fit button
    const btnFit = document.getElementById('mBtnFitModel');
    if (btnFit) {
      btnFit.addEventListener('click', () => {
        if (root.Scene) {
          if (typeof root.Scene.fitCamera === 'function') root.Scene.fitCamera('3d');
          else if (typeof root.Scene.fitAll === 'function') root.Scene.fitAll();
        }
      });
    }

    // Floating Reset button
    const btnReset = document.getElementById('mBtnResetModel');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (root.Scene && typeof root.Scene.resetView === 'function') {
          root.Scene.resetView();
        }
      });
    }

    // Member Quick Selector Pills (in Model tab — navigate to Inspector tab)
    const pills = document.querySelectorAll('.m-member-pill');
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const memberId = pill.getAttribute('data-member');
        if (memberId) {
          activeMobileMember = memberId;
          // Trigger 3D selection highlight in scene
          if (root.Scene && typeof root.Scene.selectMember === 'function') {
            root.Scene.selectMember(memberId);
          }
        }
      });
    });
  }

  /* ----------------------------------------------------
   * 3b. INSPECTOR TAB CONTROLLER
   * ---------------------------------------------------- */
  function setupInspectorActions() {
    // Member dropdown change
    const dropdown = document.getElementById('mInspMemberDropdown');
    if (dropdown) {
      dropdown.addEventListener('change', () => {
        activeMobileMember = dropdown.value;
        updateInspectorTab(activeMobileMember);
      });
    }

    // Go to Sheet button
    const btnToSheet = document.getElementById('mBtnInspToSheet');
    if (btnToSheet) {
      btnToSheet.addEventListener('click', () => {
        const stepMap = { purlin: '5', column: '6' };
        const stepDropdown = document.getElementById('mStepDropdown');
        if (stepDropdown) {
          stepDropdown.value = stepMap[activeMobileMember] || '4';
        }
        setMobileTab('sheet');
      });
    }

    // Apply Recommended Sizing button
    const btnApply = document.getElementById('mBtnApplyRecommended');
    if (btnApply) {
      btnApply.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const applyFn = (root.InspectorModule && root.InspectorModule.applyRecommendedInputs) || root.applyRecommendedInputs;
        if (typeof applyFn === 'function') {
          applyFn();
        } else {
          const deskBtn = document.getElementById('applyRecommendedInputs');
          if (deskBtn) deskBtn.click();
        }

        if (root.markCustom) root.markCustom();
        if (root.refresh) root.refresh();
        syncAllMobileViews();

        // Flash confirmation
        const orig = btnApply.innerHTML;
        btnApply.style.background = '#16a34a';
        btnApply.innerHTML = '<svg style="width:15px;height:15px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg><span>✓ Optimal Sizing Applied!</span>';
        setTimeout(() => {
          btnApply.style.background = '';
          btnApply.innerHTML = orig;
          syncAllMobileViews();
        }, 1200);
      });
    }
  }

  /* Member data table — maps memberId to display data */
  const MEMBER_DATA = {
    'L0U1':   { title: 'Top Chord (L0U1)',      section: '2x ISA 75×75×6',    force: '-61.05 kN', type: 'Compression', cap: '80.47 kN',   util: 75.9,  lambda: '99.4',  code: 'IS 800:2007 — Cl. 7.1.2 Design of Compression Members',   pass: true  },
    'L0L1':   { title: 'Bottom Chord (L0L1)',    section: '2x ISA 75×75×6',    force: '+54.60 kN', type: 'Tension',     cap: '393.64 kN', util: 13.9,  lambda: 'N/A',   code: 'IS 800:2007 — Cl. 6.2 Design of Tension Members',         pass: true  },
    'U1L1':   { title: 'Vertical Strut (U1L1)',  section: '2x ISA 65×65×6',    force: '-16.38 kN', type: 'Compression', cap: '48.12 kN',   util: 34.0,  lambda: '82.1',  code: 'IS 800:2007 — Cl. 7.1.2 Design of Compression Members',   pass: true  },
    'L1U2':   { title: 'Web Diagonal (L1U2)',    section: '2x ISA 65×65×6',    force: '+19.65 kN', type: 'Tension',     cap: '145.20 kN', util: 13.5,  lambda: 'N/A',   code: 'IS 800:2007 — Cl. 6.2 Design of Tension Members',         pass: true  },
    'purlin': { title: 'Roof Purlin',            section: 'ISMC 125',           force: 'Mz=2.49 kNm', type: 'Biaxial Flex', cap: 'Mdz=18.16 kNm', util: 48.4, lambda: 'N/A', code: 'IS 800:2007 — Cl. 8.2 Design of Beams (Purlins)',      pass: true  },
    'column': { title: 'Built-up Column',        section: '2x ISMC 200',        force: 'P=59.59 kN', type: 'Compression', cap: 'λe=250 (lim:180)', util: 139.0, lambda: '250.0', code: 'IS 800:2007 — Cl. 7.6.1 Laced/Battened Columns',     pass: false }
  };

  function updateInspectorTab(memberId) {
    const d = root.stableAnalysis ? root.stableAnalysis() : null;
    const S = root.S || {};
    let data = Object.assign({}, MEMBER_DATA[memberId] || MEMBER_DATA['L0U1']);

    if (d) {
      if (memberId === 'column' && d.column) {
        const c = d.column;
        const pass = Boolean(c.colPass && c.lacingPass);
        data = {
          title: 'Built-up Column',
          section: '2× ' + (S.column || 'ISMC 200'),
          force: 'P=' + (c.demand ? c.demand.toFixed(2) : '59.59') + ' kN',
          type: 'Compression',
          cap: (c.Pd ? c.Pd.toFixed(2) : '80.00') + ' kN',
          util: c.colUtil ? (c.colUtil * 100) : data.util,
          lambda: c.lambda_eff ? c.lambda_eff.toFixed(1) : (c.lambda_lacing ? c.lambda_lacing.toFixed(1) : '145.0'),
          code: 'IS 800:2007 — Cl. 7.6.1 Laced/Battened Columns',
          pass: pass
        };
      } else if (memberId === 'purlin' && d.purlin) {
        const p = d.purlin;
        data = {
          title: 'Roof Purlin',
          section: S.purlin || 'ISMC 125',
          force: 'Mz=' + (p.Mz ? p.Mz.toFixed(2) : '2.49') + ' kNm',
          type: 'Biaxial Flex',
          cap: 'Mdz=' + (p.Mdz ? p.Mdz.toFixed(2) : '18.16') + ' kNm',
          util: p.util ? (p.util * 100) : data.util,
          lambda: 'N/A',
          code: 'IS 800:2007 — Cl. 8.2 Design of Beams (Purlins)',
          pass: Boolean(p.pass)
        };
      } else if (d.members && d.members.length) {
        let targetMem = null;
        if (memberId === 'L0U1') targetMem = d.members.find(m => m.role === 'topChord') || d.members[0];
        else if (memberId === 'L0L1') targetMem = d.members.find(m => m.role === 'bottomChord');
        else if (memberId === 'U1L1') targetMem = d.members.find(m => m.role === 'strut');
        else if (memberId === 'L1U2') targetMem = d.members.find(m => m.role === 'tie' || m.role === 'web');

        if (targetMem) {
          const isComp = (targetMem.governingForce || 0) < 0;
          data.section = '2× ' + (S.section || 'ISA 75×75×6');
          data.force = (targetMem.governingForce > 0 ? '+' : '') + targetMem.governingForce.toFixed(2) + ' kN';
          data.type = isComp ? 'Compression' : 'Tension';
          data.cap = (targetMem.governingCapacity || 0).toFixed(2) + ' kN';
          data.util = (targetMem.util || 0) * 100;
          data.lambda = targetMem.lambda !== undefined ? targetMem.lambda.toFixed(1) : 'N/A';
          data.pass = targetMem.util <= 1.0;
        }
      }
    }

    const util = data.util;
    const fillClass = util >= 100 ? 'fail' : util >= 80 ? 'warn' : '';

    // Sync dropdown
    const dropdown = document.getElementById('mInspMemberDropdown');
    if (dropdown) dropdown.value = memberId;
    if (root.syncCustomSelects && dropdown) root.syncCustomSelects(dropdown);

    // Inspector card elements (Tab 5: mInsp2*)
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

    set('mInsp2Title', data.title);
    set('mInsp2Section', data.section + ' · ' + data.code.split('—')[0].trim());
    set('mInsp2Util', util.toFixed(1) + '%');
    set('mInsp2Force', data.force);
    set('mInsp2Type', data.type);
    set('mInsp2Cap', data.cap);
    set('mInsp2Lambda', data.lambda);

    const codeRef = document.getElementById('mInsp2CodeRef');
    if (codeRef) {
      const span = codeRef.querySelector('span');
      if (span) span.textContent = data.code;
    }

    const badge = document.getElementById('mInsp2Badge');
    if (badge) {
      badge.textContent = data.pass ? 'PASS' : 'RESIZE';
      badge.className = 'm-inspector-badge ' + (data.pass ? 'ok' : 'action');
    }

    // Animate DCR fill bar
    const fill = document.getElementById('mInsp2DcrFill');
    if (fill) {
      fill.style.width = Math.min(util, 100) + '%';
      fill.className = 'm-inspector-dcr-fill' + (fillClass ? ' ' + fillClass : '');
    }

    // Also update model tab pill highlight
    document.querySelectorAll('.m-member-pill').forEach(p => {
      p.classList.toggle('active', p.getAttribute('data-member') === memberId);
    });

    // Trigger 3D scene selection highlight
    if (root.Scene && typeof root.Scene.selectMember === 'function') {
      root.Scene.selectMember(memberId);
    }

    // Refresh the 3 dynamic sections
    renderMobileRecommendations();
    renderMobileChecklist();
    renderMobileGoverning(memberId);
  }

  /* ── Optimum Recommendations ── */
  function renderMobileRecommendations() {
    const d = root.stableAnalysis ? root.stableAnalysis() : null;
    const recsContent = document.getElementById('mInspRecsContent');
    const applyBtn    = document.getElementById('mBtnApplyRecommended');
    const statusBadge = document.getElementById('mInspRecsStatusBadge');
    if (!recsContent) return;

    const fails = (d && d.checks) ? d.checks.filter(x => !x.pass) : [];
    const q = root.stableRecommendationValues ? root.stableRecommendationValues() : { items: [], values: {} };

    // Update overall status badge
    if (statusBadge) {
      const allPass = !fails.length;
      statusBadge.textContent = allPass ? 'IS 800 PASS' : `${fails.length} CHECK${fails.length > 1 ? 'S' : ''} FAIL`;
      statusBadge.className = 'm-inspector-badge ' + (allPass ? 'ok' : 'action');
    }

    if (!fails.length && (!q.items || !q.items.length)) {
      // All good — show green confirmation
      recsContent.innerHTML = `
        <div style="background:rgba(22,163,74,0.08);border:1px solid rgba(22,163,74,0.3);border-radius:8px;padding:12px;margin-bottom:8px">
          <div style="font-size:12px;font-weight:800;color:#16a34a;margin-bottom:4px">✓ Optimal Configuration Active</div>
          <div style="font-size:11.5px;color:var(--muted);line-height:1.5">All member slenderness, purlin biaxial bending, column stability, and connection limits satisfy IS 800:2007.</div>
        </div>
        <div style="background:var(--panel2);border:1px solid var(--line);border-radius:8px;padding:10px 12px;font-size:11px;line-height:1.55;color:var(--muted)">
          <div style="font-weight:800;color:var(--accent);font-size:10px;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:5px">Engineering Insight</div>
          • <b>Buckling Resistance:</b> Top chord KL = 0.85L keeps λ ≤ 180.<br>
          • <b>Stress Reversal:</b> Wind uplift reverses bottom chords into compression (λ ≤ 250).
        </div>`;
      if (applyBtn) applyBtn.style.display = 'none';
      return;
    }

    // Show failures + recommendations
    let html = `
      <div style="background:rgba(220,38,38,0.08);border-left:4px solid #dc2626;border-radius:8px;padding:12px;margin-bottom:10px;font-size:12px">
        <div style="font-weight:800;color:#dc2626;margin-bottom:4px">Design Adjustments Required (${fails.length} Check${fails.length > 1 ? 's' : ''} Exceeded)</div>
        <div style="color:var(--text)">Optimal section sizing needed to meet IS 800:2007 limits:</div>
      </div>`;

    if (q.items && q.items.length) {
      html += q.items.map(x => `
        <div style="background:var(--panel2);border:1px solid var(--line);border-left:3px solid #f59e0b;border-radius:8px;padding:10px 12px;margin-bottom:8px;font-size:11.5px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <b style="color:var(--text)">${escSafe(x[0] || x.component || 'Component')}</b>
            <span style="background:rgba(220,38,38,0.1);color:#dc2626;padding:2px 7px;border-radius:4px;font-size:10px;font-weight:800">EXCEEDS CAPACITY</span>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;background:var(--panel);padding:6px 10px;border-radius:6px;border:1px solid var(--line)">
            <span style="color:var(--muted);font-size:11px;font-weight:700">Recommended:</span>
            <span style="font-family:var(--mono);color:#16a34a;font-weight:800;font-size:13px">${escSafe(x[1] || x.recommended || '')}</span>
          </div>
          <div style="color:var(--muted);font-size:10.5px;margin-top:5px;line-height:1.45">${escSafe(x[2] || x.reason || '')}</div>
        </div>`).join('');
    }

    // Alternative pathways
    html += `
      <div style="background:var(--panel2);border:1px solid var(--line);border-radius:8px;padding:10px 12px;font-size:11px;line-height:1.55;color:var(--muted);margin-top:4px">
        <div style="font-weight:800;color:var(--accent);font-size:10px;text-transform:uppercase;margin-bottom:5px">★ Alternative Remediation Levers</div>
        • <b>Panel sub-division:</b> More panels → shorter KL → lower λ.<br>
        • <b>Spacing reduction:</b> Closer bays → less tributary load on chords &amp; purlins.<br>
        • <b>Steel grade upgrade:</b> E350 (Fe 490) gives 40% higher yield for tension ties.
      </div>`;

    recsContent.innerHTML = html;
    if (applyBtn) applyBtn.style.display = q.items && q.items.length ? 'flex' : 'none';
  }

  /* ── Design Status Checklist ── */
  function renderMobileChecklist() {
    const d = root.stableAnalysis ? root.stableAnalysis() : null;
    const box = document.getElementById('mInspChecklist');
    if (!box) return;

    const checks = (d && d.checks) || [];
    if (!checks.length) {
      box.innerHTML = '<div style="font-size:12px;color:var(--muted)">No analysis data yet.</div>';
      return;
    }

    const allPass = checks.every(x => x.pass);
    box.innerHTML = checks.map(x => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--line);">
        <span style="font-size:12px;color:var(--text);flex:1;padding-right:8px">${escSafe(x.label)}</span>
        <span style="font-size:11px;font-weight:800;color:${x.pass ? '#16a34a' : '#dc2626'};white-space:nowrap">${x.pass ? '✓ PASS' : '✗ FAIL'}</span>
      </div>`).join('') +
      `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--line);">
        <span style="font-size:12px;color:var(--text)">Stability System</span>
        <span style="font-size:11px;font-weight:800;color:#16a34a">${escSafe(root.stabilityText ? root.stabilityText() : 'X-Bracing')}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;">
        <span style="font-size:12px;color:var(--text)">Longitudinal Struts</span>
        <span style="font-size:11px;font-weight:800;color:#16a34a">${(root.frameCount && root.frameCount() > 1) ? 'CONNECTED' : 'NONE'}</span>
      </div>`;
  }

  /* ── Governing Analysis ── */
  function renderMobileGoverning(memberId) {
    const d = root.stableAnalysis ? root.stableAnalysis() : null;
    const box = document.getElementById('mInspGoverning');
    if (!box || !d) return;

    const esc = escSafe;
    const data = MEMBER_DATA[memberId] || MEMBER_DATA['L0U1'];
    const passColor = data.pass ? '#16a34a' : '#dc2626';

    if (memberId === 'column') {
      const c = d.column || {};
      box.innerHTML = `<b>Built-up Column:</b> Factored axial demand <b>${(c.demand || 59.59).toFixed(1)} kN</b> vs laced capacity <b>${(c.Pd || c.capacity || 89.2).toFixed(1)} kN</b>.<br>Effective slenderness λe = <b style="color:${passColor}">${(c.lambda_e || c.lambda || 250.0).toFixed(1)}</b> (IS 800 limit: 180).`;
    } else if (memberId === 'purlin') {
      const p = d.purlin || {};
      box.innerHTML = `<b>Roof Purlin (IS 800 Cl. 8.2 &amp; 9.3):</b> Biaxial moments Mz = <b>${(p.Mz || p.M || 2.49).toFixed(2)} kNm</b>, My = <b>${(p.My || 1.24).toFixed(2)} kNm</b>. Interaction ratio: <b style="color:${passColor}">${((p.interactionRatio || p.util || 0.484) * 100).toFixed(1)}%</b>.`;
    } else {
      // Truss members — find by id in d.members
      const memberMap = { 'L0U1': 0, 'L0L1': 1, 'U1L1': 2, 'L1U2': 3 };
      const idx = memberMap[memberId];
      const m = (d.members && idx !== undefined) ? d.members[idx] : null;
      if (m) {
        box.innerHTML = `<b>Member ${memberId} (${esc(m.role || data.type)}):</b> Design axial force <b>${Math.abs(m.governingForce || parseFloat(data.force)).toFixed(1)} kN</b> under governing combination <b>${esc(m.governingLC || '1.5(DL+LL)')}</b>.<br>IS 800 capacity: <b>${(m.governingCapacity || parseFloat(data.cap)).toFixed(1)} kN</b> · Utilization: <b style="color:${passColor}">${(data.util).toFixed(1)}%</b> · Slenderness: ${data.lambda !== 'N/A' ? `λ = <b>${data.lambda}</b>` : 'Tension member'}.`;
      } else {
        box.innerHTML = `<b>${esc(data.title)}:</b> Force = ${esc(data.force)} · Capacity = ${esc(data.cap)} · DCR = <b style="color:${passColor}">${data.util.toFixed(1)}%</b>.`;
      }
    }
  }

  /* Tiny HTML escape helper for mobile rendering */
  function escSafe(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  /* Public: select a member and jump straight to Inspector tab */
  function inspectMember(memberId) {
    activeMobileMember = memberId;
    updateInspectorTab(memberId);
    setMobileTab('inspector');
  }

  /* ----------------------------------------------------
   * 4. SHEET TAB CONTROLLER (Figma 4:5129)
   * ---------------------------------------------------- */

  function renderMobileSheet() {
    const S = root.S || {};
    const d = root.stableAnalysis ? root.stableAnalysis() : null;
    const G = (root.GROUPS && root.GROUPS[S.group]) || {};
    const dropdown = document.getElementById('mStepDropdown');
    const stepIdx = dropdown ? parseInt(dropdown.value, 10) : (Number(root.S ? root.S.step : 0) || 0);

    const contentBox = document.getElementById('mSheetContent');
    if (!contentBox) return;

    const liveSolutions = root.LIVE_SOLUTION || (root.StudyModule && root.StudyModule.LIVE_SOLUTION);
    if (liveSolutions && liveSolutions[stepIdx]) {
      const step = liveSolutions[stepIdx];
      contentBox.innerHTML = `
        <div style="font-size:11px;font-weight:800;color:var(--accent);text-transform:uppercase;margin-bottom:4px">${step.badge}</div>
        <h3 style="font-size:16px;font-weight:800;color:var(--text);margin:0 0 10px 0">${step.title}</h3>
        <div>${step.body(d, S, G)}</div>
      `;

      // Render KaTeX safely in mobile content
      if (typeof renderMathInElement === 'function') {
        renderMathInElement(contentBox, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false }
          ],
          throwOnError: false
        });
      }
    } else {
      // Fallback: mirror desktop solution content
      const desktopContent = document.getElementById('solutionContent');
      if (desktopContent) {
        contentBox.innerHTML = desktopContent.innerHTML;
      }
    }

    // Update Next Step Button Label
    const nextBtn = document.getElementById('mBtnSheetNext');
    if (nextBtn) {
      const nextIdx = (stepIdx + 1) % 8;
      const nextStep = (liveSolutions && liveSolutions[nextIdx]) ? liveSolutions[nextIdx].title.split('—')[1] || liveSolutions[nextIdx].title : 'Next Step';
      nextBtn.textContent = `Next: ${nextStep.trim()} →`;
    }
  }

  function setupSheetActions() {
    const dropdown = document.getElementById('mStepDropdown');
    if (dropdown) {
      dropdown.addEventListener('change', () => {
        const stepIdx = parseInt(dropdown.value, 10);
        if (root.S) root.S.step = stepIdx;
        if (root.setSolutionStep) root.setSolutionStep(stepIdx);
        renderMobileSheet();
      });
    }

    const nextBtn = document.getElementById('mBtnSheetNext');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const dropdown = document.getElementById('mStepDropdown');
        let cur = dropdown ? parseInt(dropdown.value, 10) : (Number(root.S ? root.S.step : 0) || 0);
        let next = (cur + 1) % 8;
        if (dropdown) dropdown.value = String(next);
        if (root.S) root.S.step = next;
        if (root.setSolutionStep) root.setSolutionStep(next);
        renderMobileSheet();
      });
    }

    const printBtn = document.getElementById('mBtnSheetPrint');
    if (printBtn) {
      printBtn.addEventListener('click', () => {
        if (root.ProductionPrint && typeof root.ProductionPrint.print === 'function') {
          root.ProductionPrint.print();
        } else {
          window.print();
        }
      });
    }
  }

  function syncAllMobileViews() {
    renderMobileOverview();
    populateMobileInputs();
    updateInspectorTab(activeMobileMember);
    if (activeTab === 'sheet') renderMobileSheet();
  }

  // Export module
  root.MobileUI = {
    init: initMobileUI,
    setTab: setMobileTab,
    sync: syncAllMobileViews,
    inspectMember: inspectMember
  };

  // Auto-init on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileUI);
  } else {
    initMobileUI();
  }

})(typeof window !== 'undefined' ? window : globalThis);
