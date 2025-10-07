// QR code helper using a public QR image API (no dependency).
// Usage: import { showQRCode } from './QRCodeHelper.js';
// showQRCode(containerElement, text, { size:200, label:'Scan to join' });
export function showQRCode(container, text, opts = {}) {
  const size = opts.size || 220;
  const label = opts.label || '';
  container.innerHTML = '';
  const url = 'https://api.qrserver.com/v1/create-qr-code/?size=' + size + 'x' + size + '&data=' + encodeURIComponent(text);
  const img = document.createElement('img');
  img.src = url;
  img.alt = label || 'QR Code';
  img.style.width = size + 'px';
  img.style.height = size + 'px';
  img.style.display = 'block';
  img.style.margin = '6px auto';
  container.appendChild(img);

  const btnRow = document.createElement('div');
  btnRow.style.textAlign = 'center';
  btnRow.style.marginTop = '6px';

  const dl = document.createElement('a');
  dl.href = url;
  dl.download = 'qr.png';
  dl.textContent = 'Download QR';
  Object.assign(dl.style, { color: '#fff', background: '#1b1b1b', padding: '6px 10px', borderRadius: '6px', textDecoration: 'none', display: 'inline-block' });

  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Close';
  Object.assign(closeBtn.style, { marginLeft: '10px', padding: '6px 10px', borderRadius: '6px' });
  closeBtn.onclick = () => { container.innerHTML = ''; };

  btnRow.appendChild(dl);
  btnRow.appendChild(closeBtn);
  container.appendChild(btnRow);
}
