export function addQuestionBubble(question) {
  const history = document.getElementById('chatHistory');
  history.innerHTML = ''; // Clear previous conversation

  const qDiv = document.createElement('div');
  qDiv.className = 'chat-q';
  qDiv.textContent = question;
  history.appendChild(qDiv);

  const thinkDiv = document.createElement('div');
  thinkDiv.className = 'thinking';
  thinkDiv.id = 'thinkIndicator';
  thinkDiv.innerHTML = '<div class="spinner"></div>Retrieving context & generating answer…';
  history.appendChild(thinkDiv);
  history.scrollTop = history.scrollHeight;
}
//hello
export function removeThinkingBubble() {
  const thinkDiv = document.getElementById('thinkIndicator');
  if (thinkDiv) thinkDiv.remove();
}

export function addErrorBubble(errorMsg) {
  const history = document.getElementById('chatHistory');
  const err = document.createElement('div');
  err.className = 'chat-a';
  err.innerHTML = `<div class="chat-a-label">ERROR</div><div class="chat-a-text" style="color:var(--red)">${errorMsg}</div>`;
  history.appendChild(err);
  history.scrollTop = history.scrollHeight;
}

export function addAnswerBubble(answer, model, contexts) {
  const history = document.getElementById('chatHistory');
  const aDiv = document.createElement('div');
  aDiv.className = 'chat-a';

  aDiv.innerHTML = `<div class="chat-a-label">🤖 ${model || 'llm'}</div>` +
    `<div class="chat-a-text" id="typeTarget"></div>` +
    `<div class="chat-ctx">` +
    `<div class="chat-ctx-label">RETRIEVED CONTEXT (${contexts.length} chunks)</div>` +
    contexts.map((c, i) =>
      `<span class="ctx-chip" data-idx="${i}">#${i + 1} ${c.title} · ${c.distance.toFixed(3)}</span>` +
      `<div class="ctx-expand" id="ctx-${i}">${c.text}</div>`
    ).join('') +
    `</div>`;

  history.appendChild(aDiv);

  // Note: Delegated event listener for ctx-chip toggling will be handled by main.js

  const target = aDiv.querySelector('#typeTarget');
  target.classList.add('typing');
  let i = 0;

  const timer = setInterval(() => {
    if (i >= answer.length) {
      clearInterval(timer);
      target.classList.remove('typing');
      return;
    }
    const chunk = answer.slice(i, i + 3);
    target.textContent += chunk;
    i += 3;
    history.scrollTop = history.scrollHeight;
  }, 18);
}

export function toggleCtx(idx) {
  const el = document.getElementById('ctx-' + idx);
  if (el) {
    el.style.display = el.style.display === 'block' ? 'none' : 'block';
  }
}
