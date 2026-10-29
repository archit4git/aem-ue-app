/* eslint-disable no-underscore-dangle */
import { getDemoEmail, setDemoEmail } from './martech.js';

/** ?debug=1 turns this on (persisted). ?debug=0 turns it off. */
export default function mountDebugPanel() {
  const css = document.createElement('style');
  css.textContent = `
  .poc-debug{position:fixed;right:12px;bottom:12px;width:min(420px,calc(100vw - 24px));max-height:60vh;display:flex;flex-direction:column;background:#14232b;color:#f4f7f6;font:12px/1.4 ui-monospace,Menlo,monospace;z-index:9999;border:1px solid #5b6b73}
  .poc-debug header{display:flex;gap:8px;align-items:center;padding:8px 10px;border-bottom:1px solid #5b6b73}
  .poc-debug header strong{flex:1}
  .poc-debug input{flex:2;min-width:0;background:#0b161b;color:inherit;border:1px solid #5b6b73;padding:4px 6px;font:inherit}
  .poc-debug button{background:#f2b42f;color:#14232b;border:0;padding:4px 8px;font:inherit;cursor:pointer}
  .poc-debug ol{margin:0;padding:0;list-style:none;overflow:auto}
  .poc-debug li{padding:6px 10px;border-bottom:1px solid #22343d}
  .poc-debug li[data-type=error]{color:#ff9d8f}
  .poc-debug li[data-type=response]{color:#8fe3c9}
  .poc-debug details summary{cursor:pointer}
  .poc-debug pre{margin:4px 0 0;white-space:pre-wrap;word-break:break-word}
  .offer-banner[data-source]::after{content:attr(data-source);position:absolute;top:8px;right:8px;background:#f2b42f;color:#14232b;font:11px ui-monospace,monospace;padding:2px 6px}`;
  document.head.append(css);

  const panel = document.createElement('aside');
  panel.className = 'poc-debug';
  panel.innerHTML = `<header><strong>AJO decisioning debug</strong>
    <input type="email" placeholder="demo email (identity)" aria-label="Demo email">
    <button type="button">Set</button></header><ol></ol>`;
  const input = panel.querySelector('input');
  input.value = getDemoEmail();
  document.body.append(panel);

  const list = panel.querySelector('ol');
  const add = (e) => {
    const li = document.createElement('li');
    li.dataset.type = e.type;
    const body = { ...e }; delete body.type; delete body.at;
    const summary = `${e.at.slice(11, 23)} ${e.type}${e.eventType ? ` - ${e.eventType}` : ''}`;
    li.innerHTML = '<details><summary></summary><pre></pre></details>';
    li.querySelector('summary').textContent = summary;
    li.querySelector('pre').textContent = JSON.stringify(body, null, 2);
    list.prepend(li);
  };
  (window.__pocLog || []).forEach(add);
  window.addEventListener('poc:log', (ev) => add(ev.detail));

  panel.querySelector('button').addEventListener('click', () => {
    setDemoEmail(input.value.trim());
    window.location.reload();
  });
}
