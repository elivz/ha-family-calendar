// node sheet.js <outdir> <prefix> <title> <out.png>  — 2×3 contact sheet of <prefix>-<date>.png
const fs = require('fs'), path = require('path');
const sharp = require('sharp');
const [dir, prefix, title, out] = process.argv.slice(2);
const files = fs.readdirSync(dir).filter(f => f.startsWith(prefix + '-')).sort();
const G = 24, TH = 60, LH = 30, W = 800, H = 480, cols = 2, rows = Math.ceil(files.length / cols);
const SW = cols * W + (cols + 1) * G, SH = TH + rows * (H + LH + G) + G;
const txt = (s, size, w, h, weight = 700) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><text x="0" y="${h - 8}" font-family="sans-serif" font-size="${size}" font-weight="${weight}" fill="#222">${s}</text></svg>`);
(async () => {
  const comp = [{ input: txt(title, 32, SW - 2 * G, TH), left: G, top: 6 }];
  files.forEach((f, i) => {
    const x = G + (i % cols) * (W + G), y = TH + Math.floor(i / cols) * (H + LH + G);
    const d = f.slice(prefix.length + 1, -4);
    comp.push({ input: txt(new Date(`2026-${d}T12:00:00`).toDateString(), 20, W, LH, 400), left: x, top: y });
    comp.push({ input: path.join(dir, f), left: x, top: y + LH });
  });
  await sharp({ create: { width: SW, height: SH, channels: 3, background: '#d8d8d8' } }).composite(comp).png().toFile(out);
})();
