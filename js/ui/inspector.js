/**
 * Structural Design Studio — Inspector, Status & Recommendation UI Module
 */

(function(root) {
  'use strict';

  function overallStatusHTML(d) {
    if (d.mechanism) {
      return '<div class="result bad"><b>OVERALL: FAIL — UNSTABLE</b><br>' + root.escSafe(d.reason) + '</div>';
    }
    const fails = d.checks.filter(x => !x.pass);
    if (fails.length) {
      return '<div class="result bad"><b>OVERALL: FAIL</b><br>' + fails.map(x => root.escSafe(x.label) + ' exceeds capacity.').join('<br>') + '</div>';
    }
    return '<div class="result ok"><b>OVERALL: PASS (IS 800:2007)</b><br>All Limit State checks pass with current sections.</div>';
  }

  function renderInspector() {
    const box = document.getElementById('inspector');
    if (!box) return;

    const S = root.S;
    const d = root.stableAnalysis ? root.stableAnalysis() : null;
    if (!d || d.mechanism) {
      box.innerHTML = '<h2>Element Inspector</h2>' + overallStatusHTML(d || { mechanism: true, reason: 'Analysis unavailable' });
      return;
    }

    // Build selectable element list for mobile and mouse-free inspection
    const selectableList = [];
    if (d.members) {
      d.members.forEach((m, i) => {
        selectableList.push({
          key: 'member_' + i,
          label: `M${i + 1} · ${m.role} (${m.governingForce < 0 ? 'Comp' : 'Tens'})`,
          data: { kind: 'member', index: i, frame: 0, role: m.role }
        });
      });
    }
    selectableList.push({
      key: 'col_0',
      label: 'Column Left (2× ' + (S.column || 'ISMC 150') + ')',
      data: { kind: 'column', side: 0, frame: 0 }
    });
    selectableList.push({
      key: 'col_1',
      label: 'Column Right (2× ' + (S.column || 'ISMC 150') + ')',
      data: { kind: 'column', side: 1, frame: 0 }
    });
    selectableList.push({
      key: 'purlin_0',
      label: 'Roof Purlin (' + (S.purlin || 'ISMC 125') + ')',
      data: { kind: 'purlin', purlinIndex: 0, frame: 0 }
    });
    selectableList.push({
      key: 'bracing_0',
      label: 'Wind Bracing System',
      data: { kind: 'bracing', bay: 0 }
    });

    let activeKey = '';
    if (sel) {
      if (sel.kind === 'member') activeKey = 'member_' + sel.index;
      else if (sel.kind === 'column') activeKey = 'col_' + (sel.side || 0);
      else if (sel.kind === 'purlin') activeKey = 'purlin_0';
      else if (sel.kind === 'bracing') activeKey = 'bracing_0';
    }

    const quickNavHTML = `
      <div class="inspector-quicknav">
        <button id="quickPrevElem" class="nav-arrow-btn" title="Previous element (or Left Arrow)">◀</button>
        <select id="quickElemSelect" class="quick-select" aria-label="Select element to inspect">
          ${selectableList.map(item => `<option value="${item.key}" ${item.key === activeKey ? 'selected' : ''}>${root.escSafe(item.label)}</option>`).join('')}
        </select>
        <button id="quickNextElem" class="nav-arrow-btn" title="Next element (or Right Arrow)">▶</button>
        <button id="quickFocusElem" class="nav-focus-btn" title="Focus 3D View on this element">🎯 Focus</button>
      </div>`;

    h += quickNavHTML;

    if (!sel) {
      const gm = d.governingMember || (d.members && d.members[0]) || { idx: 0, role: 'chord', governingForce: 0, governingCapacity: 1, util: 0, lambda: 0, lambdaLimit: 180, pass: true, governingLC: '1.5(DL+LL)' };
      const isComp = gm.governingForce < 0;
      h += `
        <div class="solution-callout" style="margin-bottom:10px; border:1px solid #233748; background:#0f171f; color:#a3bccf;">
          <b style="color:var(--accent);">Interactive 3D Inspector</b><br>
          Click any <b>truss chord</b>, <b>web diagonal</b>, <b>column</b>, <b>purlin</b>, or <b>joint</b> in the 3D viewport (or use the dropdown above) to inspect real-time axial forces, capacities, slenderness ratio (&lambda;), and IS 800 code checks.
        </div>
        <div class="inspect-title"><b>Governing Member Overview</b><span class="tag" style="color:var(--accent);border-color:#315267;">M${gm.idx + 1}</span></div>
        <div class="inspect-sub">${root.escSafe(gm.role)} · ${isComp ? 'Compression' : 'Tension'} (${root.escSafe(gm.governingLC)})</div>
        <div class="inspectgrid">
          <div class="icell"><span>Design Force</span>${Math.abs(gm.governingForce).toFixed(1)} kN</div>
          <div class="icell"><span>IS 800 Capacity</span>${gm.governingCapacity.toFixed(1)} kN</div>
          <div class="icell"><span>Utilization</span>${(gm.util * 100).toFixed(1)}%</div>
          <div class="icell"><span>Slenderness λ</span>${gm.lambda.toFixed(1)} / ${gm.lambdaLimit}</div>
          <div class="icell"><span>Active Section</span>2 × ${root.escSafe(S.section)}</div>
          <div class="icell"><span>Status</span>${gm.pass ? '<span style="color:var(--ok)">PASS</span>' : '<span style="color:var(--bad)">FAIL</span>'}</div>
        </div>`;
    } else if (sel.kind === 'member' && d.members[sel.index]) {
      const m = d.members[sel.index];
      const isComp = m.governingForce < 0;
      h += `<div class="inspect-title"><b>Member M${sel.index + 1}</b><span class="tag">FRAME ${(Number(sel.frame) || 0) + 1}</span></div>`;
      h += `<div class="inspect-sub">${root.escSafe(m.role)} · ${isComp ? 'Compression' : 'Tension'} (${root.escSafe(m.governingLC)})</div>`;
      h += `<div class="inspectgrid">
        <div class="icell"><span>Length</span>${m.length_m.toFixed(2)} m</div>
        <div class="icell"><span>Design Force</span>${Math.abs(m.governingForce).toFixed(1)} kN</div>
        <div class="icell"><span>IS 800 Capacity</span>${m.governingCapacity.toFixed(1)} kN</div>
        <div class="icell"><span>Utilization</span>${(m.util * 100).toFixed(1)}%</div>
        <div class="icell"><span>Slenderness λ</span>${m.lambda.toFixed(1)} / ${m.lambdaLimit}</div>
        <div class="icell"><span>Status</span>${m.pass ? '<span style="color:var(--ok)">PASS</span>' : '<span style="color:var(--bad)">FAIL</span>'}</div>
      </div>`;
    } else if (sel.kind === 'column') {
      const c = d.column;
      h += `<div class="inspect-title"><b>Built-up 2C Column</b><span class="tag">FRAME ${(Number(sel.frame) || 0) + 1}</span></div>`;
      h += `<div class="inspect-sub">2 × ${root.escSafe(S.column)} back-to-back with lacing</div>`;
      h += `<div class="inspectgrid">
        <div class="icell"><span>Web Gap s</span>${c.spacing_s} mm</div>
        <div class="icell"><span>Design Reaction</span>${c.demand.toFixed(1)} kN</div>
        <div class="icell"><span>Column Capacity</span>${c.Pd.toFixed(1)} kN</div>
        <div class="icell"><span>Eff. Slenderness λe</span>${c.lambda_e.toFixed(1)}</div>
        <div class="icell"><span>Transverse Shear Vt</span>${c.Vt.toFixed(2)} kN</div>
        <div class="icell"><span>Column Status</span>${c.colPass ? '<span style="color:var(--ok)">PASS</span>' : '<span style="color:var(--bad)">FAIL</span>'}</div>
      </div>`;
    } else if (sel.kind === 'purlin') {
      const p = d.purlin;
      h += `<div class="inspect-title"><b>Roof Purlin</b><span class="tag">IS 800 CL. 8.2</span></div>`;
      h += `<div class="inspect-sub">${root.escSafe(S.purlin)} on rafter @ ${Number(S.purlinSpacing).toFixed(2)} m</div>`;
      h += `<div class="inspectgrid">
        <div class="icell"><span>Biaxial Moments</span>${p.Mz.toFixed(1)} / ${p.My.toFixed(1)} kNm</div>
        <div class="icell"><span>Capacities Mdz,Mdy</span>${p.Mdz.toFixed(1)} / ${p.Mdy.toFixed(1)} kNm</div>
        <div class="icell"><span>Biaxial Ratio</span>${(p.interactionRatio * 100).toFixed(1)}%</div>
        <div class="icell"><span>Deflection</span>${p.delta.toFixed(1)} / ${p.delta_limit.toFixed(1)} mm</div>
        <div class="icell"><span>Shear Vz</span>${p.Vz.toFixed(1)} / ${p.Vdz.toFixed(1)} kN</div>
        <div class="icell"><span>Purlin Status</span>${p.pass ? '<span style="color:var(--ok)">PASS</span>' : '<span style="color:var(--bad)">FAIL</span>'}</div>
      </div>`;
    } else if (sel.kind === 'node') {
      const t = root.truss ? root.truss() : { nodes: [] };
      const n = t.nodes[sel.index] || { x: 0, y: 0 };
      const isPin = sel.index === t.pin;
      const isRoller = sel.index === t.roller;
      h += `<div class="inspect-title"><b>Joint Node N${Number(sel.index) + 1}</b><span class="tag">FRAME ${(Number(sel.frame) || 0) + 1}</span></div>`;
      h += `<div class="inspect-sub">Support / panel point</div>`;
      h += `<div class="inspectgrid">
        <div class="icell"><span>X (Span)</span>${n.x.toFixed(2)} m</div>
        <div class="icell"><span>Y (Height)</span>${n.y.toFixed(2)} m</div>
        <div class="icell"><span>Support Type</span>${isPin ? 'Hinge Pin' : isRoller ? 'Roller Support' : 'Internal Joint'}</div>
        <div class="icell"><span>Frame Z</span>${((sel.frame || 0) * S.spacing).toFixed(2)} m</div>
      </div>`;
    } else if (sel.kind === 'bracing') {
      const bIdx = Number(sel.bay) || 0;
      const totalBays = Math.max(1, root.frameCount() - 1);
      const isEndBay = bIdx === 0 || bIdx === totalBays - 1;
      h += `<div class="inspect-title"><b>Longitudinal Wind Bracing</b><span class="tag">IS 800 CL. 4.3</span></div>`;
      h += `<div class="inspect-sub">${root.escSafe(root.stabilityText ? root.stabilityText() : 'X-Bracing')} · Bay ${bIdx + 1} (${isEndBay ? 'Gable End Bay' : 'Intermediate Expansion Bay'})</div>`;
      h += `<div class="inspectgrid">
        <div class="icell"><span>Configuration</span>${root.escSafe(S.stabilitySystem || 'x_bracing').toUpperCase()}</div>
        <div class="icell"><span>Positioning</span>${isEndBay ? 'Gable End Bay (Direct Wind Path)' : 'Intermediate Expansion Bay'}</div>
        <div class="icell"><span>Function</span>Resists longitudinal wind drag & gable thrust</div>
        <div class="icell"><span>Load Path</span>Gables → Roof Truss → Eaves Struts → Footing</div>
        <div class="icell"><span>Code Standard</span>IS 800:2007 Cl. 4.3</div>
        <div class="icell"><span>Status</span><span style="color:var(--ok)">PASS (ACTIVE)</span></div>
      </div>`;
    } else if (sel.kind === 'eaves_strut' || sel.kind === 'side_rail') {
      const isEave = sel.kind === 'eaves_strut';
      h += `<div class="inspect-title"><b>${isEave ? 'Longitudinal Eaves Strut' : 'Side Girt Rail'}</b><span class="tag">FRAME LINK</span></div>`;
      h += `<div class="inspect-sub">Continuous longitudinal link connecting column heads across all frames</div>`;
      h += `<div class="inspectgrid">
        <div class="icell"><span>Member Type</span>${isEave ? 'Eaves Compression Strut' : 'Wall Girt Rail'}</div>
        <div class="icell"><span>Function</span>Transfers wind thrust to braced bays</div>
        <div class="icell"><span>Span Between Frames</span>${Number(S.spacing).toFixed(2)} m</div>
        <div class="icell"><span>Continuity</span>Runs continuous over shed length (${Number(S.length).toFixed(1)} m)</div>
      </div>`;
    } else {
      h += `<div class="inspect-title"><b>${root.escSafe(sel.kind || 'MODEL').toUpperCase()}</b><span class="tag">COMPONENT</span></div>`;
      h += `<div class="inspect-sub">Load transferring structural element.</div>`;
    }

    box.innerHTML = h;

    // Attach quick navigation event listeners
    const selEl = document.getElementById('quickElemSelect');
    if (selEl) {
      selEl.onchange = (e) => {
        const item = selectableList.find(x => x.key === e.target.value);
        if (item) {
          root.S.selected = item.data;
          renderInspector();
          if (root.updateSelectionHighlight) root.updateSelectionHighlight();
          if (root.focusSelection) root.focusSelection(item.data);
        }
      };
    }
    const prevBtn = document.getElementById('quickPrevElem');
    if (prevBtn) {
      prevBtn.onclick = () => {
        let curIdx = selectableList.findIndex(x => x.key === activeKey);
        if (curIdx <= 0) curIdx = selectableList.length - 1;
        else curIdx--;
        const item = selectableList[curIdx];
        if (item) {
          root.S.selected = item.data;
          renderInspector();
          if (root.updateSelectionHighlight) root.updateSelectionHighlight();
          if (root.focusSelection) root.focusSelection(item.data);
        }
      };
    }
    const nextBtn = document.getElementById('quickNextElem');
    if (nextBtn) {
      nextBtn.onclick = () => {
        let curIdx = selectableList.findIndex(x => x.key === activeKey);
        if (curIdx < 0 || curIdx >= selectableList.length - 1) curIdx = 0;
        else curIdx++;
        const item = selectableList[curIdx];
        if (item) {
          root.S.selected = item.data;
          renderInspector();
          if (root.updateSelectionHighlight) root.updateSelectionHighlight();
          if (root.focusSelection) root.focusSelection(item.data);
        }
      };
    }
    const focusBtn = document.getElementById('quickFocusElem');
    if (focusBtn) {
      focusBtn.onclick = () => {
        if (root.focusSelection) root.focusSelection();
      };
    }

    refreshChecks(d);
    refreshRecommendations(d);
    updateReasonPanel(d, sel);
  }
  }

  function refreshChecks(d) {
    const box = document.getElementById('checks');
    if (!box) return;
    box.innerHTML = overallStatusHTML(d) +
      d.checks.map(x => `
        <div class="checkrow">
          <span>${root.escSafe(x.label)}</span>
          <b style="color:${x.pass ? 'var(--ok)' : 'var(--bad)'}">${x.pass ? 'PASS' : 'FAIL'}</b>
        </div>
      `).join('') +
      `<div class="checkrow"><span>Stability System</span><b>${root.escSafe(root.stabilityText())}</b></div>` +
      `<div class="checkrow"><span>Longitudinal Struts</span><b>${root.frameCount() > 1 ? 'CONNECTED' : 'NONE'}</b></div>`;
  }

  function refreshRecommendations(d) {
    const card = document.getElementById('recommendationsCard');
    const box = document.getElementById('recommendations');
    const applyBtn = document.getElementById('applyRecommendedInputs');
    if (!box) return;

    const fails = (d && d.checks) ? d.checks.filter(x => !x.pass) : [];
    const q = root.stableRecommendationValues ? root.stableRecommendationValues() : { items: [], values: {} };

    // ONLY SHOW IF FAILS
    if (!fails.length || !q.items.length) {
      if (card) card.style.display = 'none';
      box.innerHTML = '';
      if (applyBtn) applyBtn.style.display = 'none';
      return;
    }

    if (card) card.style.display = 'block';
    if (applyBtn) applyBtn.style.display = 'block';

    let html = `
      <div class="result bad" style="margin-bottom:10px; padding:8px 10px;">
        <b>Design Adjustments Required (${fails.length} Check${fails.length > 1 ? 's' : ''} Exceeded)</b><br>
        The following optimal section resizing brings all Limit State checks within IS 800:2007 limits:
      </div>`;

    html += q.items.map(x => `
      <div class="rec-item-card">
        <div class="rec-item-header">
          <div class="rec-comp-name">
            <span class="rec-dot"></span>
            <b>${root.escSafe(x.component || 'OPTIMIZATION')}</b>
          </div>
          <span class="rec-badge-fail">EXCEEDS LIMIT</span>
        </div>
        <div class="rec-change-box">
          <div class="rec-change-row">
            <span class="rec-state-label">CURRENT PROVIDING:</span>
            <span class="rec-state-val">${root.escSafe(x.current)}</span>
          </div>
          <div class="rec-arrow-divider">
            <span>↓ OPTIMAL SIZING</span>
          </div>
          <div class="rec-change-row">
            <span class="rec-state-label">RECOMMENDED SIZING:</span>
            <span class="rec-state-val highlight">→ ${root.escSafe(x.recommended)}</span>
          </div>
        </div>
        <div class="rec-item-details">
          ${root.escSafe(x.details)}
        </div>
      </div>
    `).join('');

    box.innerHTML = html;
  }

  function updateReasonPanel(d, sel) {
    const box = document.getElementById('reason');
    if (!box) return;
    if (sel && sel.kind === 'member' && d.members[sel.index]) {
      const m = d.members[sel.index];
      box.className = 'result ' + (m.pass ? 'ok' : 'bad');
      box.innerHTML = `<b>${m.pass ? 'Member Passes IS 800 Check' : 'Member Exceeds Capacity / Slenderness'}</b><br>` +
        `Design axial force ${Math.abs(m.governingForce).toFixed(1)} kN (${m.governingLC}) vs capacity ${m.governingCapacity.toFixed(1)} kN. Slenderness ${m.lambda.toFixed(1)} / ${m.lambdaLimit}. Utilization ${(m.util * 100).toFixed(1)}%.`;
      return;
    }
    if (sel && sel.kind === 'column') {
      const c = d.column;
      box.className = 'result ' + (c.colPass ? 'ok' : 'bad');
      box.innerHTML = `<b>${c.colPass ? 'Column Passes IS 800 Check' : 'Column Exceeds Capacity'}</b><br>` +
        `Factored axial demand ${c.demand.toFixed(1)} kN vs laced capacity ${c.Pd.toFixed(1)} kN. Effective slenderness λe = ${c.lambda_e.toFixed(1)}. Utilization ${(c.colUtil * 100).toFixed(1)}%.`;
      return;
    }
    if (sel && sel.kind === 'bracing') {
      box.className = 'result ok';
      box.innerHTML = '<b>IS 800:2007 Cl. 4.3 Longitudinal Bracing:</b><br>' +
        'Bracing bays are calculated at both gable ends (and central expansion bay) to transmit longitudinal wind actions and crane surge from gables down to foundations without torsional eccentricity.';
      return;
    }

    const fails = d.checks.filter(x => !x.pass).map(x => x.label);
    box.className = 'result ' + (fails.length ? 'bad' : 'ok');
    box.innerHTML = fails.length
      ? '<b>Governing Limit State Issues:</b><br>' + fails.join('<br>')
      : '<b>Design Is Fully Satisfactory:</b><br>All governing load combinations comply with IS 800:2007 strength and stability criteria.';
  }

  function refreshAssignmentSnapshot() {
    const box = document.getElementById('assignmentSnapshot');
    if (!box) return;
    const S = root.S;
    const G = (root.GROUPS && root.GROUPS[S.group]) || {};
    box.innerHTML = `
      <div class="snapshot-grid">
        <div><small>Group</small><b>${root.escSafe(S.group)}</b></div>
        <div><small>Location</small><b>${root.escSafe(G.loc || 'Custom')}</b></div>
        <div><small>Truss</small><b>${root.escSafe(S.truss)}</b></div>
        <div><small>Span</small><b>${Number(S.span).toFixed(2)} m</b></div>
        <div><small>Length</small><b>${Number(S.length).toFixed(2)} m</b></div>
        <div><small>Height</small><b>${Number(S.height).toFixed(2)} m</b></div>
        <div><small>Spacing</small><b>${Number(S.spacing).toFixed(2)} m</b></div>
        <div><small>Slope</small><b>${Number(S.slope).toFixed(1)}°</b></div>
        <div><small>Stability</small><b>${root.escSafe(root.stabilityText())}</b></div>
      </div>`;
  }

  function applyRecommendedInputs() {
    const q = root.stableRecommendationValues ? root.stableRecommendationValues() : { values: {} };
    const v = q.values || {};
    const S = root.S;
    let changed = false;

    Object.keys(v).forEach((k) => {
      if (['section', 'purlin', 'column'].includes(k)) {
        S[k] = v[k];
        changed = true;
      } else {
        const val = Number(v[k]);
        if (!isNaN(val)) {
          S[k] = val;
          changed = true;
        }
      }
    });

    if (changed) {
      if (root.syncInputs) root.syncInputs();
      if (root.refresh) root.refresh();
    }
  }

  const InspectorModule = {
    renderInspector,
    refreshChecks,
    refreshRecommendations,
    refreshRecommendedInputs: refreshRecommendations,
    updateReasonPanel,
    refreshAssignmentSnapshot,
    applyRecommendedInputs
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = InspectorModule;
  } else {
    root.InspectorModule = InspectorModule;
    root.refreshInspector = renderInspector;
    root.refreshChecks = refreshChecks;
    root.refreshAssignmentSnapshot = refreshAssignmentSnapshot;
    root.applyRecommendedInputs = applyRecommendedInputs;
  }
})(typeof window !== 'undefined' ? window : global);
