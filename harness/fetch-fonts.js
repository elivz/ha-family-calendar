// Downloads the two Sofia Sans variable fonts the card uses (OFL) into harness/fonts/ for offline test renders.
const fs = require('fs'), path = require('path');
const base = 'https://raw.githubusercontent.com/google/fonts/main/ofl/';
const files = { 'SofiaSans.ttf': 'sofiasans/SofiaSans[wght].ttf', 'SofiaSansExtraCondensed.ttf': 'sofiasansextracondensed/SofiaSansExtraCondensed[wght].ttf' };
(async () => {
  const dir = path.join(__dirname, 'fonts');
  fs.mkdirSync(dir, { recursive: true });
  for (const [out, src] of Object.entries(files)) {
    const r = await fetch(base + src.split('/').map(encodeURIComponent).join('/'));
    if (!r.ok) throw new Error(`${src}: HTTP ${r.status}`);
    fs.writeFileSync(path.join(dir, out), Buffer.from(await r.arrayBuffer()));
    console.log('saved', out);
  }
})();
