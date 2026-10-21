const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generateIcons() {
  const sourcePath = path.join(__dirname, '..', 'public', 'icons', 'Ray-logo-cute.png');
  const iconsDir = path.join(__dirname, '..', 'public', 'icons');
  const publicDir = path.join(__dirname, '..', 'public');
  const appDir = path.join(__dirname, '..', 'src', 'app');

  if (!fs.existsSync(sourcePath)) {
    console.error('Source icon not found:', sourcePath);
    process.exit(1);
  }

  console.log('Generating crisp icons from Ray-logo-cute.png...');

  // 1. Standard transparent PNG icons
  const standardSizes = [
    { size: 512, name: 'icon-512.png' },
    { size: 384, name: 'icon-384.png' },
    { size: 192, name: 'icon-192.png' },
    { size: 144, name: 'icon-144.png' },
    { size: 96, name: 'icon-96.png' },
    { size: 72, name: 'icon-72.png' },
    { size: 48, name: 'icon-48.png' },
    { size: 32, name: 'icon-32.png' },
    { size: 16, name: 'icon-16.png' },
  ];

  for (const { size, name } of standardSizes) {
    await sharp(sourcePath)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ quality: 95, compressionLevel: 9 })
      .toFile(path.join(iconsDir, name));
    console.log(`✓ Generated ${name} (${size}x${size})`);
  }

  // 2. High-performance optimized UI logo (256x256 & 512x512) for in-app display
  await sharp(sourcePath)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ quality: 95, compressionLevel: 9 })
    .toFile(path.join(iconsDir, 'ray-logo-cute-web.png'));

  // Also replace or supplement public/icons/Ray-logo.png with the new cute logo
  await sharp(sourcePath)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ quality: 95, compressionLevel: 9 })
    .toFile(path.join(iconsDir, 'Ray-logo.png'));
  console.log('✓ Generated UI logo assets (ray-logo-cute-web.png, Ray-logo.png)');

  // 3. Apple Touch Icon (180x180) on dark luxury background #070707 with safe zone
  const appleInner = await sharp(sourcePath)
    .resize(150, 150, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: {
      width: 180,
      height: 180,
      channels: 4,
      background: { r: 7, g: 7, b: 7, alpha: 1 }
    }
  })
    .composite([{ input: appleInner, gravity: 'center' }])
    .png()
    .toFile(path.join(iconsDir, 'apple-touch-icon.png'));

  // Also write to src/app/apple-icon.png for Next.js App router
  await sharp({
    create: {
      width: 180,
      height: 180,
      channels: 4,
      background: { r: 7, g: 7, b: 7, alpha: 1 }
    }
  })
    .composite([{ input: appleInner, gravity: 'center' }])
    .png()
    .toFile(path.join(appDir, 'apple-icon.png'));
  console.log('✓ Generated apple-touch-icon.png & src/app/apple-icon.png');

  // 4. Android Maskable Icon (512x512) - inner 80% safe area with #070707 background
  const maskableInner = await sharp(sourcePath)
    .resize(410, 410, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 7, g: 7, b: 7, alpha: 1 }
    }
  })
    .composite([{ input: maskableInner, gravity: 'center' }])
    .png()
    .toFile(path.join(iconsDir, 'icon-maskable.png'));
  console.log('✓ Generated icon-maskable.png');

  // 5. Next.js App Router App Icon & Favicon
  await sharp(sourcePath)
    .resize(48, 48, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(appDir, 'icon.png'));

  await sharp(sourcePath)
    .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));

  // Also copy/generate favicon.ico
  // Convert 32x32 PNG to .ico format (single image ICO container)
  const png32 = await sharp(sourcePath)
    .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  // Simple ICO header wrapping PNG buffer
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0); // Reserved
  icoHeader.writeUInt16LE(1, 2); // Type 1 = ICO
  icoHeader.writeUInt16LE(1, 4); // Number of images = 1

  const icoDirEntry = Buffer.alloc(16);
  icoDirEntry.writeUInt8(32, 0); // Width
  icoDirEntry.writeUInt8(32, 1); // Height
  icoDirEntry.writeUInt8(0, 2); // Color palette
  icoDirEntry.writeUInt8(0, 3); // Reserved
  icoDirEntry.writeUInt16LE(1, 4); // Color planes
  icoDirEntry.writeUInt16LE(32, 6); // Bits per pixel
  icoDirEntry.writeUInt32LE(png32.length, 8); // Image size in bytes
  icoDirEntry.writeUInt32LE(6 + 16, 12); // Offset to image data

  const icoBuffer = Buffer.concat([icoHeader, icoDirEntry, png32]);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
  fs.writeFileSync(path.join(appDir, 'favicon.ico'), icoBuffer);
  console.log('✓ Generated favicon.ico, favicon.png, and src/app/icon.png');

  console.log('All icons generated successfully!');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
