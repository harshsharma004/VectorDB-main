import { COL, DIM_COL, DIMS } from '../config.js';
import { state, setState } from '../state.js';

export function renderResults(results) {
  const container = document.getElementById('results');
  if (!results || !results.length) {
    container.innerHTML = '<div style="color:var(--muted);font-size:11px">No results</div>';
    return;
  }
  
  // Note: Hover and Delete actions must be delegated or bound by main.js
  // We use data attributes here, main.js will attach listeners.
  container.innerHTML = results.map((r, i) => {
    const col = COL[r.category] || COL.default;
    return `<div class="rcard result-card" data-id="${r.id}">
      <div class="rrank">#${i+1} NEAREST</div>
      <div class="rmeta">${r.metadata}</div>
      <div class="rfoot">
        <span class="rcat" style="background:${col}18;color:${col};border:1px solid ${col}44">${r.category.toUpperCase()}</span>
        <span class="rdist">dist: ${r.distance.toFixed(5)}</span>
        <button class="del del-btn" data-id="${r.id}">✕</button>
      </div>
    </div>`;
  }).join('');
}

export function drawVecChart(emb) {
  const vc = document.getElementById('vecCvs');
  if (!vc) return;
  const W = vc.parentElement.clientWidth;
  vc.width = W;
  const vx = vc.getContext('2d');
  
  vx.clearRect(0, 0, W, 76);
  vx.fillStyle = '#07070f';
  vx.fillRect(0, 0, W, 76);
  
  const bw = (W - 4) / DIMS;
  for (let i = 0; i < DIMS; i++) {
    const h = emb[i] * 58;
    const x = 2 + i * bw;
    const col = DIM_COL[i];
    vx.shadowColor = col;
    vx.shadowBlur = 5;
    vx.fillStyle = col + 'aa';
    vx.fillRect(x + 1, 63 - h, bw - 2, h);
  }
  
  vx.shadowBlur = 0;
  vx.font = '8px monospace';
  vx.textAlign = 'center';
  
  [['CS', 0], ['MATH', 4], ['FOOD', 8], ['SPORT', 12]].forEach(([lbl, gi], i) => {
    vx.fillStyle = Object.values(COL)[i] + '77';
    vx.fillText(lbl, 2 + (gi + 1.5) * bw, 74);
  });
  vx.textAlign = 'left';
}
