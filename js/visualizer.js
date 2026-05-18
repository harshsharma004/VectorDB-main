import { COL } from './config.js';
import { state, setState } from './state.js';

export function initVisualizer(canvasEl) {
  const ctx = canvasEl.getContext('2d');
  
  function resize() { 
    const r = canvasEl.parentElement.getBoundingClientRect(); 
    canvasEl.width = r.width; 
    canvasEl.height = r.height; 
  }
  
  window.addEventListener('resize', resize);
  resize();

  function w2c(wx, wy) {
    const P = 70, W = canvasEl.width, H = canvasEl.height;
    const rx = state.bounds.maxX - state.bounds.minX || 1;
    const ry = state.bounds.maxY - state.bounds.minY || 1;
    return [
      P + ((wx - state.bounds.minX) / rx) * (W - 2 * P), 
      H - P - ((wy - state.bounds.minY) / ry) * (H - 2 * P)
    ];
  }

  function drawFrame() {
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    ctx.fillStyle = '#07070f'; 
    ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);
    ctx.strokeStyle = '#0e0e1e'; 
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 8; i++) {
      const tx = 70 + (i / 8) * (canvasEl.width - 140);
      const ty = 70 + (i / 8) * (canvasEl.height - 140);
      ctx.beginPath(); ctx.moveTo(tx, 70); ctx.lineTo(tx, canvasEl.height - 70); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(70, ty); ctx.lineTo(canvasEl.width - 70, ty); ctx.stroke();
    }
    
    ctx.fillStyle = '#1a1a38'; 
    ctx.font = '11px Fira Code,monospace';
    ctx.fillText('PC₁ →', canvasEl.width / 2 - 40, canvasEl.height - 18);
    ctx.save(); 
    ctx.translate(18, canvasEl.height / 2 + 50); 
    ctx.rotate(-Math.PI / 2); 
    ctx.fillText('PC₂ →', 0, 0); 
    ctx.restore();
    
    ctx.fillStyle = '#151530'; 
    ctx.font = '12px Fira Code,monospace';
    ctx.fillText('2D PCA Projection  ·  Semantic Space', 80, 28);

    if (state.queryPt && state.hitIds.size > 0) {
      const [qx, qy] = w2c(state.queryPt.x, state.queryPt.y);
      for (const pt of state.pcaPoints) {
        if (!state.hitIds.has(pt.item.id)) continue;
        const [px, py] = w2c(pt.x, pt.y);
        ctx.strokeStyle = 'rgba(108,99,255,0.18)'; 
        ctx.lineWidth = 1; 
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(qx, qy); ctx.lineTo(px, py); ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    
    for (const pt of state.pcaPoints) {
      const [cx, cy] = w2c(pt.x, pt.y);
      const col = COL[pt.item.category] || COL.default;
      const isHit = state.hitIds.has(pt.item.id);
      const r = isHit ? 10 : 7;
      
      if (isHit) {
        const pr = r + 7 + Math.sin(state.pulse) * 3.5;
        ctx.beginPath(); ctx.arc(cx, cy, pr, 0, 2 * Math.PI);
        ctx.strokeStyle = col + '55'; ctx.lineWidth = 1.5; ctx.stroke();
      }
      
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 3);
      grd.addColorStop(0, col + (isHit ? 'bb' : '88')); 
      grd.addColorStop(1, 'transparent');
      ctx.beginPath(); ctx.arc(cx, cy, r * 3, 0, 2 * Math.PI); ctx.fillStyle = grd; ctx.fill();
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI); ctx.fillStyle = col; ctx.fill();
      
      if (state.hoverItem && state.hoverItem.id === pt.item.id) {
        ctx.beginPath(); ctx.arc(cx, cy, r + 5, 0, 2 * Math.PI); ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.stroke();
      }
    }
    
    if (state.queryPt) {
      const [qx, qy] = w2c(state.queryPt.x, state.queryPt.y);
      
      // Animated outer ring pulse
      const pulseSize = 15 + Math.sin(state.pulse * 2) * 5;
      const pulseOpacity = 0.5 - Math.sin(state.pulse * 2) * 0.3;
      
      ctx.beginPath();
      ctx.arc(qx, qy, pulseSize, 0, 2 * Math.PI);
      ctx.fillStyle = `rgba(255, 255, 255, ${pulseOpacity * 0.3})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(255, 255, 255, ${pulseOpacity})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw Star
      ctx.save(); ctx.translate(qx, qy);
      ctx.shadowColor = '#fff'; ctx.shadowBlur = 15;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = (i * Math.PI / 5) - Math.PI / 2;
        const rr = i % 2 === 0 ? 10 : 4;
        if (i === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
        else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill();
      ctx.shadowBlur = 0; ctx.restore();
      
      ctx.fillStyle = '#f8fafc'; ctx.font = '11px Inter, sans-serif'; 
      ctx.fillText('query', qx + 18, qy + 4);
    }
    
    if (!state.pcaPoints.length) {
      ctx.fillStyle = '#1a1a38'; ctx.font = '13px Fira Code,monospace'; ctx.textAlign = 'center';
      ctx.fillText('Connecting to VectorDB…', canvasEl.width / 2, canvasEl.height / 2); ctx.textAlign = 'left';
    }
    
    setState('pulse', state.pulse + 0.05);
    requestAnimationFrame(drawFrame);
  }
  
  canvasEl.addEventListener('mousemove', e => {
    const rect = canvasEl.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    
    let hovered = null; 
    let best = 18;
    for (const pt of state.pcaPoints) {
      const [cx, cy] = w2c(pt.x, pt.y);
      const d = Math.hypot(mx - cx, my - cy);
      if (d < best) {
        best = d;
        hovered = pt.item;
      }
    }
    
    setState('hoverItem', hovered);
    const tip = document.getElementById('tip');
    
    if (hovered) {
      const col = COL[hovered.category] || COL.default;
      tip.style.display = 'block';
      tip.style.left = (e.clientX + 14) + 'px';
      tip.style.top = (e.clientY - 8) + 'px';
      tip.innerHTML = `<span style="color:${col}">[${hovered.category}]</span><br>${hovered.metadata}`;
    } else {
      tip.style.display = 'none';
    }
  });
  
  canvasEl.addEventListener('mouseleave', () => {
    setState('hoverItem', null);
    document.getElementById('tip').style.display = 'none';
  });

  requestAnimationFrame(drawFrame);
}
