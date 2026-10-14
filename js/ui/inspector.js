/**
 * Structural Design Studio — Inspector, Status & Recommendation UI Module
 */

(function(root) {
  'use strict';

  function renderKaTeXInElement(container) {
    if (!container || typeof katex === 'undefined') return;
    try {
      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
      const candidates = [];
      while (walker.nextNode()) {
        const tn = walker.currentNode;
        if (!tn.nodeValue || !tn.nodeValue.includes('$')) continue;
        let p = tn.parentElement;
        let skip = false;
        while (p && p !== container) {
          const cl = p.classList;
          const tag = p.tagName;
          if ((cl && (cl.contains('katex') || cl.contains('fallback-math'))) || tag === 'SCRIPT' || tag === 'STYLE' || tag === 'PRE' || tag === 'CODE') {
            skip = true;
            break;
          }
          p = p.parentElement;
        }
        if (!skip) candidates.push(tn);
      }
      candidates.forEach((tn) => {
        const val = tn.nodeValue;
        const regex = /\$([^$\n]+?)\$/g;
        let match;
        let lastIdx = 0;
        const frag = document.createDocumentFragment();
        while ((match = regex.exec(val)) !== null) {
          if (match.index > lastIdx) {
            frag.appendChild(document.createTextNode(val.substring(lastIdx, match.index)));
          }
          const mathSrc = match[1];
          const span = document.createElement('span');
          span.className = 'inline-katex';
          try {
            katex.render(mathSrc, span, { displayMode: false, throwOnError: false });
          } catch (err) {
            span.textContent = '$' + mathSrc + '$';
          }
          frag.appendChild(span);
          lastIdx = regex.lastIndex;
        }
        if (lastIdx < val.length) {
          frag.appendChild(document.createTextNode(val.substring(lastIdx)));
        }
        if (tn.parentNode) {
          tn.parentNode.replaceChild(frag, tn);
        }
      });
    } catch (e) {
      console.warn('Inspector KaTeX error', e);
    }
  }

  function overallStatusHTML(d) {
    if (!d || d.mechanism) {
      return '<div class="result bad"><b>OVERALL: FAIL — UNSTABLE STRUCTURE</b><br>' + root.escSafe((d && d.reason) || 'Analysis unavailable') + '</div>';
    }
    const fails = (d.checks || []).filter(x => !x.pass);
    if (fails.length) {
      return '<div class="result bad"><b>OVERALL: DESIGN ADJUSTMENT NEEDED</b><br>' + fails.map(x => root.escSafe(x.label) + ' exceeds IS 800 capacity.').join('<br>') + '</div>';
    }
    return '<div class="result ok"><b>OVERALL: PASS (IS 800:2007)</b><br>All Limit State criteria & member capacities satisfied.</div>';
  }

  function renderInspector() {
    const box = document.getElementById('inspector');
    if (!box) return;

    const S = root.S;
    const sel = S.selected;
    const d = root.stableAnalysis ? root.stableAnalysis() : null;
    if (!d || d.mechanism) {
      box.innerHTML = '<h2>Element Inspector</h2>' + overallStatusHTML(d || { mechanism: true, reason: 'Analysis unavailable' });
      refreshChecks(d || { mechanism: true, checks: [] });
      refreshRecommendations(d || { mechanism: true, checks: [] });
      return;
    }

    // Build selectable element list for quick dropdown selection
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
      label: 'Column Left (2× ' + (S.column || 'ISMC 125') + ')',
      data: { kind: 'column', side: 0, frame: 0 }
    });
    selectableList.push({
      key: 'col_1',
      label: 'Column Right (2× ' + (S.column || 'ISMC 125') + ')',
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

    let h = `
      <div class="inspector-quicknav" style="display:flex;gap:6px;align-items:center;margin-bottom:12px;">
        <button id="quickPrevElem" class="btn" style="height:32px;padding:0 8px;" title="Previous element">◀</button>
        <select id="quickElemSelect" style="flex:1;height:32px;font-size:11px;">
          <option value="" ${!activeKey ? 'selected' : ''}>— Select Element to Inspect —</option>
          ${selectableList.map(item => `<option value="${item.key}" ${item.key === activeKey ? 'selected' : ''}>${root.escSafe(item.label)}</option>`).join('')}
        </select>
        <button id="quickNextElem" class="btn" style="height:32px;padding:0 8px;" title="Next element">▶</button>
      </div>`;

    if (!sel) {
      // OVERALL STRUCTURE INFORMATION CARD
      const maxMemberForce = d.members && d.members.length ? Math.max(...d.members.map(m => Math.abs(m.governingForce || 0))) : 0;
      const maxUtil = d.members && d.members.length ? Math.max(...d.members.map(m => m.util || 0)) : 0;
      const criticalMember = d.governingMember || (d.members ? d.members.find(m => m.util === maxUtil) : null);
      const critIdx = criticalMember ? ((criticalMember.idx !== undefined ? criticalMember.idx : criticalMember.index) || 0) : 0;
      const count = root.frameCount ? root.frameCount() : 1;
      const rise = (Number(S.span) / 2) * Math.tan((Number(S.slope) || 10) * Math.PI / 180);

      h += `
        <div class="overall-structure-card" style="display:flex;flex-direction:column;gap:10px;">
          ${overallStatusHTML(d)}
          <div class="inspect-title" style="display:flex;justify-content:space-between;align-items:center;">
            <b>Overall Structural Summary</b>
            <span class="tag">GLOBAL FEA</span>
          </div>
          <div class="inspectgrid">
            <div class="icell"><span>Span × Length</span>${Number(S.span).toFixed(1)} m × ${Number(S.length).toFixed(1)} m</div>
            <div class="icell"><span>Eave × Apex H</span>${Number(S.height).toFixed(1)} m / +${rise.toFixed(2)} m</div>
            <div class="icell"><span>Total Frames</span>${count} frames (${count - 1} bays)</div>
            <div class="icell"><span>Max Force</span>${maxMemberForce.toFixed(1)} kN</div>
            <div class="icell"><span>Max Utilization</span>${(maxUtil * 100).toFixed(1)}% ${maxUtil > 1 ? '<b style="color:var(--bad)">(FAIL)</b>' : '<b style="color:var(--ok)">(PASS)</b>'}</div>
            <div class="icell"><span>Critical Member</span>${criticalMember ? 'M' + (critIdx + 1) + ' (' + criticalMember.role + ')' : '—'}</div>
            <div class="icell"><span>Column Axial P</span>${d.column ? d.column.demand.toFixed(1) : '—'} kN</div>
            <div class="icell"><span>Purlin Interaction</span>${d.purlin ? (d.purlin.interactionRatio * 100).toFixed(1) + '%' : '—'}</div>
          </div>
          <div class="solution-callout" style="font-size:11px;">
            <b style="color:var(--accent);">Interactive 3D Inspector:</b> Click any <b>truss member</b>, <b>column</b>, <b>purlin</b> or <b>bracing</b> in the 3D canvas (or use the dropdown above) to inspect governing forces, slenderness ratio, and IS 800:2007 capacities.
          </div>
        </div>`;
    } else if (sel.kind === 'member' && d.members && d.members[sel.index]) {
      const m = d.members[sel.index];
      const isComp = m.governingForce < 0;
      h += `
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div class="inspect-title"><b>Member M${sel.index + 1}</b><span class="tag">FRAME ${(Number(sel.frame) || 0) + 1}</span></div>
          <button id="btnClearSel" class="btn" style="height:26px;padding:0 8px;font-size:10px;">✕ Clear</button>
        </div>`;
      h += `<div class="inspect-sub">${root.escSafe(m.role)} · ${isComp ? 'Compression' : 'Tension'} (${root.escSafe(m.governingLC || 'DL + LL')})</div>`;
      h += `<div class="inspectgrid" style="margin-top:8px;">
        <div class="icell"><span>Length L</span>${m.length_m.toFixed(2)} m</div>
        <div class="icell"><span>Design Force Pu</span>${Math.abs(m.governingForce).toFixed(1)} kN</div>
        <div class="icell"><span>IS 800 Capacity Pd</span>${m.governingCapacity.toFixed(1)} kN</div>
        <div class="icell"><span>Utilization Ratio</span>${(m.util * 100).toFixed(1)}%</div>
        <div class="icell"><span>Slenderness λ</span>${m.lambda.toFixed(1)} / ${m.lambdaLimit}</div>
        <div class="icell"><span>Cross Section</span>${root.escSafe(S.section || 'ISA 75x75x6')}</div>
        <div class="icell"><span>Status</span>${m.pass ? '<span style="color:var(--ok);font-weight:600;">PASS</span>' : '<span style="color:var(--bad);font-weight:600;">FAIL</span>'}</div>
        <div class="icell"><span>Governing LC</span>${root.escSafe(m.governingLC || 'DL+LL')}</div>
      </div>`;
    } else if (sel.kind === 'column') {
      const c = d.column || {};
      h += `
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div class="inspect-title"><b>Built-up 2C Column</b><span class="tag">FRAME ${(Number(sel.frame) || 0) + 1}</span></div>
          <button id="btnClearSel" class="btn" style="height:26px;padding:0 8px;font-size:10px;">✕ Clear</button>
        </div>`;
      h += `<div class="inspect-sub">2 × ${root.escSafe(S.column)} back-to-back with lacing flats</div>`;
      h += `<div class="inspectgrid" style="margin-top:8px;">
        <div class="icell"><span>Channel Section</span>2 × ${root.escSafe(S.column)}</div>
        <div class="icell"><span>Web Gap s</span>${c.spacing_s || 60} mm</div>
        <div class="icell"><span>Axial Demand Pu</span>${(c.demand || 0).toFixed(1)} kN</div>
        <div class="icell"><span>Column Capacity Pd</span>${(c.Pd || c.capacity || 0).toFixed(1)} kN</div>
        <div class="icell"><span>Eff. Slenderness λe</span>${(c.lambda_e || c.lambda || 0).toFixed(1)}</div>
        <div class="icell"><span>Transverse Shear Vt</span>${(c.Vt || 0).toFixed(2)} kN</div>
        <div class="icell"><span>Lacing Pitch</span>${Number(S.lacing || 0.6).toFixed(2)} m</div>
        <div class="icell"><span>Status</span>${c.colPass ? '<span style="color:var(--ok);font-weight:600;">PASS</span>' : '<span style="color:var(--bad);font-weight:600;">FAIL</span>'}</div>
      </div>`;
    } else if (sel.kind === 'purlin') {
      const p = d.purlin || {};
      h += `
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div class="inspect-title"><b>Roof Purlin</b><span class="tag">IS 800 CL. 8.2</span></div>
          <button id="btnClearSel" class="btn" style="height:26px;padding:0 8px;font-size:10px;">✕ Clear</button>
        </div>`;
      h += `<div class="inspect-sub">${root.escSafe(S.purlin)} on rafter @ ${Number(S.purlinSpacing).toFixed(2)} m</div>`;
      h += `<div class="inspectgrid" style="margin-top:8px;">
        <div class="icell"><span>Section</span>${root.escSafe(S.purlin)}</div>
        <div class="icell"><span>Purlin Spacing</span>${Number(S.purlinSpacing).toFixed(2)} m</div>
        <div class="icell"><span>Biaxial Moments</span>${(p.Mz || p.M || 0).toFixed(1)} / ${(p.My || 0).toFixed(1)} kNm</div>
        <div class="icell"><span>Capacities Mdz,Mdy</span>${(p.Mdz || p.Md || 0).toFixed(1)} / ${(p.Mdy || 0).toFixed(1)} kNm</div>
        <div class="icell"><span>Interaction Ratio</span>${((p.interactionRatio || p.util || 0) * 100).toFixed(1)}%</div>
        <div class="icell"><span>Deflection</span>${(p.delta || 0).toFixed(1)} / ${(p.delta_limit || p.dlim || 0).toFixed(1)} mm</div>
        <div class="icell"><span>Shear Vz</span>${(p.Vz || p.V || 0).toFixed(1)} / ${(p.Vdz || p.Vd || 0).toFixed(1)} kN</div>
        <div class="icell"><span>Status</span>${p.pass ? '<span style="color:var(--ok);font-weight:600;">PASS</span>' : '<span style="color:var(--bad);font-weight:600;">FAIL</span>'}</div>
      </div>`;
    } else if (sel.kind === 'bracing') {
      const bIdx = Number(sel.bay) || 0;
      const totalBays = Math.max(1, (root.frameCount ? root.frameCount() : 1) - 1);
      const isEndBay = bIdx === 0 || bIdx === totalBays - 1;
      h += `
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div class="inspect-title"><b>Longitudinal Wind Bracing</b><span class="tag">IS 800 CL. 4.3</span></div>
          <button id="btnClearSel" class="btn" style="height:26px;padding:0 8px;font-size:10px;">✕ Clear</button>
        </div>`;
      h += `<div class="inspect-sub">${root.escSafe(root.stabilityText ? root.stabilityText() : 'X-Bracing')} · Bay ${bIdx + 1}</div>`;
      h += `<div class="inspectgrid" style="margin-top:8px;">
        <div class="icell"><span>Configuration</span>${root.escSafe(S.stabilitySystem || 'x_bracing').toUpperCase()}</div>
        <div class="icell"><span>Positioning</span>${isEndBay ? 'Gable End Bay' : 'Intermediate Expansion Bay'}</div>
        <div class="icell"><span>Function</span>Resists wind drag & gable thrust</div>
        <div class="icell"><span>Load Path</span>Gables → Roof Truss → Eaves Struts → Footing</div>
        <div class="icell"><span>Standard</span>IS 800:2007 Cl. 4.3</div>
        <div class="icell"><span>Status</span><span style="color:var(--ok);font-weight:600;">PASS (ACTIVE)</span></div>
      </div>`;
    } else if (sel.kind === 'roof' || sel.kind === 'roof-edge') {
      const isAC = S.roof === 'AC';
      h += `
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div class="inspect-title"><b>Roof Cladding</b><span class="tag">IS 875 CL. 6.2</span></div>
          <button id="btnClearSel" class="btn" style="height:26px;padding:0 8px;font-size:10px;">✕ Clear</button>
        </div>`;
      h += `<div class="inspect-sub">${isAC ? 'AC Asbestos Cement Sheeting' : 'GI Corrugated Profile Sheeting (Pre-painted Steel)'}</div>`;
      h += `<div class="inspectgrid" style="margin-top:8px;">
        <div class="icell"><span>Material Type</span>${isAC ? 'Fibre Cement' : 'PPGI Steel'}</div>
        <div class="icell"><span>Dead Load</span>${isAC ? '0.160' : '0.131'} kN/m²</div>
        <div class="icell"><span>Roof Pitch</span>${Number(S.slope || 10).toFixed(1)}°</div>
        <div class="icell"><span>Overhang</span>${Number(S.overhang || 0.6).toFixed(2)} m</div>
        <div class="icell"><span>Fasteners</span>J-Bolts @ Purlins</div>
        <div class="icell"><span>Status</span><span style="color:var(--ok);font-weight:600;">PASS (ACTIVE)</span></div>
      </div>`;
    } else {
      h += `
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div class="inspect-title"><b>${root.escSafe(sel.kind || 'ELEMENT').toUpperCase()}</b><span class="tag">COMPONENT</span></div>
          <button id="btnClearSel" class="btn" style="height:26px;padding:0 8px;font-size:10px;">✕ Clear</button>
        </div>
        <div class="inspect-sub">Load transferring structural element.</div>`;
    }

    box.innerHTML = h;

    // Attach element selector event listeners
    const selEl = document.getElementById('quickElemSelect');
    if (selEl) {
      selEl.onchange = (e) => {
        const item = selectableList.find(x => x.key === e.target.value);
        if (item) {
          root.S.selected = item.data;
          renderInspector();
          if (root.updateSelectionHighlight) root.updateSelectionHighlight();
          if (root.focusSelection) root.focusSelection(item.data);
        } else {
          root.S.selected = null;
          renderInspector();
          if (root.updateSelectionHighlight) root.updateSelectionHighlight();
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
    const clearBtn = document.getElementById('btnClearSel');
    if (clearBtn) {
      clearBtn.onclick = () => {
        root.S.selected = null;
        renderInspector();
        if (root.updateSelectionHighlight) root.updateSelectionHighlight();
      };
    }

    if (root.syncCustomSelects) root.syncCustomSelects();

    refreshChecks(d);
    refreshRecommendations(d);
    updateReasonPanel(d, sel);
  }

  function refreshChecks(d) {
    const box = document.getElementById('checks');
    if (!box) return;

    const passes = !d.mechanism && d.checks && d.checks.every(x => x.pass);
    const inspBadge = document.getElementById('inspectorStatusBadge');
    if (inspBadge) {
      inspBadge.textContent = passes ? 'IS 800 PASS' : 'CHECK NEEDED';
      inspBadge.className = 'status ' + (passes ? 'ok' : '');
    }

    box.innerHTML = (d.checks || []).map(x => `
      <div class="checkrow" style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--line);">
        <span style="font-size:11px;color:var(--text);">${root.escSafe(x.label)}</span>
        <b style="font-size:11px;color:${x.pass ? 'var(--ok)' : 'var(--bad)'}">${x.pass ? 'PASS' : 'FAIL'}</b>
      </div>
    `).join('') +
    `<div class="checkrow" style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--line);">
      <span style="font-size:11px;color:var(--text);">Stability System</span>
      <b style="font-size:11px;color:var(--ok);">${root.escSafe(root.stabilityText ? root.stabilityText() : 'X-Bracing')}</b>
    </div>
    <div class="checkrow" style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;">
      <span style="font-size:11px;color:var(--text);">Longitudinal Struts</span>
      <b style="font-size:11px;color:var(--ok);">${(root.frameCount && root.frameCount() > 1) ? 'CONNECTED' : 'NONE'}</b>
    </div>`;
  }

  function refreshRecommendations(d) {
    if (!d && root.stableAnalysis) d = root.stableAnalysis();
    const card = document.getElementById('recommendationsCard');
    const box = document.getElementById('recommendations');
    const applyBtn = document.getElementById('applyRecommendedInputs');
    if (!box) return;

    const fails = (d && d.checks) ? d.checks.filter(x => !x.pass) : [];
    const q = root.stableRecommendationValues ? root.stableRecommendationValues() : { items: [], values: {} };

    // SHOW ALWAYS OR IF ITEMS ARE RECOMMENDED
    if (card) card.style.display = 'block';

    if (!fails.length && (!q.items || !q.items.length)) {
      box.innerHTML = `
        <div class="result ok" style="padding:10px 12px; font-size:11px; margin-bottom:8px;">
          <b style="color:var(--ok);">Optimal Configuration Active</b><br>
          All member slenderness, purlin biaxial bending, column stability, and connection limits satisfy IS 800:2007.
        </div>
        <div style="padding:8px 10px;background:var(--panel2);border:1px solid var(--line);border-radius:6px;font-size:10.5px;">
          <div style="font-weight:700;color:#0284c7;margin-bottom:4px;text-transform:uppercase;font-size:9.5px;letter-spacing:0.04em;">Engineering Optimization Insight</div>
          <div style="color:var(--muted);line-height:1.5;">
            • <b>Buckling Resistance:</b> Top chord effective length $KL = 0.85 L$ maintains slenderness $\\lambda = \\frac{KL}{r_{\\text{min}}} \\le 180$.<br>
            • <b>Stress Reversal:</b> Wind uplift suction reverses bottom chords into compression with safety limit $\\lambda \\le 250$.
          </div>
        </div>
      `;
      if (applyBtn) applyBtn.style.display = 'none';
      renderKaTeXInElement(box);
      return;
    }

    if (applyBtn) applyBtn.style.display = 'block';

    let html = `
      <div class="result bad" style="margin-bottom:10px; padding:10px 12px; font-size:11px; border-left:4px solid var(--bad); background:var(--bad-bg);">
        <b style="font-size:12px;display:flex;align-items:center;gap:6px;color:var(--bad);">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--bad);"></span>
          Design Adjustments Required (${fails.length} Check${fails.length > 1 ? 's' : ''} Exceeded)
        </b>
        <div style="margin-top:4px;color:var(--text);">The following optimal section sizing brings all Limit State checks within IS 800:2007 limits:</div>
      </div>`;

    if (q.items && q.items.length) {
      html += q.items.map(x => `
        <div style="background:var(--panel2);border:1px solid var(--line);border-left:3px solid var(--warn);border-radius:6px;padding:8px 10px;margin-bottom:8px;font-size:11px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <b style="color:var(--text-primary);">${root.escSafe(x[0] || x.component || 'Component')}</b>
            <span style="background:var(--bad-bg);color:var(--bad);padding:2px 6px;border-radius:4px;font-size:9px;font-weight:700;">EXCEEDS CAPACITY</span>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin:5px 0 4px;background:var(--panel);padding:4px 8px;border-radius:4px;border:1px solid var(--line);">
            <span style="color:var(--muted);font-size:10px;font-weight:600;">Recommended:</span>
            <span style="font-family:var(--mono);color:var(--ok);font-weight:800;font-size:12px;">${root.escSafe(x[1] || x.recommended || '')}</span>
          </div>
          <div style="color:var(--muted);font-size:10px;margin-top:3px;line-height:1.45;">${root.escSafe(x[2] || x.reason || '')}</div>
        </div>
      `).join('');
    }

    // Alternative Remediation Pathways (Multi-Lever Engineering Optimization)
    html += `
      <div style="margin-top:10px;padding:9px 12px;background:var(--panel2);border:1px solid var(--line);border-radius:6px;font-size:10.5px;">
        <div style="font-weight:800;color:var(--accent);display:flex;align-items:center;gap:5px;margin-bottom:6px;text-transform:uppercase;font-size:10px;letter-spacing:0.04em;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          <span>Alternative Engineering Remediation Levers</span>
        </div>
        <div style="color:var(--text);line-height:1.55;">
          • <b>Geometric Sub-division:</b> Increasing panel count (e.g. 4 → 6 → 8) reduces unsupported buckling length $KL$, cutting slenderness $\\lambda = \\frac{KL}{r_{\\text{min}}}$ quadratically and raising $f_{cd}$ without heavier steel.<br>
          • <b>Spacing Optimization:</b> Reducing bay spacing (e.g. 4.0m → 3.2m) linearly decreases tributary load on chords & purlins.<br>
          • <b>Steel Grade Upgrade:</b> Switching to E350 (Fe 490) yields 40% higher yield capacity for tension ties and stocky members.
        </div>
      </div>
    `;

    box.innerHTML = html;
    renderKaTeXInElement(box);

    if (applyBtn) {
      applyBtn.onclick = () => {
        applyRecommendedInputs();
      };
    }
  }

  function updateReasonPanel(d, sel) {
    const box = document.getElementById('reason');
    if (!box) return;

    if (sel && sel.kind === 'member' && d.members && d.members[sel.index]) {
      const m = d.members[sel.index];
      box.className = 'governing-callout ' + (m.pass ? 'ok' : 'warn');
      box.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;flex-shrink:0;">
          <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
        </svg>
        <p><b>Member M${sel.index + 1} (${m.role}):</b> Design axial force is ${Math.abs(m.governingForce).toFixed(1)} kN under governing combination <b>${root.escSafe(m.governingLC || 'DL+LL')}</b> against IS 800 capacity ${m.governingCapacity.toFixed(1)} kN (utilization: ${(m.util * 100).toFixed(1)}%, slenderness: ${m.lambda.toFixed(1)} vs ${m.lambdaLimit}).</p>`;
      return;
    }

    if (sel && sel.kind === 'column') {
      const c = d.column || {};
      box.className = 'governing-callout ' + (c.colPass ? 'ok' : 'warn');
      box.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;flex-shrink:0;">
          <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
        </svg>
        <p><b>Built-up Column:</b> Factored axial reaction demand is ${(c.demand || 0).toFixed(1)} kN vs laced axial capacity ${(c.Pd || c.capacity || 0).toFixed(1)} kN. Effective slenderness λe = ${(c.lambda_e || c.lambda || 0).toFixed(1)}.</p>`;
      return;
    }

    if (sel && sel.kind === 'purlin') {
      const p = d.purlin || {};
      box.className = 'governing-callout ' + (p.pass ? 'ok' : 'warn');
      box.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;flex-shrink:0;">
          <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
        </svg>
        <p><b>Roof Purlin (IS 800 Cl. 8.2 & 9.3):</b> Biaxial moments Mz = ${(p.Mz || p.M || 0).toFixed(1)} kNm, My = ${(p.My || 0).toFixed(1)} kNm with interaction ratio ${((p.interactionRatio || p.util || 0) * 100).toFixed(1)}%.</p>`;
      return;
    }

    const fails = (d.checks || []).filter(x => !x.pass).map(x => x.label);
    if (fails.length) {
      box.className = 'governing-callout warn';
      box.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;flex-shrink:0;">
          <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
        </svg>
        <p><b>Governing Limit State Issues:</b> ${fails.join(', ')} exceed allowable limits. Check Optimum Recommendations above to apply required section sizes.</p>`;
    } else {
      box.className = 'governing-callout ok';
      box.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;flex-shrink:0;color:var(--ok);">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <p style="color:var(--ok);"><b>Design Criteria Satisfied:</b> All members, purlins, built-up columns, and connections pass Limit State checks under governing load combinations (DL + LL, DL + WL, and DL + LL + WL).</p>`;
    }
  }

  function refreshAssignmentSnapshot() {
    const box = document.getElementById('assignmentSnapshot');
    if (!box) return;
    const S = root.S;
    const G = (root.GROUPS && root.GROUPS[S.group]) || {};
    box.innerHTML = `
      <div class="snapshot-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px;">
        <div class="icell"><span style="color:var(--muted);font-size:9px;">Preset / Mode</span><b>${S.group === 'Custom' ? 'Custom' : 'Preset ' + S.group}</b></div>
        <div class="icell"><span style="color:var(--muted);font-size:9px;">Location</span><b>${root.escSafe(S.loc || G.loc || 'Custom')}</b></div>
        <div class="icell"><span style="color:var(--muted);font-size:9px;">Truss Type</span><b>${root.escSafe(S.truss)}</b></div>
        <div class="icell"><span style="color:var(--muted);font-size:9px;">Span</span><b>${Number(S.span).toFixed(1)} m</b></div>
        <div class="icell"><span style="color:var(--muted);font-size:9px;">Length</span><b>${Number(S.length).toFixed(1)} m</b></div>
        <div class="icell"><span style="color:var(--muted);font-size:9px;">Height</span><b>${Number(S.height).toFixed(1)} m</b></div>
        <div class="icell"><span style="color:var(--muted);font-size:9px;">Spacing</span><b>${Number(S.spacing).toFixed(1)} m</b></div>
        <div class="icell"><span style="color:var(--muted);font-size:9px;">Slope</span><b>${Number(S.slope).toFixed(1)}°</b></div>
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

    if (S.purlin) S.purlinSection = S.purlin;
    if (S.column) S.colSection = S.column;

    if (changed) {
      if (root.markCustom) root.markCustom();
      if (root.syncInputs) root.syncInputs();
      if (root.refresh) root.refresh();
      if (root.MobileUI && root.MobileUI.sync) root.MobileUI.sync();
      window.dispatchEvent(new CustomEvent('analysisUpdated'));
    }
  }

  const InspectorModule = {
    renderInspector,
    refreshChecks,
    refreshRecommendations,
    refreshAssignmentSnapshot,
    refreshRecommendedInputs: (d) => refreshRecommendations(d || (root.stableAnalysis ? root.stableAnalysis() : null)),
    applyRecommendedInputs,
    overallStatusHTML
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = InspectorModule;
  }
  if (typeof window !== 'undefined') {
    root.InspectorModule = InspectorModule;
    root.refreshInspector = renderInspector;
    root.applyRecommendedInputs = applyRecommendedInputs;
  }
})(typeof window !== 'undefined' ? window : global);
