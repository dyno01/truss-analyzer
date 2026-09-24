/**
 * Structural Design Studio — Resizable Layout Manager
 * Enables dragging splitters for Left, Right, and Study panels with localStorage persistence.
 */

(function(root) {
  'use strict';

  const STORAGE_KEY = 'truss-studio-layout-v5';
  const DEFAULTS = { left: 275, right: 345, study: 215 };

  function getCSSProp(prop) {
    return document.documentElement.style.getPropertyValue(prop).trim();
  }

  function parseNumber(val, fallback) {
    const num = parseFloat(val);
    return Number.isFinite(num) ? num : fallback;
  }

  function getCurrentLayout() {
    return {
      left: parseNumber(getCSSProp('--left-panel-w'), DEFAULTS.left),
      right: parseNumber(getCSSProp('--right-panel-w'), DEFAULTS.right),
      study: parseNumber(getCSSProp('--study-panel-h'), DEFAULTS.study)
    };
  }

  function applyLayout(dims, shouldSave = false) {
    const vw = window.innerWidth || 1440;
    const vh = window.innerHeight || 900;
    const maxSide = Math.min(450, Math.max(240, vw * 0.38));

    const left = Math.max(210, Math.min(maxSide, Number(dims.left) || DEFAULTS.left));
    const right = Math.max(240, Math.min(maxSide, Number(dims.right) || DEFAULTS.right));
    const study = Math.max(155, Math.min(Math.min(450, vh * 0.55), Number(dims.study) || DEFAULTS.study));

    document.documentElement.style.setProperty('--left-panel-w', left + 'px');
    document.documentElement.style.setProperty('--right-panel-w', right + 'px');
    document.documentElement.style.setProperty('--study-panel-h', study + 'px');

    if (shouldSave) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ left, right, study }));
      } catch (e) {
        // Ignore localStorage quota errors
      }
    }

    if (typeof root.resize === 'function') {
      requestAnimationFrame(() => root.resize());
    }
  }

  function resetLayout() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
    applyLayout(DEFAULTS, false);
  }

  function initResizer() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      applyLayout(saved && saved.left && saved.right && saved.study ? saved : DEFAULTS, false);
    } catch (e) {
      applyLayout(DEFAULTS, false);
    }

    const resetBtn = document.getElementById('resetLayout');
    if (resetBtn) resetBtn.addEventListener('click', resetLayout);

    const dividers = [
      { id: 'leftResizer', type: 'left' },
      { id: 'rightResizer', type: 'right' },
      { id: 'studyResizer', type: 'study' }
    ];

    dividers.forEach(({ id, type }) => {
      const handle = document.getElementById(id);
      if (!handle) return;

      handle.addEventListener('pointerdown', (ev) => {
        if (window.innerWidth <= 780) return;
        ev.preventDefault();
        handle.classList.add('dragging');

        const initial = Object.assign({}, getCurrentLayout(), { startX: ev.clientX, startY: ev.clientY });

        const onMove = (e) => {
          const dims = Object.assign({}, initial);
          if (type === 'left') dims.left = initial.left + (e.clientX - initial.startX);
          if (type === 'right') dims.right = initial.right - (e.clientX - initial.startX);
          if (type === 'study') dims.study = initial.study - (e.clientY - initial.startY);
          applyLayout(dims, false);
        };

        const onUp = () => {
          handle.classList.remove('dragging');
          applyLayout(getCurrentLayout(), true);
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerup', onUp);
        };

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp, { once: true });
      });
    });
  }

  const ResizerModule = {
    initResizer,
    applyLayout,
    resetLayout
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResizerModule;
  } else {
    root.ResizerModule = ResizerModule;
  }
})(typeof window !== 'undefined' ? window : global);
