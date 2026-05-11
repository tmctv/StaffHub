const sharp = require('sharp');
const path = require('path');

async function generate() {
  // Installer sidebar image (164x314) — shown on left of installer wizard
  const sidebarSvg = `
  <svg width="164" height="314" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#7C4DFF"/>
        <stop offset="50%" stop-color="#6a3de8"/>
        <stop offset="100%" stop-color="#5225cc"/>
      </linearGradient>
      <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#FF48BC"/>
        <stop offset="100%" stop-color="#0ED7FF"/>
      </linearGradient>
    </defs>
    <rect width="164" height="314" fill="url(#bg)"/>
    <!-- Decorative circles -->
    <circle cx="20" cy="40" r="60" fill="rgba(255,255,255,0.03)"/>
    <circle cx="140" cy="280" r="80" fill="rgba(255,255,255,0.03)"/>
    <circle cx="82" cy="160" r="40" fill="rgba(255,255,255,0.04)"/>
    <!-- TMC text -->
    <text x="82" y="130" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="900" fill="white" letter-spacing="3">TMC</text>
    <!-- Divider -->
    <rect x="52" y="145" width="60" height="2" rx="1" fill="url(#accent)"/>
    <!-- StaffHub text -->
    <text x="82" y="172" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" font-weight="600" fill="rgba(255,255,255,0.8)">StaffHub</text>
    <!-- Version -->
    <text x="82" y="290" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="rgba(255,255,255,0.4)">v1.0.0</text>
    <text x="82" y="302" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" fill="rgba(255,255,255,0.3)">The Mishra Corporation</text>
  </svg>`;

  await sharp(Buffer.from(sidebarSvg))
    .png()
    .toFile(path.join(__dirname, 'build', 'installerSidebar.png'));

  // Installer header image (150x57) — shown on top of installer pages
  const headerSvg = `
  <svg width="150" height="57" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="hbg" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#7C4DFF"/>
        <stop offset="100%" stop-color="#5225cc"/>
      </linearGradient>
    </defs>
    <rect width="150" height="57" fill="url(#hbg)"/>
    <text x="75" y="30" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="900" fill="white" letter-spacing="2">TMC</text>
    <text x="75" y="44" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" font-weight="500" fill="rgba(255,255,255,0.7)">StaffHub Portal</text>
  </svg>`;

  await sharp(Buffer.from(headerSvg))
    .png()
    .toFile(path.join(__dirname, 'build', 'installerHeader.png'));

  // Also generate a 256x256 ICO-compatible PNG for the icon
  await sharp(path.join(__dirname, 'assets', 'icon.png'))
    .resize(256, 256, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .toFile(path.join(__dirname, 'build', 'icon256.png'));

  console.log('Installer assets generated!');
}

generate().catch(console.error);
