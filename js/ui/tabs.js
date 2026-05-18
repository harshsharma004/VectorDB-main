import { state, setState } from '../state.js';

export function switchTab(name) {
  document.querySelectorAll('.tab').forEach((t, i) => {
    const names = ['search', 'docs', 'rag'];
    const isActive = names[i] === name;
    t.classList.toggle('on', isActive);
    
    if (isActive) {
      const indicator = document.querySelector('.tab-indicator');
      if (indicator) {
        indicator.style.transform = `translateX(${i * 100}%)`;
      }
    }
  });
  
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('on'));
  const tabContent = document.getElementById('tab-' + name);
  if (tabContent) {
    tabContent.classList.add('on');
  }
}

export function setAlgo(algo) {
  document.querySelectorAll('.algo-btn').forEach(b => {
    if (b.dataset.algo === algo) {
      b.classList.add('on');
    } else {
      b.classList.remove('on');
    }
  });
  setState('selAlgo', algo);
}
