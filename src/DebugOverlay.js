export default class DebugOverlay {
  constructor(game, maxLines = 8) {
    this.game = game;
    this.maxLines = maxLines;
    this.node = document.createElement('div');
    this.node.id = 'debug-overlay';
    Object.assign(this.node.style, {
      position: 'fixed', left: '12px', top: '72px', width: '320px', padding: '8px 10px',
      background: 'rgba(20,20,20,0.6)', color: '#e6fff2', fontFamily: 'monospace', fontSize: '12px',
      borderRadius: '8px', zIndex: 9999, pointerEvents: 'none', backdropFilter: 'blur(4px)'
    });
    this.node.innerHTML = `<div style="font-weight:700;margin-bottom:6px">Debug</div><div id="debug-lines"></div>`;
    document.body.appendChild(this.node);
    this.linesNode = this.node.querySelector('#debug-lines');
    this.visible = true;
    this._bindEvents();
  }

  _bindEvents() {
    window.addEventListener('pong-log', (e) => {
      const d = e.detail || {};
      const text = d.text || JSON.stringify(d);
      this.push(text, d.category || 'info');
    });
  }

  push(text, category = 'info') {
    if (!this.visible) return;
    const ts = new Date().toLocaleTimeString();
    const safe = text.toString();
    const line = document.createElement('div');
    line.style.marginBottom = '6px';
    line.style.display = 'block';
    line.innerHTML = `<span style="opacity:.6">${ts}</span> — <span style="color:${this._colorFor(category)}">${this._escape(safe)}</span>`;
    this.linesNode.insertBefore(line, this.linesNode.firstChild);
    while (this.linesNode.children.length > this.maxLines) {
      this.linesNode.removeChild(this.linesNode.lastChild);
    }
  }

  _colorFor(cat) {
    switch (cat) {
      case 'error': return '#ff8b8b';
      case 'warn': return '#ffd07a';
      case 'powerup': return '#ffd46b';
      case 'score': return '#9ef8c6';
      case 'hit': return '#9ecbff';
      default: return '#e6fff2';
    }
  }

  _escape(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  show() { this.visible = true; this.node.style.display = 'block'; }
  hide() { this.visible = false; this.node.style.display = 'none'; }
  toggle() { this.visible ? this.hide() : this.show(); }
  destroy() { this.node.remove(); }
}
