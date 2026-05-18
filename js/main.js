import { KW } from './config.js';
import { state, setState } from './state.js';
import * as api from './api.js';
import { textToEmbedding, pca2D } from './math.js';
import { initVisualizer } from './visualizer.js';
import { switchTab, setAlgo } from './ui/tabs.js';
import { renderResults, drawVecChart } from './ui/results.js';
import { addQuestionBubble, removeThinkingBubble, addErrorBubble, addAnswerBubble, toggleCtx } from './ui/chat.js';

// Boot Sequence
document.addEventListener('DOMContentLoaded', async () => {
  const canvasEl = document.getElementById('scatter');
  initVisualizer(canvasEl);
  
  bindEvents();
  
  await loadItems();
  await loadHNSW();
  await checkOllamaStatus();
});

// Orchestration methods combining API, State, and UI
async function loadItems() {
  try {
    const items = await api.fetchItems();
    setState('allItems', items);
    
    if (items.length >= 2) {
      const coords = pca2D(items.map(v => v.embedding));
      const pcaPoints = items.map((item, i) => ({ x: coords[i][0], y: coords[i][1], item }));
      setState('pcaPoints', pcaPoints);
      
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      for (const p of pcaPoints) {
        x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); 
        y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y);
      }
      const px = (x1 - x0) * .18 || .1, py = (y1 - y0) * .18 || .1;
      setState('bounds', { minX: x0 - px, maxX: x1 + px, minY: y0 - py, maxY: y1 + py });
    }
    
    document.getElementById('statsLabel').textContent = items.length + ' vectors · 16 dims';
  } catch (_) {}
}

async function runSearch() {
  const text = document.getElementById('qInput').value.trim(); 
  if (!text) return;
  
  const emb = textToEmbedding(text, KW);
  const k = parseInt(document.getElementById('kSlider').value);
  const metric = document.getElementById('metric').value;
  
  try {
    const data = await api.search(emb, k, metric, state.selAlgo);
    const results = data.results || [];
    setState('searchResults', results);
    setState('hitIds', new Set(results.map(r => r.id)));
    
    const us = data.latencyUs || 0;
    document.getElementById('latBig').textContent = us < 1000 ? us + ' μs' : (us / 1000).toFixed(2) + ' ms';
    document.getElementById('latSub').textContent = state.selAlgo.toUpperCase() + '  ·  ' + metric + '  ·  k=' + k;
    
    if (results.length > 0) {
      let sx = 0, sy = 0, sw = 0;
      for (let i = 0; i < Math.min(3, results.length); i++) {
        const pt = state.pcaPoints.find(p => p.item.id === results[i].id);
        if (pt) {
          const w = 1 / (i + 1); 
          sx += pt.x * w; 
          sy += pt.y * w; 
          sw += w;
        }
      }
      if (sw > 0) {
        setState('queryPt', { x: sx / sw + (Math.random() - .5) * .015, y: sy / sw + (Math.random() - .5) * .015 });
      }
    }
    
    renderResults(results);
    drawVecChart(emb);
  } catch (_) {
    alert('Cannot reach server — is it running on :8080?');
  }
}

async function runBenchmark() {
  const text = document.getElementById('qInput').value.trim() || 'binary tree algorithm';
  const emb = textToEmbedding(text, KW);
  const metric = document.getElementById('metric').value;
  
  try {
    const d = await api.benchmark(emb, 5, metric);
    document.getElementById('benchSec').style.display = 'block';
    const mx = Math.max(d.bruteforceUs, d.kdtreeUs, d.hnswUs, 1);
    
    const bars = [
      { lbl: 'Brute Force', us: d.bruteforceUs, col: '#f38ba8' },
      { lbl: 'KD-Tree', us: d.kdtreeUs, col: '#89dceb' },
      { lbl: 'HNSW', us: d.hnswUs, col: '#b388ff' }
    ].map(({ lbl, us, col }) => {
      const pct = Math.max((us / mx) * 100, 2);
      const disp = us < 1000 ? us + ' μs' : (us / 1000).toFixed(2) + ' ms';
      return `<div class="brow"><div class="blabel"><span style="color:${col}">${lbl}</span><span style="color:var(--muted)">${disp}</span></div><div class="btrack"><div class="bfill" style="width:${pct}%;background:${col}"></div></div></div>`;
    }).join('');
    
    document.getElementById('benchBars').innerHTML = bars;
  } catch (_) {}
}

async function loadHNSW() {
  try {
    const d = await api.getHNSWInfo();
    const maxN = d.nodesPerLayer[0] || 1;
    const html = d.nodesPerLayer.map((cnt, lyr) => {
      const pct = Math.max((cnt / maxN) * 100, 2);
      const edg = d.edgesPerLayer[lyr] || 0;
      return `<div class="lrow"><div class="lnum">L${lyr}</div><div class="ltrack"><div class="lfill" style="width:${pct}%"></div></div><div class="lcount">${cnt}n · ${edg}e</div></div>`;
    }).join('');
    
    document.getElementById('layers').innerHTML = html || '<div style="color:var(--muted);font-size:11px">Empty</div>';
  } catch (_) {}
}

async function addVector() {
  const meta = document.getElementById('addMeta').value.trim();
  const cat = document.getElementById('addCat').value;
  if (!meta) return;
  const emb = textToEmbedding(meta + ' ' + cat, KW);
  
  try {
    await api.insertVector(meta, cat, emb);
    document.getElementById('addMeta').value = '';
    await loadItems();
    loadHNSW();
  } catch (_) {}
}

async function deleteItem(id) {
  try {
    await api.deleteVector(id);
    const newResults = state.searchResults.filter(r => r.id !== id);
    setState('searchResults', newResults);
    state.hitIds.delete(id);
    renderResults(newResults);
    await loadItems();
    loadHNSW();
  } catch (_) {}
}

async function checkOllamaStatus() {
  try {
    const d = await api.getOllamaStatus();
    const badge = document.getElementById('ollamaBadge');
    const box = document.getElementById('ollamaStatus');
    
    if (d.ollamaAvailable) {
      badge.className = 'badge ok'; 
      badge.textContent = 'OLLAMA ✓';
      box.className = 'ollama-status ok';
      box.innerHTML = `<span style="color:var(--green)">● Online</span><br>` +
        `Embed: <span style="color:var(--accent)">${d.embedModel}</span><br>` +
        `Generate: <span style="color:var(--accent)">${d.genModel}</span><br>` +
        `Dims: <span style="color:var(--muted)">${d.docDims || '(first insert sets this)'}</span><br>` +
        `Documents: <span style="color:var(--text)">${d.docCount}</span>`;
    } else {
      badge.className = 'badge err'; 
      badge.textContent = 'OLLAMA ✗';
      box.className = 'ollama-status err';
      box.innerHTML = `<span style="color:var(--red)">● Offline</span><br><br>` +
        `To enable RAG features:<br>` +
        `<span style="color:var(--muted)">1. Install from ollama.com<br>` +
        `2. ollama pull nomic-embed-text<br>` +
        `3. ollama pull llama3.2</span>`;
    }
  } catch (_) {}
}

async function insertDocument() {
  const title = document.getElementById('docTitle').value.trim();
  const text = document.getElementById('docText').value.trim();
  const btn = document.getElementById('insertDocBtn');
  const status = document.getElementById('insertStatus');
  
  if (!title || !text) { 
    status.textContent = '⚠ Need both a title and text.'; 
    return; 
  }

  btn.disabled = true; 
  btn.textContent = 'Embedding…';
  status.innerHTML = '<span style="color:var(--muted)">Calling Ollama nomic-embed-text…</span>';

  try {
    const d = await api.insertDoc(title, text);
    if (d.error) {
      status.innerHTML = `<span style="color:var(--red)">✗ ${d.error}</span>`;
    } else {
      status.innerHTML = `<span style="color:var(--green)">✓ Inserted ${d.chunks} chunk(s) · ${d.dims}D embeddings</span>`;
      document.getElementById('docTitle').value = '';
      document.getElementById('docText').value = '';

      const emb16 = textToEmbedding(title + ' ' + text, KW);
      await api.insertVector(title, 'doc', emb16);
      await loadItems();
      loadHNSW();
      loadDocList();
      checkOllamaStatus();
    }
  } catch (_) {
    status.innerHTML = '<span style="color:var(--red)">✗ Server error</span>';
  }
  btn.disabled = false; 
  btn.textContent = '⚡ EMBED & INSERT';
}

async function loadDocList() {
  try {
    const docs = await api.getDocList();
    document.getElementById('docCountLabel').textContent = docs.length;
    
    if (!docs.length) {
      document.getElementById('docList').innerHTML = '<div style="color:var(--muted);font-size:11px">No documents yet.</div>';
      return;
    }
    
    document.getElementById('docList').innerHTML = docs.map(d => `
      <div class="dcard">
        <div class="dcard-title">${d.title}</div>
        <div class="dcard-preview">${d.preview}</div>
        <div class="dcard-foot">
          <span class="dcard-words">${d.words} words</span>
          <button class="del del-doc-btn" data-id="${d.id}">✕</button>
        </div>
      </div>`).join('');
  } catch (_) {}
}

async function deleteDoc(id) {
  try {
    await api.deleteDoc(id);
    loadDocList();
    checkOllamaStatus();
  } catch (_) {}
}

async function executeAskAI() {
  const question = document.getElementById('ragQuestion').value.trim();
  if (!question) return;
  const k = parseInt(document.getElementById('ragK').value);
  const btn = document.getElementById('askBtn');
  
  btn.disabled = true; 
  btn.textContent = 'Thinking…';

  addQuestionBubble(question);

  try {
    const data = await api.searchDoc(question, k);
    if (data.contexts && data.contexts.length > 0) {
      const newHitIds = new Set();
      let sx = 0, sy = 0, sw = 0;
      data.contexts.forEach((ctx, i) => {
        const pt = state.pcaPoints.find(p => p.item.category === 'doc' && ctx.title.startsWith(p.item.metadata));
        if (pt) {
          newHitIds.add(pt.item.id);
          const w = 1 / (i + 1); 
          sx += pt.x * w; 
          sy += pt.y * w; 
          sw += w;
        }
      });
      setState('hitIds', newHitIds);
      if (sw > 0) {
        setState('queryPt', { x: sx / sw + (Math.random() - .5) * .015, y: sy / sw + (Math.random() - .5) * .015 });
      }
    } else {
      setState('hitIds', new Set());
      const emb16 = textToEmbedding(question, KW);
      try {
        const data2 = await api.search(emb16, 3, 'cosine', 'hnsw');
        if (data2.results && data2.results.length > 0) {
          let sx = 0, sy = 0, sw = 0;
          for (let i = 0; i < Math.min(3, data2.results.length); i++) {
            const pt = state.pcaPoints.find(p => p.item.id === data2.results[i].id);
            if (pt) {
              const w = 1 / (i + 1); 
              sx += pt.x * w; 
              sy += pt.y * w; 
              sw += w;
            }
          }
          if (sw > 0) {
            setState('queryPt', { x: sx / sw + (Math.random() - .5) * .015, y: sy / sw + (Math.random() - .5) * .015 });
          }
        }
      } catch (_) {}
    }
  } catch (_) {}

  try {
    const d = await api.askAI(question, k);
    removeThinkingBubble();
    
    if (d.error) {
      addErrorBubble(d.error);
    } else {
      addAnswerBubble(d.answer, d.model, d.contexts);
    }
  } catch (e) {
    removeThinkingBubble();
    addErrorBubble('Server error — is the backend running?');
  }

  document.getElementById('ragQuestion').value = '';
  btn.disabled = false; 
  btn.textContent = '🤖 ASK AI';
}

function bindEvents() {
  document.querySelectorAll('.tab').forEach(t => {
    t.addEventListener('click', e => {
      const name = e.target.textContent.trim().toLowerCase().replace('ask ai', 'rag').replace('documents', 'docs');
      switchTab(name);
      if (name === 'docs') loadDocList();
    });
  });

  document.querySelectorAll('.algo-btn').forEach(b => {
    b.addEventListener('click', e => setAlgo(e.target.dataset.algo));
  });

  const qInput = document.getElementById('qInput');
  if (qInput) {
    qInput.addEventListener('keydown', e => { if (e.key === 'Enter') runSearch(); });
  }

  const searchBtn = document.querySelector('.left-panel .btn-p');
  if (searchBtn) searchBtn.addEventListener('click', runSearch);

  const kSlider = document.getElementById('kSlider');
  if (kSlider) {
    kSlider.addEventListener('input', e => { document.getElementById('kLabel').textContent = e.target.value; });
  }
  
  const benchToggle = document.getElementById('benchToggle');
  if (benchToggle) {
    benchToggle.addEventListener('click', () => {
      const content = document.getElementById('benchContent');
      const chevron = benchToggle.querySelector('.chevron');
      if (content.style.display === 'none') {
        content.style.display = 'flex';
        chevron.classList.add('open');
      } else {
        content.style.display = 'none';
        chevron.classList.remove('open');
      }
    });
  }

  const addVectorBtn = document.getElementById('addVectorBtn');
  if (addVectorBtn) addVectorBtn.addEventListener('click', addVector);
  
  const runBenchBtn = document.getElementById('runBenchBtn');
  if (runBenchBtn) runBenchBtn.addEventListener('click', runBenchmark);

  const insertDocBtn = document.getElementById('insertDocBtn');
  if (insertDocBtn) insertDocBtn.addEventListener('click', insertDocument);

  const askBtn = document.getElementById('askBtn');
  if (askBtn) askBtn.addEventListener('click', executeAskAI);

  const ragQ = document.getElementById('ragQuestion');
  if (ragQ) ragQ.addEventListener('keydown', e => { if (e.key === 'Enter' && e.ctrlKey) executeAskAI(); });

  // Event Delegation for dynamically created elements
  document.body.addEventListener('click', e => {
    if (e.target.classList.contains('del-btn')) {
      const id = parseInt(e.target.dataset.id);
      if (!isNaN(id)) deleteItem(id);
    }
    
    if (e.target.classList.contains('del-doc-btn')) {
      const id = parseInt(e.target.dataset.id);
      if (!isNaN(id)) deleteDoc(id);
    }

    if (e.target.classList.contains('ctx-chip')) {
      const idx = parseInt(e.target.dataset.idx);
      if (!isNaN(idx)) toggleCtx(idx);
    }
  });
}
