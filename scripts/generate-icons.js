const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const dir = path.join(process.cwd(), 'public', 'icons');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <radialGradient id="bgGrad" cx="50%" cy="30%" r="75%">
      <stop offset="0%" stop-color="#222222"/>
      <stop offset="60%" stop-color="#0a0a0a"/>
      <stop offset="100%" stop-color="#040404"/>
    </radialGradient>
    <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#cccccc"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.85"/>
    </filter>
  </defs>

  <!-- Base background -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)"/>
  <rect width="508" height="508" x="2" y="2" rx="110" fill="none" stroke="rgba(255,255,255,0.16)" stroke-width="4"/>

  <!-- Ray beam circles -->
  <circle cx="256" cy="240" r="180" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1.5"/>
  <circle cx="256" cy="240" r="140" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1.5"/>

  <!-- Radiant Central Heart -->
  <g filter="url(#shadow)">
    <path d="M256 360 C256 360 140 280 140 200 C140 155 175 120 220 120 C240 120 252 130 256 135 C260 130 272 120 292 120 C337 120 372 155 372 200 C372 280 256 360 256 360 Z"
      fill="url(#heartGrad)" filter="url(#glow)"/>
  </g>

  <!-- Brand Typography: Ray — किरण -->
  <text x="256" y="420" text-anchor="middle" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="600" letter-spacing="3">RAY</text>
  <text x="256" y="456" text-anchor="middle" fill="rgba(255,255,255,0.65)" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="500" letter-spacing="2">किरण</text>
</svg>`;

fs.writeFileSync(path.join(dir, 'icon.svg'), svg);

async function generate() {
  await sharp(Buffer.from(svg)).resize(192, 192).png().toFile(path.join(dir, 'icon-192.png'));
  await sharp(Buffer.from(svg)).resize(512, 512).png().toFile(path.join(dir, 'icon-512.png'));
  await sharp(Buffer.from(svg)).resize(180, 180).png().toFile(path.join(dir, 'apple-touch-icon.png'));
  
  // Maskable icon with safe-padding
  const maskableSvg = svg.replace('rx="112"', 'rx="0"');
  await sharp(Buffer.from(maskableSvg)).resize(512, 512).png().toFile(path.join(dir, 'icon-maskable.png'));
  console.log('✅ Icons generated successfully in public/icons/');
}

generate().catch(console.error);
