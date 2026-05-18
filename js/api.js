import { API } from './config.js';

export async function fetchItems() {
  const r = await fetch(`${API}/items`);
  if (!r.ok) throw new Error('Failed to fetch items');
  return await r.json();
}

export async function search(emb, k, metric, algo) {
  const url = `${API}/search?v=${emb.join(',')}&k=${k}&metric=${metric}&algo=${algo}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error('Failed to search');
  return await r.json();
}

export async function benchmark(emb, k, metric) {
  const r = await fetch(`${API}/benchmark?v=${emb.join(',')}&k=${k}&metric=${metric}`);
  if (!r.ok) throw new Error('Failed to benchmark');
  return await r.json();
}

export async function getHNSWInfo() {
  const r = await fetch(`${API}/hnsw-info`);
  if (!r.ok) throw new Error('Failed to get HNSW info');
  return await r.json();
}

export async function insertVector(meta, cat, emb) {
  const r = await fetch(`${API}/insert`, {
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ metadata: meta, category: cat, embedding: emb })
  });
  if (!r.ok) throw new Error('Failed to insert vector');
  return await r.json();
}

export async function deleteVector(id) {
  const r = await fetch(`${API}/delete/${id}`, { method: 'DELETE' });
  if (!r.ok) throw new Error('Failed to delete vector');
  return await r.json();
}

export async function getOllamaStatus() {
  const r = await fetch(`${API}/status`);
  if (!r.ok) throw new Error('Failed to get Ollama status');
  return await r.json();
}

export async function insertDoc(title, text) {
  const r = await fetch(`${API}/doc/insert`, {
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, text })
  });
  if (!r.ok) throw new Error('Failed to insert doc');
  return await r.json();
}

export async function getDocList() {
  const r = await fetch(`${API}/doc/list`);
  if (!r.ok) throw new Error('Failed to get doc list');
  return await r.json();
}

export async function deleteDoc(id) {
  const r = await fetch(`${API}/doc/delete/${id}`, { method: 'DELETE' });
  if (!r.ok) throw new Error('Failed to delete doc');
  return await r.json();
}

export async function searchDoc(question, k) {
  const r = await fetch(`${API}/doc/search`, {
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, k })
  });
  if (!r.ok) throw new Error('Failed to search docs');
  return await r.json();
}

export async function askAI(question, k) {
  const r = await fetch(`${API}/doc/ask`, {
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, k })
  });
  if (!r.ok) throw new Error('Failed to ask AI');
  return await r.json();
}
